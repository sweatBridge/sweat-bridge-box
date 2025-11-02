import { Timestamp } from 'firebase/firestore';

export interface MembershipData {
  type: 'periodPass' | 'countPass';
  startDate?: Timestamp | { seconds: number };
  endDate?: Timestamp | { seconds: number };
  count?: number;
  days?: number;
  // 새로운 구조 지원
  period?: {
    startDate?: Timestamp | { seconds: number };
    endDate?: Timestamp | { seconds: number };
  };
  quota?: {
    total?: number;
    used?: number;
    remaining?: number;
  };
}

export interface MembershipInfo {
  type: string;
  expiryDate: string;
  remainingDays: string | number;
  remainingVisits: string | number;
}

/**
 * 현재 유효한 회원권들을 필터링 (레거시 및 새 구조 모두 지원)
 */
export function getCurrentMemberships(memberships: MembershipData[]): MembershipData[] {
  if (!memberships || !Array.isArray(memberships)) {
    return [];
  }
  
  return memberships.filter(membership => {
    // 새로운 구조 체크
    if (membership.period) {
      const startDate = membership.period.startDate && membership.period.startDate.seconds 
        ? new Date(membership.period.startDate.seconds * 1000) 
        : null;
      const endDate = membership.period.endDate && membership.period.endDate.seconds 
        ? new Date(membership.period.endDate.seconds * 1000) 
        : null;
      
      if (!startDate || !endDate) {
        return false;
      }
      
      const today = new Date();
      return today >= startDate && today <= endDate;
    }
    
    // 레거시 구조 체크
    const startDate = membership.startDate && membership.startDate.seconds 
      ? new Date(membership.startDate.seconds * 1000) 
      : null;
    const endDate = membership.endDate && membership.endDate.seconds 
      ? new Date(membership.endDate.seconds * 1000) 
      : null;
    
    // startDate나 endDate가 유효하지 않으면 필터에서 제외
    if (!startDate || !endDate) {
      console.warn('유효하지 않은 날짜 데이터:', membership);
      return false;
    }
  
    const today = new Date();
    return today >= startDate && today <= endDate;
  });
}

/**
 * Timestamp를 문자열로 변환
 */
export function convertTimestampToString(timestamp: Timestamp | { seconds: number }): string {
  if (!timestamp || !timestamp.seconds) return '-';
  
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 회원권 정보를 계산하여 반환 (레거시 및 새 구조 모두 지원)
 */
export function getMembershipInfo(
  currentMemberships: MembershipData[], 
  futureMemberships: MembershipData[] = []
): MembershipInfo {
  const currentMembership = currentMemberships?.[0];
  
  // 현재 회원권이 없고 미래 회원권이 있는 경우
  if (!currentMembership && futureMemberships && futureMemberships.length > 0) {
    return {
      type: '사용 예정',
      expiryDate: '-',
      remainingDays: '-',
      remainingVisits: '-'
    };
  }

  // 현재 회원권이 없는 경우
  if (!currentMembership) {
    return {
      type: '없음',
      expiryDate: '만료됨',
      remainingDays: 0,
      remainingVisits: 0
    };
  }

  // 등록 타입
  let type = '-';
  if (currentMembership.type) {
    switch(currentMembership.type) {
      case 'periodPass':
        type = '기간권';
        break;
      case 'countPass':
        type = '횟수권';
        break;
      default:
        type = currentMembership.type;
    }
  }

  // 날짜 추출 (새 구조 우선, 레거시 폴백)
  const endDateTimestamp = currentMembership.period?.endDate || currentMembership.endDate;

  // 만료 일자
  const expiryDate = endDateTimestamp 
    ? convertTimestampToString(endDateTimestamp) 
    : '-';

  // 잔여 기간 계산
  let remainingDays: string | number = '-';
  if (endDateTimestamp && endDateTimestamp.seconds) {
    const today = new Date();
    const endDate = new Date(endDateTimestamp.seconds * 1000);
    const diff = endDate.getTime() - today.getTime();
    
    if (diff > 0) {
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      remainingDays = days;
    } else {
      remainingDays = 0;
    }
  }

  // 잔여 횟수 계산 (새 구조 우선, 레거시 폴백)
  let remainingVisits: string | number = '-';
  if (currentMembership.type === 'periodPass') {
    remainingVisits = '∞';
  } else if (currentMembership.type === 'countPass') {
    if (currentMembership.quota?.remaining !== undefined) {
      remainingVisits = currentMembership.quota.remaining;
    } else if (currentMembership.count !== undefined) {
      remainingVisits = currentMembership.count;
    }
  }

  return {
    type,
    expiryDate,
    remainingDays,
    remainingVisits
  };
}

/**
 * 미래 회원권들을 필터링 (시작일이 미래인 것들) - 레거시 및 새 구조 지원
 */
export function getFutureMemberships(memberships: MembershipData[]): MembershipData[] {
  if (!memberships || !Array.isArray(memberships)) {
    return [];
  }
  
  return memberships.filter(membership => {
    // 새 구조 우선, 레거시 폴백
    const startDateTimestamp = membership.period?.startDate || membership.startDate;
    const startDate = startDateTimestamp && startDateTimestamp.seconds 
      ? new Date(startDateTimestamp.seconds * 1000) 
      : null;
    
    if (!startDate) {
      return false;
    }
  
    const today = new Date();
    return startDate > today;
  });
}

/**
 * 만료된 회원권들을 필터링 - 레거시 및 새 구조 지원
 */
export function getExpiredMemberships(memberships: MembershipData[]): MembershipData[] {
  if (!memberships || !Array.isArray(memberships)) {
    return [];
  }
  
  return memberships.filter(membership => {
    // 새 구조 우선, 레거시 폴백
    const endDateTimestamp = membership.period?.endDate || membership.endDate;
    const endDate = endDateTimestamp && endDateTimestamp.seconds 
      ? new Date(endDateTimestamp.seconds * 1000) 
      : null;
    
    if (!endDate) {
      return false;
    }
  
    const today = new Date();
    return endDate < today;
  });
} 