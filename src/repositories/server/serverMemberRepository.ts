import { api } from '../../data/apiClient';

export interface ServerMemberResponse {
  id: number;
  box_name: string;
  email: string;
  real_name: string;
  nick_name: string | null;
  gender: string | null;
  birth_date: string | null;
  phone: string | null;
  memo: string | null;
  locker_pass: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerMemberCreate {
  box_name: string;
  email: string;
  real_name: string;
  nick_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  memo?: string | null;
}

export interface ServerMemberUpdate {
  real_name?: string | null;
  nick_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  phone?: string | null;
  memo?: string | null;
}

export class ServerMemberRepository {
  static async listMembers(boxName: string): Promise<ServerMemberResponse[]> {
    return api.get<ServerMemberResponse[]>(
      `/api/v1/members?box_name=${encodeURIComponent(boxName)}&limit=500`
    );
  }

  static async getMemberByEmail(boxName: string, email: string): Promise<ServerMemberResponse> {
    return api.get<ServerMemberResponse>(
      `/api/v1/members/by-email?box_name=${encodeURIComponent(boxName)}&email=${encodeURIComponent(email)}`
    );
  }

  static async createMember(payload: ServerMemberCreate): Promise<ServerMemberResponse> {
    return api.post<ServerMemberResponse>('/api/v1/members', payload);
  }

  static async updateMemberById(id: number, payload: ServerMemberUpdate): Promise<ServerMemberResponse> {
    return api.patch<ServerMemberResponse>(`/api/v1/members/${id}`, payload);
  }

  static async deleteMemberById(id: number): Promise<void> {
    return api.delete(`/api/v1/members/${id}`);
  }
}
