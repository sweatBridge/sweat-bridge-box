import { Timestamp } from 'firebase/firestore';
import { MembershipInfo } from './membership';

export interface MemberLockerHistory {
  lockerNum: number;
  startDate: string;
  endDate: string;
  createdAt: any;  // Firebase Timestamp 또는 string
  key?: string;  // 락커 할당 고유 키
  price?: string;  // 가격
  paymentType?: 'cash' | 'card';  // 결제수단
}

export interface Member {
  email: string;
  realName: string;
  nickName: string;
  gender: 'M' | 'F';
  birthDate: string;
  phone: string;
  membershipInfo: MembershipInfo;
  memberships: any[];
  futureMemberships: any[];
  lockerHistory?: MemberLockerHistory[];
  lockerPass?: string;
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
