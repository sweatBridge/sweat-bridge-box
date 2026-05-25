import { api } from '../../data/apiClient';

export interface ServerAppliedResponse {
  id: number;
  box_name: string;
  email: string;
  real_name: string;
  phone: string | null;
  birth: string | null;
  status: string;
  applied_at: string;
  processed_at: string | null;
}

export class ServerAppliedRepository {
  static async findByEmail(boxName: string, email: string): Promise<ServerAppliedResponse | null> {
    return api.get<ServerAppliedResponse | null>(
      `/api/v1/applied/${encodeURIComponent(boxName)}/by-email?email=${encodeURIComponent(email)}`
    );
  }

  static async deleteApplied(aid: number): Promise<void> {
    return api.delete(`/api/v1/applied/${aid}`);
  }
}
