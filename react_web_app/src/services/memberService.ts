import { 
  getDocs, 
  collection, 
  doc, 
  deleteDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDoc,
  setDoc,
  deleteField
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Member } from '../types/member';
import { getCurrentMemberships, getFutureMemberships, getMembershipInfo, MembershipData } from '../utils/membershipUtils';

export interface FirebaseMemberData {
  email: string;
  realName: string;
  nickName: string;
  gender: 'M' | 'F';
  birthDate: string;
  phone: string;
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
   * 회원 회원권 업데이트
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
   * 이름으로 회원 검색
   */
  static async searchMembersByName(box: string, searchName: string): Promise<Member[]> {
    try {
      const allMembers = await this.getMembers(box);
      const searchTerm = searchName.trim().toLowerCase();
      
      if (!searchTerm) {
        return allMembers;
      }
      
      return allMembers.filter(member => 
        member.realName.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching members:', error);
      throw error;
    }
  }

  /**
   * 회원에게 락커 번호 할당
   */
  static async assignLockerToMember(box: string, email: string, lockerNumber: number): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      await updateDoc(doc(db, path, email), {
        locker: lockerNumber
      });
    } catch (error) {
      console.error('Error assigning locker to member:', error);
      throw error;
    }
  }

  /**
   * 회원의 락커 할당 해제
   */
  static async unassignLockerFromMember(box: string, email: string): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      await updateDoc(doc(db, path, email), {
        locker: null
      });
    } catch (error) {
      console.error('Error unassigning locker from member:', error);
      throw error;
    }
  }

  /**
   * user 컬렉션에서 이메일로 사용자 조회
   */
  static async getUserByEmail(email: string): Promise<any> {
    try {
      const path = '/user';
      const q = query(collection(db, path), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      let userData = null;
      querySnapshot.forEach((doc) => {
        userData = doc.data();
      });
      
      return userData;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  /**
   * user 컬렉션에서 전화번호로 사용자 조회
   */
  static async getUserByPhone(phone: string): Promise<any> {
    try {
      const path = '/user';
      const q = query(collection(db, path), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      
      let userData = null;
      querySnapshot.forEach((doc) => {
        userData = doc.data();
      });
      
      return userData;
    } catch (error) {
      console.error('Error fetching user by phone:', error);
      throw error;
    }
  }

  /**
   * user 컬렉션에서 실명으로 사용자 조회
   */
  static async getUserByRealName(realName: string): Promise<any[]> {
    try {
      const path = '/user';
      const q = query(collection(db, path), where('realName', '==', realName));
      const querySnapshot = await getDocs(q);
      
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data());
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users by realName:', error);
      throw error;
    }
  }

  /**
   * user 컬렉션에서 닉네임으로 사용자 조회
   */
  static async getUserByNickName(nickName: string): Promise<any[]> {
    try {
      const path = '/user';
      const q = query(collection(db, path), where('nickName', '==', nickName));
      const querySnapshot = await getDocs(q);
      
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data());
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users by nickName:', error);
      throw error;
    }
  }

  /**
   * 회원 생성 (email을 문서 ID로 사용)
   */
  static async createMember(box: string, memberData: any): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      const memberDocRef = doc(collection(db, path), memberData.email);
      
      // 이미 존재하는지 확인
      const docSnapshot = await getDoc(memberDocRef);
      if (docSnapshot.exists()) {
        console.log(`Member with email ${memberData.email} already exists. Skipping creation.`);
        return;
      }
      
      await setDoc(memberDocRef, memberData);
      console.log('멤버가 추가되었습니다. 문서 ID:', memberDocRef.id);
    } catch (error) {
      console.error('멤버 추가 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * user 도큐먼트 업데이트
   */
  static async updateUser(email: string, userData: any): Promise<any> {
    try {
      const path = '/user';
      const q = query(collection(db, path), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.warn('해당 이메일로 사용자를 찾을 수 없습니다:', email);
        return null;
      }
      
      // 여러 문서가 있을 수 있지만, 일반적으로는 하나일 것으로 예상
      for (const docSnap of querySnapshot.docs) {
        await updateDoc(docSnap.ref, userData);
      }
      
      return userData;
    } catch (error) {
      console.error('사용자 업데이트 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 신청자 목록 가져오기
   */
  static async fetchApplicants(boxName: string): Promise<any[]> {
    try {
      const applicantDocRef = doc(db, `box/${boxName}/applied/applieddoc`);
      const applicantSnap = await getDoc(applicantDocRef);
      
      const applicants: any[] = [];
      if (applicantSnap.exists()) {
        const data = applicantSnap.data();
        for (const email in data) {
          if (data.hasOwnProperty(email)) {
            const applicant = data[email];
            applicants.push({
              name: applicant.realName || '',
              email: applicant.email || '',
              phone: applicant.phone || '',
              boxName: boxName
            });
          }
        }
      }
      return applicants;
    } catch (error) {
      console.error('Failed to fetch applicants:', error);
      return [];
    }
  }

  /**
   * 신청 거절
   */
  static async rejectApplicant(email: string, boxName: string): Promise<void> {
    try {
      const applicantDocRef = doc(db, `box/${boxName}/applied/applieddoc`);
      const userDocRef = doc(db, `user/${email}`);
      
      await setDoc(applicantDocRef, {
        [email]: deleteField()
      }, { merge: true });
      
      await updateDoc(userDocRef, {
        boxName: ''
      });
      
      console.log(`Applicant ${email} removed successfully`);
    } catch (error) {
      console.error('Failed to reject applicant:', error);
      throw error;
    }
  }

  /**
   * 신청 제거 (승인 시)
   */
  static async removeApplication(email: string, boxName: string): Promise<void> {
    try {
      const applicantDocRef = doc(db, `box/${boxName}/applied/applieddoc`);
      const userDocRef = doc(db, `user/${email}`);
      
      await setDoc(applicantDocRef, {
        [email]: deleteField()
      }, { merge: true });
      
      await updateDoc(userDocRef, {
        boxName: boxName
      });
      
      console.log(`Applicant ${email} removed successfully`);
    } catch (error) {
      console.error('Failed to remove application:', error);
      throw error;
    }
  }

  /**
   * 회원권 정보 계산
   */
  private static calculateMembershipInfo(memberships: MembershipData[], futureMemberships: MembershipData[]) {
    // 안전하게 배열 처리
    const safeMemberships = memberships || [];
    const safeFutureMemberships = futureMemberships || [];
    
    // 현재 유효한 회원권들을 필터링
    const currentMemberships = getCurrentMemberships(safeMemberships);
    
    // 미래 회원권들을 필터링 (필요한 경우)
    const filteredFutureMemberships = getFutureMemberships(safeFutureMemberships);
    
    // 회원권 정보 계산
    return getMembershipInfo(currentMemberships, filteredFutureMemberships);
  }
} 