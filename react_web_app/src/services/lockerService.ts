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
        for (const item of value) out.push(toLocker(item));
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
        if (Object.prototype.hasOwnProperty.call(existing, key)) {
          skipped.push(n);
          continue;
        }
        const defaultEntry: Lockers = {
          number: n,
          state: 'unused',   // per spec
          user: '',
          userName: '',
          phoneNumber: ''
        };
        // store as an array of Lockers
        toSet[key] = [defaultEntry];
        added.push(n);
      }

      if (added.length > 0) {
        tx.set(ref, toSet, { merge: true });
      }

      return { added, skipped };
    });
  }
}
