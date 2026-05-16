import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { BoxInfo } from '../types/box';

export class BoxRepository {
  /**
   * 박스 문서를 조회합니다.
   *
   * @param boxName 박스 이름
   * @returns 박스 정보 또는 `null`
   */
  static async getBoxInfo(boxName: string): Promise<BoxInfo | null> {
    const snap = await getDoc(doc(db, 'box', boxName));
    return snap.exists() ? (snap.data() as BoxInfo) : null;
  }

  /**
   * 박스 문서를 저장합니다.
   *
   * @param boxInfo 저장할 박스 정보
   */
  static async saveBoxInfo(boxInfo: BoxInfo): Promise<void> {
    await setDoc(doc(db, 'box', boxInfo.boxName), boxInfo);
  }

  /**
   * 박스의 memberCount 필드를 delta만큼 증감합니다.
   * 필드가 없으면 delta 값으로 초기화됩니다.
   *
   * @param boxName 박스 이름
   * @param delta 변화량 (+1 또는 -1)
   */
  static async adjustMemberCount(boxName: string, delta: number): Promise<void> {
    await updateDoc(doc(db, 'box', boxName), { memberCount: increment(delta) });
  }
}
