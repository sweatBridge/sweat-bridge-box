export interface MembershipPlan {
  plan: string;
  type: 'periodPass' | 'countPass';
  count: string;
  duration: number;
  price: string;
}

export interface UserMembership {
  plan: string;
  type: 'periodPass' | 'countPass';
  count: string;
  price: string;
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