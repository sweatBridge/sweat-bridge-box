import { MembershipRepository } from '../repositories/membershipRepository';
import {
  isHold,
  isFutureHold,
  isValidActiveMembership,
  getCurrentMemberships,
  getWarningMemberThreshold,
  isWarningMember,
  filterWarningMembers,
  isNewMember,
  getMemberStatusBadge,
  getMembershipStatusBadges,
} from '../models/membershipModel';
import { MembershipPlan, UserMembership } from '../types/membership';

export class MembershipService {
  // ─── 도메인 로직 (Model 위임) ────────────────────────────────

  static isHold = isHold;
  static isFutureHold = isFutureHold;
  static isValidActiveMembership = isValidActiveMembership;
  static getCurrentMemberships = getCurrentMemberships;
  static getWarningMemberThreshold = getWarningMemberThreshold;
  static isWarningMember = isWarningMember;
  static filterWarningMembers = filterWarningMembers;
  static isNewMember = isNewMember;
  static getMemberStatusBadge = getMemberStatusBadge;
  static getMembershipStatusBadges = getMembershipStatusBadges;

  // ─── 플랜 관리 (Repository 위임) ─────────────────────────────

  static async getMembershipPlans(): Promise<MembershipPlan[]> {
    return MembershipRepository.getMembershipPlans();
  }

  static async setMembershipPlans(plans: MembershipPlan[]): Promise<void> {
    return MembershipRepository.setMembershipPlans(plans);
  }

  static async addMembershipPlan(plan: MembershipPlan): Promise<void> {
    return MembershipRepository.addMembershipPlan(plan);
  }

  static async deleteMembershipPlan(planName: string): Promise<void> {
    return MembershipRepository.deleteMembershipPlan(planName);
  }

  // ─── 회원권 CRUD (Repository 위임) ───────────────────────────

  static async getUserMemberships(email: string): Promise<UserMembership[]> {
    return MembershipRepository.getUserMemberships(email);
  }

  static async addUserMembership(email: string, membership: UserMembership, memberRealName: string): Promise<void> {
    return MembershipRepository.addUserMembership(email, membership, memberRealName);
  }

  static async addHold(
    email: string,
    membershipIndex: number,
    holdStartDate: Date,
    holdEndDate: Date,
    reason: string,
    assignee: string,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    return MembershipRepository.addHold(email, membershipIndex, holdStartDate, holdEndDate, reason, assignee, existingMemberships);
  }

  static async releaseHold(
    email: string,
    membershipIndex: number,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    return MembershipRepository.releaseHold(email, membershipIndex, existingMemberships);
  }

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
    return MembershipRepository.editMembershipPeriod(
      email, membershipIndex, newStartDate, newEndDate,
      newQuotaRemaining, newQuotaUsed, reason, assignee, existingMemberships
    );
  }

  static async refundUserMembership(
    email: string,
    membershipIndex: number,
    refundAmount: string,
    reason: string,
    assignee: string,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    return MembershipRepository.refundUserMembership(email, membershipIndex, refundAmount, reason, assignee, existingMemberships);
  }

  static async removeUserMembership(
    email: string,
    index: number,
    existingMemberships?: UserMembership[]
  ): Promise<void> {
    return MembershipRepository.removeUserMembership(email, index, existingMemberships);
  }

  static async extendAllMemberships(
    days: number,
    reason: string,
    assignee: string
  ): Promise<{ extendedCount: number }> {
    return MembershipRepository.extendAllMemberships(days, reason, assignee);
  }
}
