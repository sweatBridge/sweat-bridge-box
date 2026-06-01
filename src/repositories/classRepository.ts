import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FirebaseClassData {
  cap: number;
  coach: string;
  date: Timestamp;
  reserved: string[];
}

export interface ClassPayload {
  docKey: string;
  box: string;
  coach: string;
  cap: number;
  reserved?: string[];
}

export interface FirebaseClassDocument {
  docKey: string;
  data: FirebaseClassData;
}

export class ClassRepository {
  /**
   * 지정한 기간의 클래스 문서를 조회합니다.
   *
   * @param box 박스 이름
   * @param startDate 조회 시작 시각
   * @param endDate 조회 종료 시각
   * @returns 클래스 문서 목록
   */
  static async getClassesInRange(box: string, startDate: Date, endDate: Date): Promise<FirebaseClassDocument[]> {
    const q = query(
      collection(db, `/box/${box}/class`),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );

    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      docKey: docSnap.id,
      data: docSnap.data() as FirebaseClassData
    }));
  }

  /**
   * 클래스 문서를 생성합니다.
   *
   * @param box 박스 이름
   * @param docKey 클래스 문서 키
   * @param data 저장할 클래스 데이터
   */
  static async setClassDocument(box: string, docKey: string, data: FirebaseClassData): Promise<void> {
    await setDoc(doc(db, `/box/${box}/class`, docKey), data);
  }

  /**
   * 클래스 문서를 수정합니다.
   *
   * @param box 박스 이름
   * @param docKey 클래스 문서 키
   * @param data 수정할 클래스 데이터
   */
  static async updateClassDocument(box: string, docKey: string, data: FirebaseClassData): Promise<void> {
    await updateDoc(doc(db, `/box/${box}/class`, docKey), {
      cap: data.cap,
      coach: data.coach,
      date: data.date,
      reserved: data.reserved
    });
  }

  /**
   * 클래스 문서를 삭제합니다.
   *
   * @param docKey 클래스 문서 키
   * @param box 박스 이름
   */
  static async deleteClassDocument(docKey: string, box: string): Promise<void> {
    await deleteDoc(doc(db, `/box/${box}/class`, docKey));
  }
}
