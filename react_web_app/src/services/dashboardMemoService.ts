import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const DASHBOARD_MEMO_DOC_ID = 'coachMemoDoc';

interface DashboardMemoDoc {
  coachMemo?: string;
  updatedAt?: unknown;
}

export class DashboardMemoService {
  static async getCoachMemo(boxName: string): Promise<string> {
    try {
      if (!boxName) return '';

      const memoRef = doc(db, `box/${boxName}/dashboardCoachMemos/${DASHBOARD_MEMO_DOC_ID}`);
      const memoSnap = await getDoc(memoRef);

      if (!memoSnap.exists()) {
        return '';
      }

      const data = memoSnap.data() as DashboardMemoDoc;
      return data.coachMemo || '';
    } catch (error) {
      console.error('Failed to load coach memo:', error);
      throw error;
    }
  }

  static async saveCoachMemo(boxName: string, coachMemo: string): Promise<void> {
    try {
      if (!boxName) {
        throw new Error('박스 이름이 없습니다.');
      }

      const memoRef = doc(db, `box/${boxName}/dashboardCoachMemos/${DASHBOARD_MEMO_DOC_ID}`);
      await setDoc(
        memoRef,
        {
          coachMemo,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to save coach memo:', error);
      throw error;
    }
  }
}
