import { Timestamp } from 'firebase/firestore';
import { api } from '../../data/apiClient';
import { FirebaseClassData, FirebaseClassDocument } from '../classRepository';

interface ServerClassResponse {
  id: number;
  box_name: string;
  doc_key: string;
  class_date: string;
  start_time: string;
  end_time: string;
  coach: string;
  cap: number;
  reserved_count: number;
  created_at: string;
}

interface ServerClassCreate {
  box_name: string;
  doc_key: string;
  class_date: string;
  start_time: string;
  end_time: string;
  coach: string;
  cap: number;
}

export class ServerClassRepository {
  static async getClassesByMonth(
    boxName: string,
    year: number,
    month: number
  ): Promise<FirebaseClassDocument[]> {
    const classes = await api.get<ServerClassResponse[]>(
      `/api/v1/classes/by-month?box_name=${encodeURIComponent(boxName)}&year=${year}&month=${month}`
    );
    return classes.map((c) => ({
      docKey: c.doc_key,
      data: {
        cap: c.cap,
        coach: c.coach,
        date: Timestamp.fromDate(new Date(c.class_date)),
        reserved: []
      } as FirebaseClassData
    }));
  }

  static async createClass(payload: ServerClassCreate): Promise<ServerClassResponse> {
    return api.post<ServerClassResponse>('/api/v1/classes', payload);
  }

  static async findClassIdByDocKey(boxName: string, docKey: string): Promise<number | null> {
    const date = docKeyToDate(docKey);
    if (!date) return null;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const classes = await api.get<ServerClassResponse[]>(
      `/api/v1/classes/by-month?box_name=${encodeURIComponent(boxName)}&year=${year}&month=${month}`
    );
    return classes.find((c) => c.doc_key === docKey)?.id ?? null;
  }

  static async updateClassById(id: number, payload: Partial<Pick<ServerClassCreate, 'class_date' | 'start_time' | 'end_time' | 'coach' | 'cap'>>): Promise<void> {
    await api.patch(`/api/v1/classes/${id}`, payload);
  }

  static async getClassesByRange(
    boxName: string,
    start: string,
    end: string
  ): Promise<FirebaseClassDocument[]> {
    const classes = await api.get<ServerClassResponse[]>(
      `/api/v1/classes/by-range?box_name=${encodeURIComponent(boxName)}&start=${start}&end=${end}`
    );
    return classes.map((c) => ({
      docKey: c.doc_key,
      data: {
        cap: c.cap,
        coach: c.coach,
        date: Timestamp.fromDate(new Date(c.class_date)),
        reserved: []
      } as FirebaseClassData
    }));
  }

  static async deleteClassById(id: number): Promise<void> {
    await api.delete(`/api/v1/classes/${id}`);
  }
}

function docKeyToDate(docKey: string): Date | null {
  // format: YYYYMMDDHHMM_HHMM  e.g. 202605251100_1200
  const match = docKey.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
}
