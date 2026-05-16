/**
 * 전화번호를 숫자만 남긴 11자리 형태로 정규화합니다.
 */
export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(0, 11);
};

/**
 * 전화번호 표시 포맷을 반환합니다.
 * 저장값은 숫자만 유지하고, 화면에서는 하이픈을 붙여 표시합니다.
 */
export const formatPhoneNumber = (phone: string): string => {
  const numbers = normalizePhoneNumber(phone);
  if (!numbers) return '';

  if (numbers.length <= 3) {
    return numbers;
  }

  if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }

  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
};

/**
 * 기존 호출부 호환용 alias.
 */
export const getPhoneMask = (phone: string): string => formatPhoneNumber(phone);
