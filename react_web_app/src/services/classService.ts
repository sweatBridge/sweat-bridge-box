import { ClassRepository, ClassPayload, FirebaseClassData } from '../repositories/classRepository';
import { generateDocKey, extractDateTimeFromDocKey, formatDateTime } from '../models/classModel';
import { ClassEvent } from '../types/class';

export class ClassService {
  // Domain logic (from classModel)
  static generateDocKey = generateDocKey;
  static extractDateTimeFromDocKey = extractDateTimeFromDocKey;
  static formatDateTime = formatDateTime;

  // Firebase operations (from classRepository)
  static async getTodayClasses(box: string): Promise<ClassEvent[]> {
    return ClassRepository.getTodayClasses(box);
  }

  static async getMonthlyClasses(box: string, startDate: Date, endDate: Date): Promise<ClassEvent[]> {
    return ClassRepository.getMonthlyClasses(box, startDate, endDate);
  }

  static async getClass(box: string, date: string, time: string): Promise<FirebaseClassData | null> {
    return ClassRepository.getClass(box, date, time);
  }

  static async setClass(payload: ClassPayload): Promise<void> {
    return ClassRepository.setClass(payload);
  }

  static async updateClass(payload: ClassPayload): Promise<void> {
    return ClassRepository.updateClass(payload);
  }

  static async deleteClass(docKey: string, box: string): Promise<void> {
    return ClassRepository.deleteClass(docKey, box);
  }
}

export type { ClassPayload };
