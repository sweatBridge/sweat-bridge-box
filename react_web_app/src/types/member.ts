export interface MembershipInfo {
  type: string;
  expiryDate: string;
  remainingDays: string | number;
  remainingVisits: string | number;
}

export interface Member {
  email: string;
  realName: string;
  nickName: string;
  gender: 'male' | 'female';
  birthDate: string;
  phoneNumber: string;
  membershipInfo: MembershipInfo;
  memberships: any[];
  futureMemberships: any[];
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