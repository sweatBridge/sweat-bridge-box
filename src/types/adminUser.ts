import { BoxStatus, UserRole } from './auth';

export type AdminUserRole = UserRole | 'member' | 'unknown';

export interface AdminUserSummary {
  uid: string;
  email: string;
  realName: string;
  nickName: string;
  phone: string;
  role: AdminUserRole;
  boxName: string;
  status?: BoxStatus;
  createdAt: string;
}
