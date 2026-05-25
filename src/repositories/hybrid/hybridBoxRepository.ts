import { serverRead, serverWrite } from '../../data/apiClient';
import { BoxInfo } from '../../types/box';
import { BoxRepository } from '../boxRepository';
import { ServerBoxRepository } from '../server/serverBoxRepository';

export class HybridBoxRepository {
  // ---- Server-first read ----

  static async getBoxInfo(boxName: string): Promise<BoxInfo | null> {
    const serverBox = await serverRead(
      () => ServerBoxRepository.getBoxInfo(boxName),
      `Box.getBoxInfo(${boxName})`
    );
    if (serverBox) return serverBox;
    return BoxRepository.getBoxInfo(boxName);
  }

  // ---- Firebase primary + server fire-and-forget ----

  static async saveBoxInfo(boxInfo: BoxInfo): Promise<void> {
    await BoxRepository.saveBoxInfo(boxInfo);
    serverWrite(
      () => ServerBoxRepository.updateBox(boxInfo.boxName, {
        email: boxInfo.email ?? null,
        representative: boxInfo.representative ?? null,
        phone: boxInfo.phone ?? null,
        zone_code: boxInfo.address?.zoneCode ?? null,
        road_address: boxInfo.address?.roadAddress ?? null,
        detail_address: boxInfo.address?.detailAddress ?? null,
        description: boxInfo.description ?? null,
        status: boxInfo.status ?? null
      }),
      `Box.saveBoxInfo(${boxInfo.boxName})`
    );
  }

  // ---- Firebase-only (server manages member_count separately) ----

  static adjustMemberCount(boxName: string, delta: number): Promise<void> {
    return BoxRepository.adjustMemberCount(boxName, delta);
  }
}
