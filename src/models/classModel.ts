/**
 * docKey 생성
 * 형식: YYYYMMDDHHMMHHMM
 * 예: 2023년 09월 08일 10:00~11:00 → "202309081000110"
 */
export function generateDocKey(date: Date, startTime: string, endTime: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const [startHour, startMin] = startTime.split(':');
  const [endHour, endMin] = endTime.split(':');

  return `${year}${month}${day}${startHour}${startMin}${endHour}${endMin}`;
}

/**
 * docKey에서 날짜/시간 파싱
 */
export function extractDateTimeFromDocKey(docKey: string) {
  return {
    year: docKey.substring(0, 4),
    month: docKey.substring(4, 6),
    day: docKey.substring(6, 8),
    startHour: docKey.substring(8, 10),
    startMin: docKey.substring(10, 12),
    endHour: docKey.substring(12, 14),
    endMin: docKey.substring(14, 16)
  };
}

/**
 * ISO 날짜 문자열에서 날짜/시간 분리
 */
export function extractDateAndTime(dateTimeString: string) {
  const date = new Date(dateTimeString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hours}:${minutes}`
  };
}

/**
 * 날짜 시간 포맷팅 (YYYY.MM.DD HH:MM)
 */
export function formatDateTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}
