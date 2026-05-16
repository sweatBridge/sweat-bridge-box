import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MembershipPlan } from '../types/membership';

export interface MemberMembershipDocument {
  email: string;
  memberships: unknown[];
}

export class MembershipRepository {
  /**
   * 회원권 플랜 문서를 조회합니다.
   *
   * @param boxName 박스 이름
   * @returns 회원권 플랜 목록
   */
  static async getMembershipPlans(boxName: string): Promise<MembershipPlan[]> {
    const snap = await getDoc(doc(db, `box/${boxName}/membership`, 'plansDoc'));
    return snap.exists() ? (snap.data().plans || []) : [];
  }

  /**
   * 회원권 플랜 문서를 저장합니다.
   *
   * @param boxName 박스 이름
   * @param plans 저장할 플랜 목록
   */
  static async setMembershipPlans(boxName: string, plans: MembershipPlan[]): Promise<void> {
    const ref = doc(db, `box/${boxName}/membership`, 'plansDoc');
    await setDoc(ref, { plans }, { merge: true });
  }

  /**
   * 회원 문서의 원시 회원권 배열을 조회합니다.
   *
   * @param boxName 박스 이름
   * @param email 회원 이메일
   * @returns 원시 회원권 배열
   */
  static async getRawUserMemberships(boxName: string, email: string): Promise<unknown[]> {
    const snap = await getDoc(doc(db, `box/${boxName}/member/${email}`));
    if (!snap.exists()) return [];

    return snap.data().memberships || [];
  }

  /**
   * 회원 문서의 회원권 배열을 저장합니다.
   *
   * @param boxName 박스 이름
   * @param email 회원 이메일
   * @param memberships 저장할 회원권 배열
   */
  static async setUserMemberships(boxName: string, email: string, memberships: unknown[]): Promise<void> {
    await setDoc(doc(db, `box/${boxName}/member/${email}`), { memberships }, { merge: true });
  }

  /**
   * 전체 회원 문서의 원시 회원권 배열을 조회합니다.
   *
   * @param boxName 박스 이름
   * @returns 회원 이메일과 원시 회원권 배열 목록
   */
  static async getAllMemberMemberships(boxName: string): Promise<MemberMembershipDocument[]> {
    const snap = await getDocs(collection(db, `/box/${boxName}/member`));
    return snap.docs.map((docSnap) => ({
      email: docSnap.id,
      memberships: docSnap.data().memberships || []
    }));
  }
}
