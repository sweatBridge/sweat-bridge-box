import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BoxInfo } from '../types/box';

export class BoxService {
  /**
   * 박스 정보 조회
   */
  static async getBoxInfo(boxName: string): Promise<BoxInfo | null> {
    try {
      const docRef = doc(db, 'box', boxName);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as BoxInfo;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting box info:', error);
      throw new Error('박스 정보를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 박스 정보 업데이트
   */
  static async updateBoxInfo(boxInfo: BoxInfo): Promise<void> {
    try {
      const path = `/box/${boxInfo.boxName}`;
      await setDoc(doc(db, path), boxInfo);
    } catch (error) {
      console.error('Error updating box info:', error);
      throw new Error('박스 정보 수정에 실패했습니다.');
    }
  }
} 