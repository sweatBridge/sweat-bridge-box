import { Timestamp } from 'firebase/firestore';
import { extractDateTimeFromDocKey, formatDateTime, generateDocKey } from '../models/classModel';
import { ClassPayload, ClassRepository, FirebaseClassData, FirebaseClassDocument } from '../repositories/classRepository';
import { ClassEvent } from '../types/class';

export class ClassService {
  /**
   * 선택한 날짜와 시각 범위를 기반으로 클래스 문서 키를 생성합니다.
   */
  static generateDocKey = generateDocKey;

  /**
   * 클래스 문서 키에서 날짜와 시각 정보를 추출합니다.
   */
  static extractDateTimeFromDocKey = extractDateTimeFromDocKey;

  /**
   * ISO 날짜 문자열을 화면용 시각 문자열로 포맷합니다.
   */
  static formatDateTime = formatDateTime;

  /**
   * 오늘 범위의 클래스 목록을 조회합니다.
   *
   * @param box 박스 이름
   * @returns 시간순으로 정렬된 오늘의 클래스 이벤트 목록
   */
  static async getTodayClasses(box: string): Promise<ClassEvent[]> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getClassesInRange(box, startOfDay, endOfDay, true);
  }

  /**
   * 지정한 기간의 클래스 목록을 조회합니다.
   *
   * @param box 박스 이름
   * @param startDate 조회 시작일
   * @param endDate 조회 종료일
   * @returns 기간 내 클래스 이벤트 목록
   */
  static async getMonthlyClasses(box: string, startDate: Date, endDate: Date): Promise<ClassEvent[]> {
    const startDt = new Date(startDate);
    startDt.setHours(0, 0, 0, 0);

    const endDt = new Date(endDate);
    endDt.setHours(23, 59, 59, 999);

    return this.getClassesInRange(box, startDt, endDt, false);
  }

  /**
   * 레거시 경로 기준으로 특정 클래스 문서를 조회합니다.
   *
   * @param box 박스 이름
   * @param date 날짜 경로
   * @param time 시간 경로
   * @returns 클래스 문서 또는 `null`
   */
  static async getClass(box: string, date: string, time: string): Promise<FirebaseClassData | null> {
    return ClassRepository.getClass(box, date, time);
  }

  /**
   * 새 클래스 문서를 생성합니다.
   *
   * @param payload 생성할 클래스 정보
   */
  static async setClass(payload: ClassPayload): Promise<void> {
    const { docKey, box, coach, cap } = payload;
    const date = this.createClassTimestamp(docKey);

    await ClassRepository.setClassDocument(box, docKey, {
      cap,
      coach,
      date,
      reserved: []
    });
  }

  /**
   * 기존 클래스 문서를 수정합니다.
   *
   * @param payload 수정할 클래스 정보
   */
  static async updateClass(payload: ClassPayload): Promise<void> {
    const { docKey, box, coach, cap, reserved } = payload;
    const date = this.createClassTimestamp(docKey);

    await ClassRepository.updateClassDocument(box, docKey, {
      cap,
      coach,
      date,
      reserved: reserved || []
    });
  }

  /**
   * 클래스 문서를 삭제합니다.
   *
   * @param docKey 삭제할 클래스 문서 키
   * @param box 박스 이름
   */
  static async deleteClass(docKey: string, box: string): Promise<void> {
    return ClassRepository.deleteClassDocument(docKey, box);
  }

  /**
   * 지정한 기간의 클래스 문서를 조회하고 이벤트로 변환합니다.
   *
   * @param box 박스 이름
   * @param startDate 조회 시작 시각
   * @param endDate 조회 종료 시각
   * @param sortByStart 시작 시각 기준 정렬 여부
   * @returns 화면 표시용 클래스 이벤트 목록
   */
  private static async getClassesInRange(
    box: string,
    startDate: Date,
    endDate: Date,
    sortByStart: boolean
  ): Promise<ClassEvent[]> {
    try {
      const documents = await ClassRepository.getClassesInRange(box, startDate, endDate);
      const events = documents
        .map((document) => this.toClassEvent(document, box))
        .filter((event): event is ClassEvent => event !== null);

      return sortByStart
        ? events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        : events;
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  }

  /**
   * 클래스 문서를 화면용 이벤트로 변환합니다.
   *
   * @param document Firebase 클래스 문서
   * @param box 박스 이름
   * @returns 변환된 이벤트 또는 `null`
   */
  private static toClassEvent(document: FirebaseClassDocument, box: string): ClassEvent | null {
    try {
      const { year, month, day, startHour, startMin, endHour, endMin } = extractDateTimeFromDocKey(document.docKey);

      return {
        id: document.docKey,
        title: `${box} WOD`,
        start: `${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`,
        end: `${year}-${month}-${day}T${endHour}:${endMin}:00+09:00`,
        extendedProps: {
          coach: document.data.coach,
          cap: document.data.cap,
          reserved: document.data.reserved || []
        }
      };
    } catch (error) {
      console.error('Error processing class document:', document.docKey, error);
      return null;
    }
  }

  /**
   * 클래스 문서 키를 기반으로 저장용 Timestamp를 생성합니다.
   *
   * @param docKey 클래스 문서 키
   * @returns 저장용 Timestamp
   */
  private static createClassTimestamp(docKey: string): Timestamp {
    const { year, month, day, startHour, startMin } = extractDateTimeFromDocKey(docKey);
    const date = new Date(`${year}-${month}-${day}T${startHour}:${startMin}:00+09:00`);
    return Timestamp.fromDate(date);
  }
}

export type { ClassPayload };
