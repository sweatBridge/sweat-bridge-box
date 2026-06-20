import { serverRead, serverWrite } from '../../data/apiClient';
import { MembershipPlan } from '../../types/membership';
import { RevenueData } from '../../types/revenue';
import { MemberMembershipDocument, MembershipRepository } from '../membershipRepository';
import { ServerMembershipRepository, ServerMembershipResponse } from '../server/serverMembershipRepository';
import { ServerRevenueRepository } from '../server/serverRevenueRepository';

export type { MemberMembershipDocument };

export class HybridMembershipRepository {
  // ---- Server-first read ----

  static async getMembershipPlans(boxName: string): Promise<MembershipPlan[]> {
    const serverPlans = await serverRead(
      () => ServerMembershipRepository.getMembershipPlans(boxName),
      `Membership.getMembershipPlans(${boxName})`
    );
    if (serverPlans && serverPlans.length > 0) return serverPlans;
    return MembershipRepository.getMembershipPlans(boxName);
  }

  // ---- Firebase primary + server fire-and-forget ----

  static async setMembershipPlans(boxName: string, plans: MembershipPlan[]): Promise<void> {
    await MembershipRepository.setMembershipPlans(boxName, plans);
    serverWrite(
      () => syncPlansToServer(boxName, plans),
      `Membership.setMembershipPlans(${boxName})`
    );
  }

  static async commitAddMembershipBatch(
    boxName: string,
    email: string,
    memberships: unknown[],
    revenue: { year: number; month: number; key: string; entry: RevenueData }
  ): Promise<void> {
    await MembershipRepository.commitAddMembershipBatch(boxName, email, memberships, revenue);

    const newMembership = memberships[memberships.length - 1] as any;
    if (!newMembership) return;

    serverWrite(async () => {
      const toIsoOrUndef = (v: any) =>
        v ? (v instanceof Date ? v.toISOString() : new Date(v.seconds * 1000 || v).toISOString()) : undefined;

      await ServerMembershipRepository.createMembership({
        box_name: boxName,
        member_email: email,
        plan: newMembership.plan ?? '',
        type: newMembership.type ?? 'periodPass',
        price: newMembership.purchase?.price ?? 0,
        paid: newMembership.purchase?.paid ?? 0,
        payment_type: newMembership.purchase?.paymentType ?? undefined,
        paid_at: toIsoOrUndef(newMembership.purchase?.at),
        quota_total: newMembership.quota?.total ?? 0,
        quota_used: newMembership.quota?.used ?? 0,
        quota_remaining: newMembership.quota?.remaining ?? 0,
        start_date: toIsoOrUndef(newMembership.period?.startDate),
        end_date: toIsoOrUndef(newMembership.period?.endDate),
        assignee: newMembership.assignee ?? undefined
      });

      await ServerRevenueRepository.createRevenue({
        box_name: boxName,
        year: revenue.year,
        month: revenue.month,
        transaction_id: revenue.key,
        assignee: revenue.entry.assignee || undefined,
        payment_type: revenue.entry.paymentType,
        plan: revenue.entry.plan || undefined,
        price: revenue.entry.price,
        real_name: revenue.entry.realName || undefined,
        member_email: revenue.entry.id || undefined,
        type: revenue.entry.type || undefined,
        refund_amount: revenue.entry.refundAmount || undefined
      });
    }, `Membership.commitAddMembershipBatch(${email})`);
  }

  // ---- Firebase-only reads/writes ----

  static getRawUserMemberships(boxName: string, email: string): Promise<unknown[]> {
    return MembershipRepository.getRawUserMemberships(boxName, email);
  }

  static setUserMemberships(boxName: string, email: string, memberships: unknown[]): Promise<void> {
    return MembershipRepository.setUserMemberships(boxName, email, memberships);
  }

  static async getAllMemberMemberships(boxName: string): Promise<MemberMembershipDocument[]> {
    const serverList = await serverRead(
      () => ServerMembershipRepository.getMembershipsByBox(boxName),
      `Membership.getAllMemberMemberships(${boxName})`
    );
    if (serverList && serverList.length > 0) {
      const byEmail = new Map<string, unknown[]>();
      for (const m of serverList) {
        const list = byEmail.get(m.member_email) ?? [];
        list.push(toRawMembership(m));
        byEmail.set(m.member_email, list);
      }
      return Array.from(byEmail.entries()).map(([email, memberships]) => ({ email, memberships }));
    }
    return MembershipRepository.getAllMemberMemberships(boxName);
  }
}

function toRawMembership(m: ServerMembershipResponse): unknown {
  return {
    key: String(m.id),
    plan: m.plan,
    type: m.type,
    assignee: m.assignee ?? '',
    purchase: {
      price: m.price,
      paid: m.paid,
      paymentType: m.payment_type ?? '',
      at: m.paid_at,
    },
    period: {
      startDate: m.start_date,
      endDate: m.end_date,
      originalEndDate: m.original_end_date,
    },
    quota: {
      total: m.quota_total,
      used: m.quota_used,
      remaining: m.quota_remaining,
    },
    holds: [],
    adjustments: [],
    refund: {
      isRefunded: m.is_refunded,
      amount: m.refund_amount,
      at: m.refunded_at,
      reason: m.refund_reason,
    },
    deleted: m.deleted,
    deletedAt: m.deleted_at,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  };
}

async function syncPlansToServer(boxName: string, newPlans: MembershipPlan[]): Promise<void> {
  const serverPlans = await ServerMembershipRepository.getRawPlans(boxName);
  const newPlanNames = new Set(newPlans.map((p) => p.plan));
  const serverPlanNames = new Set(serverPlans.map((p) => p.plan));

  for (const sp of serverPlans) {
    if (!newPlanNames.has(sp.plan)) {
      await ServerMembershipRepository.deletePlan(sp.id);
    }
  }

  for (const plan of newPlans) {
    if (!serverPlanNames.has(plan.plan)) {
      await ServerMembershipRepository.createPlan({
        box_name: boxName,
        plan: plan.plan,
        type: plan.type,
        count: plan.count || undefined,
        duration: plan.duration || undefined,
        price: plan.price
      });
    }
  }
}
