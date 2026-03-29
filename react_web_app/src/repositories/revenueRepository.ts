import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { RevenueData } from '../types/revenue';

export interface RevenueYearDocument {
  year: string;
  data: Record<string, any>;
}

export class RevenueRepository {
  /**
   * 특정 연도의 매출 문서를 조회합니다.
   *
   * @param boxName 박스 이름
   * @param year 조회 연도
   * @returns 연도 매출 데이터
   */
  static async getRevenueYear(boxName: string, year: number): Promise<Record<string, any>> {
    const revenueDoc = await getDoc(doc(db, `box/${boxName}/revenue/${year}`));
    return revenueDoc.exists() ? revenueDoc.data() : {};
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
   * 특정 연도의 매출 문서를 저장합니다.
   *
   * @param boxName 박스 이름
   * @param year 저장 연도
   * @param data 저장할 연도 데이터
   */
  static async setRevenueYear(boxName: string, year: number | string, data: Record<string, any>): Promise<void> {
    await setDoc(doc(db, `box/${boxName}/revenue/${year}`), data);
  }

  /**
   * 일별 매출 저장 구현을 위한 예약 메서드입니다.
   *
   * @param _boxName 박스 이름
   * @param _dailyRevenue 저장할 일별 매출
   */
  static async updateDailyRevenue(_boxName: string, _dailyRevenue: any): Promise<void> {
    return Promise.resolve();
  }
}
