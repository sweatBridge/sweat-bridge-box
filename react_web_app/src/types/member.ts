import { Timestamp } from 'firebase/firestore';
import { BoxStatus } from './auth';
import { MembershipInfo, UserMembership } from './membership';

export interface MemberLockerHistory {
  lockerNum: number;
  startDate: string;
  endDate: string;
  createdAt: Timestamp | string;
  releasedDate?: string;  // 실제 반납일 (반납되지 않으면 undefined)
  key?: string;  // 락커 할당 고유 키
  price?: string;  // 가격
  paymentType?: 'cash' | 'card';  // 결제수단
}

export interface MemberApplicantRecord {
  email?: string;
  realName?: string;
  phone?: string;
  birth?: string;
}

export interface MemberApplicant {
  name: string;
  email: string;
  phone: string;
  boxName: string;
  birth?: string;
}

export interface BoxUser {
  email: string;
  realName: string;
  nickName: string;
  phone: string;
  boxName: string;
  status?: BoxStatus;
  gender?: 'M' | 'F';
  birth?: string;
  birthDate?: string;
  role?: string;
  joinedAt?: Timestamp | null;
  memberships?: UserMembership[];
}

export interface Member {
  email: string;
  realName: string;
  nickName: string;
  gender: 'M' | 'F';
  birthDate: string;
  phone: string;
  membershipInfo: MembershipInfo;
  memberships: UserMembership[];
  futureMemberships: UserMembership[];
  lockerHistory?: MemberLockerHistory[];
  memo?: string;
  joinedAt?: Timestamp | null;
}

export interface MemberListProps {
  // 필요한 경우 추가
}

export interface MemberDetailsModalProps {
  visible: boolean;
  member: Member | null;
  onClose: () => void;
}

export interface MemberDeletionModalProps {
  visible: boolean;
  member: Member | null;
  onClose: () => void;
  onDelete: (email: string) => void;
}

export interface MembershipModalProps {
  visible: boolean;
  memberEmail: string | null;
  onClose: () => void;
  onUpdate: (membershipData: any) => void;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
}

export interface ToastMessageProps {
  onCreateToast: (createToastFn: (toast: ToastMessageType) => void) => void;
}

export type ToastMessageType = Omit<ToastMessage, 'id'>;
