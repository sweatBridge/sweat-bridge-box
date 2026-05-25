import { Timestamp } from 'firebase/firestore';
import { api } from '../../data/apiClient';
import { RevenueData, RevenueYearData } from '../../types/revenue';

interface ServerRevenueResponse {
  id: number;
  box_name: string;
  year: number;
  month: number;
  transaction_id: string | null;
  assignee: string | null;
  payment_type: string;
  plan: string | null;
  price: string;
  real_name: string | null;
  member_email: string | null;
  type: string | null;
  refund_amount: string | null;
  created_at: string;
}

interface ServerRevenueCreate {
  box_name: string;
  year: number;
  month: number;
  transaction_id?: string;
  assignee?: string;
  payment_type: string;
  plan?: string;
  price: string;
  real_name?: string;
  member_email?: string;
  type?: string;
  refund_amount?: string;
}

function toRevenueYearData(revenues: ServerRevenueResponse[]): RevenueYearData {
  const result: RevenueYearData = {};
  for (const r of revenues) {
    const monthKey = r.month.toString();
    if (!result[monthKey]) result[monthKey] = {};
    const key = r.transaction_id ?? r.id.toString();
    result[monthKey][key] = {
      assignee: r.assignee ?? '',
      createdAt: Timestamp.fromDate(new Date(r.created_at)),
      id: r.member_email ?? '',
      paymentType: r.payment_type as RevenueData['paymentType'],
      plan: r.plan ?? '',
      price: r.price,
      realName: r.real_name ?? '',
      type: r.type ?? '',
      refundAmount: r.refund_amount ?? '0'
    };
  }
  return result;
}

export class ServerRevenueRepository {
  static async getRevenueYear(boxName: string, year: number): Promise<RevenueYearData> {
    const revenues = await api.get<ServerRevenueResponse[]>(
      `/api/v1/revenues/year?box_name=${encodeURIComponent(boxName)}&year=${year}`
    );
    return toRevenueYearData(revenues);
  }

  static async createRevenue(payload: ServerRevenueCreate): Promise<void> {
    await api.post('/api/v1/revenues', payload);
  }

  static async updateRevenueById(id: number, payload: Partial<ServerRevenueCreate>): Promise<void> {
    await api.patch(`/api/v1/revenues/${id}`, payload);
  }

  static async deleteRevenueById(id: number): Promise<void> {
    await api.delete(`/api/v1/revenues/${id}`);
  }

  static async findRevenueIdByKey(
    boxName: string,
    year: number,
    month: number,
    transactionId: string
  ): Promise<number | null> {
    const revenues = await api.get<ServerRevenueResponse[]>(
      `/api/v1/revenues/month?box_name=${encodeURIComponent(boxName)}&year=${year}&month=${month}`
    );
    const match = revenues.find((r) => r.transaction_id === transactionId);
    return match?.id ?? null;
  }
}
