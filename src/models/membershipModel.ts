import { UserMembership } from '../types/membership';
import { Timestamp } from 'firebase/firestore';

/**
 * 회원권이 현재 홀딩 중인지 확인 (오늘 날짜 기준)
 */
export function isHold(membership: any): boolean {
  if (!membership.holds || membership.holds.length === 0) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const latestHold = membership.holds[membership.holds.length - 1];
  const holdStart = new Date(latestHold.startDate);
  holdStart.setHours(0, 0, 0, 0);
  const holdEnd = new Date(latestHold.endDate);
  holdEnd.setHours(0, 0, 0, 0);

  return now >= holdStart && now <= holdEnd;
}

/**
 * 회원권이 미래에 홀딩 예정인지 확인
 */
export function isFutureHold(membership: any): boolean {
  if (!membership.holds || membership.holds.length === 0) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const latestHold = membership.holds[membership.holds.length - 1];
  const holdStart = new Date(latestHold.startDate);
  holdStart.setHours(0, 0, 0, 0);

  return holdStart > now;
}

/**
 * Firebase Timestamp/Date/string → Date 변환 헬퍼
 */
function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (value instanceof Timestamp || (value.toDate && typeof value.toDate === 'function')) return value.toDate();
  if (value.seconds && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * 회원권이 현재 유효하고 활성 상태인지 확인
 */
export function isValidActiveMembership(membership: UserMembership, now: Date = new Date()): boolean {
  if (!membership.period) return false;
  if (membership.deleted) return false;
  if (membership.refund?.isRefunded) return false;

  const startDate = toDate(membership.period.startDate);
  const endDate = toDate(membership.period.endDate);

  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;

  const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return startOnly <= nowOnly && endOnly >= nowOnly;
}

/**
 * 현재 유효한 회원권 배열 반환
 */
export function getCurrentMemberships(memberships: UserMembership[]): UserMembership[] {
  const now = new Date();
  return memberships.filter(m => isValidActiveMembership(m, now));
}

/** 주의 회원 기준 임계값 (14일) */
export function getWarningMemberThreshold(): number {
  return 14;
}

/**
 * 회원이 주의 회원인지 판단
 */
export function isWarningMember(member: any): boolean {
  const threshold = getWarningMemberThreshold();
  const remainingDays = member.membershipInfo?.remainingDays;

  if (remainingDays === '-' || remainingDays === undefined || remainingDays === null) return false;

  const days = typeof remainingDays === 'string' ? parseInt(remainingDays) : remainingDays;
  if (isNaN(days)) return false;

  return days > 0 && days <= threshold;
}

/**
 * 주의 회원 필터링
 */
export function filterWarningMembers(members: any[]): any[] {
  return members.filter(isWarningMember);
}

/**
 * 신규 회원 여부 확인 (최근 30일 내 가입)
 */
export function isNewMember(member: any): boolean {
  if (!member.joinedAt) return false;
  const joinedDate = member.joinedAt?.toDate?.() || new Date(member.joinedAt);
  const daysSinceJoined = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceJoined <= 30;
}

/**
 * 회원 상태 뱃지 반환
 */
export function getMemberStatusBadge(member: any): { status: string; colorClass: string } {
  if (isNewMember(member)) return { status: '신규', colorClass: 'new' };

  const membershipType = member.membershipInfo?.type || '없음';

  if (membershipType === '없음' || membershipType === '만료') {
    return { status: '비활성', colorClass: 'inactive' };
  }

  if (isWarningMember(member)) return { status: '주의', colorClass: 'warning' };

  return { status: '활성', colorClass: 'active' };
}

/**
 * 회원권 상태 뱃지 목록 반환
 */
export function getMembershipStatusBadges(member: any): Array<{ label: string; colorClass: string }> {
  const membershipType = member.membershipInfo?.type || '없음';

  let colorClass: string;
  if (membershipType === '기간권' || membershipType === '횟수권') {
    colorClass = 'primary';
  } else if (membershipType === '없음') {
    colorClass = 'none';
  } else if (membershipType === '홀딩') {
    colorClass = 'hold';
  } else {
    colorClass = 'primary';
  }

  return [{ label: membershipType, colorClass }];
}
