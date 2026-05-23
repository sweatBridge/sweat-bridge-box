/**
 * 8자리 영어 대소문자와 숫자를 섞어서 고유 키 생성
 * @returns 8자리 랜덤 문자열
 */
export const generateMembershipKey = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  
  return result;
};