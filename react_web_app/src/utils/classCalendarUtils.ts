import { ClassEvent } from '../types/class';

let eventGuid = 0;

export function createEventId() {
  return String(eventGuid++);
}

// 초기 이벤트 데이터 (예시)
export const INITIAL_EVENTS: ClassEvent[] = [
  {
    id: createEventId(),
    title: 'CrossFit WOD',
    start: '2025-09-15T09:00:00',
    end: '2025-09-15T10:00:00',
    extendedProps: {
      coach: '김코치',
      cap: 12,
      reserved: ['홍길동', '김영희']
    }
  },
  {
    id: createEventId(),
    title: 'Olympic Lifting',
    start: '2025-09-16T09:00:00',
    end: '2025-09-16T10:00:00',
    extendedProps: {
      coach: '박코치',
      cap: 8,
      reserved: ['이철수']
    }
  }
];

// 날짜와 시간 추출 함수
export function extractDateAndTime(dateTimeString: string) {
  const date = new Date(dateTimeString);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  return { dateStr, timeStr };
}

// 날짜 시간 포맷팅 함수
export function formatDateTime(dateTimeString: string) {
  const date = new Date(dateTimeString);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

// 오늘 날짜 문자열 (사용하지 않음 - 경고 방지용 주석)
// export function todayStr() {
//   return new Date().toISOString().replace(/T.*$/, ''); // YYYY-MM-DD
// }

// 날짜 더하기 함수 (사용하지 않음 - 경고 방지용 주석)
// export function addDate(dateStr: string, days: number) {
//   const date = new Date(dateStr + 'T00:00:00');
//   date.setDate(date.getDate() + days);
//   return date.toISOString().replace(/T.*$/, '');
// }

// docKey에서 날짜와 시간 정보 추출
export function extractDateTimeFromDocKey(docKey: string) {
  // docKey 형식: YYYYMMDDHHMMHHMM (예: 202309081000110)
  const year = docKey.substring(0, 4);
  const month = docKey.substring(4, 6);
  const day = docKey.substring(6, 8);
  const startHour = docKey.substring(8, 10);
  const startMin = docKey.substring(10, 12);
  const endHour = docKey.substring(12, 14);
  const endMin = docKey.substring(14, 16);

  return {
    year,
    month,
    day,
    startHour,
    startMin,
    endHour,
    endMin
  };
} 