/**
 * 애플리케이션에서 사용하는 그라데이션 상수들
 */
export const Gradients = {
  // 메인 브랜드 그라데이션
  primary: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
  
  // 호버 상태용 그라데이션 (조금 더 진한 색상)
  primaryHover: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
  
  // 비활성 상태용 그라데이션 (조금 더 연한 색상)
  primaryLight: 'linear-gradient(135deg, #60A5FA 0%, #93C5FD 100%)',
} as const;

export default Gradients; 