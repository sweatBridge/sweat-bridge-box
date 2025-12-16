import { Locker, LOCKER_STATE, isLockerState } from '../types/locker';

/**
 * 락커 데이터를 Locker 타입으로 변환하는 공용 함수
 * @param v 원본 데이터 객체
 * @param number 락커 번호
 * @returns Locker 타입 객체
 */
export const toLocker = (v: any, number: number): Locker => {
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
};

