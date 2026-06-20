import { api } from '../../data/apiClient';
import { Locker } from '../../types/locker';

export interface ServerLockerResponse {
  id: number;
  box_name: string;
  number: number;
  state: string;
  user_email: string | null;
  real_name: string | null;
  phone: string | null;
  assignee: string | null;
  note: string | null;
  start_date: string | null;
  end_date: string | null;
  locker_key: string | null;
  price: string | null;
  payment_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerLockerAssign {
  user_email: string;
  real_name: string;
  phone?: string;
  assignee?: string;
  note?: string;
  start_date: string;
  end_date?: string;
  locker_key?: string;
  price?: string;
  payment_type?: string;
}

export class ServerLockerRepository {
  static async listLockers(boxName: string): Promise<ServerLockerResponse[]> {
    return api.get<ServerLockerResponse[]>(
      `/api/v1/lockers?box_name=${encodeURIComponent(boxName)}`
    );
  }

  static async getLockerMap(boxName: string): Promise<Record<string, Partial<Locker>>> {
    const map = await api.get<Record<string, ServerLockerResponse>>(
      `/api/v1/lockers?box_name=${encodeURIComponent(boxName)}&format=map`
    );
    return Object.fromEntries(
      Object.entries(map).map(([key, l]) => [key, serverLockerToPartial(l)])
    );
  }

  static async findLockerIdByNumber(boxName: string, number: number): Promise<number | null> {
    const lockers = await this.listLockers(boxName);
    return lockers.find((l) => l.number === number)?.id ?? null;
  }

  static async createLocker(payload: { box_name: string; number: number; state?: string }): Promise<void> {
    await api.post('/api/v1/lockers', { state: 'unused', ...payload });
  }

  static async assignLocker(lockerId: number, payload: ServerLockerAssign): Promise<void> {
    await api.post(`/api/v1/lockers/${lockerId}/assign`, payload);
  }

  static async releaseLocker(lockerId: number): Promise<void> {
    await api.post(`/api/v1/lockers/${lockerId}/release`, {});
  }

  static async updateLockerState(lockerId: number, state: 'unused' | 'na' | 'deleted'): Promise<void> {
    await api.patch(`/api/v1/lockers/${lockerId}`, { state });
  }
}

function serverLockerToPartial(l: ServerLockerResponse): Partial<Locker> {
  return {
    number: l.number,
    state: l.state as Locker['state'],
    id: l.user_email ?? '',
    realName: l.real_name ?? '',
    phone: l.phone ?? '',
    assignee: l.assignee ?? '',
    note: l.note ?? '',
    startDate: l.start_date ?? '',
    endDate: l.end_date ?? '',
    key: l.locker_key ?? undefined,
    price: l.price ?? undefined,
    paymentType: (l.payment_type as Locker['paymentType']) ?? undefined,
  };
}
