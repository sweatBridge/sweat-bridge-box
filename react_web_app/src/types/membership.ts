export interface MembershipPlan {
  plan: string;
  type: 'periodPass' | 'countPass';
  count: string;
  duration: number;
  price: string;
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
  };
  
  adjustments: Array<{
    before: { period: { startDate: Date; endDate: Date }};
    after: { period: { startDate: Date; endDate: Date }};
    reason: string;
    assignee: string;
    at: Date;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
  assignee: string;
  
  deleted: boolean;
  deletedAt: Date | null;
  
  boxName: string;
}

// 레거시 데이터 지원을 위한 타입
export interface LegacyUserMembership {
  key: string;
  plan: string;
  type: 'periodPass' | 'countPass';
  count: string;
  price: string;
  paymentType: 'cash' | 'card';
  assignee: string;
  startDate: Date;
  endDate: Date;
  holdStartDate?: Date | null;
  holdEndDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  member: any; // Member 타입 사용
  onClose: () => void;
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