/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다.
 * @param date Date 객체 또는 null
 * @returns YYYY-MM-DD 형식의 문자열, date가 null이면 빈 문자열
 */
export const formatDateToString = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * YYYY-MM-DD 형식의 문자열을 Date 객체로 변환합니다.
 * 로컬 시간대 기준으로 00:00:00에 생성됩니다.
 * @param dateString YYYY-MM-DD 형식의 문자열
 * @returns Date 객체, 유효하지 않은 문자열이면 null
 */
export const parseStringToDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  // YYYY-MM-DD 형식 파싱
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 월은 0부터 시작
  const day = parseInt(parts[2], 10);
  
  // 로컬 시간대 기준으로 Date 생성 (00:00:00)
  const date = new Date(year, month, day);
  
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Date 객체를 한국어 형식으로 포맷합니다.
 * @param date Date 객체
 * @returns YYYY년 MM월 DD일 형식의 문자열
 */
export const formatDateToKorean = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * 두 날짜 사이의 일수를 계산합니다.
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 일수 (endDate - startDate), 올림 처리
 */
export const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / msPerDay);
};

