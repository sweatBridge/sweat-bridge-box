import { 
  getDocs, 
  collection, 
  query, 
  doc, 
  deleteDoc,
  updateDoc,
  addDoc,
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Member } from '../types/member';
import { getCurrentMemberships, getFutureMemberships, getMembershipInfo, MembershipData } from '../utils/membershipUtils';

export interface FirebaseMemberData {
  email: string;
  realName: string;
  nickName: string;
  gender: 'male' | 'female';
  birthDate: string;
  phoneNumber: string;
  memberships: MembershipData[];
  futureMemberships: MembershipData[];
}

export class MemberService {
  /**
   * 모든 회원 조회
   */
  static async getMembers(box: string): Promise<Member[]> {
    try {
      const path = `/box/${box}/member`;
      const querySnapshot = await getDocs(collection(db, path));
      
      const members: Member[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseMemberData;
        members.push({
          ...data,
          membershipInfo: this.calculateMembershipInfo(
            data.memberships || [], 
            data.futureMemberships || []
          )
        });
      });
      
      return members;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  }

  /**
   * 회원 삭제
   */
  static async deleteMember(box: string, email: string): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      await deleteDoc(doc(db, path, email));
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  /**
   * 회원 멤버십 업데이트
   */
  static async updateMemberMembership(box: string, email: string, membershipData: any): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      await updateDoc(doc(db, path, email), membershipData);
    } catch (error) {
      console.error('Error updating member membership:', error);
      throw error;
    }
  }

  /**
   * 새 회원 추가
   */
  static async addMember(box: string, memberData: FirebaseMemberData): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      await addDoc(collection(db, path), memberData);
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  /**
   * 멤버십 정보 계산
   */
  private static calculateMembershipInfo(memberships: MembershipData[], futureMemberships: MembershipData[]) {
    // 안전하게 배열 처리
    const safeMemberships = memberships || [];
    const safeFutureMemberships = futureMemberships || [];
    
    // 현재 유효한 멤버십들을 필터링
    const currentMemberships = getCurrentMemberships(safeMemberships);
    
    // 미래 멤버십들을 필터링 (필요한 경우)
    const filteredFutureMemberships = getFutureMemberships(safeFutureMemberships);
    
    // 멤버십 정보 계산
    return getMembershipInfo(currentMemberships, filteredFutureMemberships);
  }
} 