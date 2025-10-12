import { getDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Lockers } from '../types/locker';

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

      const toLocker = (v: any): Lockers => ({
        number: num, 
        state: v?.state ?? '',
        user: v?.user ?? '',
        userName: v?.userName ?? '',
        phoneNumber: v?.phoneNumber ?? ''
      });

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
          state: 'unused',
          user: '',
          userName: '',
          phoneNumber: ''
        };
        
        // 키가 존재하는지 확인
        if (Object.prototype.hasOwnProperty.call(existing, key)) {
          const existingValue = existing[key];
          let isDeleted = false;
          
          // 배열인 경우와 객체인 경우 모두 확인
          if (Array.isArray(existingValue)) {
            // 배열의 마지막 항목이 deleted 상태인지 확인
            const lastItem = existingValue[existingValue.length - 1];
            isDeleted = lastItem?.state === 'deleted';
            
            if (isDeleted) {
              // deleted 상태면 배열에 새 항목 추가
              toSet[key] = [...existingValue, defaultEntry];
              added.push(n);
            } else {
              skipped.push(n);
            }
          } else if (existingValue && typeof existingValue === 'object') {
            isDeleted = (existingValue as any)?.state === 'deleted';
            
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
        state: 'deleted',
        user: '',
        userName: '',
        phoneNumber: ''
      };

      let newValue: any;

      if (Array.isArray(existingValue)) {
        const lastItem = existingValue[existingValue.length - 1];
        const hasName = (lastItem?.userName || lastItem?.user || '').trim().length > 0;

        if (hasName) {
          // 이름이 있으면 배열에 새로운 deleted 항목 추가
          newValue = [...existingValue, deletedEntry];
        } else {
          // 이름이 없으면 마지막 항목의 상태만 deleted로 변경
          const updated = [...existingValue];
          updated[updated.length - 1] = { ...lastItem, state: 'deleted' };
          newValue = updated;
        }
      } else if (existingValue && typeof existingValue === 'object') {
        const hasName = ((existingValue as any)?.userName || (existingValue as any)?.user || '').trim().length > 0;

        if (hasName) {
          // 이름이 있으면 배열로 변환하고 deleted 항목 추가
          newValue = [existingValue, deletedEntry];
        } else {
          // 이름이 없으면 상태만 deleted로 변경
          newValue = { ...existingValue, state: 'deleted' };
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
        state: 'unused',
        user: '',
        userName: '',
        phoneNumber: ''
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
}
