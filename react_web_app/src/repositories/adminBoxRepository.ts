import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
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

  /**
   * 신규 박스를 생성하고 하위 컬렉션 초기 문서를 함께 세팅합니다.
   *   - box/{boxName}                      박스 기본 정보
   *   - box/{boxName}/membership/plansDoc  회원권 플랜 (빈 배열)
   *   - box/{boxName}/lockers/lockerdoc    락커 현황 (빈 맵)
   *   - box/{boxName}/applied/applieddoc   가입 신청 (빈 맵)
   */
  static async createBox(boxInfo: BoxInfo): Promise<void> {
    const boxRef = doc(db, 'box', boxInfo.boxName);
    await setDoc(boxRef, boxInfo);
    await Promise.all([
      setDoc(doc(db, 'box', boxInfo.boxName, 'membership', 'plansDoc'), { plans: [] }),
      setDoc(doc(db, 'box', boxInfo.boxName, 'lockers', 'lockerdoc'), {}),
      setDoc(doc(db, 'box', boxInfo.boxName, 'applied', 'applieddoc'), {}),
    ]);
  }
}
