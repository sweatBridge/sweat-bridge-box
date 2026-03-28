import { getDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Locker, LOCKER_STATE, LockerState, getLockerState } from '../types/locker';
import { toLocker } from '../utils/lockerUtils';
import { formatDateToString } from '../utils/dateUtils';

export class LockerService {
  private static hasActiveAssignedUser(lockerEntryData: unknown, lockerNumber: number): boolean {
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

  static async getLockers(box: string): Promise<Locker[]> {
    // lockerdoc 은 "문서"이므로 getDoc + doc 사용
    const ref = doc(db, `box/${box}/lockers/lockerdoc`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const data = snap.data() as Record<string, unknown>;
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
      const existing = snap.exists() ? (snap.data() as Record<string, unknown>) : {};

      const toSet: Record<string, unknown> = {};
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

  static async deleteLocker(box: string, lockerNumber: number): Promise<void> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const data = snap.data() as Record<string, unknown>;
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

  static async releaseLocker(box: string, lockerNumber: number, note: string = '', assignee: string = ''): Promise<void> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error('락커 문서를 찾을 수 없습니다.');
      }

      const data = snap.data() as Record<string, unknown>;
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

      const data = snap.data() as Record<string, unknown>;
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

  static async getLockerHistory(box: string, lockerNumber: number): Promise<Locker[]> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return [];
    }

    const data = snap.data() as Record<string, unknown>;
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

      const data = snap.data() as Record<string, unknown>;
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
   * 전체 락커 연장
   * 현재 사용 중인 모든 락커의 만료일을 연장합니다.
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

      const data = snap.data() as Record<string, unknown>;
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
