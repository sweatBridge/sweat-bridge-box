import { api, serverRead, serverWrite } from '../../data/apiClient';
import { BoxInfo, BoxStatus } from '../../types/box';
import { AdminBoxRepository } from '../adminBoxRepository';
import { ServerBoxRepository } from '../server/serverBoxRepository';

interface ServerBoxListItem {
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
}

function toBoxInfo(b: ServerBoxListItem): BoxInfo {
  return {
    boxName: b.box_name,
    email: b.email ?? '',
    representative: b.representative ?? '',
    phone: b.phone ?? '',
    address: {
      zoneCode: b.zone_code ?? '',
      roadAddress: b.road_address ?? '',
      detailAddress: b.detail_address ?? ''
    },
    description: b.description ?? '',
    coaches: b.coaches.map((c) => ({ name: c.name, phone: c.phone ?? '', email: c.email ?? '' })),
    status: b.status as BoxInfo['status'],
    memberCount: b.member_count
  };
}

export class HybridAdminBoxRepository {
  // ---- Server-first read ----

  static async listAllBoxes(): Promise<BoxInfo[]> {
    const serverBoxes = await serverRead(
      async () => {
        const list = await api.get<ServerBoxListItem[]>('/api/v1/boxes?limit=200');
        return list.map(toBoxInfo);
      },
      'AdminBox.listAllBoxes'
    );
    if (serverBoxes && serverBoxes.length > 0) return serverBoxes;
    return AdminBoxRepository.listAllBoxes();
  }

  // ---- Firebase primary + server fire-and-forget ----

  static async updateBoxStatus(boxName: string, status: BoxStatus): Promise<void> {
    await AdminBoxRepository.updateBoxStatus(boxName, status);
    serverWrite(
      () => ServerBoxRepository.updateBox(boxName, { status }),
      `AdminBox.updateBoxStatus(${boxName})`
    );
  }

  static async createBox(boxInfo: BoxInfo): Promise<void> {
    await AdminBoxRepository.createBox(boxInfo);
    serverWrite(
      () => api.post('/api/v1/boxes', {
        box_name: boxInfo.boxName,
        email: boxInfo.email || null,
        representative: boxInfo.representative || null,
        phone: boxInfo.phone || null,
        zone_code: boxInfo.address?.zoneCode || null,
        road_address: boxInfo.address?.roadAddress || null,
        detail_address: boxInfo.address?.detailAddress || null,
        description: boxInfo.description || null,
        coaches: (boxInfo.coaches ?? []).map((c) => ({
          name: c.name,
          phone: c.phone || null,
          email: c.email || null
        }))
      }),
      `AdminBox.createBox(${boxInfo.boxName})`
    );
  }
}
