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
import { UserMembership } from '../types/membership';
import {
  convertMembershipsFromFirebase,
  categorizeMemberships,
  buildMembershipInfo
} from '../models/memberModel';

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

export class MemberRepository {
  static async getMembers(box: string): Promise<Member[]> {
    try {
      const snap = await getDocs(collection(db, `/box/${box}/member`));
      const members: Member[] = [];

      snap.forEach(docSnap => {
        const data = docSnap.data() as any;

        // 레거시 birth 필드 지원
        if (data.birth && !data.birthDate) data.birthDate = data.birth;

        const allMemberships = convertMembershipsFromFirebase(data.memberships || []);
        const { pastMemberships, currentMemberships, futureMemberships, refundedMemberships } =
          categorizeMemberships(allMemberships);

        members.push({
          ...data,
          futureMemberships,
          membershipInfo: buildMembershipInfo(pastMemberships, currentMemberships, futureMemberships, refundedMemberships)
        });
      });

      return members;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  }

  static async deleteMember(box: string, email: string): Promise<void> {
    try {
      await deleteDoc(doc(db, `/box/${box}/member`, email));
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  static async updateMemberMembership(box: string, email: string, membershipData: any): Promise<void> {
    try {
      await updateDoc(doc(db, `/box/${box}/member`, email), membershipData);
    } catch (error) {
      console.error('Error updating member membership:', error);
      throw error;
    }
  }

  static async addMember(box: string, memberData: FirebaseMemberData): Promise<void> {
    try {
      await addDoc(collection(db, `/box/${box}/member`), memberData);
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  static async searchMembersByName(box: string, searchName: string): Promise<Member[]> {
    try {
      const all = await this.getMembers(box);
      const term = searchName.trim().toLowerCase();
      if (!term) return all;
      return all.filter(m => m.realName.toLowerCase().includes(term));
    } catch (error) {
      console.error('Error searching members:', error);
      throw error;
    }
  }

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
      const memberRef = doc(db, `/box/${box}/member`, email);
      const memberDoc = await getDoc(memberRef);

      let lockerHistory: MemberLockerHistory[] = [];
      if (memberDoc.exists()) {
        lockerHistory = (memberDoc.data().lockerHistory || []) as MemberLockerHistory[];
      }

      lockerHistory.push({
        lockerNum: lockerNumber,
        startDate,
        endDate,
        createdAt: Timestamp.now(),
        key,
        price,
        paymentType
      });

      await updateDoc(memberRef, { lockerHistory });
    } catch (error) {
      console.error('Error assigning locker to member:', error);
      throw error;
    }
  }

  static async updateLockerHistoryEndDate(
    box: string,
    email: string,
    key: string,
    newEndDate: string
  ): Promise<void> {
    try {
      const memberRef = doc(db, `/box/${box}/member`, email);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) throw new Error('회원 정보를 찾을 수 없습니다.');

      const lockerHistory: any[] = memberDoc.data().lockerHistory || [];
      const idx = lockerHistory.findIndex(item => item.key === key);

      if (idx === -1) {
        console.warn(`락커 히스토리를 찾을 수 없습니다. email: ${email}, key: ${key}`);
        return;
      }

      lockerHistory[idx] = { ...lockerHistory[idx], endDate: newEndDate };
      await updateDoc(memberRef, { lockerHistory });
    } catch (error) {
      console.error('Error updating locker history endDate:', error);
      throw error;
    }
  }

  static async unassignLockerFromMember(
    box: string,
    email: string,
    lockerNumber: number,
    endDate: string,
    key: string
  ): Promise<void> {
    try {
      const memberRef = doc(db, `/box/${box}/member`, email);
      const memberDoc = await getDoc(memberRef);

      if (!memberDoc.exists()) throw new Error('회원 정보를 찾을 수 없습니다.');

      const lockerHistory: any[] = memberDoc.data().lockerHistory || [];
      const idx = lockerHistory.findIndex(item => item.key === key && item.lockerNum === lockerNumber);

      if (idx === -1) throw new Error('해당 락커 할당 기록을 찾을 수 없습니다.');

      lockerHistory[idx] = { ...lockerHistory[idx], endDate };
      await updateDoc(memberRef, { lockerHistory });
    } catch (error) {
      console.error('Error unassigning locker from member:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<any> {
    try {
      const snap = await getDocs(query(collection(db, '/user'), where('email', '==', email)));
      let userData = null;
      snap.forEach(d => { userData = d.data(); });
      return userData;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  static async getUserByPhone(phone: string): Promise<any> {
    try {
      const snap = await getDocs(query(collection(db, '/user'), where('phone', '==', phone)));
      let userData = null;
      snap.forEach(d => { userData = d.data(); });
      return userData;
    } catch (error) {
      console.error('Error fetching user by phone:', error);
      throw error;
    }
  }

  static async getUserByRealName(realName: string): Promise<any[]> {
    try {
      const snap = await getDocs(query(collection(db, '/user'), where('realName', '==', realName)));
      const users: any[] = [];
      snap.forEach(d => users.push(d.data()));
      return users;
    } catch (error) {
      console.error('Error fetching users by realName:', error);
      throw error;
    }
  }

  static async getUserByNickName(nickName: string): Promise<any[]> {
    try {
      const snap = await getDocs(query(collection(db, '/user'), where('nickName', '==', nickName)));
      const users: any[] = [];
      snap.forEach(d => users.push(d.data()));
      return users;
    } catch (error) {
      console.error('Error fetching users by nickName:', error);
      throw error;
    }
  }

  static async createMember(box: string, memberData: any): Promise<void> {
    try {
      const memberDocRef = doc(collection(db, `/box/${box}/member`), memberData.email);
      const snap = await getDoc(memberDocRef);
      if (snap.exists()) {
        console.log(`Member with email ${memberData.email} already exists. Skipping creation.`);
        return;
      }
      await setDoc(memberDocRef, memberData);
    } catch (error) {
      console.error('멤버 추가 중 오류 발생:', error);
      throw error;
    }
  }

  static async updateUser(email: string, userData: any): Promise<any> {
    try {
      const snap = await getDocs(query(collection(db, '/user'), where('email', '==', email)));
      if (snap.empty) {
        console.warn('해당 이메일로 사용자를 찾을 수 없습니다:', email);
        return null;
      }
      for (const docSnap of snap.docs) {
        await updateDoc(docSnap.ref, userData);
      }
      return userData;
    } catch (error) {
      console.error('사용자 업데이트 중 오류 발생:', error);
      throw error;
    }
  }

  static async fetchApplicants(boxName: string): Promise<any[]> {
    try {
      const snap = await getDoc(doc(db, `box/${boxName}/applied/applieddoc`));
      const applicants: any[] = [];
      if (snap.exists()) {
        const data = snap.data();
        for (const email in data) {
          if (Object.prototype.hasOwnProperty.call(data, email)) {
            const a = data[email];
            applicants.push({
              name: a.realName || '',
              email: a.email || '',
              phone: a.phone || '',
              boxName,
              birth: a.birth || undefined
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

  static async approveApplicant(email: string, boxName: string): Promise<void> {
    try {
      const userDoc = await this.getUserByEmail(email);
      if (!userDoc) throw new Error('사용자 정보를 찾을 수 없습니다.');
      if (!userDoc.boxName?.startsWith('?')) throw new Error('유효하지 않은 신청 상태입니다.');

      const actualBoxName = userDoc.boxName.slice(1);
      await this.removeApplication(email, actualBoxName);

      if (userDoc.hasOwnProperty('memberships')) delete userDoc.memberships;
      if (userDoc.birth && !userDoc.birthDate) {
        userDoc.birthDate = userDoc.birth;
        delete userDoc.birth;
      }

      userDoc.boxName = actualBoxName;
      userDoc.joinedAt = Timestamp.now();

      await this.createMember(actualBoxName, userDoc);
    } catch (error) {
      console.error('Failed to approve applicant:', error);
      throw error;
    }
  }

  static async rejectApplicant(email: string, boxName: string): Promise<void> {
    try {
      await setDoc(doc(db, `box/${boxName}/applied/applieddoc`), { [email]: deleteField() }, { merge: true });
      await updateDoc(doc(db, `user/${email}`), { boxName: '' });
    } catch (error) {
      console.error('Failed to reject applicant:', error);
      throw error;
    }
  }

  static async removeApplication(email: string, boxName: string): Promise<void> {
    try {
      await setDoc(doc(db, `box/${boxName}/applied/applieddoc`), { [email]: deleteField() }, { merge: true });
      await updateDoc(doc(db, `user/${email}`), { boxName });
    } catch (error) {
      console.error('Failed to remove application:', error);
      throw error;
    }
  }

  static async updateMemberMemo(box: string, email: string, memo: string): Promise<void> {
    try {
      await updateDoc(doc(db, `/box/${box}/member`, email), { memo });
    } catch (error) {
      console.error('Error updating member memo:', error);
      throw error;
    }
  }
}
