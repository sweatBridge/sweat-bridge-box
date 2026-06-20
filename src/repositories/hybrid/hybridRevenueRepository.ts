import { serverRead, serverWrite } from '../../data/apiClient';
import { RevenueData, RevenueYearData } from '../../types/revenue';
import { RevenueRepository, RevenueYearDocument } from '../revenueRepository';
import { ServerRevenueRepository } from '../server/serverRevenueRepository';

export type { RevenueYearDocument };

export class HybridRevenueRepository {
  // ---- Server-first read ----

  static async getRevenueYear(boxName: string, year: number): Promise<RevenueYearData> {
    const serverData = await serverRead(
      () => ServerRevenueRepository.getRevenueYear(boxName, year),
      `Revenue.getRevenueYear(${boxName}, ${year})`
    );
    if (serverData && Object.keys(serverData).length > 0) return serverData;
    return RevenueRepository.getRevenueYear(boxName, year);
  }

  static async getAllRevenueYears(boxName: string): Promise<RevenueYearDocument[]> {
    const serverYears = await serverRead(
      () => ServerRevenueRepository.getRevenueYears(boxName),
      `Revenue.getAllRevenueYears(${boxName})`
    );
    if (serverYears && serverYears.length > 0) {
      return Promise.all(
        serverYears.map(async (year) => ({
          year: String(year),
          data: await RevenueRepository.getRevenueYear(boxName, year),
        }))
      );
    }
    return RevenueRepository.getAllRevenueYears(boxName);
  }

  // ---- Firebase primary + server fire-and-forget ----

  static async setRevenueEntry(
    boxName: string,
    year: number,
    month: number,
    key: string,
    entry: RevenueData
  ): Promise<void> {
    await RevenueRepository.setRevenueEntry(boxName, year, month, key, entry);
    serverWrite(
      () => ServerRevenueRepository.createRevenue({
        box_name: boxName,
        year,
        month,
        transaction_id: key,
        assignee: entry.assignee || undefined,
        payment_type: entry.paymentType,
        plan: entry.plan || undefined,
        price: entry.price,
        real_name: entry.realName || undefined,
        member_email: entry.id || undefined,
        type: entry.type || undefined,
        refund_amount: entry.refundAmount || undefined
      }),
      `Revenue.setRevenueEntry(${key})`
    );
  }

  static async deleteRevenueEntry(
    boxName: string,
    year: number,
    month: number,
    key: string
  ): Promise<void> {
    await RevenueRepository.deleteRevenueEntry(boxName, year, month, key);
    serverWrite(async () => {
      const id = await ServerRevenueRepository.findRevenueIdByKey(boxName, year, month, key);
      if (id !== null) await ServerRevenueRepository.deleteRevenueById(id);
    }, `Revenue.deleteRevenueEntry(${key})`);
  }

  static async updateRevenueEntryField(
    boxName: string,
    year: number,
    month: number,
    key: string,
    field: string,
    value: unknown
  ): Promise<void> {
    await RevenueRepository.updateRevenueEntryField(boxName, year, month, key, field, value);
    serverWrite(async () => {
      const id = await ServerRevenueRepository.findRevenueIdByKey(boxName, year, month, key);
      if (id !== null) await ServerRevenueRepository.updateRevenueById(id, { [field]: value } as any);
    }, `Revenue.updateRevenueEntryField(${key}.${field})`);
  }

}
