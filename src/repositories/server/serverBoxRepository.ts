import { api } from '../../data/apiClient';
import { BoxInfo, Coach } from '../../types/box';

interface ServerBoxResponse {
  box_name: string;
  email: string | null;
  representative: string | null;
  phone: string | null;
  zone_code: string | null;
  road_address: string | null;
  detail_address: string | null;
  description: string | null;
  status: string;
  member_count: number;
  coaches: Array<{ name: string; phone: string | null; email: string | null }>;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ServerBoxUpdate {
  email?: string | null;
  representative?: string | null;
  phone?: string | null;
  zone_code?: string | null;
  road_address?: string | null;
  detail_address?: string | null;
  description?: string | null;
  status?: string | null;
}

function toBoxInfo(box: ServerBoxResponse): BoxInfo {
  return {
    boxName: box.box_name,
    email: box.email ?? '',
    representative: box.representative ?? '',
    phone: box.phone ?? '',
    address: {
      zoneCode: box.zone_code ?? '',
      roadAddress: box.road_address ?? '',
      detailAddress: box.detail_address ?? ''
    },
    description: box.description ?? '',
    coaches: box.coaches.map(
      (c): Coach => ({ name: c.name, phone: c.phone ?? '', email: c.email ?? '' })
    ),
    status: box.status as BoxInfo['status'],
    memberCount: box.member_count
  };
}

export class ServerBoxRepository {
  static async getBoxInfo(boxName: string): Promise<BoxInfo> {
    const box = await api.get<ServerBoxResponse>(`/api/v1/boxes/${encodeURIComponent(boxName)}`);
    return toBoxInfo(box);
  }

  static async updateBox(boxName: string, payload: ServerBoxUpdate): Promise<void> {
    await api.patch(`/api/v1/boxes/${encodeURIComponent(boxName)}`, payload);
  }
}
