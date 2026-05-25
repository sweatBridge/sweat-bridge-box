import { Locker, LOCKER_STATE, getLockerState, isLockerState } from '../types/locker';

/**
 * Firebase 원시 데이터를 Locker 타입으로 변환
 */
export function toLocker(v: any, number: number): Locker {
  const state = isLockerState(v?.state) ? v.state : LOCKER_STATE.UNUSED;
  return {
    number,
    state,
    id: v?.id ?? '',
    realName: v?.realName ?? '',
    phone: v?.phone ?? '',
    assignee: v?.assignee ?? '',
    note: v?.note ?? '',
    startDate: v?.startDate ?? '',
    endDate: v?.endDate ?? '',
    createdAt: v?.createdAt ?? '',
    key: v?.key ?? '',
    price: v?.price,
    paymentType: v?.paymentType
  };
}

/**
 * 문서 엔트리의 최신 락커 상태를 Locker 타입으로 정규화합니다.
 */
export function getLatestLocker(entry: unknown, number: number): Locker | null {
  if (Array.isArray(entry)) {
    if (entry.length === 0) return null;
    return toLocker(entry[entry.length - 1], number);
  }

  if (entry && typeof entry === 'object') {
    return toLocker(entry, number);
  }

  return null;
}

/**
 * 최신 엔트리 기준으로 현재 활성 배정 회원이 있는지 확인합니다.
 * 만료된 배정은 활성 사용자로 보지 않습니다.
 */
export function hasActiveAssignedUser(entry: unknown, number: number): boolean {
  const latestLocker = getLatestLocker(entry, number);
  if (!latestLocker) return false;

  return latestLocker.realName.trim().length > 0 && getLockerState(latestLocker.state, latestLocker) === LOCKER_STATE.USED;
}
