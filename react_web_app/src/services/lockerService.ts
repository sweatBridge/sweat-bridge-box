import { getDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Lockers, LOCKER_STATE, LockerState, isLockerState } from '../types/locker';

export class LockerService {
  static async getLockers(box: string): Promise<Lockers[]> {
    // lockerdoc 은 "문서"이므로 getDoc + doc 사용
    const ref = doc(db, `box/${box}/lockers/lockerdoc`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const data = snap.data() as Record<string, unknown>;
    const out: Lockers[] = [];

    for (const [key, value] of Object.entries(data)) {
      // key 가 "101" 같은 라커번호 제목
      const num = Number(key);
      if (!Number.isFinite(num)) {
        // 숫자 변환이 안되면 스킵 (필요시 로그 남기기)
        continue;
      }

      const toLocker = (v: any): Lockers => {
        const state = isLockerState(v?.state) ? v.state : LOCKER_STATE.UNUSED;
        return {
          number: num, 
          state,
          id: v?.id ?? '',
          realName: v?.realName ?? '',
          phone: v?.phone ?? '',
          assignee: v?.assignee ?? '',
          note: v?.note ?? '',
          startDate: v?.startDate ?? '',
          endDate: v?.endDate ?? '',
          createdAt: v?.createdAt ?? '',
          key: v?.key ?? ''
        };
      };

      if (Array.isArray(value)) {
        // 배열인 경우 마지막 항목만 사용 (최신 상태)
        if (value.length > 0) {
          const latestItem = value[value.length - 1];
          out.push(toLocker(latestItem));
        }
      } else if (value && typeof value === 'object') {
        out.push(toLocker(value as any));
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
        
        const defaultEntry: Lockers = {
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
          const existingValue = existing[key];
          let isDeleted = false;
          
          // 배열인 경우와 객체인 경우 모두 확인
          if (Array.isArray(existingValue)) {
            // 배열의 마지막 항목이 deleted 상태인지 확인
            const lastItem = existingValue[existingValue.length - 1];
            isDeleted = lastItem?.state === LOCKER_STATE.DELETED;
            
            if (isDeleted) {
              // deleted 상태면 배열에 새 항목 추가
              toSet[key] = [...existingValue, defaultEntry];
              added.push(n);
            } else {
              skipped.push(n);
            }
          } else if (existingValue && typeof existingValue === 'object') {
            isDeleted = (existingValue as any)?.state === LOCKER_STATE.DELETED;
            
            if (isDeleted) {
              // 객체를 배열로 변환하고 새 항목 추가
              toSet[key] = [existingValue, defaultEntry];
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

      const existingValue = data[key];
      const deletedEntry: Lockers = {
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

      if (Array.isArray(existingValue)) {
        const lastItem = existingValue[existingValue.length - 1];
        const hasName = (lastItem?.realName || '').trim().length > 0;

        if (hasName) {
          // 이름이 있으면 배열에 새로운 deleted 항목 추가
          newValue = [...existingValue, deletedEntry];
        } else {
          // 이름이 없으면 마지막 항목의 상태만 deleted로 변경
          const updated = [...existingValue];
          updated[updated.length - 1] = { ...lastItem, state: LOCKER_STATE.DELETED };
          newValue = updated;
        }
      } else if (existingValue && typeof existingValue === 'object') {
        const hasName = ((existingValue as any)?.realName || '').trim().length > 0;

        if (hasName) {
          // 이름이 있으면 배열로 변환하고 deleted 항목 추가
          newValue = [existingValue, deletedEntry];
        } else {
          // 이름이 없으면 상태만 deleted로 변경
          newValue = { ...existingValue, state: LOCKER_STATE.DELETED };
        }
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      tx.set(ref, { [key]: newValue }, { merge: true });
    });
  }

  static async releaseLocker(box: string, lockerNumber: number): Promise<void> {
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

      const existingValue = data[key];
      const unusedEntry: Lockers = {
        number: lockerNumber,
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

      let newValue: any;

      if (Array.isArray(existingValue)) {
        // 배열에 새로운 unused 항목 추가
        newValue = [...existingValue, unusedEntry];
      } else if (existingValue && typeof existingValue === 'object') {
        // 객체를 배열로 변환하고 unused 항목 추가
        newValue = [existingValue, unusedEntry];
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

      const existingValue = data[key];
      
      // 현재 사용자가 할당되어 있는지 확인
      let hasUser = false;
      if (Array.isArray(existingValue)) {
        const lastItem = existingValue[existingValue.length - 1];
        hasUser = (lastItem?.realName || '').trim().length > 0;
      } else if (existingValue && typeof existingValue === 'object') {
        hasUser = ((existingValue as any)?.realName || '').trim().length > 0;
      }

      if (hasUser) {
        throw new Error('회원을 먼저 해지하시기 바랍니다.');
      }

      const updatedEntry: Lockers = {
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

      if (Array.isArray(existingValue)) {
        if (hasNote) {
          // note가 있으면 배열에 새 항목 추가
          newValue = [...existingValue, updatedEntry];
        } else {
          // note가 없으면 마지막 항목 업데이트
          const updated = [...existingValue];
          updated[updated.length - 1] = updatedEntry;
          newValue = updated;
        }
      } else if (existingValue && typeof existingValue === 'object') {
        if (hasNote) {
          // note가 있으면 객체를 배열로 변환하고 새 항목 추가
          newValue = [existingValue, updatedEntry];
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

  static async getLockerHistory(box: string, lockerNumber: number): Promise<Lockers[]> {
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

    const value = data[key];
    const history: Lockers[] = [];

    const toLocker = (v: any): Lockers => ({
      number: lockerNumber,
      state: v?.state ?? '',
      id: v?.id ?? '',
      realName: v?.realName ?? '',
      phone: v?.phone ?? '',
      assignee: v?.assignee ?? '',
      note: v?.note ?? '',
      startDate: v?.startDate ?? '',
      endDate: v?.endDate ?? '',
      createdAt: v?.createdAt ?? '',
      key: v?.key ?? ''
    });

    if (Array.isArray(value)) {
      // 배열인 경우 모든 항목을 히스토리로 반환
      for (const item of value) {
        history.push(toLocker(item));
      }
    } else if (value && typeof value === 'object') {
      // 객체인 경우 단일 항목
      history.push(toLocker(value));
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
    key: string
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

      const existingValue = data[lockerKey];
      
      // 현재 사용자가 할당되어 있는지 확인
      let hasUser = false;
      if (Array.isArray(existingValue)) {
        const lastItem = existingValue[existingValue.length - 1];
        hasUser = (lastItem?.realName || '').trim().length > 0;
      } else if (existingValue && typeof existingValue === 'object') {
        hasUser = ((existingValue as any)?.realName || '').trim().length > 0;
      }

      if (hasUser) {
        throw new Error('이미 회원이 배정되어 있습니다. 먼저 해지해주세요.');
      }

      const assignedEntry: Lockers = {
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
        key: key
      };

      let newValue: any;

      if (Array.isArray(existingValue)) {
        const lastItem = existingValue[existingValue.length - 1];
        const isUnusedWithNoNote = lastItem?.state === LOCKER_STATE.UNUSED && (!lastItem?.note || lastItem.note.trim() === '');
        
        if (isUnusedWithNoNote) {
          // 사용 가능 상태이고 note가 없으면 마지막 항목 덮어쓰기
          const updated = [...existingValue];
          updated[updated.length - 1] = assignedEntry;
          newValue = updated;
        } else {
          // 그렇지 않으면 새 항목 추가
          newValue = [...existingValue, assignedEntry];
        }
      } else if (existingValue && typeof existingValue === 'object') {
        const isUnusedWithNoNote = (existingValue as any)?.state === LOCKER_STATE.UNUSED && 
                                     (!(existingValue as any)?.note || (existingValue as any).note.trim() === '');
        
        if (isUnusedWithNoNote) {
          // 사용 가능 상태이고 note가 없으면 객체 덮어쓰기
          newValue = assignedEntry;
        } else {
          // 그렇지 않으면 배열로 변환하고 새 항목 추가
          newValue = [existingValue, assignedEntry];
        }
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      tx.set(ref, { [lockerKey]: newValue }, { merge: true });
    });
  }
}
