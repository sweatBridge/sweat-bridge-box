export type UserRole = 'coach' | 'admin';
export type BoxStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  boxName: string;
  email: string;
  realName: string;
  nickName: string;
  phone: string;
  role: UserRole;
  status?: BoxStatus;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
} 