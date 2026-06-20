import { api } from '../../data/apiClient';

export interface ServerUserResponse {
  email: string;
  real_name: string;
  nick_name: string | null;
  phone: string | null;
  gender: string | null;
  birth: string | null;
  box_name: string | null;
  role: string;
  status: string;
}

export interface ServerUserUpdate {
  real_name?: string | null;
  nick_name?: string | null;
  phone?: string | null;
  gender?: string | null;
  birth?: string | null;
  box_name?: string | null;
  role?: string | null;
  status?: string | null;
}

export class ServerUserRepository {
  static async getUserByEmail(email: string): Promise<ServerUserResponse> {
    return api.get<ServerUserResponse>(`/api/v1/users/${encodeURIComponent(email)}`);
  }

  static async getUsersByPhone(phone: string): Promise<ServerUserResponse[]> {
    const params = new URLSearchParams({ phone });
    return api.get<ServerUserResponse[]>(`/api/v1/users?${params.toString()}`);
  }

  static async searchUsers(query: string, boxName?: string): Promise<ServerUserResponse[]> {
    const params = new URLSearchParams({ search: query });
    if (boxName) params.set('box_name', boxName);
    return api.get<ServerUserResponse[]>(`/api/v1/users?${params.toString()}`);
  }

  static async updateUser(email: string, payload: ServerUserUpdate): Promise<ServerUserResponse> {
    return api.patch<ServerUserResponse>(`/api/v1/users/${encodeURIComponent(email)}`, payload);
  }

  static async deleteUser(email: string): Promise<void> {
    return api.delete(`/api/v1/users/${encodeURIComponent(email)}`);
  }
}
