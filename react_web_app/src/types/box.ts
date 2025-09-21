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

export interface BoxInfo {
  boxName: string;
  email: string;
  representative: string;
  phone: string;
  address: Address;
  description: string;
  coaches: Coach[];
}

export interface BoxState {
  loading: boolean;
  error: string | null;
  boxInfo: BoxInfo | null;
} 