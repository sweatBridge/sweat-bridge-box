// 멤버십 관련 유틸리티 함수들

// 고유 키 생성 함수 (8자 해시)
export const generateUniqueKey = (email) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, '');
  
  // 문자열 조합
  const combined = `${timestamp}_${cleanEmail}_${random}`;
  
  // 간단한 해시 함수로 8자 문자열 생성
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  
  // 절댓값을 36진수로 변환하고 8자로 제한
  const hashStr = Math.abs(hash).toString(36);
  return hashStr.substring(0, 8).padEnd(8, '0');
};
