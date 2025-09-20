export interface MembershipPlan {
  plan: string;
  type: 'periodPass' | 'countPass';
  count: number;
  duration: number;
  price: number;
}

export interface UserMembership {
  plan: string;
  type: 'periodPass' | 'countPass';
  count: string;
  price: string;
  assignee: string;
  startDate: Date | null;
  endDate: Date | null;
  holdStartDate: Date | null;
  holdEndDate: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MembershipState {
  plans: MembershipPlan[];
  userMemberships: UserMembership[];
  userCurrentMemberships: UserMembership[];
} 