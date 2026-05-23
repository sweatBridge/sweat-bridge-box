import { Timestamp } from 'firebase/firestore';
import { convertMembershipsFromFirebase } from '../models/memberModel';
import {
  filterWarningMembers,
  getCurrentMemberships,
  getMemberStatusBadge,
  getMembershipStatusBadges,
  getWarningMemberThreshold,
  isFutureHold,
  isHold,
  isNewMember,
  isValidActiveMembership,
  isWarningMember
} from '../models/membershipModel';
import { MembershipRepository } from '../repositories/membershipRepository';
import { MembershipPlan, UserMembership } from '../types/membership';
import { getDaysBetween, formatDateToString } from '../utils/dateUtils';
import { RevenueService } from './revenueService';

export class MembershipService {
  /**
   * 회원권이 현재 홀딩 중인지 확인합니다.
   */
  static isHold = isHold;

  /**
   * 회원권이 미래 홀딩 예정 상태인지 확인합니다.
   */
  static isFutureHold = isFutureHold;

  /**
   * 회원권이 현재 유효한 활성 상태인지 확인합니다.
   */
  static isValidActiveMembership = isValidActiveMembership;

  /**
   * 현재 유효한 회원권 목록을 반환합니다.
   */
  static getCurrentMemberships = getCurrentMemberships;

  /**
   * 주의 회원 기준 임계값을 반환합니다.
   */
  static getWarningMemberThreshold = getWarningMemberThreshold;

  /**
   * 회원이 주의 회원인지 확인합니다.
   */
  static isWarningMember = isWarningMember;

  /**
   * 주의 회원 목록만 필터링합니다.
   */
  static filterWarningMembers = filterWarningMembers;

  /**
   * 신규 회원 여부를 확인합니다.
   */
  static isNewMember = isNewMember;

  /**
   * 회원 상태 뱃지를 계산합니다.
   */
  static getMemberStatusBadge = getMemberStatusBadge;

  /**
   * 회원권 상태 뱃지 목록을 계산합니다.
   */
  static getMembershipStatusBadges = getMembershipStatusBadges;

  /**
   * 현재 로컬 스토리지에 저장된 박스 이름을 반환합니다.
   *
   * @returns 박스 이름
   * @throws 박스 이름이 없으면 에러를 던집니다.
   */
  private static getBoxName(): string {
    const boxName = localStorage.getItem('boxName');
    if (!boxName) throw new Error('박스 이름이 없습니다.');
    return boxName;
  }

  /**
   * 회원권 플랜 목록을 조회합니다.
   *
   * @returns 회원권 플랜 목록
   */
  static async getMembershipPlans(): Promise<MembershipPlan[]> {
    try {
      return MembershipRepository.getMembershipPlans(this.getBoxName());
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      throw error;
    }
  }

  /**
   * 회원권 플랜 목록을 저장합니다.
   *
   * @param plans 저장할 플랜 목록
   */
  static async setMembershipPlans(plans: MembershipPlan[]): Promise<void> {
    try {
      await MembershipRepository.setMembershipPlans(this.getBoxName(), plans);
    } catch (error) {
      console.error('Error setting membership plans:', error);
      throw error;
    }
  }

  /**
   * 새 회원권 플랜을 추가합니다.
   *
   * 호출자가 이미 로드한 `existingPlans`를 전달하면 read 없이 write만 수행합니다.
   * 새 플랜이 적용된 전체 목록을 반환해 호출자가 재조회 없이 상태를 갱신할 수 있게 합니다.
   *
   * @param plan 추가할 플랜
   * @param existingPlans 호출자가 이미 들고 있는 플랜 목록 (선택)
   * @returns 변경 후 플랜 목록
   */
  static async addMembershipPlan(
    plan: MembershipPlan,
    existingPlans?: MembershipPlan[]
  ): Promise<MembershipPlan[]> {
    const existing = existingPlans ?? (await this.getMembershipPlans());
    const updated = [...existing, plan];
    await this.setMembershipPlans(updated);
    return updated;
  }

  /**
   * 회원권 플랜을 삭제합니다.
   *
   * 호출자가 이미 로드한 `existingPlans`를 전달하면 read 없이 write만 수행합니다.
   * 변경 후 전체 목록을 반환합니다.
   *
   * @param planName 삭제할 플랜 이름
   * @param existingPlans 호출자가 이미 들고 있는 플랜 목록 (선택)
   * @returns 변경 후 플랜 목록
   */
  static async deleteMembershipPlan(
    planName: string,
    existingPlans?: MembershipPlan[]
  ): Promise<MembershipPlan[]> {
    const existing = existingPlans ?? (await this.getMembershipPlans());
    const updated = existing.filter((plan) => plan.plan !== planName);
    await this.setMembershipPlans(updated);
    return updated;
  }

  /**
   * 특정 회원의 회원권 목록을 조회합니다.
   *
   * @param email 회원 이메일
   * @returns 변환된 회원권 목록
   */
  static async getUserMemberships(email: string): Promise<UserMembership[]> {
    try {
      if (!email) return [];
      const rawMemberships = await MembershipRepository.getRawUserMemberships(this.getBoxName(), email);
      return convertMembershipsFromFirebase(rawMemberships);
    } catch (error) {
      console.error('회원권 정보 불러오기 중 오류 발생:', error);
      throw new Error('회원권 정보를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 회원에게 새 회원권을 추가합니다.
   *
   * @param email 회원 이메일
   * @param membership 추가할 회원권
   * @param memberRealName 회원 이름
   */
  static async addUserMembership(email: string, membership: UserMembership, memberRealName: string): Promise<void> {
    try {
      if (!email || !membership || !memberRealName) {
        throw new Error('이메일, 회원권 데이터 또는 회원 이름이 없습니다.');
      }

      const existingMemberships = await this.getUserMemberships(email);
      const newStart = new Date(membership.period.startDate);
      const newEnd = new Date(membership.period.endDate);

      for (const existing of existingMemberships) {
        if (existing.deleted || existing.refund?.isRefunded) continue;

        const existStart = new Date(existing.period.startDate);
        const existEnd = new Date(existing.period.endDate);

        if (newStart <= existEnd && existStart <= newEnd) {
          throw new Error(
            `일자가 겹치는 다른 회원권이 있습니다. 회원권의 일자를 다시 확인해주세요. ` +
            `기존 멤버십: ${existStart.toLocaleDateString()} ~ ${existEnd.toLocaleDateString()}`
          );
        }
      }

      const boxName = this.getBoxName();
      const updatedMemberships = [...existingMemberships, membership];
      const purchaseDate = membership.purchase.at;

      // 회원권 갱신과 매출 엔트리 등록을 단일 writeBatch로 원자 커밋.
      await MembershipRepository.commitAddMembershipBatch(boxName, email, updatedMemberships, {
        year: purchaseDate.getFullYear(),
        month: purchaseDate.getMonth() + 1,
        key: membership.key,
        entry: {
          assignee: membership.assignee,
          createdAt: Timestamp.fromDate(purchaseDate),
          id: email,
          paymentType: membership.purchase.paymentType,
          plan: membership.plan,
          price: membership.purchase.price.toString(),
          realName: memberRealName,
          type: membership.type,
          refundAmount: '0'
        }
      });
    } catch (error) {
      console.error('Error adding user membership:', error);
      throw error;
    }
  }

  /**
   * 회원권에 홀딩을 추가합니다.
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
      const memberships = existingMemberships || await this.getUserMemberships(email);
      if (membershipIndex < 0 || membershipIndex >= memberships.length) throw new Error('유효하지 않은 회원권 인덱스입니다.');

      const membership = memberships[membershipIndex] as any;
      if (!membership.period) throw new Error('레거시 회원권은 홀딩을 지원하지 않습니다.');

      const holdDays = getDaysBetween(holdStartDate, holdEndDate);
      membership.holds = membership.holds || [];
      membership.holds.push({ reason, startDate: holdStartDate, endDate: holdEndDate, days: holdDays, assignee });

      membership.adjustments = membership.adjustments || [];
      membership.adjustments.push({
        type: 'hold',
        hold: { startDate: holdStartDate, endDate: holdEndDate, reason },
        reason: `[홀딩 등록] ${reason}`,
        assignee,
        at: new Date()
      });

      const currentEnd = new Date(membership.period.endDate);
      membership.period.endDate = new Date(currentEnd.getTime() + holdDays * 24 * 60 * 60 * 1000);

      for (let i = membershipIndex + 1; i < memberships.length; i++) {
        const next = memberships[i] as any;
        if (!next.period) continue;

        const prevEnd = new Date((memberships[i - 1] as any).period.endDate);
        const nextStart = new Date(next.period.startDate);
        const nextEnd = new Date(next.period.endDate);

        if (prevEnd >= nextStart) {
          const overlapDays = getDaysBetween(nextStart, prevEnd) + 1;
          next.period.endDate = new Date(nextEnd.getTime() + overlapDays * 24 * 60 * 60 * 1000);
          next.period.startDate = new Date(prevEnd.getTime() + 24 * 60 * 60 * 1000);
        }
      }

      membership.updatedAt = new Date();
      await MembershipRepository.setUserMemberships(this.getBoxName(), email, memberships);
    } catch (error) {
      console.error('Error adding hold:', error);
      throw error;
    }
  }

  /**
   * 홀딩을 해제합니다.
   */
  static async releaseHold(
    email: string,
    membershipIndex: number,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const memberships = existingMemberships || await this.getUserMemberships(email);
      if (membershipIndex < 0 || membershipIndex >= memberships.length) throw new Error('유효하지 않은 회원권 인덱스입니다.');

      const membership = memberships[membershipIndex] as any;
      if (!membership.period) throw new Error('레거시 회원권은 홀딩 해제를 지원하지 않습니다.');
      if (!membership.holds || membership.holds.length === 0) throw new Error('홀딩 정보가 없습니다.');

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const latestHold = membership.holds[membership.holds.length - 1];
      const latestHoldStart = new Date(latestHold.startDate);
      latestHoldStart.setHours(0, 0, 0, 0);

      if (latestHoldStart > now) {
        const originalDays = latestHold.days;
        membership.holds.pop();

        const currentEnd = new Date(membership.period.endDate);
        membership.period.endDate = new Date(currentEnd.getTime() - originalDays * 24 * 60 * 60 * 1000);

        for (let i = membershipIndex + 1; i < memberships.length; i++) {
          const next = memberships[i] as any;
          if (!next.period) continue;

          const nextStart = new Date(next.period.startDate);
          const nextEnd = new Date(next.period.endDate);
          const prevEnd = new Date((memberships[i - 1] as any).period.endDate);
          const prevOrigEnd = new Date(prevEnd.getTime() - originalDays * 24 * 60 * 60 * 1000);

          if (prevEnd >= nextStart) {
            next.period.endDate = new Date(nextEnd.getTime() - originalDays * 24 * 60 * 60 * 1000);
            next.period.startDate = new Date(prevOrigEnd.getTime() + 24 * 60 * 60 * 1000);
          }
        }

        membership.adjustments = membership.adjustments || [];
        membership.adjustments.push({
          type: 'hold_release',
          hold: { startDate: latestHold.startDate, endDate: latestHold.endDate, reason: latestHold.reason },
          reason: `[미래 홀딩 해제] ${latestHold.reason}`,
          assignee: latestHold.assignee,
          at: new Date()
        });
      } else {
        const currentIndex = membership.holds.findIndex((hold: any) => {
          const start = new Date(hold.startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(hold.endDate);
          end.setHours(0, 0, 0, 0);
          return now >= start && now <= end;
        });

        if (currentIndex === -1) throw new Error('현재 활성화된 홀딩이 없습니다.');

        const currentHold = membership.holds[currentIndex];
        const originalDays = currentHold.days;
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        const holdStart = new Date(currentHold.startDate);
        const newHoldDays = getDaysBetween(holdStart, yesterday);
        if (newHoldDays < 0) throw new Error('홀딩 시작 전에는 해제할 수 없습니다.');

        currentHold.endDate = yesterday;
        currentHold.days = newHoldDays;
        currentHold.released = true;
        currentHold.releasedAt = new Date();

        const daysDiff = originalDays - newHoldDays;
        const currentEnd = new Date(membership.period.endDate);
        membership.period.endDate = new Date(currentEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000);

        membership.adjustments = membership.adjustments || [];
        membership.adjustments.push({
          type: 'hold_release',
          hold: { startDate: holdStart, endDate: yesterday, reason: currentHold.reason },
          reason: `[홀딩 해제] ${currentHold.reason}`,
          assignee: currentHold.assignee,
          at: new Date()
        });
      }

      membership.updatedAt = new Date();
      await MembershipRepository.setUserMemberships(this.getBoxName(), email, memberships);
    } catch (error) {
      console.error('Error releasing hold:', error);
      throw error;
    }
  }

  /**
   * 회원권 기간 또는 횟수 정보를 수정합니다.
   */
  static async editMembershipPeriod(
    email: string,
    membershipIndex: number,
    newStartDate: Date,
    newEndDate: Date,
    newQuotaRemaining: number,
    newQuotaUsed: number,
    reason: string,
    assignee: string,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const memberships = existingMemberships || await this.getUserMemberships(email);
      if (membershipIndex < 0 || membershipIndex >= memberships.length) throw new Error('유효하지 않은 회원권 인덱스입니다.');

      const membership = memberships[membershipIndex];
      if (!membership.period) throw new Error('레거시 회원권은 수정을 지원하지 않습니다.');

      const dateChanged =
        newStartDate.getTime() !== membership.period.startDate.getTime() ||
        newEndDate.getTime() !== membership.period.endDate.getTime();

      const quotaChanged = membership.type === 'countPass' && (
        membership.quota.remaining !== newQuotaRemaining ||
        membership.quota.used !== newQuotaUsed
      );

      if (dateChanged) {
        for (let i = 0; i < memberships.length; i++) {
          if (i === membershipIndex) continue;
          const other = memberships[i];
          if (other.deleted || other.refund?.isRefunded) continue;

          const otherStart = new Date(other.period.startDate);
          const otherEnd = new Date(other.period.endDate);

          if (newStartDate <= otherEnd && otherStart <= newEndDate) {
            throw new Error(
              `수정하려는 기간이 다른 회원권과 겹칩니다.\n` +
              `겹치는 회원권: ${formatDateToString(otherStart)} ~ ${formatDateToString(otherEnd)}`
            );
          }
        }
      }

      if (dateChanged || quotaChanged) {
        const adjustment: any = { type: 'edit', before: {}, after: {}, reason, assignee, at: new Date() };

        if (dateChanged) {
          adjustment.before.period = {
            startDate: new Date(membership.period.startDate),
            endDate: new Date(membership.period.endDate)
          };
          adjustment.after.period = { startDate: newStartDate, endDate: newEndDate };
          membership.period.startDate = newStartDate;
          membership.period.endDate = newEndDate;
        }

        if (quotaChanged) {
          adjustment.before.quota = { used: membership.quota.used, remaining: membership.quota.remaining };
          adjustment.after.quota = { used: newQuotaUsed, remaining: newQuotaRemaining };
        }

        membership.adjustments = membership.adjustments || [];
        membership.adjustments.push(adjustment);
      }

      if (membership.type === 'countPass') {
        membership.quota.remaining = newQuotaRemaining;
        membership.quota.used = newQuotaUsed;
        membership.quota.total = newQuotaRemaining + newQuotaUsed;
      }

      membership.updatedAt = new Date();
      await MembershipRepository.setUserMemberships(this.getBoxName(), email, memberships);
    } catch (error) {
      console.error('Error editing membership:', error);
      throw error;
    }
  }

  /**
   * 회원권을 환불 처리합니다.
   */
  static async refundUserMembership(
    email: string,
    membershipIndex: number,
    refundAmount: string,
    reason: string,
    assignee: string,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const memberships = existingMemberships || await this.getUserMemberships(email);
      if (membershipIndex < 0 || membershipIndex >= memberships.length) throw new Error('유효하지 않은 회원권 인덱스입니다.');

      const membership = memberships[membershipIndex] as any;
      if (membership.refund?.isRefunded) throw new Error('이미 환불된 회원권입니다.');
      if (!membership.purchase) throw new Error('회원권 결제 정보가 없습니다.');

      const parsedRefundAmount = parseInt(refundAmount, 10);
      const maxRefundAmount = Number(membership.purchase.paid ?? membership.purchase.price ?? 0);

      if (!Number.isFinite(parsedRefundAmount) || parsedRefundAmount <= 0) {
        throw new Error('환불 금액은 0보다 커야 합니다.');
      }

      if (!Number.isFinite(maxRefundAmount) || maxRefundAmount <= 0) {
        throw new Error('회원권 결제 금액이 올바르지 않습니다.');
      }

      if (parsedRefundAmount > maxRefundAmount) {
        throw new Error('환불 금액은 결제 금액을 초과할 수 없습니다.');
      }

      membership.refund = {
        isRefunded: true,
        at: new Date(),
        refundAmount: parsedRefundAmount,
        reason,
        assignee
      };
      membership.updatedAt = new Date();

      await MembershipRepository.setUserMemberships(this.getBoxName(), email, memberships);

      if (membership.key) {
        try {
          // purchase.at이 있으면 정확한 연/월 문서만 갱신(스캔 회피)
          const purchaseAt = membership.purchase?.at
            ? this.toDate(membership.purchase.at) ?? undefined
            : undefined;
          await RevenueService.refundUserMembership(membership.key, parsedRefundAmount, purchaseAt);
        } catch (revenueError) {
          console.error('Failed to process revenue refund, but membership refund was successful:', revenueError);
        }
      }
    } catch (error) {
      console.error('Error refunding membership:', error);
      throw error;
    }
  }

  /**
   * 회원권을 삭제합니다.
   */
  static async removeUserMembership(
    email: string,
    index: number,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      if (index === undefined || email === undefined) {
        throw new Error('회원권 인덱스 또는 이메일이 없습니다.');
      }

      const memberships = existingMemberships || await this.getUserMemberships(email);
      if (index < 0 || index >= memberships.length) throw new Error('유효하지 않은 회원권 인덱스입니다.');

      const membershipKey = memberships[index].key;
      const purchaseAt = (memberships[index] as any).purchase?.at
        ? this.toDate((memberships[index] as any).purchase.at) ?? undefined
        : undefined;
      const updatedMemberships = memberships.filter((_, membershipIndex) => membershipIndex !== index);
      await MembershipRepository.setUserMemberships(this.getBoxName(), email, updatedMemberships);

      if (membershipKey) {
        try {
          await RevenueService.removeUserMembership(membershipKey, purchaseAt);
        } catch (revenueError) {
          console.error('Failed to remove revenue data, but membership was removed successfully:', revenueError);
        }
      }
    } catch (error) {
      console.error('Error removing user membership:', error);
      throw error;
    }
  }

  /**
   * 전체 활성 회원권의 만료일을 일괄 연장합니다.
   */
  static async extendAllMemberships(
    days: number,
    reason: string,
    assignee: string
  ): Promise<{ extendedCount: number }> {
    try {
      const boxName = this.getBoxName();
      const documents = await MembershipRepository.getAllMemberMemberships(boxName);
      let extendedCount = 0;
      const now = new Date();
      const pendingWrites: Array<{ email: string; memberships: unknown[] }> = [];

      for (const document of documents) {
        const memberships = document.memberships || [];
        if (memberships.length === 0) continue;

        let hasChanges = false;
        let memberExtendedCount = 0;

        const updatedMemberships = memberships.map((membership: any) => {
          if (isValidActiveMembership(membership, now)) {
            const endDate = this.toDate(membership.period.endDate);
            const startDate = this.toDate(membership.period.startDate);
            if (!endDate || !startDate) return membership;

            const beforePeriod = { startDate: new Date(startDate), endDate: new Date(endDate) };
            const newEndDate = new Date(endDate.getTime() + days * 24 * 60 * 60 * 1000);
            membership.period.endDate = Timestamp.fromDate(newEndDate);
            membership.updatedAt = Timestamp.now();
            hasChanges = true;
            memberExtendedCount++;

            membership.adjustments = membership.adjustments || [];
            membership.adjustments.push({
              type: 'edit',
              before: {
                period: {
                  startDate: Timestamp.fromDate(beforePeriod.startDate),
                  endDate: Timestamp.fromDate(beforePeriod.endDate)
                }
              },
              after: {
                period: {
                  startDate: Timestamp.fromDate(new Date(startDate)),
                  endDate: Timestamp.fromDate(newEndDate)
                }
              },
              reason: `[전체 연장] ${reason}`,
              assignee,
              at: Timestamp.now()
            });

            if (membership.holds?.length > 0) {
              const activeHold = membership.holds.find((hold: any) => {
                const holdStart = this.toDate(hold.startDate);
                const holdEnd = this.toDate(hold.endDate);
                return holdStart && holdEnd && now >= holdStart && now <= holdEnd;
              });

              if (activeHold) {
                const holdEnd = this.toDate(activeHold.endDate);
                if (holdEnd) {
                  const newHoldEnd = new Date(holdEnd.getTime() + days * 24 * 60 * 60 * 1000);
                  activeHold.endDate = Timestamp.fromDate(newHoldEnd);
                  const holdStart = this.toDate(activeHold.startDate);
                  if (holdStart) {
                    activeHold.days = getDaysBetween(holdStart, newHoldEnd);
                  }
                }
              }
            }
          }

          return membership;
        });

        extendedCount += memberExtendedCount;

        for (let i = 0; i < updatedMemberships.length - 1; i++) {
          const current = updatedMemberships[i] as any;
          const next = updatedMemberships[i + 1] as any;
          if (!current.period || !next.period) continue;
          if (current.deleted || next.deleted || current.refund?.isRefunded || next.refund?.isRefunded) continue;

          const currentEnd = this.toDate(current.period.endDate);
          const nextStart = this.toDate(next.period.startDate);
          const nextEnd = this.toDate(next.period.endDate);
          if (!currentEnd || !nextStart || !nextEnd) continue;

          if (currentEnd >= nextStart) {
            const overlapDays = getDaysBetween(nextStart, currentEnd) + 1;
            const beforePeriod = { startDate: new Date(nextStart), endDate: new Date(nextEnd) };
            const newNextEnd = new Date(nextEnd.getTime() + overlapDays * 24 * 60 * 60 * 1000);
            const newNextStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);

            next.period.endDate = Timestamp.fromDate(newNextEnd);
            next.period.startDate = Timestamp.fromDate(newNextStart);
            next.updatedAt = Timestamp.now();
            hasChanges = true;

            next.adjustments = next.adjustments || [];
            next.adjustments.push({
              type: 'edit',
              before: {
                period: {
                  startDate: Timestamp.fromDate(beforePeriod.startDate),
                  endDate: Timestamp.fromDate(beforePeriod.endDate)
                }
              },
              after: {
                period: {
                  startDate: Timestamp.fromDate(newNextStart),
                  endDate: Timestamp.fromDate(newNextEnd)
                }
              },
              reason: `[전체 연장] ${reason} (기간 충돌 자동 조정)`,
              assignee,
              at: Timestamp.now()
            });
          }
        }

        if (hasChanges) {
          pendingWrites.push({ email: document.email, memberships: updatedMemberships });
        }
      }

      // 회원당 write를 병렬 처리. 개별 실패는 throw해서 전체 작업이 실패로 보고되도록 한다.
      await Promise.all(
        pendingWrites.map(({ email, memberships }) =>
          MembershipRepository.setUserMemberships(boxName, email, memberships)
        )
      );

      return { extendedCount };
    } catch (error) {
      console.error('Error extending all memberships:', error);
      throw error;
    }
  }

  /**
   * Firestore Timestamp, Date, 문자열 값을 `Date`로 정규화합니다.
   *
   * @param value 변환할 값
   * @returns 정규화된 Date 또는 `null`
   */
  private static toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (value instanceof Timestamp || (value.toDate && typeof value.toDate === 'function')) return value.toDate();
    if (value.seconds && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }
}
