import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const MEMO_DOC_ID = 'coachMemoDoc';

export class CoachMemoRepository {
  static async getMemo(boxName: string): Promise<string> {
    const snap = await getDoc(doc(db, `box/${boxName}/dashboardCoachMemos/${MEMO_DOC_ID}`));
    if (!snap.exists()) return '';
    return (snap.data() as { coachMemo?: string }).coachMemo ?? '';
  }

  static async saveMemo(boxName: string, coachMemo: string): Promise<void> {
    await setDoc(
      doc(db, `box/${boxName}/dashboardCoachMemos/${MEMO_DOC_ID}`),
      { coachMemo, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}
