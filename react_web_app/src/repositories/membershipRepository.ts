import { doc, getDoc, setDoc, getDocs, collection, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MembershipPlan, UserMembership } from '../types/membership';
import { RevenueRepository } from './revenueRepository';
import { getDaysBetween, formatDateToString } from '../utils/dateUtils';
import { convertMembershipsFromFirebase } from '../models/memberModel';
import { isValidActiveMembership } from '../models/membershipModel';

export class MembershipRepository {
  private static getBoxName(): string {
    return localStorage.getItem('boxName') || 'SWEAT';
  }

  // ─── 플랜 관리 ─────────────────────────────────────────────

  static async getMembershipPlans(): Promise<MembershipPlan[]> {
    try {
      const boxName = this.getBoxName();
      const snap = await getDoc(doc(db, `box/${boxName}/membership`, 'plansDoc'));
      return snap.exists() ? (snap.data().plans || []) : [];
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      throw error;
    }
  }

  static async setMembershipPlans(plans: MembershipPlan[]): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const ref = doc(db, `box/${boxName}/membership`, 'plansDoc');
      await setDoc(ref, { plans }, { merge: true });
    } catch (error) {
      console.error('Error setting membership plans:', error);
      throw error;
    }
  }

  static async addMembershipPlan(plan: MembershipPlan): Promise<void> {
    try {
      const existing = await this.getMembershipPlans();
      await this.setMembershipPlans([...existing, plan]);
    } catch (error) {
      console.error('Error adding membership plan:', error);
      throw error;
    }
  }

  static async deleteMembershipPlan(planName: string): Promise<void> {
    try {
      const existing = await this.getMembershipPlans();
      await this.setMembershipPlans(existing.filter(p => p.plan !== planName));
    } catch (error) {
      console.error('Error deleting membership plan:', error);
      throw error;
    }
  }

  // ─── 회원권 조회 ─────────────────────────────────────────────

  static async getUserMemberships(email: string): Promise<UserMembership[]> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName || !email) return [];

      const snap = await getDoc(doc(db, `box/${boxName}/member/${email}`));
      if (!snap.exists()) return [];

      return convertMembershipsFromFirebase(snap.data().memberships || []);
    } catch (error) {
      console.error('회원권 정보 불러오기 중 오류 발생:', error);
      throw new Error('회원권 정보를 불러오는데 실패했습니다.');
    }
  }

  // ─── 회원권 추가 ─────────────────────────────────────────────

  static async addUserMembership(email: string, membership: UserMembership, memberRealName: string): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) throw new Error('박스 이름이 없습니다.');
      if (!email || !membership || !memberRealName) throw new Error('이메일, 회원권 데이터 또는 회원 이름이 없습니다.');

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

      const memberDocRef = doc(db, `box/${boxName}/member/${email}`);
      await setDoc(memberDocRef, { memberships: [...existingMemberships, membership] }, { merge: true });

      try {
        await RevenueRepository.addUserMembership(membership, email, memberRealName);
      } catch (revenueError) {
        console.error('Failed to add revenue data, but membership was added successfully:', revenueError);
      }
    } catch (error) {
      console.error('Error adding user membership:', error);
      throw error;
    }
  }

  // ─── 홀딩 ─────────────────────────────────────────────────

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
      if (!boxName) throw new Error('박스 이름이 없습니다.');

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

      // 이후 회원권 충돌 자동 조정
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
      await setDoc(doc(db, `box/${boxName}/member/${email}`), { memberships }, { merge: true });
    } catch (error) {
      console.error('Error adding hold:', error);
      throw error;
    }
  }

  static async releaseHold(
    email: string,
    membershipIndex: number,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) throw new Error('박스 이름이 없습니다.');

      const memberships = existingMemberships || await this.getUserMemberships(email);
      if (membershipIndex < 0 || membershipIndex >= memberships.length) throw new Error('유효하지 않은 회원권 인덱스입니다.');

      const membership = memberships[membershipIndex] as any;
      if (!membership.period) throw new Error('레거시 회원권은 홀딩 해제를 지원하지 않습니다.');
      if (!membership.holds || membership.holds.length === 0) throw new Error('홀딩 정보가 없습니다.');

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const latestHold = membership.holds[membership.holds.length - 1];
      const holdStart = new Date(latestHold.startDate);
      holdStart.setHours(0, 0, 0, 0);
      const isFuture = holdStart > now;

      if (isFuture) {
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
        const currentIdx = membership.holds.findIndex((h: any) => {
          const s = new Date(h.startDate); s.setHours(0, 0, 0, 0);
          const e = new Date(h.endDate); e.setHours(0, 0, 0, 0);
          return now >= s && now <= e;
        });

        if (currentIdx === -1) throw new Error('현재 활성화된 홀딩이 없습니다.');

        const currentHold = membership.holds[currentIdx];
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
      await setDoc(doc(db, `box/${boxName}/member/${email}`), { memberships }, { merge: true });
    } catch (error) {
      console.error('Error releasing hold:', error);
      throw error;
    }
  }

  // ─── 회원권 수정 ─────────────────────────────────────────────

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
      const boxName = localStorage.getItem('boxName');
      if (!boxName) throw new Error('박스 이름이 없습니다.');

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
      await setDoc(doc(db, `box/${boxName}/member/${email}`), { memberships }, { merge: true });
    } catch (error) {
      console.error('Error editing membership:', error);
      throw error;
    }
  }

  // ─── 환불 ─────────────────────────────────────────────────

  static async refundUserMembership(
    email: string,
    membershipIndex: number,
    refundAmount: string,
    reason: string,
    assignee: string,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) throw new Error('박스 이름이 없습니다.');

      const memberships = existingMemberships || await this.getUserMemberships(email);
      if (membershipIndex < 0 || membershipIndex >= memberships.length) throw new Error('유효하지 않은 회원권 인덱스입니다.');

      const membership = memberships[membershipIndex] as any;
      if (membership.refund?.isRefunded) throw new Error('이미 환불된 회원권입니다.');

      membership.refund = {
        isRefunded: true,
        at: new Date(),
        refundAmount: parseInt(refundAmount),
        reason,
        assignee
      };
      membership.updatedAt = new Date();

      await setDoc(doc(db, `box/${boxName}/member/${email}`), { memberships }, { merge: true });

      try {
        if (membership.key) {
          await RevenueRepository.refundUserMembership(membership.key, parseInt(refundAmount));
        }
      } catch (revenueError) {
        console.error('Failed to process revenue refund, but membership refund was successful:', revenueError);
      }
    } catch (error) {
      console.error('Error refunding membership:', error);
      throw error;
    }
  }

  // ─── 삭제 ─────────────────────────────────────────────────

  static async removeUserMembership(
    email: string,
    index: number,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    try {
      const boxName = localStorage.getItem('boxName');
      if (!boxName) throw new Error('박스 이름이 없습니다.');
      if (index === undefined || email === undefined) throw new Error('회원권 인덱스 또는 이메일이 없습니다.');

      const memberships = existingMemberships || await this.getUserMemberships(email);
      if (index < 0 || index >= memberships.length) throw new Error('유효하지 않은 회원권 인덱스입니다.');

      const membershipKey = memberships[index].key;
      const updated = memberships.filter((_, i) => i !== index);

      await setDoc(doc(db, `box/${boxName}/member/${email}`), { memberships: updated }, { merge: true });

      if (membershipKey) {
        try {
          await RevenueRepository.removeUserMembership(membershipKey);
        } catch (revenueError) {
          console.error('Failed to remove revenue data, but membership was removed successfully:', revenueError);
        }
      }
    } catch (error) {
      console.error('Error removing user membership:', error);
      throw error;
    }
  }

  // ─── 전체 연장 ─────────────────────────────────────────────

  static async extendAllMemberships(
    days: number,
    reason: string,
    assignee: string
  ): Promise<{ extendedCount: number }> {
    try {
      const boxName = this.getBoxName();
      if (!boxName) throw new Error('박스 이름이 없습니다.');

      const snap = await getDocs(collection(db, `/box/${boxName}/member`));
      let extendedCount = 0;
      const now = new Date();

      for (const memberDoc of snap.docs) {
        const email = memberDoc.id;
        const data = memberDoc.data();
        const memberships = data.memberships || [];
        if (memberships.length === 0) continue;

        let hasChanges = false;
        let memberExtendedCount = 0;

        const toDate = (value: any): Date | null => {
          if (!value) return null;
          if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
          if (value instanceof Timestamp || (value.toDate && typeof value.toDate === 'function')) return value.toDate();
          if (value.seconds && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
          if (typeof value === 'string') { const d = new Date(value); return isNaN(d.getTime()) ? null : d; }
          return null;
        };

        const updatedMemberships = memberships.map((membership: any) => {
          if (isValidActiveMembership(membership, now)) {
            const endDate = toDate(membership.period.endDate);
            const startDate = toDate(membership.period.startDate);
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
              before: { period: { startDate: Timestamp.fromDate(beforePeriod.startDate), endDate: Timestamp.fromDate(beforePeriod.endDate) } },
              after: { period: { startDate: Timestamp.fromDate(new Date(startDate)), endDate: Timestamp.fromDate(newEndDate) } },
              reason: `[전체 연장] ${reason}`,
              assignee,
              at: Timestamp.now()
            });

            if (membership.holds?.length > 0) {
              const activeHold = membership.holds.find((h: any) => {
                const hs = toDate(h.startDate);
                const he = toDate(h.endDate);
                return hs && he && now >= hs && now <= he;
              });
              if (activeHold) {
                const holdEnd = toDate(activeHold.endDate);
                if (holdEnd) {
                  const newHoldEnd = new Date(holdEnd.getTime() + days * 24 * 60 * 60 * 1000);
                  activeHold.endDate = Timestamp.fromDate(newHoldEnd);
                  const holdStart = toDate(activeHold.startDate);
                  if (holdStart) activeHold.days = getDaysBetween(holdStart, newHoldEnd);
                }
              }
            }
          }
          return membership;
        });

        extendedCount += memberExtendedCount;

        // 기간 충돌 자동 조정
        for (let i = 0; i < updatedMemberships.length - 1; i++) {
          const cur = updatedMemberships[i] as any;
          const next = updatedMemberships[i + 1] as any;
          if (!cur.period || !next.period) continue;
          if (cur.deleted || next.deleted || cur.refund?.isRefunded || next.refund?.isRefunded) continue;

          const curEnd = toDate(cur.period.endDate);
          const nextStart = toDate(next.period.startDate);
          const nextEnd = toDate(next.period.endDate);
          if (!curEnd || !nextStart || !nextEnd) continue;

          if (curEnd >= nextStart) {
            const overlapDays = getDaysBetween(nextStart, curEnd) + 1;
            const beforePeriod = { startDate: new Date(nextStart), endDate: new Date(nextEnd) };
            const newNextEnd = new Date(nextEnd.getTime() + overlapDays * 24 * 60 * 60 * 1000);
            const newNextStart = new Date(curEnd.getTime() + 24 * 60 * 60 * 1000);

            next.period.endDate = Timestamp.fromDate(newNextEnd);
            next.period.startDate = Timestamp.fromDate(newNextStart);
            next.updatedAt = Timestamp.now();
            hasChanges = true;

            next.adjustments = next.adjustments || [];
            next.adjustments.push({
              type: 'edit',
              before: { period: { startDate: Timestamp.fromDate(beforePeriod.startDate), endDate: Timestamp.fromDate(beforePeriod.endDate) } },
              after: { period: { startDate: Timestamp.fromDate(newNextStart), endDate: Timestamp.fromDate(newNextEnd) } },
              reason: `[전체 연장] ${reason} (기간 충돌 자동 조정)`,
              assignee,
              at: Timestamp.now()
            });
          }
        }

        if (hasChanges) {
          await setDoc(doc(db, `box/${boxName}/member/${email}`), { memberships: updatedMemberships }, { merge: true });
        }
      }

      return { extendedCount };
    } catch (error) {
      console.error('Error extending all memberships:', error);
      throw error;
    }
  }
}
