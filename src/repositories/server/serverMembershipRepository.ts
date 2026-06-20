import { api } from '../../data/apiClient';
import { MembershipPlan } from '../../types/membership';

interface ServerPlanResponse {
  id: number;
  box_name: string;
  plan: string;
  type: string;
  count: string | null;
  duration: number | null;
  price: string;
}

export interface ServerMembershipResponse {
  id: number;
  box_name: string;
  member_email: string;
  plan: string;
  type: string;
  price: number;
  paid: number;
  payment_type: string | null;
  paid_at: string | null;
  quota_total: number;
  quota_used: number;
  quota_remaining: number;
  start_date: string | null;
  end_date: string | null;
  original_end_date: string | null;
  assignee: string | null;
  is_refunded: boolean;
  refund_amount: number;
  refund_reason: string | null;
  refunded_at: string | null;
  deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerMembershipCreate {
  box_name: string;
  member_email: string;
  plan: string;
  type: string;
  price?: number;
  paid?: number;
  payment_type?: string;
  paid_at?: string;
  quota_total?: number;
  quota_used?: number;
  quota_remaining?: number;
  start_date?: string;
  end_date?: string;
  assignee?: string;
}

export class ServerMembershipRepository {
  // ---- Plans ----

  static async getMembershipPlans(boxName: string): Promise<MembershipPlan[]> {
    const plans = await api.get<ServerPlanResponse[]>(
      `/api/v1/memberships/plans?box_name=${encodeURIComponent(boxName)}`
    );
    return plans.map((p) => ({
      plan: p.plan,
      type: p.type as MembershipPlan['type'],
      count: p.count ?? '',
      duration: p.duration ?? 0,
      price: p.price
    }));
  }

  static async getRawPlans(boxName: string): Promise<ServerPlanResponse[]> {
    return api.get<ServerPlanResponse[]>(
      `/api/v1/memberships/plans?box_name=${encodeURIComponent(boxName)}`
    );
  }

  static async createPlan(payload: {
    box_name: string;
    plan: string;
    type: string;
    count?: string;
    duration?: number;
    price: string;
  }): Promise<void> {
    await api.post('/api/v1/memberships/plans', payload);
  }

  static async deletePlan(planId: number): Promise<void> {
    await api.delete(`/api/v1/memberships/plans/${planId}`);
  }

  // ---- Memberships ----

  static async getMembershipsByBox(boxName: string): Promise<ServerMembershipResponse[]> {
    return api.get<ServerMembershipResponse[]>(
      `/api/v1/memberships?box_name=${encodeURIComponent(boxName)}`
    );
  }

  static async createMembership(payload: ServerMembershipCreate): Promise<void> {
    await api.post('/api/v1/memberships', payload);
  }
}
