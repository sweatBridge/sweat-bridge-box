export interface Address {
  zoneCode: string;
  roadAddress: string;
  detailAddress: string;
}

export interface Coach {
  name: string;
  phone: string;
  email: string;
}

export type BoxStatus = 'active' | 'suspended';

export interface BoxInfo {
  boxName: string;
  email: string;
  representative: string;
  phone: string;
  address: Address;
  description: string;
  coaches: Coach[];
  status?: BoxStatus;
  createdAt?: string;
  onboardedAt?: string;
  memberCount?: number;
}

export interface BoxState {
  loading: boolean;
  error: string | null;
  boxInfo: BoxInfo | null;
} 