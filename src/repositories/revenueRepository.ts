import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { RevenueData, RevenueYearData } from '../types/revenue';

export interface RevenueYearDocument {
  year: string;
  data: RevenueYearData;
}

export class RevenueRepository {
  /**
   * 특정 연도의 매출 문서를 조회합니다.
   *
   * @param boxName 박스 이름
   * @param year 조회 연도
   * @returns 연도 매출 데이터
   */
  static async getRevenueYear(boxName: string, year: number): Promise<RevenueYearData> {
    const revenueDoc = await getDoc(doc(db, `box/${boxName}/revenue/${year}`));
    return revenueDoc.exists() ? (revenueDoc.data() as RevenueYearData) : {};
  }

  /**
   * 전체 연도 매출 문서를 조회합니다.
   *
   * @param boxName 박스 이름
   * @returns 연도 매출 문서 목록
   */
  static async getAllRevenueYears(boxName: string): Promise<RevenueYearDocument[]> {
    const snap = await getDocs(collection(db, `box/${boxName}/revenue`));
    return snap.docs.map((docSnap) => ({ year: docSnap.id, data: docSnap.data() }));
  }

  /**
   * 매출 문서에 단일 엔트리를 추가/갱신합니다.
   *
   * 연도 문서가 없으면 새로 만들고, 있으면 해당 월의 해당 키만 갱신합니다.
   * 다른 월·엔트리는 보존됩니다(merge: true).
   *
   * @param boxName 박스 이름
   * @param year 매출 연도
   * @param month 매출 월(1~12)
   * @param key 매출 엔트리 키
   * @param entry 저장할 매출 데이터
   */
  static async setRevenueEntry(
    boxName: string,
    year: number,
    month: number,
    key: string,
    entry: RevenueData
  ): Promise<void> {
    await setDoc(
      doc(db, `box/${boxName}/revenue/${year}`),
      { [month.toString()]: { [key]: entry } },
      { merge: true }
    );
  }

  /**
   * 특정 매출 엔트리의 단일 필드만 갱신합니다.
   *
   * 환불 금액 등 사후 갱신용으로 사용합니다. 문서가 이미 존재한다고 가정합니다.
   *
   * @param boxName 박스 이름
   * @param year 매출 연도
   * @param month 매출 월(1~12)
   * @param key 매출 엔트리 키
   * @param field 변경할 필드 이름
   * @param value 새 값
   */
  static async updateRevenueEntryField(
    boxName: string,
    year: number,
    month: number,
    key: string,
    field: string,
    value: unknown
  ): Promise<void> {
    await updateDoc(doc(db, `box/${boxName}/revenue/${year}`), {
      [`${month}.${key}.${field}`]: value
    } as Record<string, any>);
  }

  /**
   * 특정 매출 엔트리를 삭제합니다.
   *
   * @param boxName 박스 이름
   * @param year 매출 연도
   * @param month 매출 월(1~12)
   * @param key 매출 엔트리 키
   */
  static async deleteRevenueEntry(
    boxName: string,
    year: number,
    month: number,
    key: string
  ): Promise<void> {
    await updateDoc(doc(db, `box/${boxName}/revenue/${year}`), {
      [`${month}.${key}`]: deleteField()
    });
  }

}
