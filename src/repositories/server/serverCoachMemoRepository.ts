import { api } from '../../data/apiClient';

interface ServerCoachMemoResponse {
  box_name: string;
  content: string | null;
  updated_at: string;
}

export class ServerCoachMemoRepository {
  // 404 = 메모 없음 → 빈 문자열 반환 (throw 하지 않음)
  static async getMemo(boxName: string): Promise<string> {
    try {
      const res = await api.get<ServerCoachMemoResponse>(
        `/api/v1/coach-memos/${encodeURIComponent(boxName)}`
      );
      return res.content ?? '';
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('HTTP 404')) return '';
      throw err;
    }
  }

  static async upsertMemo(boxName: string, content: string): Promise<void> {
    await api.put<ServerCoachMemoResponse>(
      `/api/v1/coach-memos/${encodeURIComponent(boxName)}`,
      { content }
    );
  }
}
