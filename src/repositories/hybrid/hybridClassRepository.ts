import { serverRead, serverWrite } from '../../data/apiClient';
import { ClassPayload, ClassRepository, FirebaseClassData, FirebaseClassDocument } from '../classRepository';
import { ServerClassRepository } from '../server/serverClassRepository';

export type { FirebaseClassData, ClassPayload, FirebaseClassDocument };

export class HybridClassRepository {
  // ---- Server-first reads ----

  static async getClassesInRange(box: string, startDate: Date, endDate: Date): Promise<FirebaseClassDocument[]> {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const serverDocs = await serverRead(
      () => ServerClassRepository.getClassesByRange(box, fmt(startDate), fmt(endDate)),
      `Class.getClassesInRange(${box})`
    );
    if (serverDocs && serverDocs.length > 0) return serverDocs;
    return ClassRepository.getClassesInRange(box, startDate, endDate);
  }

  // ---- Firebase-only reads ----

  static getClass(box: string, date: string, time: string): Promise<FirebaseClassData | null> {
    return ClassRepository.getClass(box, date, time);
  }

  // ---- Firebase primary + server fire-and-forget ----

  static async setClassDocument(box: string, docKey: string, data: FirebaseClassData): Promise<void> {
    await ClassRepository.setClassDocument(box, docKey, data);
    serverWrite(async () => {
      const classDate = data.date.toDate();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${classDate.getFullYear()}-${pad(classDate.getMonth() + 1)}-${pad(classDate.getDate())}T${pad(classDate.getHours())}:${pad(classDate.getMinutes())}:00`;
      const startTime = `${pad(classDate.getHours())}${pad(classDate.getMinutes())}`;
      const endTimeMatch = docKey.match(/_(\d{4})$/);
      const endTime = endTimeMatch ? endTimeMatch[1] : startTime;

      await ServerClassRepository.createClass({
        box_name: box,
        doc_key: docKey,
        class_date: dateStr,
        start_time: startTime,
        end_time: endTime,
        coach: data.coach,
        cap: data.cap
      });
    }, `Class.setClassDocument(${docKey})`);
  }

  static async updateClassDocument(box: string, docKey: string, data: FirebaseClassData): Promise<void> {
    await ClassRepository.updateClassDocument(box, docKey, data);
    serverWrite(async () => {
      const id = await ServerClassRepository.findClassIdByDocKey(box, docKey);
      if (id === null) return;
      const classDate = data.date.toDate();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${classDate.getFullYear()}-${pad(classDate.getMonth() + 1)}-${pad(classDate.getDate())}T${pad(classDate.getHours())}:${pad(classDate.getMinutes())}:00`;
      const startTime = `${pad(classDate.getHours())}${pad(classDate.getMinutes())}`;
      const endTimeMatch = docKey.match(/_(\d{4})$/);
      const endTime = endTimeMatch ? endTimeMatch[1] : startTime;
      await ServerClassRepository.updateClassById(id, {
        class_date: dateStr,
        start_time: startTime,
        end_time: endTime,
        coach: data.coach,
        cap: data.cap
      });
    }, `Class.updateClassDocument(${docKey})`);
  }

  // ---- Firebase primary + server fire-and-forget ----

  static async deleteClassDocument(docKey: string, box: string): Promise<void> {
    await ClassRepository.deleteClassDocument(docKey, box);
    serverWrite(async () => {
      const id = await ServerClassRepository.findClassIdByDocKey(box, docKey);
      if (id !== null) await ServerClassRepository.deleteClassById(id);
    }, `Class.deleteClassDocument(${docKey})`);
  }
}
