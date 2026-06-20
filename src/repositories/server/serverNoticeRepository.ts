import { api } from '../../data/apiClient';

export interface ServerNoticeResponse {
  id: string;
  box_name: string | null;
  title: string;
  content: string | null;
  author_name: string | null;
  author_email: string | null;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface ServerNoticeCreate {
  id: string;
  box_name?: string | null;
  title: string;
  content?: string | null;
  author_name?: string | null;
  author_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerNoticeUpdate {
  title?: string;
  content?: string;
  author_name?: string;
  author_email?: string;
  updated_at?: string;
}

export class ServerNoticeRepository {
  static async listByBox(boxName: string, limit = 50): Promise<ServerNoticeResponse[]> {
    return api.get<ServerNoticeResponse[]>(
      `/api/v1/notices?box_name=${encodeURIComponent(boxName)}&limit=${limit}`
    );
  }

  static async createNotice(payload: ServerNoticeCreate): Promise<void> {
    await api.post('/api/v1/notices', payload);
  }

  static async updateNotice(noticeId: string, payload: ServerNoticeUpdate): Promise<void> {
    await api.patch(`/api/v1/notices/${encodeURIComponent(noticeId)}`, payload);
  }

  static async deleteNotice(noticeId: string): Promise<void> {
    await api.delete(`/api/v1/notices/${encodeURIComponent(noticeId)}`);
  }
}
