import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserMembership } from '../types/membership';

export interface FirebaseMemberData {
  email: string;
  realName: string;
  nickName: string;
  gender: 'M' | 'F';
  birthDate: string;
  phone: string;
  memberships: UserMembership[];
  futureMemberships: UserMembership[];
}

export interface FirebaseMemberDocument {
  id: string;
  data: any;
}

export class MemberRepository {
  /**
   * 박스의 전체 회원 문서를 조회합니다.
   *
   * @param box 박스 이름
   * @returns 회원 문서 목록
   */
  static async getMemberDocuments(box: string): Promise<FirebaseMemberDocument[]> {
    const snap = await getDocs(collection(db, `/box/${box}/member`));
    return snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
  }

  /**
   * 특정 회원 문서를 조회합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   * @returns 회원 문서 또는 `null`
   */
  static async getMemberDocument(box: string, email: string): Promise<any | null> {
    const snap = await getDoc(doc(db, `/box/${box}/member`, email));
    return snap.exists() ? snap.data() : null;
  }

  /**
   * 회원 문서를 삭제합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   */
  static async deleteMember(box: string, email: string): Promise<void> {
    await deleteDoc(doc(db, `/box/${box}/member`, email));
  }

  /**
   * 회원 문서를 부분 수정합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   * @param payload 수정할 필드
   */
  static async updateMember(box: string, email: string, payload: any): Promise<void> {
    await updateDoc(doc(db, `/box/${box}/member`, email), payload);
  }

  /**
   * 회원 문서를 병합 저장합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   * @param payload 저장할 데이터
   */
  static async setMember(box: string, email: string, payload: any): Promise<void> {
    await setDoc(doc(db, `/box/${box}/member`, email), payload, { merge: true });
  }

  /**
   * 자동 생성 ID로 회원 문서를 추가합니다.
   *
   * @param box 박스 이름
   * @param memberData 저장할 회원 데이터
   */
  static async addMember(box: string, memberData: FirebaseMemberData): Promise<void> {
    await addDoc(collection(db, `/box/${box}/member`), memberData);
  }

  /**
   * 특정 필드 값과 일치하는 사용자 문서를 조회합니다.
   *
   * @param field 조회 필드명
   * @param value 조회 값
   * @returns 사용자 데이터 목록
   */
  static async getUsersByField(field: string, value: string): Promise<any[]> {
    const snap = await getDocs(query(collection(db, '/user'), where(field, '==', value)));
    return snap.docs.map((docSnap) => docSnap.data());
  }

  /**
   * 이메일과 일치하는 사용자 문서를 부분 수정합니다.
   *
   * @param email 사용자 이메일
   * @param userData 수정할 데이터
   * @returns 수정 데이터 또는 `null`
   */
  static async updateUsersByEmail(email: string, userData: any): Promise<any> {
    const snap = await getDocs(query(collection(db, '/user'), where('email', '==', email)));
    if (snap.empty) {
      return null;
    }

    for (const docSnap of snap.docs) {
      await updateDoc(docSnap.ref, userData);
    }

    return userData;
  }

  /**
   * 가입 신청 문서를 조회합니다.
   *
   * @param boxName 박스 이름
   * @returns 신청 데이터 맵 또는 `null`
   */
  static async getApplicantMap(boxName: string): Promise<Record<string, any> | null> {
    const snap = await getDoc(doc(db, `box/${boxName}/applied/applieddoc`));
    return snap.exists() ? (snap.data() as Record<string, any>) : null;
  }

  /**
   * 가입 신청 문서에서 특정 신청 정보를 제거합니다.
   *
   * @param email 신청자 이메일
   * @param boxName 박스 이름
   */
  static async deleteApplication(email: string, boxName: string): Promise<void> {
    await setDoc(doc(db, `box/${boxName}/applied/applieddoc`), { [email]: deleteField() }, { merge: true });
  }

  /**
   * 사용자 문서의 박스 이름을 수정합니다.
   *
   * @param email 사용자 이메일
   * @param boxName 반영할 박스 이름
   */
  static async updateUserBoxName(email: string, boxName: string): Promise<void> {
    await updateDoc(doc(db, `user/${email}`), { boxName });
  }
}
