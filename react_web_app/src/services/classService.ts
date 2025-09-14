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
import { extractDateTimeFromDocKey } from '../utils/classCalendarUtils';
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

export class ClassService {
  /**
   * 오늘자 수업 데이터 가져오기
   */
  static async getTodayClasses(box: string): Promise<ClassEvent[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      const path = `/box/${box}/class`;
      const q = query(
        collection(db, path),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      );
      
      const querySnap = await getDocs(q);
      const events: ClassEvent[] = [];
      
      querySnap.forEach((docSnap) => {
        try {
          const docKey = docSnap.id;
          const data = docSnap.data() as FirebaseClassData;
          
          const { year, month, day, startHour, startMin, endHour, endMin } = 
            extractDateTimeFromDocKey(docKey);
          
          const event: ClassEvent = {
            id: docKey,
            title: `${box} WOD`,
            start: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${startHour}:${startMin}:00+09:00`,
            end: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${endHour}:${endMin}:00+09:00`,
            extendedProps: {
              coach: data.coach,
              cap: data.cap,
              reserved: data.reserved || [],
            }
          };
          
          events.push(event);
        } catch (error) {
          console.error('Error processing document:', docSnap.id, error);
        }
      });
      
      // 시간순으로 정렬
      return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    } catch (error) {
      console.error('Error fetching today classes:', error);
      throw error;
    }
  }

  /**
   * 월별 수업 데이터 가져오기
   */
  static async getMonthlyClasses(box: string): Promise<ClassEvent[]> {
    try {
      const today = new Date();
      const startDt = new Date();
      const endDt = new Date();
      
      startDt.setDate(today.getDate() - 1);
      endDt.setDate(startDt.getDate() + 30);
      
      const path = `/box/${box}/class`;
      const q = query(
        collection(db, path),
        where('date', '>=', startDt),
        where('date', '<', endDt)
      );
      
      const querySnap = await getDocs(q);
      const events: ClassEvent[] = [];
      
      querySnap.forEach((docSnap) => {
        try {
          const docKey = docSnap.id;
          const data = docSnap.data() as FirebaseClassData;
          
          const { year, month, day, startHour, startMin, endHour, endMin } = 
            extractDateTimeFromDocKey(docKey);
          
          const event: ClassEvent = {
            id: docKey,
            title: `${box} WOD`,
            start: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${startHour}:${startMin}:00+09:00`,
            end: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${endHour}:${endMin}:00+09:00`,
            extendedProps: {
              coach: data.coach,
              cap: data.cap,
              reserved: data.reserved || [],
            }
          };
          
          events.push(event);
        } catch (error) {
          console.error('Error processing document:', docSnap.id, error);
        }
      });
      
      return events;
    } catch (error) {
      console.error('Error fetching monthly classes:', error);
      throw error;
    }
  }

  /**
   * 특정 수업 데이터 가져오기
   */
  static async getClass(box: string, date: string, time: string): Promise<FirebaseClassData | null> {
    try {
      const path = `/box/${box}/class/${date}/time`;
      const docSnap = await getDoc(doc(db, path, time));
      
      if (docSnap.exists()) {
        return docSnap.data() as FirebaseClassData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching class:', error);
      throw error;
    }
  }

  /**
   * 새 수업 생성
   */
  static async setClass(payload: ClassPayload): Promise<void> {
    try {
      const { docKey, box, coach, cap } = payload;
      const { year, month, day, startHour, startMin } = extractDateTimeFromDocKey(docKey);
      
      const path = `/box/${box}/class`;
      const date = new Date(`${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`);
      
      await setDoc(doc(db, path, docKey), {
        cap: cap,
        coach: coach,
        date: Timestamp.fromDate(date),
        reserved: [],
      });
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  }

  /**
   * 수업 정보 업데이트
   */
  static async updateClass(payload: ClassPayload): Promise<void> {
    try {
      const { docKey, box, coach, cap, reserved } = payload;
      const { year, month, day, startHour, startMin } = extractDateTimeFromDocKey(docKey);
      
      const path = `/box/${box}/class`;
      const date = new Date(`${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`);
      
      await updateDoc(doc(db, path, docKey), {
        cap: cap,
        coach: coach,
        date: Timestamp.fromDate(date),
        reserved: reserved || [],
      });
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  }

  /**
   * 수업 삭제
   */
  static async deleteClass(docKey: string, box: string): Promise<void> {
    try {
      const path = `/box/${box}/class`;
      await deleteDoc(doc(db, path, docKey));
    } catch (error) {
      console.error('Error deleting class:', error);
      throw error;
    }
  }

  /**
   * docKey 생성 헬퍼 함수
   */
  static generateDocKey(date: Date, startTime: string, endTime: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const [startHour, startMin] = startTime.split(':');
    const [endHour, endMin] = endTime.split(':');
    
    return `${year}${month}${day}${startHour}${startMin}${endHour}${endMin}`;
  }
} 