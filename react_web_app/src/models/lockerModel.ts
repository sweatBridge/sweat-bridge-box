import { Locker, LOCKER_STATE, isLockerState } from '../types/locker';

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
