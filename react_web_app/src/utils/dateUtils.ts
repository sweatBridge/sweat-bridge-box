/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환합니다.
 * @param date Date 객체 또는 null
 * @returns YYYY-MM-DD 형식의 문자열, date가 null이면 빈 문자열
 */
export const formatDateToString = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  // 연도가 유효하지 않으면 빈 문자열 반환
  if (year < 1000 || year > 9999) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  // 연도를 4자리 문자열로 명시적으로 변환
  const yearStr = String(year).padStart(4, '0');
  return `${yearStr}-${month}-${day}`;
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
  
  const yearStr = parts[0].trim();
  const monthStr = parts[1].trim();
  const dayStr = parts[2].trim();
  
  // 연도가 비어있거나 4자리가 아니면 null 반환 (부분 입력 방지)
  if (!yearStr || yearStr.length !== 4) return null;
  
  const year = parseInt(yearStr, 10);
  
  // 연도가 유효한 숫자인지 확인
  if (isNaN(year)) return null;
  
  // 연도 유효성 검사 (1000-9999 범위)
  if (year < 1000 || year > 9999) return null;
  
  // 월과 일이 비어있거나 "00"이면 기본값 사용 (부분 입력 허용)
  // 하지만 완전한 날짜만 유효한 Date 객체로 변환
  const month = monthStr && monthStr !== '00' ? parseInt(monthStr, 10) : 0;
  const day = dayStr && dayStr !== '00' ? parseInt(dayStr, 10) : 0;
  
  // 월이나 일이 "00"이면 완전한 날짜가 아니므로 null 반환 (상태 업데이트 방지)
  // 이렇게 하면 사용자가 입력하는 동안 상태가 초기화되지 않음
  if (month === 0 || day === 0) return null;
  
  // 유효한 숫자인지 확인
  if (isNaN(month) || isNaN(day)) return null;
  
  // 월 유효성 검사 (1-12)
  if (month < 1 || month > 12) return null;
  
  // 일 유효성 검사 (1-31)
  if (day < 1 || day > 31) return null;
  
  // 로컬 시간대 기준으로 Date 생성 (00:00:00) - 월은 0부터 시작하므로 -1
  const date = new Date(year, month - 1, day);
  
  // 생성된 날짜가 입력한 값과 일치하는지 확인 (예: 2월 30일 같은 경우)
  if (date.getFullYear() !== year || date.getMonth() !== (month - 1) || date.getDate() !== day) {
    return null;
  }
  
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
 * 두 날짜 사이의 일수를 계산합니다. (시작일과 종료일 모두 포함)
 * 예: 01.04 ~ 01.05 = 2일
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜
 * @returns 일수 (endDate - startDate + 1), 시작일과 종료일 모두 포함
 */
export const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / msPerDay) + 1;
};

