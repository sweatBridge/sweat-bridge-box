import { 
  getDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCurrentMemberships, MembershipData } from '../utils/membershipUtils';

export class MembershipService {
  /**
   * 특정 회원의 멤버십 정보 조회
   */
  static async getUserMemberships(box: string, email: string): Promise<MembershipData[]> {
    try {
      if (!box || !email) {
        console.warn('boxName 또는 email이 없습니다.');
        return [];
      }

      const memberDocRef = doc(db, `box/${box}/member/${email}`);
      const docSnap = await getDoc(memberDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const memberships = data.memberships || [];
        return memberships;
      } else {
        console.log('Member 문서를 찾을 수 없습니다.');
        return [];
      }
    } catch (error) {
      console.error('회원권 정보 불러오기 중 오류 발생:', error);
      return [];
    }
  }

  /**
   * 특정 회원의 현재 유효한 멤버십 정보 조회
   */
  static async getUserCurrentMemberships(box: string, email: string): Promise<MembershipData[]> {
    try {
      const memberships = await this.getUserMemberships(box, email);
      return getCurrentMemberships(memberships);
    } catch (error) {
      console.error('현재 멤버십 정보 불러오기 중 오류 발생:', error);
      return [];
    }
  }

  /**
   * 회원의 멤버십 정보 업데이트
   */
  static async updateUserMembership(
    box: string, 
    email: string, 
    memberships: MembershipData[]
  ): Promise<void> {
    try {
      const memberDocRef = doc(db, `box/${box}/member/${email}`);
      await updateDoc(memberDocRef, {
        memberships: memberships
      });
    } catch (error) {
      console.error('멤버십 정보 업데이트 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 회원에게 새 멤버십 추가
   */
  static async addMembershipToUser(
    box: string, 
    email: string, 
    newMembership: MembershipData
  ): Promise<void> {
    try {
      const currentMemberships = await this.getUserMemberships(box, email);
      const updatedMemberships = [...currentMemberships, newMembership];
      
      await this.updateUserMembership(box, email, updatedMemberships);
    } catch (error) {
      console.error('멤버십 추가 중 오류 발생:', error);
      throw error;
    }
  }
} 