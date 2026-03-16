import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BoxInfo } from '../types/box';

export class BoxRepository {
  static async getBoxInfo(boxName: string): Promise<BoxInfo | null> {
    try {
      const snap = await getDoc(doc(db, 'box', boxName));
      return snap.exists() ? (snap.data() as BoxInfo) : null;
    } catch (error) {
      console.error('Error getting box info:', error);
      throw new Error('박스 정보를 불러오는데 실패했습니다.');
    }
  }

  static async updateBoxInfo(boxInfo: BoxInfo): Promise<void> {
    try {
      await setDoc(doc(db, 'box', boxInfo.boxName), boxInfo);
    } catch (error) {
      console.error('Error updating box info:', error);
      throw new Error('박스 정보 수정에 실패했습니다.');
    }
  }
}
