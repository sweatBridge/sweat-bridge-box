import { serverWrite } from '../../data/apiClient';
import { LOCKER_ACTION, LOCKER_STATE, Locker, LockerDocumentData } from '../../types/locker';
import { LockerRepository } from '../lockerRepository';
import { ServerLockerRepository } from '../server/serverLockerRepository';

interface LockerTransactionContext {
  exists: boolean;
  data: LockerDocumentData;
}

interface LockerTransactionResult<T> {
  result: T;
  payload?: Record<string, unknown>;
  operation?: 'set' | 'update';
}

export class HybridLockerRepository {
  static getLockerDocument(box: string): Promise<LockerTransactionContext> {
    return LockerRepository.getLockerDocument(box);
  }

  static async runLockerDocumentTransaction<T>(
    box: string,
    handler: (context: LockerTransactionContext) => Promise<LockerTransactionResult<T>> | LockerTransactionResult<T>
  ): Promise<T> {
    let capturedPayload: Record<string, unknown> | undefined;

    const wrappedHandler = async (context: LockerTransactionContext): Promise<LockerTransactionResult<T>> => {
      const res = await handler(context);
      capturedPayload = res.payload;
      return res;
    };

    const result = await LockerRepository.runLockerDocumentTransaction(box, wrappedHandler);

    if (capturedPayload && Object.keys(capturedPayload).length > 0) {
      const payload = capturedPayload;
      serverWrite(
        () => syncPayloadToServer(box, payload),
        `Locker.transaction(${box})`
      );
    }

    return result;
  }
}

async function syncPayloadToServer(box: string, payload: Record<string, unknown>): Promise<void> {
  for (const [key, value] of Object.entries(payload)) {
    const lockerNumber = Number(key);
    if (!Number.isFinite(lockerNumber)) continue;

    const lastEntry = extractLastEntry(value);
    if (!lastEntry) continue;

    await syncEntryToServer(box, lockerNumber, lastEntry);
  }
}

function extractLastEntry(value: unknown): Partial<Locker> | null {
  if (Array.isArray(value) && value.length > 0) {
    return value[value.length - 1] as Partial<Locker>;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Partial<Locker>;
  }
  return null;
}

async function syncEntryToServer(box: string, lockerNumber: number, entry: Partial<Locker>): Promise<void> {
  const { action, state } = entry;

  // 신규 락커 추가 (addLockers): action 없음, state = unused, realName 없음
  if (!action && state === LOCKER_STATE.UNUSED && !entry.realName) {
    try {
      await ServerLockerRepository.createLocker({ box_name: box, number: lockerNumber });
    } catch {
      // 이미 존재할 수 있으므로 무시
    }
    return;
  }

  if (action === LOCKER_ACTION.ASSIGN) {
    const lockerId = await ServerLockerRepository.findLockerIdByNumber(box, lockerNumber);
    if (!lockerId) return;
    await ServerLockerRepository.assignLocker(lockerId, {
      user_email: entry.id || '',
      real_name: entry.realName || '',
      phone: entry.phone || undefined,
      start_date: entry.startDate || new Date().toISOString().split('T')[0],
      end_date: entry.endDate || undefined,
      locker_key: entry.key || undefined,
      price: entry.price || undefined,
      payment_type: entry.paymentType || undefined
    });
    return;
  }

  if (action === LOCKER_ACTION.RELEASE) {
    const lockerId = await ServerLockerRepository.findLockerIdByNumber(box, lockerNumber);
    if (lockerId) await ServerLockerRepository.releaseLocker(lockerId);
    return;
  }

  if (action === LOCKER_ACTION.DELETE) {
    const lockerId = await ServerLockerRepository.findLockerIdByNumber(box, lockerNumber);
    if (lockerId) await ServerLockerRepository.updateLockerState(lockerId, 'deleted');
    return;
  }

  if (action === LOCKER_ACTION.MARK_BROKEN) {
    const lockerId = await ServerLockerRepository.findLockerIdByNumber(box, lockerNumber);
    if (lockerId) await ServerLockerRepository.updateLockerState(lockerId, 'na');
    return;
  }

  if (action === LOCKER_ACTION.RESTORE) {
    const lockerId = await ServerLockerRepository.findLockerIdByNumber(box, lockerNumber);
    if (lockerId) await ServerLockerRepository.updateLockerState(lockerId, 'unused');
    return;
  }
}
