import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MembershipPlan, UserMembership } from '../types/membership';
import { RevenueService } from './revenueService';
import { getDaysBetween, formatDateToString } from '../utils/dateUtils';

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
   * 사용자 회원권 조회 (레거시 및 새 구조 모두 지원)
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
        return memberships.map((membership: any) => {
          // 새로운 구조인지 확인
          if (membership.period && membership.purchase) {
            return {
              ...membership,
              purchase: {
                ...membership.purchase,
                at: membership.purchase.at?.toDate?.() ?? new Date(membership.purchase.at)
              },
              period: {
                startDate: membership.period.startDate?.toDate?.() ?? new Date(membership.period.startDate),
                endDate: membership.period.endDate?.toDate?.() ?? new Date(membership.period.endDate),
                originalEndDate: membership.period.originalEndDate?.toDate?.() ?? new Date(membership.period.originalEndDate)
              },
              holds: (membership.holds || []).map((hold: any) => ({
                ...hold,
                startDate: hold.startDate?.toDate?.() ?? new Date(hold.startDate),
                endDate: hold.endDate?.toDate?.() ?? new Date(hold.endDate)
              })),
              refund: {
                ...membership.refund,
                at: membership.refund?.at?.toDate?.() ?? null
              },
              adjustments: (membership.adjustments || []).map((adj: any) => ({
                ...adj,
                before: {
                  period: {
                    startDate: adj.before?.period?.startDate?.toDate?.() ?? new Date(adj.before?.period?.startDate),
                    endDate: adj.before?.period?.endDate?.toDate?.() ?? new Date(adj.before?.period?.endDate)
                  }
                },
                after: {
                  period: {
                    startDate: adj.after?.period?.startDate?.toDate?.() ?? new Date(adj.after?.period?.startDate),
                    endDate: adj.after?.period?.endDate?.toDate?.() ?? new Date(adj.after?.period?.endDate)
                  }
                },
                at: adj.at?.toDate?.() ?? new Date(adj.at)
              })),
              createdAt: membership.createdAt?.toDate?.() ?? new Date(membership.createdAt),
              updatedAt: membership.updatedAt?.toDate?.() ?? new Date(membership.updatedAt),
              deletedAt: membership.deletedAt?.toDate?.() ?? null
            };
          }
          
          // 레거시 구조
          return {
            ...membership,
            startDate: membership.startDate?.toDate?.() ?? new Date(membership.startDate),
            endDate: membership.endDate?.toDate?.() ?? new Date(membership.endDate),
            holdStartDate: membership.holdStartDate?.toDate?.() ?? null,
            holdEndDate: membership.holdEndDate?.toDate?.() ?? null,
            createdAt: membership.createdAt?.toDate?.() ?? new Date(membership.createdAt),
            updatedAt: membership.updatedAt?.toDate?.() ?? new Date(membership.updatedAt)
          };
        });
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
   * 회원권이 현재 홀딩 중인지 확인
   */
  static isHold(membership: any): boolean {
    if (!membership.holds || membership.holds.length === 0) {
      return false;
    }

    const now = new Date();
    
    // 가장 최신 홀딩 찾기 (마지막 요소)
    const latestHold = membership.holds[membership.holds.length - 1];
    
    const holdStartDate = new Date(latestHold.startDate);
    const holdEndDate = new Date(latestHold.endDate);
    
    // 오늘이 홀딩 기간 내에 있는지 확인
    return now >= holdStartDate && now <= holdEndDate;
  }

  /**
   * 회원의 회원권 상태 뱃지 정보 반환
   */
  static getMembershipStatusBadges(member: any): Array<{ label: string; colorClass: string }> {
    const membershipType = member.membershipInfo?.type || '없음';
    
    // 타입에 따라 색상 클래스 결정
    let colorClass: string;
    
    if (membershipType === '기간권') {
      colorClass = 'primary';
    } else if (membershipType === '횟수권') {
      colorClass = 'primary';
    } else if (membershipType === '없음') {
      colorClass = 'none';
    } else if (membershipType === '홀딩') {
      colorClass = 'hold';
    } else {
      // 기타 알 수 없는 타입
      colorClass = 'primary';
    }
    
    return [{ label: membershipType, colorClass }];
  }

  /**
   * 주의 회원 판단 기준 (나중에 변경하기 용이하도록 분리)
   * @returns 주의 회원인지 여부
   */
  static getWarningMemberThreshold(): number {
    return 14; // 남은 일자 14일 이내
  }

  /**
   * 회원이 주의 회원인지 판단
   * @param member 회원 정보
   * @returns 주의 회원인지 여부
   */
  static isWarningMember(member: any): boolean {
    const threshold = this.getWarningMemberThreshold();
    const remainingDays = member.membershipInfo?.remainingDays;
    
    // remainingDays가 숫자가 아니거나 '-'인 경우 제외
    if (remainingDays === '-' || remainingDays === undefined || remainingDays === null) {
      return false;
    }
    
    // 숫자로 변환
    const days = typeof remainingDays === 'string' 
      ? parseInt(remainingDays) 
      : remainingDays;
    
    // 숫자가 아니거나 NaN인 경우 제외
    if (isNaN(days)) {
      return false;
    }
    
    // 0보다 크고 threshold 이하인 경우 주의 회원
    return days > 0 && days <= threshold;
  }

  /**
   * 회원 배열에서 주의 회원만 필터링
   * @param members 회원 배열
   * @returns 주의 회원 배열
   */
  static filterWarningMembers(members: any[]): any[] {
    return members.filter(member => this.isWarningMember(member));
  }

  /**
   * 현재 유효한 회원권 필터링 (레거시 및 새 구조 지원)
   */
  static getCurrentMemberships(memberships: UserMembership[]): UserMembership[] {
    const now = new Date();
    return memberships.filter(membership => {
      // 삭제된 회원권 제외
      if ((membership as any).deleted) {
        return false;
      }

      // 환불된 회원권 제외
      if ((membership as any).refund && (membership as any).refund.isRefunded) {
        return false;
      }
      
      // 새 구조
      if ((membership as any).period) {
        const startDate = new Date((membership as any).period.startDate);
        const endDate = new Date((membership as any).period.endDate);
        return startDate <= now && endDate >= now;
      }
      
      // 레거시 구조
      if ((membership as any).startDate && (membership as any).endDate) {
        const startDate = new Date((membership as any).startDate);
        const endDate = new Date((membership as any).endDate);
        return startDate <= now && endDate >= now;
      }
      
      return false;
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
      
      // 새 구조에서 날짜 추출
      const newStartDate = new Date(membership.period.startDate);
      const newEndDate = new Date(membership.period.endDate);

      // 날짜 겹침 체크
      for (const existingMembership of existingMemberships) {
        // 삭제된 회원권은 체크하지 않음
        if ((existingMembership as any).deleted) {
          continue;
        }
        
        let existingStartDate: Date;
        let existingEndDate: Date;
        
        // 새 구조
        if ((existingMembership as any).period) {
          existingStartDate = new Date((existingMembership as any).period.startDate);
          existingEndDate = new Date((existingMembership as any).period.endDate);
        } else {
          // 레거시 구조
          existingStartDate = new Date((existingMembership as any).startDate);
          existingEndDate = new Date((existingMembership as any).endDate);
        }

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
   * 회원권 홀딩 추가
   */
  static async addHold(
    email: string,
    membershipIndex: number,
    holdStartDate: Date,
    holdEndDate: Date,
    reason: string,
    assignee: string,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) {
        throw new Error('박스 이름이 없습니다.');
      }

      const memberships = existingMemberships || await this.getUserMemberships(email);
      
      if (membershipIndex < 0 || membershipIndex >= memberships.length) {
        throw new Error('유효하지 않은 회원권 인덱스입니다.');
      }

      const membership = memberships[membershipIndex] as any;
      
      // 새 구조만 지원
      if (!membership.period) {
        throw new Error('레거시 회원권은 홀딩을 지원하지 않습니다.');
      }

      const holdDays = getDaysBetween(holdStartDate, holdEndDate);

      // 홀딩 정보 추가
      const newHold = {
        reason,
        startDate: holdStartDate,
        endDate: holdEndDate,
        days: holdDays,
        assignee
      };

      membership.holds = membership.holds || [];
      membership.holds.push(newHold);

      // 만료일 연장
      const currentEndDate = new Date(membership.period.endDate);
      const newEndDate = new Date(currentEndDate.getTime() + holdDays * 24 * 60 * 60 * 1000);
      membership.period.endDate = newEndDate;

      // 다음 회원권들 연쇄 이동 (홀딩 일수만큼 모두 뒤로 밀기)
      for (let i = membershipIndex + 1; i < memberships.length; i++) {
        const nextMembership = memberships[i] as any;
        
        if (nextMembership.period) {
          const nextStartDate = new Date(nextMembership.period.startDate);
          const nextEndDate = new Date(nextMembership.period.endDate);
          
          // 앞 회원권의 새 만료일
          const prevEndDate = new Date((memberships[i - 1] as any).period.endDate);
          
          // 겹치는지 확인
          if (nextStartDate <= prevEndDate) {
            // 겹치면 바로 다음날부터 시작
            nextMembership.period.startDate = new Date(prevEndDate.getTime() + 24 * 60 * 60 * 1000);
            const duration = getDaysBetween(nextStartDate, nextEndDate);
            nextMembership.period.endDate = new Date(nextMembership.period.startDate.getTime() + duration * 24 * 60 * 60 * 1000);
          } else {
            // 겹치지 않으면 홀딩 일수만큼 뒤로 밀기
            nextMembership.period.startDate = new Date(nextStartDate.getTime() + holdDays * 24 * 60 * 60 * 1000);
            nextMembership.period.endDate = new Date(nextEndDate.getTime() + holdDays * 24 * 60 * 60 * 1000);
          }
        }
      }

      // 업데이트된 시간 기록
      membership.updatedAt = new Date();

      // Firebase에 저장
      const memberDocRef = doc(db, `box/${boxName}/member/${email}`);
      await setDoc(memberDocRef, { memberships }, { merge: true });

      console.log('Hold added successfully');
    } catch (error) {
      console.error('Error adding hold:', error);
      throw error;
    }
  }

  /**
   * 회원권 홀딩 해제
   */
  static async releaseHold(
    email: string,
    membershipIndex: number,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) {
        throw new Error('박스 이름이 없습니다.');
      }

      const memberships = existingMemberships || await this.getUserMemberships(email);
      
      if (membershipIndex < 0 || membershipIndex >= memberships.length) {
        throw new Error('유효하지 않은 회원권 인덱스입니다.');
      }

      const membership = memberships[membershipIndex] as any;
      
      // 새 구조만 지원
      if (!membership.period) {
        throw new Error('레거시 회원권은 홀딩 해제를 지원하지 않습니다.');
      }

      if (!membership.holds || membership.holds.length === 0) {
        throw new Error('홀딩 정보가 없습니다.');
      }

      // 현재 활성화된 홀딩 찾기
      const now = new Date();
      const currentHoldIndex = membership.holds.findIndex((hold: any) => {
        const holdStartDate = new Date(hold.startDate);
        const holdEndDate = new Date(hold.endDate);
        return now >= holdStartDate && now <= holdEndDate;
      });

      if (currentHoldIndex === -1) {
        throw new Error('현재 활성화된 홀딩이 없습니다.');
      }

      const currentHold = membership.holds[currentHoldIndex];
      const originalHoldDays = currentHold.days;

      // 홀딩 종료일을 오늘 전날로 변경 (D-1)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // 새로운 홀딩 일수 계산
      const holdStartDate = new Date(currentHold.startDate);
      const newHoldDays = getDaysBetween(holdStartDate, yesterday);

      // 홀딩이 시작되지 않았거나 음수인 경우 처리
      if (newHoldDays < 0) {
        throw new Error('홀딩 시작 전에는 해제할 수 없습니다.');
      }

      // 홀딩 정보 업데이트
      currentHold.endDate = yesterday;
      currentHold.days = newHoldDays;
      currentHold.released = true;
      currentHold.releasedAt = now;

      // 원래 홀딩 일수와 실제 홀딩 일수의 차이 계산
      const daysDifference = originalHoldDays - newHoldDays;

      // 회원권 만료일 조정 (차이만큼 빼기)
      const currentEndDate = new Date(membership.period.endDate);
      const newEndDate = new Date(currentEndDate.getTime() - daysDifference * 24 * 60 * 60 * 1000);
      membership.period.endDate = newEndDate;

      // 다음 회원권들 연쇄 조정 (차이만큼 앞당기기)
      for (let i = membershipIndex + 1; i < memberships.length; i++) {
        const nextMembership = memberships[i] as any;
        
        if (nextMembership.period) {
          const nextStartDate = new Date(nextMembership.period.startDate);
          const nextEndDate = new Date(nextMembership.period.endDate);
          
          // 앞 회원권의 새 만료일
          const prevEndDate = new Date((memberships[i - 1] as any).period.endDate);
          
          // 겹치는 경우 조정
          if (nextStartDate > prevEndDate) {
            // 겹치지 않으면 차이만큼 앞당기기
            nextMembership.period.startDate = new Date(nextStartDate.getTime() - daysDifference * 24 * 60 * 60 * 1000);
            nextMembership.period.endDate = new Date(nextEndDate.getTime() - daysDifference * 24 * 60 * 60 * 1000);
          } else {
            // 겹치면 바로 다음날부터 시작
            nextMembership.period.startDate = new Date(prevEndDate.getTime() + 24 * 60 * 60 * 1000);
            const duration = getDaysBetween(nextStartDate, nextEndDate);
            nextMembership.period.endDate = new Date(nextMembership.period.startDate.getTime() + duration * 24 * 60 * 60 * 1000);
          }
        }
      }

      // 업데이트된 시간 기록
      membership.updatedAt = new Date();

      // Firebase에 저장
      const memberDocRef = doc(db, `box/${boxName}/member/${email}`);
      await setDoc(memberDocRef, { memberships }, { merge: true });

      console.log('Hold released successfully');
    } catch (error) {
      console.error('Error releasing hold:', error);
      throw error;
    }
  }

  /**
   * 회원권 기간 수정
   */
  static async editMembershipPeriod(
    email: string,
    membershipIndex: number,
    newStartDate: Date,
    newEndDate: Date,
    reason: string,
    assignee: string,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) {
        throw new Error('박스 이름이 없습니다.');
      }

      const memberships = existingMemberships || await this.getUserMemberships(email);
      
      if (membershipIndex < 0 || membershipIndex >= memberships.length) {
        throw new Error('유효하지 않은 회원권 인덱스입니다.');
      }

      const membership = memberships[membershipIndex] as any;
      
      // 새 구조만 지원
      if (!membership.period) {
        throw new Error('레거시 회원권은 수정을 지원하지 않습니다.');
      }

      // 다른 회원권과 겹치는지 체크
      for (let i = 0; i < memberships.length; i++) {
        if (i === membershipIndex) continue; // 자기 자신은 제외
        
        const otherMembership = memberships[i] as any;
        
        // 삭제되거나 환불된 회원권은 제외
        if (otherMembership.deleted || (otherMembership.refund && otherMembership.refund.isRefunded)) {
          continue;
        }
        
        let otherStartDate: Date;
        let otherEndDate: Date;
        
        // 새 구조
        if (otherMembership.period) {
          otherStartDate = new Date(otherMembership.period.startDate);
          otherEndDate = new Date(otherMembership.period.endDate);
        } else {
          // 레거시 구조
          otherStartDate = new Date(otherMembership.startDate);
          otherEndDate = new Date(otherMembership.endDate);
        }
        
        // 날짜 겹침 체크
        if (newStartDate <= otherEndDate && otherStartDate <= newEndDate) {
          throw new Error(
            `수정하려는 기간이 다른 회원권과 겹칩니다.\n` +
            `겹치는 회원권: ${formatDateToString(otherStartDate)} ~ ${formatDateToString(otherEndDate)}`
          );
        }
      }

      // 이전 기간 정보 저장
      const beforePeriod = {
        startDate: new Date(membership.period.startDate),
        endDate: new Date(membership.period.endDate)
      };

      // 조정 기록 추가
      const adjustment = {
        before: {
          period: {
            startDate: beforePeriod.startDate,
            endDate: beforePeriod.endDate
          }
        },
        after: {
          period: {
            startDate: newStartDate,
            endDate: newEndDate
          }
        },
        reason,
        assignee,
        at: new Date()
      };

      membership.adjustments = membership.adjustments || [];
      membership.adjustments.push(adjustment);

      // 기간 업데이트
      membership.period.startDate = newStartDate;
      membership.period.endDate = newEndDate;

      // 업데이트된 시간 기록
      membership.updatedAt = new Date();

      // Firebase에 저장
      const memberDocRef = doc(db, `box/${boxName}/member/${email}`);
      await setDoc(memberDocRef, { memberships }, { merge: true });

      console.log('Membership period updated successfully');
    } catch (error) {
      console.error('Error editing membership period:', error);
      throw error;
    }
  }

  /**
   * 회원권 환불 처리
   */
  static async refundUserMembership(
    email: string,
    membershipIndex: number,
    refundAmount: string,
    reason: string,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) {
        throw new Error('박스 이름이 없습니다.');
      }

      const memberships = existingMemberships || await this.getUserMemberships(email);
      
      if (membershipIndex < 0 || membershipIndex >= memberships.length) {
        throw new Error('유효하지 않은 회원권 인덱스입니다.');
      }

      const membership = memberships[membershipIndex] as any;

      // 이미 환불된 회원권인지 확인
      if (membership.refund && membership.refund.isRefunded) {
        throw new Error('이미 환불된 회원권입니다.');
      }

      // 환불 정보 업데이트
      membership.refund = {
        isRefunded: true,
        at: new Date(),
        refundAmount: parseInt(refundAmount),
        reason: reason
      };

      // 업데이트된 시간 기록
      membership.updatedAt = new Date();

      // Firebase에 저장
      const memberDocRef = doc(db, `box/${boxName}/member/${email}`);
      await setDoc(memberDocRef, { memberships }, { merge: true });

      // 매출 데이터에서 환불 금액 차감
      try {
        const membershipKey = membership.key;
        if (membershipKey) {
          await RevenueService.refundUserMembership(membershipKey, parseInt(refundAmount));
          console.log('Revenue refund processed for membership:', membershipKey);
        }
      } catch (revenueError) {
        console.error('Failed to process revenue refund, but membership refund was successful:', revenueError);
        // 매출 차감 실패해도 회원권 환불은 성공으로 처리
      }

      console.log('Refund processed successfully');
    } catch (error) {
      console.error('Error refunding membership:', error);
      throw error;
    }
  }

  /**
   * 사용자 회원권 삭제 (매출 데이터도 함께 삭제)
   */
  static async removeUserMembership(
    email: string, 
    index: number,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) {
        throw new Error('박스 이름이 없습니다.');
      }

      if (index === undefined || email === undefined) {
        throw new Error('회원권 인덱스 또는 이메일이 없습니다.');
      }

      const memberships = existingMemberships || await this.getUserMemberships(email);
      
      if (index < 0 || index >= memberships.length) {
        throw new Error('유효하지 않은 회원권 인덱스입니다.');
      }

      // 삭제할 회원권의 키 저장
      const membershipToDelete = memberships[index];
      const membershipKey = membershipToDelete.key;

      const updatedMemberships = memberships.filter((_, i) => i !== index);
      
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