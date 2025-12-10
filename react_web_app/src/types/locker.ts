export const LOCKER_STATE = {
  USED: 'used',
  UNUSED: 'unused',
  NA: 'na',
  DELETED: 'deleted'
} as const;

export type LockerState = typeof LOCKER_STATE[keyof typeof LOCKER_STATE];

export const LOCKER_STATE_ORDER: Record<LockerState, number> = {
  [LOCKER_STATE.NA]: 3,
  [LOCKER_STATE.DELETED]: 2,
  [LOCKER_STATE.USED]: 1,
  [LOCKER_STATE.UNUSED]: 0
};

export const isLockerState = (value: unknown): value is LockerState =>
  (Object.values(LOCKER_STATE) as LockerState[]).includes(value as LockerState);

export const coalesceLockerState = (a: LockerState, b: LockerState): LockerState =>
  LOCKER_STATE_ORDER[a] >= LOCKER_STATE_ORDER[b] ? a : b;

export const getLockerStateLabel = (state: LockerState, locker?: Locker) => {
  // state가 USED이고 락커 데이터가 있는 경우 날짜 비교
  if (state === LOCKER_STATE.USED && locker) {
    const { startDate, endDate } = locker;
    
    // startDate와 endDate가 모두 있는 경우에만 날짜 비교
    if (startDate && endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      // startDate 이전이면 '사용 예정'
      if (today < start) {
        return '사용 예정';
      }
      
      // endDate 이후면 '만료'
      if (today > end) {
        return '만료';
      }
      
      // startDate와 endDate 사이면 '사용중'
      return '사용중';
    }
  }
  
  // 기본 상태 라벨 반환
  switch (state) {
    case LOCKER_STATE.USED:
      return '사용중';
    case LOCKER_STATE.UNUSED:
      return '사용 가능';
    case LOCKER_STATE.NA:
      return '고장';
    case LOCKER_STATE.DELETED:
      return '삭제됨';
    default:
      return state;
  }
};

export type LockerUpdatableState = typeof LOCKER_STATE.UNUSED | typeof LOCKER_STATE.NA;

export interface Locker{
    number: number;
    state: LockerState;
    id: string;  // 사용자 이메일
    realName: string;
    phone: string;
    assignee: string;
    note: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    key?: string;  // 락커 할당 고유 키
    price?: string;  // 가격
    paymentType?: 'cash' | 'card';  // 결제수단
}