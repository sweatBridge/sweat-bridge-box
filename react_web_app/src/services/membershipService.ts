import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MembershipPlan, UserMembership } from '../types/membership';
import { RevenueService } from './revenueService';

export class MembershipService {
  private static getBoxName(): string {
    return localStorage.getItem('boxName') || 'SWEAT';
  }

  static async getMembershipPlans(): Promise<MembershipPlan[]> {
    try {
      const boxName = this.getBoxName();
      const membershipDocRef = doc(db, `box/${boxName}/membership`, "plansDoc");
      
      const docSnap = await getDoc(membershipDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.plans || [];
      } else {
        console.log("No membership document found, returning empty array.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching membership plans:", error);
      throw error;
    }
  }

  static async setMembershipPlans(plans: MembershipPlan[]): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const membershipDocRef = doc(db, `box/${boxName}/membership`, "plansDoc");

      const docSnap = await getDoc(membershipDocRef);

      if (!docSnap.exists()) {
        await setDoc(membershipDocRef, { plans: plans });
        console.log("Created new membership plan document.");
      } else {
        await setDoc(membershipDocRef, { plans: plans }, { merge: true });
        console.log("Updated existing membership plan document.");
      }
    } catch (error) {
      console.error("Error setting membership plans:", error);
      throw error;
    }
  }

  static async addMembershipPlan(plan: MembershipPlan): Promise<void> {
    try {
      const existingPlans = await this.getMembershipPlans();
      const updatedPlans = [...existingPlans, plan];
      await this.setMembershipPlans(updatedPlans);
      console.log("Successfully added new membership plan:", plan);
    } catch (error) {
      console.error("Error adding membership plan:", error);
      throw error;
    }
  }

  static async deleteMembershipPlan(planName: string): Promise<void> {
    try {
      const existingPlans = await this.getMembershipPlans();
      const updatedPlans = existingPlans.filter(plan => plan.plan !== planName);
      await this.setMembershipPlans(updatedPlans);
      console.log("Successfully deleted membership plan:", planName);
    } catch (error) {
      console.error("Error deleting membership plan:", error);
      throw error;
    }
  }

  /**
   * 사용자 회원권 조회
   */
  static async getUserMemberships(email: string): Promise<UserMembership[]> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName || !email) {
        console.warn('boxName 또는 email이 없습니다.');
        return [];
      }

      const memberDocRef = doc(db, `box/${boxName}/member/${email}`);
      const docSnap = await getDoc(memberDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const memberships = data.memberships || [];
        
        // Date 객체로 변환
        return memberships.map((membership: any) => ({
          ...membership,
          startDate: membership.startDate?.toDate?.() ?? new Date(membership.startDate),
          endDate: membership.endDate?.toDate?.() ?? new Date(membership.endDate),
          holdStartDate: membership.holdStartDate?.toDate?.() ?? null,
          holdEndDate: membership.holdEndDate?.toDate?.() ?? null,
          createdAt: membership.createdAt?.toDate?.() ?? new Date(membership.createdAt),
          updatedAt: membership.updatedAt?.toDate?.() ?? new Date(membership.updatedAt),
        }));
      } else {
        console.log('Member 문서를 찾을 수 없습니다.');
        return [];
      }
    } catch (error) {
      console.error('회원권 정보 불러오기 중 오류 발생:', error);
      throw new Error('회원권 정보를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 현재 유효한 회원권 필터링
   */
  static getCurrentMemberships(memberships: UserMembership[]): UserMembership[] {
    const now = new Date();
    return memberships.filter(membership => {
      const startDate = new Date(membership.startDate);
      const endDate = new Date(membership.endDate);
      return startDate <= now && endDate >= now;
    });
  }

  /**
   * 사용자 회원권 추가 (매출 데이터도 함께 저장)
   */
  static async addUserMembership(email: string, membership: UserMembership, memberRealName: string): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) {
        throw new Error('박스 이름이 없습니다.');
      }

      if (!email || !membership || !memberRealName) {
        throw new Error('이메일, 회원권 데이터 또는 회원 이름이 없습니다.');
      }

      // 기존 회원권들을 가져와서 날짜 겹침 체크
      const existingMemberships = await this.getUserMemberships(email);
      
      const newStartDate = new Date(membership.startDate);
      const newEndDate = new Date(membership.endDate);

      // 날짜 겹침 체크
      for (const existingMembership of existingMemberships) {
        const existingStartDate = new Date(existingMembership.startDate);
        const existingEndDate = new Date(existingMembership.endDate);

        if (newStartDate <= existingEndDate && existingStartDate <= newEndDate) {
          throw new Error(`일자가 겹치는 다른 회원권이 있습니다. 회원권의 일자를 다시 확인해주세요. 기존 멤버십: ${existingStartDate.toLocaleDateString()} ~ ${existingEndDate.toLocaleDateString()}`);
        }
      }

      // 새 회원권 추가
      const updatedMemberships = [...existingMemberships, membership];
      
      const memberDocRef = doc(db, `box/${boxName}/member/${email}`);
      await setDoc(memberDocRef, { memberships: updatedMemberships }, { merge: true });

      // 회원권 추가 성공 후 매출 데이터 저장
      try {
        await RevenueService.addUserMembership(membership, email, memberRealName);
      } catch (revenueError) {
        console.error('Failed to add revenue data, but membership was added successfully:', revenueError);
        // 매출 데이터 저장 실패해도 회원권 추가는 성공으로 처리
        // 필요시 여기서 별도 알림 처리 가능
      }
      
    } catch (error) {
      console.error('Error adding user membership:', error);
      throw error;
    }
  }

  /**
   * 사용자 회원권 삭제 (매출 데이터도 함께 삭제)
   */
  static async removeUserMembership(email: string, index: number): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) {
        throw new Error('박스 이름이 없습니다.');
      }

      if (index === undefined || email === undefined) {
        throw new Error('회원권 인덱스 또는 이메일이 없습니다.');
      }

      const existingMemberships = await this.getUserMemberships(email);
      
      if (index < 0 || index >= existingMemberships.length) {
        throw new Error('유효하지 않은 회원권 인덱스입니다.');
      }

      // 삭제할 회원권의 키 저장
      const membershipToDelete = existingMemberships[index];
      const membershipKey = membershipToDelete.key;

      const updatedMemberships = existingMemberships.filter((_, i) => i !== index);
      
      const memberDocRef = doc(db, `box/${boxName}/member/${email}`);
      await setDoc(memberDocRef, { memberships: updatedMemberships }, { merge: true });
      
      console.log('Successfully removed user membership at index:', index);

      // 회원권 삭제 성공 후 매출 데이터에서도 삭제
      if (membershipKey) {
        try {
          await RevenueService.removeUserMembership(membershipKey);
          console.log('Successfully removed revenue data for membership:', membershipKey);
        } catch (revenueError) {
          console.error('Failed to remove revenue data, but membership was removed successfully:', revenueError);
          // 매출 데이터 삭제 실패해도 회원권 삭제는 성공으로 처리
        }
      } else {
        console.log('No membership key found, skipping revenue data removal');
      }

    } catch (error) {
      console.error('Error removing user membership:', error);
      throw error;
    }
  }
} 