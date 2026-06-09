import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
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

/**
 * 같은 docKey에 이미 클래스가 있어 생성에 실패했을 때 던지는 예외.
 *
 * 호출자는 `instanceof ClassAlreadyExistsError`로 "이미 존재" 케이스를
 * 다른 실패와 구분해서 적절한 UX를 제공할 수 있다(예: 4주 반복 시 해당 주만 건너뛰기).
 */
export class ClassAlreadyExistsError extends Error {
  readonly docKey: string;
  readonly box: string;
  constructor(box: string, docKey: string) {
    super(`Class already exists: box=${box}, docKey=${docKey}`);
    this.name = 'ClassAlreadyExistsError';
    this.box = box;
    this.docKey = docKey;
  }
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
   * 특정 클래스 문서를 조회합니다.
   *
   * @param box 박스 이름
   * @param date 레거시 날짜 경로
   * @param time 레거시 시간 경로
   * @returns 클래스 문서 또는 `null`
   */
  static async getClass(box: string, date: string, time: string): Promise<FirebaseClassData | null> {
    const snap = await getDoc(doc(db, `/box/${box}/class/${date}/time`, time));
    return snap.exists() ? (snap.data() as FirebaseClassData) : null;
  }

  /**
   * 클래스 문서를 생성합니다.
   *
   * 같은 `docKey`에 이미 클래스가 있으면 `ClassAlreadyExistsError`를 던진다 —
   * 다른 코치가 만들어 놓은 클래스(또는 동일 코치의 재생성 시도)의 `reserved` 배열을
   * 통째로 덮어쓰지 않도록 트랜잭션 안에서 존재 여부를 먼저 검증한다.
   *
   * 수정이 의도라면 `updateClassDocument`를 사용해야 한다.
   *
   * @param box 박스 이름
   * @param docKey 클래스 문서 키
   * @param data 저장할 클래스 데이터
   * @throws ClassAlreadyExistsError 같은 docKey의 문서가 이미 존재할 때
   */
  static async setClassDocument(box: string, docKey: string, data: FirebaseClassData): Promise<void> {
    const ref = doc(db, `/box/${box}/class`, docKey);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        throw new ClassAlreadyExistsError(box, docKey);
      }
      tx.set(ref, data);
    });
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
