import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BoxInfo, BoxStatus } from '../types/box';

export class AdminBoxRepository {
  /**
   * box 컬렉션 전체를 1회 조회합니다.
   */
  static async listAllBoxes(): Promise<BoxInfo[]> {
    const snap = await getDocs(collection(db, 'box'));
    return snap.docs.map((d) => d.data() as BoxInfo);
  }

  /**
   * 특정 박스의 status 필드를 업데이트합니다.
   */
  static async updateBoxStatus(boxName: string, status: BoxStatus): Promise<void> {
    await updateDoc(doc(db, 'box', boxName), { status });
  }
}
