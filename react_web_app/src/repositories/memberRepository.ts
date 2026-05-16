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
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { BoxStatus } from '../types/auth';
import { UserMembership } from '../types/membership';
import { BoxUser, MemberApplicantRecord } from '../types/member';

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
  data: Record<string, unknown>;
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
  static async getMemberDocument(box: string, email: string): Promise<Record<string, unknown> | null> {
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
  static async updateMember(box: string, email: string, payload: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, `/box/${box}/member`, email), payload as Record<string, any>);
  }

  /**
   * 회원 문서를 병합 저장합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   * @param payload 저장할 데이터
   */
  static async setMember(box: string, email: string, payload: Record<string, unknown>): Promise<void> {
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
   * 이메일은 문서 ID이므로 `getUserByEmail`을 사용하면 쿼리 없이 1회 read로 끝납니다.
   *
   * @param field 조회 필드명
   * @param value 조회 값
   * @returns 사용자 데이터 목록
   */
  static async getUsersByField(field: string, value: string): Promise<BoxUser[]> {
    if (field === 'email') {
      const user = await this.getUserByEmail(value);
      return user ? [user] : [];
    }
    const snap = await getDocs(query(collection(db, '/user'), where(field, '==', value)));
    return snap.docs.map((docSnap) => docSnap.data() as BoxUser);
  }

  /**
   * 이메일을 문서 ID로 사용해 사용자 문서를 직접 조회합니다.
   *
   * `where('email', '==', ...)` 쿼리 대비 인덱스 룩업이 없어 빠르고 비용도 동일합니다.
   *
   * @param email 사용자 이메일(문서 ID)
   * @returns 사용자 정보 또는 `null`
   */
  static async getUserByEmail(email: string): Promise<BoxUser | null> {
    const snap = await getDoc(doc(db, 'user', email));
    return snap.exists() ? (snap.data() as BoxUser) : null;
  }

  /**
   * 이메일에 해당하는 사용자 문서를 부분 수정합니다.
   *
   * `user` 컬렉션은 이메일을 문서 ID로 사용하므로 read 없이 단일 `updateDoc` 1회로 끝냅니다.
   *
   * @param email 사용자 이메일(문서 ID)
   * @param userData 수정할 데이터
   * @returns 수정 데이터 또는 문서가 없으면 `null`
   */
  static async updateUsersByEmail(email: string, userData: Partial<BoxUser>): Promise<Partial<BoxUser> | null> {
    try {
      await updateDoc(doc(db, 'user', email), userData);
      return userData;
    } catch (error: any) {
      // 문서가 없으면 firestore가 not-found로 거부 — 기존 시그니처 호환을 위해 null 반환
      if (error?.code === 'not-found') return null;
      throw error;
    }
  }

  /**
   * 가입 신청 문서를 조회합니다.
   *
   * @param boxName 박스 이름
   * @returns 신청 데이터 맵 또는 `null`
   */
  static async getApplicantMap(boxName: string): Promise<Record<string, MemberApplicantRecord> | null> {
    const snap = await getDoc(doc(db, `box/${boxName}/applied/applieddoc`));
    return snap.exists() ? (snap.data() as Record<string, MemberApplicantRecord>) : null;
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

  /**
   * 가입 신청 승인 처리를 단일 writeBatch로 커밋합니다.
   *
   * `applied/applieddoc`에서 신청자 제거 + `user/{email}.boxName` 갱신 +
   * `box/{boxName}/member/{email}` 문서 생성(merge)을 한 번의 원자 커밋으로 처리합니다.
   *
   * @param email 신청자 이메일
   * @param boxName 승인되는 박스 이름
   * @param memberData 새 회원 문서에 저장할 데이터
   */
  static async commitApproveApplicantBatch(
    email: string,
    boxName: string,
    memberData: Record<string, unknown>
  ): Promise<void> {
    const batch = writeBatch(db);
    batch.set(
      doc(db, `box/${boxName}/applied/applieddoc`),
      { [email]: deleteField() },
      { merge: true }
    );
    batch.update(doc(db, `user/${email}`), { boxName });
    batch.set(doc(db, `box/${boxName}/member`, email), memberData, { merge: true });
    await batch.commit();
  }

  /**
   * 가입 신청 거절 처리를 단일 writeBatch로 커밋합니다.
   *
   * `applied/applieddoc`에서 신청자 제거 + `user/{email}.boxName`을 빈 문자열로 갱신.
   *
   * @param email 신청자 이메일
   * @param boxName 신청이 등록되어 있던 박스 이름
   */
  static async commitRejectApplicantBatch(email: string, boxName: string): Promise<void> {
    const batch = writeBatch(db);
    batch.set(
      doc(db, `box/${boxName}/applied/applieddoc`),
      { [email]: deleteField() },
      { merge: true }
    );
    batch.update(doc(db, `user/${email}`), { boxName: '' });
    await batch.commit();
  }

  /**
   * 사용자 문서의 박스 이름과 박스 소속 상태를 함께 수정합니다.
   *
   * @param email 사용자 이메일
   * @param boxName 반영할 박스 이름
   * @param status 반영할 박스 소속 상태
   */
  static async updateUserBoxInfo(email: string, boxName: string, status: BoxStatus): Promise<void> {
    await updateDoc(doc(db, `user/${email}`), { boxName, status });
  }

  /**
   * 사용자 문서의 박스 소속 상태만 수정합니다.
   *
   * @param email 사용자 이메일
   * @param status 반영할 박스 소속 상태
   */
  static async updateUserStatus(email: string, status: BoxStatus): Promise<void> {
    await updateDoc(doc(db, `user/${email}`), { status });
  }
}