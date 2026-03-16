import { getDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Locker, LOCKER_STATE, LockerState } from '../types/locker';
import { toLocker } from '../models/lockerModel';
import { formatDateToString } from '../utils/dateUtils';

export class LockerRepository {
  static async getLockers(box: string): Promise<Locker[]> {
    const ref = doc(db, `box/${box}/lockers/lockerdoc`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const data = snap.data() as Record<string, unknown>;
    const out: Locker[] = [];

    for (const [key, value] of Object.entries(data)) {
      const num = Number(key);
      if (!Number.isFinite(num)) continue;

      if (Array.isArray(value)) {
        if (value.length > 0) out.push(toLocker(value[value.length - 1], num));
      } else if (value && typeof value === 'object') {
        out.push(toLocker(value as any, num));
      }
    }
    out.sort((a, b) => a.number - b.number);
    return out;
  }

  static async addLockers(box: string, start: number, end: number): Promise<{ added: number[]; skipped: number[] }> {
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
          number: n, state: LOCKER_STATE.UNUSED, id: '', realName: '', phone: '',
          assignee: '', note: '', startDate: '', endDate: '',
          createdAt: new Date().toISOString().split('T')[0], key: ''
        };

        if (Object.prototype.hasOwnProperty.call(existing, key)) {
          const existingValue = existing[key];
          let isDeleted = false;

          if (Array.isArray(existingValue)) {
            const last = existingValue[existingValue.length - 1];
            isDeleted = last?.state === LOCKER_STATE.DELETED;
            if (isDeleted) { toSet[key] = [...existingValue, defaultEntry]; added.push(n); }
            else skipped.push(n);
          } else if (existingValue && typeof existingValue === 'object') {
            isDeleted = (existingValue as any)?.state === LOCKER_STATE.DELETED;
            if (isDeleted) { toSet[key] = [existingValue, defaultEntry]; added.push(n); }
            else skipped.push(n);
          }
        } else {
          toSet[key] = [defaultEntry];
          added.push(n);
        }
      }

      if (added.length > 0) tx.set(ref, toSet, { merge: true });
      return { added, skipped };
    });
  }

  static async deleteLocker(box: string, lockerNumber: number): Promise<void> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('락커 문서를 찾을 수 없습니다.');

      const data = snap.data() as Record<string, unknown>;
      const key = String(lockerNumber);
      if (!Object.prototype.hasOwnProperty.call(data, key)) throw new Error('해당 락커 번호를 찾을 수 없습니다.');

      const existingValue = data[key];
      const deletedEntry: Locker = {
        number: lockerNumber, state: LOCKER_STATE.DELETED, id: '', realName: '', phone: '',
        assignee: '', note: '', startDate: '', endDate: '',
        createdAt: new Date().toISOString().split('T')[0], key: ''
      };

      let newValue: any;

      if (Array.isArray(existingValue)) {
        const last = existingValue[existingValue.length - 1];
        const hasName = (last?.realName || '').trim().length > 0;
        if (hasName) {
          newValue = [...existingValue, deletedEntry];
        } else {
          const updated = [...existingValue];
          updated[updated.length - 1] = { ...last, state: LOCKER_STATE.DELETED };
          newValue = updated;
        }
      } else if (existingValue && typeof existingValue === 'object') {
        const hasName = ((existingValue as any)?.realName || '').trim().length > 0;
        newValue = hasName ? [existingValue, deletedEntry] : { ...existingValue, state: LOCKER_STATE.DELETED };
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
      if (!snap.exists()) throw new Error('락커 문서를 찾을 수 없습니다.');

      const data = snap.data() as Record<string, unknown>;
      const key = String(lockerNumber);
      if (!Object.prototype.hasOwnProperty.call(data, key)) throw new Error('해당 락커 번호를 찾을 수 없습니다.');

      const existingValue = data[key];
      const releaseNote = note.trim() ? `[해지] ${note}` : note;
      const unusedEntry: Locker = {
        number: lockerNumber, state: LOCKER_STATE.UNUSED, id: '', realName: '', phone: '',
        assignee, note: releaseNote, startDate: '', endDate: '',
        createdAt: new Date().toISOString().split('T')[0], key: ''
      };

      let newValue: any;
      if (Array.isArray(existingValue)) {
        newValue = [...existingValue, unusedEntry];
      } else if (existingValue && typeof existingValue === 'object') {
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
      if (!snap.exists()) throw new Error('락커 문서를 찾을 수 없습니다.');

      const data = snap.data() as Record<string, unknown>;
      const key = String(lockerNumber);
      if (!Object.prototype.hasOwnProperty.call(data, key)) throw new Error('해당 락커 번호를 찾을 수 없습니다.');

      const existingValue = data[key];
      let hasUser = false;
      if (Array.isArray(existingValue)) {
        hasUser = (existingValue[existingValue.length - 1]?.realName || '').trim().length > 0;
      } else if (existingValue && typeof existingValue === 'object') {
        hasUser = ((existingValue as any)?.realName || '').trim().length > 0;
      }
      if (hasUser) throw new Error('회원을 먼저 해지하시기 바랍니다.');

      const updatedEntry: Locker = {
        number: lockerNumber, state, id: '', realName: '', phone: '',
        assignee, note, startDate: '', endDate: '',
        createdAt: new Date().toISOString().split('T')[0], key: ''
      };
      const hasNote = note.trim().length > 0;
      let newValue: any;

      if (Array.isArray(existingValue)) {
        if (hasNote) { newValue = [...existingValue, updatedEntry]; }
        else { const u = [...existingValue]; u[u.length - 1] = updatedEntry; newValue = u; }
      } else if (existingValue && typeof existingValue === 'object') {
        newValue = hasNote ? [existingValue, updatedEntry] : updatedEntry;
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      tx.set(ref, { [key]: newValue }, { merge: true });
    });
  }

  static async getLockerHistory(box: string, lockerNumber: number): Promise<Locker[]> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const data = snap.data() as Record<string, unknown>;
    const key = String(lockerNumber);
    if (!Object.prototype.hasOwnProperty.call(data, key)) return [];

    const value = data[key];
    const history: Locker[] = [];

    if (Array.isArray(value)) {
      for (const item of value) history.push(toLocker(item, lockerNumber));
    } else if (value && typeof value === 'object') {
      history.push(toLocker(value, lockerNumber));
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
      if (!snap.exists()) throw new Error('락커 문서를 찾을 수 없습니다.');

      const data = snap.data() as Record<string, unknown>;
      const lockerKey = String(lockerNumber);
      if (!Object.prototype.hasOwnProperty.call(data, lockerKey)) throw new Error('해당 락커 번호를 찾을 수 없습니다.');

      const existingValue = data[lockerKey];
      let hasUser = false;
      if (Array.isArray(existingValue)) {
        hasUser = (existingValue[existingValue.length - 1]?.realName || '').trim().length > 0;
      } else if (existingValue && typeof existingValue === 'object') {
        hasUser = ((existingValue as any)?.realName || '').trim().length > 0;
      }
      if (hasUser) throw new Error('이미 회원이 배정되어 있습니다. 먼저 해지해주세요.');

      const assignedEntry: Locker = {
        number: lockerNumber, state: LOCKER_STATE.USED,
        id: userId, realName: userName, phone: phoneNumber || '',
        assignee: '', note: '', startDate: startDate || '', endDate: endDate || '',
        createdAt: new Date().toISOString().split('T')[0], key, price, paymentType
      };

      let newValue: any;
      if (Array.isArray(existingValue)) {
        const last = existingValue[existingValue.length - 1];
        const isClean = last?.state === LOCKER_STATE.UNUSED && (!last?.note || last.note.trim() === '');
        if (isClean) { const u = [...existingValue]; u[u.length - 1] = assignedEntry; newValue = u; }
        else newValue = [...existingValue, assignedEntry];
      } else if (existingValue && typeof existingValue === 'object') {
        const isClean = (existingValue as any)?.state === LOCKER_STATE.UNUSED && (!(existingValue as any)?.note || (existingValue as any).note.trim() === '');
        newValue = isClean ? assignedEntry : [existingValue, assignedEntry];
      } else {
        throw new Error('잘못된 락커 데이터 형식입니다.');
      }

      tx.set(ref, { [lockerKey]: newValue }, { merge: true });
    });
  }

  static async extendAllLockers(box: string, days: number): Promise<{
    extendedCount: number;
    extendedLockers: Array<{ id: string; key: string; endDate: string }>;
  }> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return { extendedCount: 0, extendedLockers: [] };

      const data = snap.data() as Record<string, unknown>;
      let extendedCount = 0;
      const updates: Record<string, any> = {};
      const extendedLockers: Array<{ id: string; key: string; endDate: string }> = [];

      for (const [key, value] of Object.entries(data)) {
        const num = Number(key);
        if (!Number.isFinite(num)) continue;

        let latestLocker: Locker | null = null;
        let newValue: any;

        if (Array.isArray(value)) {
          if (value.length === 0) continue;
          latestLocker = toLocker(value[value.length - 1], num);
          newValue = [...value];
        } else if (value && typeof value === 'object') {
          latestLocker = toLocker(value as any, num);
          newValue = value;
        } else continue;

        if (latestLocker.state === LOCKER_STATE.USED && latestLocker.endDate) {
          const endDate = new Date(latestLocker.endDate);
          endDate.setHours(0, 0, 0, 0);

          if (endDate >= now) {
            const newEndDate = new Date(endDate.getTime() + days * 24 * 60 * 60 * 1000);
            const newEndDateStr = formatDateToString(newEndDate);
            const updatedLocker: Locker = { ...latestLocker, endDate: newEndDateStr };

            if (Array.isArray(newValue)) {
              const u = [...newValue];
              u[u.length - 1] = updatedLocker;
              updates[key] = u;
            } else {
              updates[key] = updatedLocker;
            }

            if (latestLocker.id && latestLocker.key) {
              extendedLockers.push({ id: latestLocker.id, key: latestLocker.key, endDate: newEndDateStr });
            }
            extendedCount++;
          }
        }
      }

      if (Object.keys(updates).length > 0) tx.update(ref, updates);
      return { extendedCount, extendedLockers };
    });
  }
}
