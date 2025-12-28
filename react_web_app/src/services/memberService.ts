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
  deleteField,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Member, MemberLockerHistory } from '../types/member';
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
        const data = doc.data() as any;
        
        // birth 필드를 birthDate로 변환 (레거시 데이터 지원)
        if (data.birth && !data.birthDate) {
          data.birthDate = data.birth;
        }
        
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
   * lockerHistory 배열에 히스토리를 누적 추가
   */
  static async assignLockerToMember(
    box: string, 
    email: string, 
    lockerNumber: number,
    startDate: string,
    endDate: string,
    key: string,
    price: string,
    paymentType: 'cash' | 'card'
  ): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      const memberRef = doc(db, path, email);
      const memberDoc = await getDoc(memberRef);
      
      let lockerHistory: MemberLockerHistory[] = [];
      if (memberDoc.exists()) {
        const data = memberDoc.data();
        lockerHistory = (data.lockerHistory || []) as MemberLockerHistory[];
      }
      
      // 새로운 히스토리 항목 추가
      const newHistoryEntry: MemberLockerHistory = {
        lockerNum: lockerNumber,
        startDate: startDate,
        endDate: endDate,
        createdAt: Timestamp.now(),
        key: key,
        price: price,
        paymentType: paymentType
      };
      
      lockerHistory.push(newHistoryEntry);
      
      await updateDoc(memberRef, {
        lockerHistory: lockerHistory
      });
    } catch (error) {
      console.error('Error assigning locker to member:', error);
      throw error;
    }
  }

  /**
   * 회원의 락커 히스토리에서 endDate 업데이트
   * id(email)와 key를 기준으로 lockerHistory를 찾아 endDate를 변경
   */
  static async updateLockerHistoryEndDate(
    box: string,
    email: string,
    key: string,
    newEndDate: string
  ): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      const memberRef = doc(db, path, email);
      const memberDoc = await getDoc(memberRef);
      
      if (!memberDoc.exists()) {
        throw new Error('회원 정보를 찾을 수 없습니다.');
      }
      
      const data = memberDoc.data();
      let lockerHistory: any[] = data.lockerHistory || [];
      
      // key를 기준으로 해당 항목 찾아서 endDate 업데이트
      const targetIndex = lockerHistory.findIndex(
        (item: any) => item.key === key
      );
      
      if (targetIndex === -1) {
        // 히스토리를 찾을 수 없어도 에러를 던지지 않고 로그만 남김
        console.warn(`락커 히스토리를 찾을 수 없습니다. email: ${email}, key: ${key}`);
        return;
      }
      
      // endDate 업데이트
      lockerHistory[targetIndex] = {
        ...lockerHistory[targetIndex],
        endDate: newEndDate
      };
      
      await updateDoc(memberRef, {
        lockerHistory: lockerHistory
      });
    } catch (error) {
      console.error('Error updating locker history endDate:', error);
      throw error;
    }
  }

  /**
   * 회원의 락커 할당 해제
   * lockerHistory 배열에서 key로 항목을 찾아 endDate를 업데이트
   */
  static async unassignLockerFromMember(
    box: string, 
    email: string,
    lockerNumber: number,
    endDate: string,
    key: string
  ): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      const memberRef = doc(db, path, email);
      const memberDoc = await getDoc(memberRef);
      
      if (!memberDoc.exists()) {
        throw new Error('회원 정보를 찾을 수 없습니다.');
      }
      
      const data = memberDoc.data();
      let lockerHistory: any[] = data.lockerHistory || [];
      
      // key를 기준으로 해당 항목 찾아서 endDate 업데이트
      const targetIndex = lockerHistory.findIndex(
        (item: any) => item.key === key && item.lockerNum === lockerNumber
      );
      
      if (targetIndex === -1) {
        throw new Error('해당 락커 할당 기록을 찾을 수 없습니다.');
      }
      
      // endDate 업데이트
      lockerHistory[targetIndex] = {
        ...lockerHistory[targetIndex],
        endDate: endDate
      };
      
      await updateDoc(memberRef, {
        lockerHistory: lockerHistory
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
              boxName: boxName,
              birth: applicant.birth || undefined
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
   * 신청자 승인
   */
  static async approveApplicant(email: string, boxName: string): Promise<void> {
    try {
      // 1. 사용자 정보 조회
      const userDoc = await this.getUserByEmail(email);
      
      if (!userDoc) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      // 2. boxName이 ?로 시작하는지 확인
      if (!userDoc.boxName?.startsWith('?')) {
        throw new Error('유효하지 않은 신청 상태입니다.');
      }

      // 3. ? 제거
      const actualBoxName = userDoc.boxName.slice(1);

      // 4. 신청 제거 (applied/applieddoc에서 삭제 및 user 문서 업데이트)
      await this.removeApplication(email, actualBoxName);

      // 5. memberships 필드가 있으면 제거
      if (userDoc.hasOwnProperty('memberships')) {
        delete userDoc.memberships;
      }

      // 6. birth 필드를 birthDate로 변환
      if (userDoc.birth && !userDoc.birthDate) {
        userDoc.birthDate = userDoc.birth;
        delete userDoc.birth;
      }

      // 7. boxName 업데이트
      userDoc.boxName = actualBoxName;

      // 8. 가입일 추가
      userDoc.joinedAt = Timestamp.now();

      // 9. 회원 생성
      await this.createMember(actualBoxName, userDoc);

      console.log(`Applicant ${email} approved successfully`);
    } catch (error) {
      console.error('Failed to approve applicant:', error);
      throw error;
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
   * 회원 메모 업데이트
   */
  static async updateMemberMemo(box: string, email: string, memo: string): Promise<void> {
    try {
      const path = `/box/${box}/member`;
      const memberRef = doc(db, path, email);
      
      await updateDoc(memberRef, {
        memo: memo
      });
      
      console.log(`Successfully updated memo for member: ${email}`);
    } catch (error) {
      console.error('Error updating member memo:', error);
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