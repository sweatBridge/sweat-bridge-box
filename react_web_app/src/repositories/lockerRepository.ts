import { getDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LockerDocumentData } from '../types/locker';

type LockerTransactionOperation = 'set' | 'update';

interface LockerTransactionResult<T> {
  result: T;
  payload?: Record<string, unknown>;
  operation?: LockerTransactionOperation;
}

interface LockerTransactionContext {
  exists: boolean;
  data: LockerDocumentData;
}

export class LockerRepository {
  static async getLockerDocument(box: string): Promise<LockerTransactionContext> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { exists: false, data: {} };
    }

    return {
      exists: true,
      data: snap.data() as LockerDocumentData
    };
  }

  static async runLockerDocumentTransaction<T>(
    box: string,
    handler: (context: LockerTransactionContext) => Promise<LockerTransactionResult<T>> | LockerTransactionResult<T>
  ): Promise<T> {
    const ref = doc(db, 'box', box, 'lockers', 'lockerdoc');

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const context: LockerTransactionContext = snap.exists()
        ? { exists: true, data: snap.data() as LockerDocumentData }
        : { exists: false, data: {} };

      const { result, payload, operation = 'set' } = await handler(context);

      if (payload && Object.keys(payload).length > 0) {
        if (operation === 'update' && snap.exists()) {
          tx.update(ref, payload as Record<string, any>);
        } else {
          tx.set(ref, payload, { merge: true });
        }
      }

      return result;
    });
  }
}
