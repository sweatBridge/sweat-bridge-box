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

export const getLockerStateLabel = (state: LockerState) => {
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

export interface Lockers{
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
}