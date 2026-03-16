import {
  getDocs,
  collection,
  query,
  getDoc,
  doc,
  setDoc,
  where,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { extractDateTimeFromDocKey } from '../models/classModel';
import { ClassEvent } from '../types/class';

export interface FirebaseClassData {
  cap: number;
  coach: string;
  date: Timestamp;
  reserved: string[];
}

export interface ClassPayload {
  docKey: string;
  box: string;
  coach: string;
  cap: number;
  reserved?: string[];
}

export class ClassRepository {
  static async getTodayClasses(box: string): Promise<ClassEvent[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, `/box/${box}/class`),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      );

      const snap = await getDocs(q);
      const events: ClassEvent[] = [];

      snap.forEach(docSnap => {
        try {
          const docKey = docSnap.id;
          const data = docSnap.data() as FirebaseClassData;
          const { year, month, day, startHour, startMin, endHour, endMin } = extractDateTimeFromDocKey(docKey);

          events.push({
            id: docKey,
            title: `${box} WOD`,
            start: `${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`,
            end: `${year}-${month}-${day}T${endHour}:${endMin}:00+09:00`,
            extendedProps: { coach: data.coach, cap: data.cap, reserved: data.reserved || [] }
          });
        } catch (err) {
          console.error('Error processing class document:', docSnap.id, err);
        }
      });

      return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    } catch (error) {
      console.error('Error fetching today classes:', error);
      throw error;
    }
  }

  static async getMonthlyClasses(box: string, startDate: Date, endDate: Date): Promise<ClassEvent[]> {
    try {
      const startDt = new Date(startDate);
      startDt.setHours(0, 0, 0, 0);
      const endDt = new Date(endDate);
      endDt.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, `/box/${box}/class`),
        where('date', '>=', Timestamp.fromDate(startDt)),
        where('date', '<=', Timestamp.fromDate(endDt))
      );

      const snap = await getDocs(q);
      const events: ClassEvent[] = [];

      snap.forEach(docSnap => {
        try {
          const docKey = docSnap.id;
          const data = docSnap.data() as FirebaseClassData;
          const { year, month, day, startHour, startMin, endHour, endMin } = extractDateTimeFromDocKey(docKey);

          events.push({
            id: docKey,
            title: `${box} WOD`,
            start: `${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`,
            end: `${year}-${month}-${day}T${endHour}:${endMin}:00+09:00`,
            extendedProps: { coach: data.coach, cap: data.cap, reserved: data.reserved || [] }
          });
        } catch (err) {
          console.error('Error processing class document:', docSnap.id, err);
        }
      });

      return events;
    } catch (error) {
      console.error('Error fetching monthly classes:', error);
      throw error;
    }
  }

  static async getClass(box: string, date: string, time: string): Promise<FirebaseClassData | null> {
    try {
      const snap = await getDoc(doc(db, `/box/${box}/class/${date}/time`, time));
      return snap.exists() ? (snap.data() as FirebaseClassData) : null;
    } catch (error) {
      console.error('Error fetching class:', error);
      throw error;
    }
  }

  static async setClass(payload: ClassPayload): Promise<void> {
    try {
      const { docKey, box, coach, cap } = payload;
      const { year, month, day, startHour, startMin } = extractDateTimeFromDocKey(docKey);
      const date = new Date(`${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`);

      await setDoc(doc(db, `/box/${box}/class`, docKey), {
        cap,
        coach,
        date: Timestamp.fromDate(date),
        reserved: []
      });
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  }

  static async updateClass(payload: ClassPayload): Promise<void> {
    try {
      const { docKey, box, coach, cap, reserved } = payload;
      const { year, month, day, startHour, startMin } = extractDateTimeFromDocKey(docKey);
      const date = new Date(`${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`);

      await updateDoc(doc(db, `/box/${box}/class`, docKey), {
        cap,
        coach,
        date: Timestamp.fromDate(date),
        reserved: reserved || []
      });
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  }

  static async deleteClass(docKey: string, box: string): Promise<void> {
    try {
      await deleteDoc(doc(db, `/box/${box}/class`, docKey));
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  }
}
