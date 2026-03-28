import { getDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Locker, LOCKER_STATE, LockerState, getLockerState } from '../types/locker';
import { toLocker } from '../utils/lockerUtils';
import { formatDateToString } from '../utils/dateUtils';

type LockerDocumentEntry = Locker | Locker[];
type LockerDocumentData = Record<string, LockerDocumentEntry>;

export class LockerService {
  /**
   * 특정 락커 엔트리에 현재 활성 배정 회원이 있는지 확인합니다.
   *
   * 최신 엔트리를 기준으로 회원 이름이 존재하고, 날짜 기준 실제 상태가
   * `used`인 경우에만 배정 중으로 판단합니다.
   *
   * @param lockerEntryData 락커 문서에 저장된 단일 엔트리 또는 히스토리 배열
   * @param lockerNumber 확인할 락커 번호
   * @returns 현재 배정된 회원이 있으면 `true`
   */
  private static hasActiveAssignedUser(lockerEntryData: LockerDocumentEntry, lockerNumber: number): boolean {
    if (Array.isArray(lockerEntryData)) {
      if (lockerEntryData.length === 0) {
        return false;
      }

      const latestLocker = toLocker(lockerEntryData[lockerEntryData.length - 1], lockerNumber);
      return latestLocker.realName.trim().length > 0 && getLockerState(latestLocker.state, latestLocker) === LOCKER_STATE.USED;
    }

    if (lockerEntryData && typeof lockerEntryData === 'object') {
      const latestLocker = toLocker(lockerEntryData, lockerNumber);
      return latestLocker.realName.trim().length > 0 && getLockerState(latestLocker.state, latestLocker) === LOCKER_STATE.USED;
    }

    return false;
  }

  /**
   * 박스의 전체 락커 목록을 조회합니다.
   *
   * 각 락커 번호별로 최신 엔트리만 꺼내 `Locker` 형태로 반환합니다.
   *
   * @param box 박스 이름
   * @returns 최신 상태 기준의 락커 목록
   */
  static async getLockers(box: string): Promise<Locker[]> {
    // lockerdoc 은 "문서"이므로 getDoc + doc 사용
    const ref = doc(db, `box/${box}/lockers/lockerdoc`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const data = snap.data() as LockerDocumentData;
    const out: Locker[] = [];

    for (const [key, value] of Object.entries(data)) {
      // key 가 "101" 같은 라커번호 제목
      const num = Number(key);
      if (!Number.isFinite(num)) {
        // 숫자 변환이 안되면 스킵 (필요시 로그 남기기)
        continue;
      }


      if (Array.isArray(value)) {
        // 배열인 경우 마지막 항목만 사용 (최신 상태)
        if (value.length > 0) {
          const latestItem = value[value.length - 1];
          out.push(toLocker(latestItem, num));
        }
      } else if (value && typeof value === 'object') {
        out.push(toLocker(value as any, num));
      }
    }
    out.sort((a, b) => a.number - b.number);

    return out;
  }

  /**
   * 지정한 번호 범위의 락커를 추가합니다.
   *
   * 이미 존재하는 락커는 건너뛰고, 삭제 상태였던 락커는 다시 활성화합니다.
   *
   * @param box 박스 이름
   * @param start 시작 번호
   * @param end 종료 번호
   * @returns 추가된 번호와 건너뛴 번호 목록
   */
  static async addLockers(
    box: string,
    start: number,
    end: number
  ): Promise<{ added: number[]; skipped: number[] }> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const existing: LockerDocumentData = snap.exists() ? (snap.data() as LockerDocumentData) : {};

      const toSet: LockerDocumentData = {};
      const added: number[] = [];
      const skipped: number[] = [];

      for (let n = lo; n <= hi; n++) {
        const key = String(n);
        
        const defaultEntry: Locker = {
          number: n,
          state: LOCKER_STATE.UNUSED,
          id: '',
          realName: '',
          phone: '',
          assignee: '',
          note: '',
          startDate: '',
          endDate: '',
          createdAt: new Date().toISOString().split('T')[0],
          key: ''
        };
        
        // 키가 존재하는지 확인
        if (Object.prototype.hasOwnProperty.call(existing, key)) {
          const lockerEntry = existing[key];
          let isDeleted = false;
          
          // 배열인 경우와 객체인 경우 모두 확인
          if (Array.isArray(lockerEntry)) {
            // 배열의 마지막 항목이 deleted 상태인지 확인
            const lastItem = lockerEntry[lockerEntry.length - 1];
            isDeleted = lastItem?.state === LOCKER_STATE.DELETED;
            
            if (isDeleted) {
              // deleted 상태면 배열에 새 항목 추가
              toSet[key] = [...lockerEntry, defaultEntry];
              added.push(n);
            } else {
              skipped.push(n);
            }
          } else if (lockerEntry && typeof lockerEntry === 'object') {
            isDeleted = (lockerEntry as any)?.state === LOCKER_STATE.DELETED;
            
            if (isDeleted) {
              // 객체를 배열로 변환하고 새 항목 추가
              toSet[key] = [lockerEntry, defaultEntry];
              added.push(n);
            } else {
              skipped.push(n);
            }
          }
        } else {
          // 키가 존재하지 않으면 새 배열로 추가
          toSet[key] = [defaultEntry];
          added.push(n);
        }
      }

      if (added.length > 0) {
        tx.set(ref, toSet, { merge: true });
      }

      return { added, skipped };
    });
  }

  /**
   * 락커를 삭제 상태로 변경합니다.
   *
   * 회원이 배정된 이력이 있으면 삭제 히스토리를 추가하고,
   * 그렇지 않으면 최신 엔트리의 상태만 삭제로 바꿉니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 삭제할 락커 번호
   */
  static async deleteLocker(box: string, lockerNumber: number): Promise<void> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const data = snap.data() as LockerDocumentData;
      const key = String(lockerNumber);

      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        throw new Error('해당 락커 번호를 찾을 수 없습니다.');
      }

      const lockerEntry = data[key];
      const deletedEntry: Locker = {
        number: lockerNumber,
        state: LOCKER_STATE.DELETED,
        id: '',
        realName: '',
        phone: '',
        assignee: '',
        note: '',
        startDate: '',
        endDate: '',
        createdAt: new Date().toISOString().split('T')[0],
        key: ''
      };

      let newValue: any;

      if (Array.isArray(lockerEntry)) {
        const lastItem = lockerEntry[lockerEntry.length - 1];
        const hasName = (lastItem?.realName || '').trim().length > 0;

        if (hasName) {
          // 이름이 있으면 배열에 새로운 deleted 항목 추가
          newValue = [...lockerEntry, deletedEntry];
        } else {
          // 이름이 없으면 마지막 항목의 상태만 deleted로 변경
          const updated = [...lockerEntry];
          updated[updated.length - 1] = { ...lastItem, state: LOCKER_STATE.DELETED };
          newValue = updated;
        }
      } else if (lockerEntry && typeof lockerEntry === 'object') {
        const hasName = ((lockerEntry as any)?.realName || '').trim().length > 0;

        if (hasName) {
          // 이름이 있으면 배열로 변환하고 deleted 항목 추가
          newValue = [lockerEntry, deletedEntry];
        } else {
          // 이름이 없으면 상태만 deleted로 변경
          newValue = { ...lockerEntry, state: LOCKER_STATE.DELETED };
        }
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      tx.set(ref, { [key]: newValue }, { merge: true });
    });
  }

  /**
   * 사용 중인 락커를 해지하고 사용 가능 상태 엔트리를 추가합니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 해지할 락커 번호
   * @param note 해지 사유 메모
   * @param assignee 처리자 이름
   */
  static async releaseLocker(box: string, lockerNumber: number, note: string = '', assignee: string = ''): Promise<void> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const data = snap.data() as LockerDocumentData;
      const key = String(lockerNumber);

      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        throw new Error('해당 락커 번호를 찾을 수 없습니다.');
      }

      const lockerEntry = data[key];
      // 해지 사유 앞에 "[해지] " 접두사 추가
      const releaseNote = note.trim() ? `[해지] ${note}` : note;
      
      const unusedEntry: Locker = {
        number: lockerNumber,
        state: LOCKER_STATE.UNUSED,
        id: '',
        realName: '',
        phone: '',
        assignee: assignee,
        note: releaseNote,
        startDate: '',
        endDate: '',
        createdAt: new Date().toISOString().split('T')[0],
        key: ''
      };

      let newValue: any;

      if (Array.isArray(lockerEntry)) {
        // 배열에 새로운 unused 항목 추가
        newValue = [...lockerEntry, unusedEntry];
      } else if (lockerEntry && typeof lockerEntry === 'object') {
        // 객체를 배열로 변환하고 unused 항목 추가
        newValue = [lockerEntry, unusedEntry];
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      tx.set(ref, { [key]: newValue }, { merge: true });
    });
  }

  /**
   * 비어 있는 락커의 상태를 변경합니다.
   *
   * 회원이 배정된 락커는 변경할 수 없으며, `unused` 또는 `na` 상태만 지원합니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 변경할 락커 번호
   * @param state 변경할 상태
   * @param note 변경 사유 메모
   * @param assignee 처리자 이름
   */
  static async updateLocker(
    box: string,
    lockerNumber: number,
    state: LockerState,
    note: string,
    assignee: string
  ): Promise<void> {
    if (state !== LOCKER_STATE.UNUSED && state !== LOCKER_STATE.NA) {
      throw new Error('지원하지 않는 락커 상태입니다.');
    }

    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const data = snap.data() as LockerDocumentData;
      const key = String(lockerNumber);

      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        throw new Error('해당 락커 번호를 찾을 수 없습니다.');
      }

      const lockerEntry = data[key];
      
      const hasUser = this.hasActiveAssignedUser(lockerEntry, lockerNumber);

      if (hasUser) {
        throw new Error('회원을 먼저 해지하시기 바랍니다.');
      }

      const updatedEntry: Locker = {
        number: lockerNumber,
        state,
        id: '',
        realName: '',
        phone: '',
        assignee,
        note,
        startDate: '',
        endDate: '',
        createdAt: new Date().toISOString().split('T')[0],
        key: ''
      };

      let newValue: any;
      const hasNote = note.trim().length > 0;

      if (Array.isArray(lockerEntry)) {
        if (hasNote) {
          // note가 있으면 배열에 새 항목 추가
          newValue = [...lockerEntry, updatedEntry];
        } else {
          // note가 없으면 마지막 항목 업데이트
          const updated = [...lockerEntry];
          updated[updated.length - 1] = updatedEntry;
          newValue = updated;
        }
      } else if (lockerEntry && typeof lockerEntry === 'object') {
        if (hasNote) {
          // note가 있으면 객체를 배열로 변환하고 새 항목 추가
          newValue = [lockerEntry, updatedEntry];
        } else {
          // note가 없으면 객체를 업데이트
          newValue = updatedEntry;
        }
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      tx.set(ref, { [key]: newValue }, { merge: true });
    });
  }

  /**
   * 특정 락커 번호의 전체 히스토리를 조회합니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 조회할 락커 번호
   * @returns 오래된 순서대로 정리된 락커 히스토리 목록
   */
  static async getLockerHistory(box: string, lockerNumber: number): Promise<Locker[]> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return [];
    }

    const data = snap.data() as LockerDocumentData;
    const key = String(lockerNumber);

    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      return [];
    }

    const lockerEntryData = data[key];
    const history: Locker[] = [];


    if (Array.isArray(lockerEntryData)) {
      // 배열인 경우 모든 항목을 히스토리로 반환
      for (const item of lockerEntryData) {
        history.push(toLocker(item, lockerNumber));
      }
    } else if (lockerEntryData && typeof lockerEntryData === 'object') {
      // 객체인 경우 단일 항목
      history.push(toLocker(lockerEntryData, lockerNumber));
    }

    return history;
  }

  /**
   * 회원을 락커에 배정합니다.
   *
   * 현재 활성 배정 회원이 없는 경우에만 배정 가능하며,
   * 기존 최신 엔트리 상태에 따라 덮어쓰기 또는 히스토리 추가를 수행합니다.
   *
   * @param box 박스 이름
   * @param lockerNumber 배정할 락커 번호
   * @param userId 회원 식별자
   * @param userName 회원 이름
   * @param phoneNumber 회원 연락처
   * @param startDate 사용 시작일
   * @param endDate 사용 종료일
   * @param key 락커 배정 고유 키
   * @param price 결제 금액
   * @param paymentType 결제 수단
   */
  static async assignLocker(
    box: string,
    lockerNumber: number,
    userId: string,
    userName: string,
    phoneNumber: string,
    startDate: string,
    endDate: string,
    key: string,
    price: string,
    paymentType: 'cash' | 'card'
  ): Promise<void> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const data = snap.data() as LockerDocumentData;
      const lockerKey = String(lockerNumber);

      if (!Object.prototype.hasOwnProperty.call(data, lockerKey)) {
        throw new Error('해당 락커 번호를 찾을 수 없습니다.');
      }

      const lockerEntry = data[lockerKey];
      
      const hasUser = this.hasActiveAssignedUser(lockerEntry, lockerNumber);

      if (hasUser) {
        throw new Error('이미 회원이 배정되어 있습니다. 먼저 해지해주세요.');
      }

      const assignedEntry: Locker = {
        number: lockerNumber,
        state: LOCKER_STATE.USED,
        id: userId,
        realName: userName,
        phone: phoneNumber || '',
        assignee: '',
        note: '',
        startDate: startDate || '',
        endDate: endDate || '',
        createdAt: new Date().toISOString().split('T')[0],
        key: key,
        price: price,
        paymentType: paymentType
      };

      let newValue: any;

      if (Array.isArray(lockerEntry)) {
        const lastItem = lockerEntry[lockerEntry.length - 1];
        const isUnusedWithNoNote = lastItem?.state === LOCKER_STATE.UNUSED && (!lastItem?.note || lastItem.note.trim() === '');
        
        if (isUnusedWithNoNote) {
          // 사용 가능 상태이고 note가 없으면 마지막 항목 덮어쓰기
          const updated = [...lockerEntry];
          updated[updated.length - 1] = assignedEntry;
          newValue = updated;
        } else {
          // 그렇지 않으면 새 항목 추가
          newValue = [...lockerEntry, assignedEntry];
        }
      } else if (lockerEntry && typeof lockerEntry === 'object') {
        const isUnusedWithNoNote = (lockerEntry as any)?.state === LOCKER_STATE.UNUSED && 
                                     (!(lockerEntry as any)?.note || (lockerEntry as any).note.trim() === '');
        
        if (isUnusedWithNoNote) {
          // 사용 가능 상태이고 note가 없으면 객체 덮어쓰기
          newValue = assignedEntry;
        } else {
          // 그렇지 않으면 배열로 변환하고 새 항목 추가
          newValue = [lockerEntry, assignedEntry];
        }
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      tx.set(ref, { [lockerKey]: newValue }, { merge: true });
    });
  }

  /**
   * 현재 사용 중인 모든 락커의 만료일을 일괄 연장합니다.
   *
   * 만료되지 않은 활성 락커만 대상으로 하며, 회원 히스토리 갱신에 필요한
   * 최소 정보도 함께 반환합니다.
   *
   * @param box 박스 이름
   * @param days 연장할 일수
   * @returns 연장된 개수와 후속 처리용 락커 정보
   */
  static async extendAllLockers(
    box: string,
    days: number
  ): Promise<{ 
    extendedCount: number;
    extendedLockers: Array<{ id: string; key: string; endDate: string }>;
  }> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        return { extendedCount: 0, extendedLockers: [] };
      }

      const data = snap.data() as LockerDocumentData;
      let extendedCount = 0;
      const updates: Record<string, any> = {};
      const extendedLockers: Array<{ id: string; key: string; endDate: string }> = [];

      for (const [key, value] of Object.entries(data)) {
        const num = Number(key);
        if (!Number.isFinite(num)) {
          continue;
        }

        let latestLocker: Locker | null = null;
        let newValue: any;

        if (Array.isArray(value)) {
          if (value.length === 0) continue;
          latestLocker = toLocker(value[value.length - 1], num);
          newValue = [...value];
        } else if (value && typeof value === 'object') {
          latestLocker = toLocker(value as any, num);
          newValue = value;
        } else {
          continue;
        }

        // 사용 중인 락커만 연장
        if (latestLocker.state === LOCKER_STATE.USED && latestLocker.endDate) {
          const endDate = new Date(latestLocker.endDate);
          endDate.setHours(0, 0, 0, 0);

          // 현재 유효한 락커인지 확인 (만료일이 오늘 이후)
          if (endDate >= now) {
            // 만료일 연장
            const newEndDate = new Date(endDate.getTime() + days * 24 * 60 * 60 * 1000);
            const newEndDateStr = formatDateToString(newEndDate);

            // Locker 타입으로 업데이트된 객체 생성
            const updatedLocker: Locker = {
              ...latestLocker,
              endDate: newEndDateStr
            };

            if (Array.isArray(newValue)) {
              const updated = [...newValue];
              updated[updated.length - 1] = updatedLocker;
              updates[key] = updated;
            } else {
              updates[key] = updatedLocker;
            }

            // 연장된 락커 정보 저장 (id와 key가 있는 경우만)
            if (latestLocker.id && latestLocker.key) {
              extendedLockers.push({
                id: latestLocker.id,
                key: latestLocker.key,
                endDate: newEndDateStr
              });
            }

            extendedCount++;
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        tx.update(ref, updates);
      }

      return { extendedCount, extendedLockers };
    });
  }
}
