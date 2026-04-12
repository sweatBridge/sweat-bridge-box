import type { Member } from './member';

export interface MembershipPlan {
  plan: string;
  type: 'periodPass' | 'countPass';
  count: string;
  duration: number;
  price: string;
}

export interface Adjustment {
  type: 'edit' | 'hold' | 'hold_release';
  before?: {
    period?: { startDate: Date; endDate: Date };
    quota?: { used: number; remaining: number };
  };
  after?: {
    period?: { startDate: Date; endDate: Date };
    quota?: { used: number; remaining: number };
  };
  hold?: {
    startDate: Date;
    endDate: Date;
    reason: string;
  };
  reason: string;
  assignee: string;
  at: Date;
}

// 새로운 회원권 구조
export interface UserMembership {
  key: string;
  plan: string;
  type: 'periodPass' | 'countPass';
  
  purchase: {
    price: number;
    paid: number;
    paymentType: 'card' | 'cash' | 'transfer' | 'point';
    at: Date;
  };
  
  quota: {
    total: number;
    used: number;
    remaining: number;
  };
  
  period: {
    startDate: Date;
    endDate: Date;
    originalEndDate: Date;
  };
  
  holds: Array<{
    reason: string;
    startDate: Date;
    endDate: Date;
    days: number;
    assignee: string;
  }>;
  
  refund: {
    isRefunded: boolean;
    at: Date | null;
    refundAmount: number;
    reason: string | null;
    assignee: string | null;
  };
  
  adjustments: Adjustment[];
  
  createdAt: Date;
  updatedAt: Date;
  assignee: string;
  
  deleted: boolean;
  deletedAt: Date | null;
  
  boxName: string;
}

export interface MembershipState {
  plans: MembershipPlan[];
  userMemberships: UserMembership[];
  userCurrentMemberships: UserMembership[];
  loading: boolean;
  error: string | null;
}

// 새로운 통합 모달을 위한 타입
export interface MemberManagementModalProps {
  visible: boolean;
  member: Member;
  onClose: (hasDataChanged?: boolean) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onMemoUpdate?: (email: string, memo: string) => void;
}

export interface AddMembershipData {
  selectedPlanName: string;
  membershipType: 'periodPass' | 'countPass';
  duration: number;
  count: string;
  price: string;
  paymentType: 'cash' | 'card';
  assignee: string;
  startDate: Date;
}

export class MembershipInfo {
  type: string;
  expiryDate: string;
  remainingDays: string | number;
  remainingVisits: string | number;

  constructor(
    type: string,
    expiryDate: string,
    remainingDays: string | number,
    remainingVisits: string | number
  ) {
    this.type = type;
    this.expiryDate = expiryDate;
    this.remainingDays = remainingDays;
    this.remainingVisits = remainingVisits;
  }

  static create(
    type: string,
    expiryDate: string,
    remainingDays: string | number,
    remainingVisits: string | number
  ): MembershipInfo {
    return new MembershipInfo(type, expiryDate, remainingDays, remainingVisits);
  }
}
