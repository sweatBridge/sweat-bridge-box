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

/**
 * 날짜를 비교하여 실제 락커 상태를 반환합니다.
 * - 사용 예정: LOCKER_STATE.USED
 * - 만료: LOCKER_STATE.UNUSED
 * - 사용중: LOCKER_STATE.USED
 */
export const getLockerState = (state: LockerState, locker?: Locker): LockerState => {
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

      // endDate 이후면 '만료' -> UNUSED
      if (today > end) {
        return LOCKER_STATE.UNUSED;
      }

      // startDate 이전이거나 사이면 '사용 예정' 또는 '사용중' -> USED
      return LOCKER_STATE.USED;
    }
  }

  // 날짜 비교가 불가능한 경우 원래 상태 반환
  return state;
};

export const getLockerStateLabel = (state: LockerState, locker?: Locker) => {
  // 실제 상태를 먼저 계산
  const actualState = getLockerState(state, locker);

  // state가 USED이고 락커 데이터가 있는 경우 날짜 비교하여 라벨 결정
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
  switch (actualState) {
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

export const LOCKER_ACTION = {
  ASSIGN: 'assign',
  RELEASE: 'release',
  MARK_BROKEN: 'mark_broken',
  RESTORE: 'restore',
  DELETE: 'delete',
} as const;

export type LockerAction = typeof LOCKER_ACTION[keyof typeof LOCKER_ACTION];

export interface Locker {
    number: number;
    state: LockerState;
    action?: LockerAction;
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

export type LockerDocumentValue = Partial<Locker>;

export type LockerDocumentEntry = LockerDocumentValue | LockerDocumentValue[];

export type LockerDocumentData = Record<string, LockerDocumentEntry>;

export const getLockerEventLabel = (action?: LockerAction): string => {
  switch (action) {
    case LOCKER_ACTION.ASSIGN: return '락커 배정';
    case LOCKER_ACTION.RELEASE: return '락커 반납';
    case LOCKER_ACTION.MARK_BROKEN: return '고장 등록';
    case LOCKER_ACTION.RESTORE: return '고장 복구';
    case LOCKER_ACTION.DELETE: return '락커 삭제';
    default: return '미확인';
  }
};
