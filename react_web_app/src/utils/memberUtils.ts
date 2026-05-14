import { MembershipService } from '../services/membershipService';
import { formatPhoneNumber as formatPhoneNumberValue } from './phoneUtils';
import type { MemberLockerHistory } from '../types/member';

/**
 * 성별 텍스트 변환
 */
export const getGenderText = (gender: string): string => {
  switch(gender) {
    case 'M':
      return '남성';
    case 'F':
      return '여성';
    default:
      return '-';
  }
};

/**
 * 전화번호 포맷팅
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '-';
  return formatPhoneNumberValue(phone) || '-';
};

/**
 * 나이 계산
 */
export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * 회원권 상태 체크
 */
export const getMembershipStatus = (remainingDays: number): 'active' | 'warning' | 'expired' => {
  if (remainingDays <= 0) return 'expired';
  if (remainingDays <= 7) return 'warning';
  return 'active';
};

/**
 * 회원권 만료일 포맷팅
 */
export const formatExpiryDate = (dateString: string): string => {
  if (!dateString || dateString === '만료됨') return '만료됨';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

/**
 * 이메일 유효성 검사
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 회원 검색 필터링
 */
export const filterMembers = (members: any[], searchValue: string) => {
  if (!searchValue.trim()) return members;
  
  const searchLower = searchValue.toLowerCase();
  return members.filter(member =>
    member.realName.toLowerCase().includes(searchLower) ||
    member.nickName.toLowerCase().includes(searchLower) ||
    member.email.toLowerCase().includes(searchLower)
  );
};

/**
 * 회원권 타입을 한국어로 변환
 */
export const getMembershipTypeKorean = (type: string): string => {
  switch(type) {
    case 'periodPass':
      return '기간권';
    case 'countPass':
      return '횟수권';
    case '사용 예정':
      return '사용 예정';
    case '없음':
      return '없음';
    default:
      return type || '-';
  }
};

/**
 * 유효한 회원권을 가진 회원 수 계산
 */
export const getActiveMembersCount = (members: any[]): number => {
  return members.filter(member => {
    const remainingDays = typeof member.membershipInfo.remainingDays === 'string' 
      ? parseInt(member.membershipInfo.remainingDays) 
      : member.membershipInfo.remainingDays;
    return remainingDays > 0;
  }).length;
};

/**
 * 주의 회원 필터링
 * - 남은 일자 14일 이내 (타입과 상관없이 통일)
 * @deprecated MembershipService.filterWarningMembers를 직접 사용하세요
 */
export const getWarningMembers = (members: any[]): any[] => {
  return MembershipService.filterWarningMembers(members);
};

/**
 * 주의 회원 수 계산
 * @deprecated MembershipService.filterWarningMembers를 사용하세요
 */
export const getWarningMembersCount = (members: any[]): number => {
  return getWarningMembers(members).length;
};

/**
 * 락커 히스토리 상태 판단
 */
export type LockerHistoryStatus = 'active' | 'released' | 'expired';

/**
 * 락커 히스토리의 상태를 판단합니다
 * - released: releasedDate가 있으면 반납됨
 * - expired: releasedDate가 없고 endDate < 오늘이면 만료됨
 * - active: 반납도 안 됐고 만료도 안 됐으면 진행 중
 */
export const getLockerHistoryStatus = (history: MemberLockerHistory, today: Date = new Date()): LockerHistoryStatus => {
  if (history.releasedDate) {
    return 'released';
  }

  const endDate = new Date(history.endDate);
  endDate.setHours(23, 59, 59, 999);

  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  if (normalizedToday > endDate) {
    return 'expired';
  }

  return 'active';
};

/**
 * 락커 히스토리 상태를 한국어로 변환합니다
 */
export const getLockerHistoryStatusLabel = (status: LockerHistoryStatus): string => {
  switch (status) {
    case 'active':
      return '진행 중';
    case 'released':
      return '반납됨';
    case 'expired':
      return '만료됨';
    default:
      return '-';
  }
};

/**
 * 락커 히스토리가 반납되었는지 확인합니다
 */
export const isLockerReleased = (history: MemberLockerHistory): boolean => {
  return !!history.releasedDate;
};

/**
 * 락커 히스토리가 진행 중인지 확인합니다 (반납도 안 됐고 만료도 안 됨)
 */
export const isLockerActive = (history: MemberLockerHistory, today: Date = new Date()): boolean => {
  return getLockerHistoryStatus(history, today) === 'active';
}; 
