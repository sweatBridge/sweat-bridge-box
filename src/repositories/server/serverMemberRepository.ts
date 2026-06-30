import { Timestamp } from 'firebase/firestore';
import { api } from '../../data/apiClient';
import { FirebaseMemberDocument } from '../memberRepository';

export interface ServerMembershipDetail {
  id: number;
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
  is_future: boolean;
  deleted: boolean;
  deleted_at: string | null;
  is_refunded: boolean;
  refund_amount: number;
  refund_reason: string | null;
  refunded_at: string | null;
  refund_assignee: string | null;
  box_name: string;
  created_at: string;
  updated_at: string;
}

export interface ServerLockerHistoryDetail {
  id: number;
  locker_num: number;
  start_date: string;
  end_date: string | null;
  released_date: string | null;
  locker_key: string | null;
  price: string | null;
  payment_type: string | null;
  created_at: string;
}

export interface ServerMemberResponse {
  id: number;
  box_name: string;
  email: string;
  real_name: string;
  nick_name: string | null;
  gender: string | null;
  birth_date: string | null;
  phone: string | null;
  memo: string | null;
  locker_pass: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerMemberDetailResponse extends ServerMemberResponse {
  memberships: ServerMembershipDetail[];
  locker_history: ServerLockerHistoryDetail[];
}

export interface ServerMemberCreate {
  box_name: string;
  email: string;
  real_name: string;
  nick_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  memo?: string | null;
  joined_at?: string | null;
}

export interface ServerMemberUpdate {
  real_name?: string | null;
  nick_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  memo?: string | null;
}

export class ServerMemberRepository {
  static async listMembers(boxName: string): Promise<ServerMemberResponse[]> {
    return api.get<ServerMemberResponse[]>(
      `/api/v1/members?box_name=${encodeURIComponent(boxName)}&limit=500`
    );
  }

  static async listMembersWithDetail(boxName: string): Promise<FirebaseMemberDocument[]> {
    const members = await api.get<ServerMemberDetailResponse[]>(
      `/api/v1/members?box_name=${encodeURIComponent(boxName)}&limit=500&with_detail=true`
    );
    return members.map(serverMemberDetailToFirebaseDocument);
  }

  static async getMemberByEmail(boxName: string, email: string): Promise<ServerMemberResponse> {
    return api.get<ServerMemberResponse>(
      `/api/v1/members/by-email?box_name=${encodeURIComponent(boxName)}&email=${encodeURIComponent(email)}`
    );
  }

  static async getMemberWithDetail(boxName: string, email: string): Promise<Record<string, unknown> | null> {
    try {
      const m = await api.get<ServerMemberDetailResponse>(
        `/api/v1/members/by-email?box_name=${encodeURIComponent(boxName)}&email=${encodeURIComponent(email)}&with_detail=true`
      );
      return serverMemberDetailToFirebaseDocument(m).data;
    } catch {
      return null;
    }
  }

  static async createMember(payload: ServerMemberCreate): Promise<ServerMemberResponse> {
    return api.post<ServerMemberResponse>('/api/v1/members', payload);
  }

  static async updateMemberById(id: number, payload: ServerMemberUpdate): Promise<ServerMemberResponse> {
    return api.patch<ServerMemberResponse>(`/api/v1/members/${id}`, payload);
  }

  static async deleteMemberById(id: number): Promise<void> {
    return api.delete(`/api/v1/members/${id}`);
  }
}

function serverMemberDetailToFirebaseDocument(m: ServerMemberDetailResponse): FirebaseMemberDocument {
  return {
    id: m.email,
    data: {
      email: m.email,
      realName: m.real_name,
      nickName: m.nick_name ?? '',
      gender: m.gender ?? '',
      birthDate: m.birth_date ?? '',
      birth: m.birth_date ?? '',
      phone: m.phone ?? '',
      memo: m.memo ?? '',
      lockerPass: m.locker_pass ?? '',
      joinedAt: m.joined_at ? Timestamp.fromDate(new Date(m.joined_at)) : null,
      memberships: m.memberships.map(serverMembershipToFirebaseFormat),
      lockerHistory: m.locker_history.map(serverLockerHistoryToFirebaseFormat),
    },
  };
}

function serverMembershipToFirebaseFormat(ms: ServerMembershipDetail): Record<string, unknown> {
  return {
    key: `server-${ms.id}`,
    plan: ms.plan,
    type: ms.type,
    boxName: ms.box_name,
    assignee: ms.assignee ?? '',
    deleted: ms.deleted,
    deletedAt: ms.deleted_at ?? null,
    purchase: {
      price: ms.price,
      paid: ms.paid,
      paymentType: ms.payment_type ?? '',
      at: ms.paid_at ?? new Date(0).toISOString(),
    },
    quota: {
      total: ms.quota_total,
      used: ms.quota_used,
      remaining: ms.quota_remaining,
    },
    period: {
      startDate: ms.start_date ?? new Date(0).toISOString(),
      endDate: ms.end_date ?? new Date(0).toISOString(),
      originalEndDate: ms.original_end_date ?? ms.end_date ?? new Date(0).toISOString(),
    },
    holds: [],
    refund: {
      isRefunded: ms.is_refunded,
      at: ms.refunded_at ?? null,
      refundAmount: ms.refund_amount,
      reason: ms.refund_reason ?? null,
      assignee: ms.refund_assignee ?? null,
    },
    adjustments: [],
    createdAt: ms.created_at,
    updatedAt: ms.updated_at,
  };
}

function serverLockerHistoryToFirebaseFormat(lh: ServerLockerHistoryDetail): Record<string, unknown> {
  return {
    lockerNum: lh.locker_num,
    startDate: lh.start_date,
    endDate: lh.end_date ?? '',
    releasedDate: lh.released_date ?? undefined,
    key: `server-${lh.id}`,
    price: lh.price ?? undefined,
    paymentType: lh.payment_type ?? undefined,
    createdAt: lh.created_at,
  };
}
