import { LOCKER_STATE, Locker, LockerDocumentData } from '../../types/locker';
import { Member } from '../../types/member';
import { UserMembership } from '../../types/membership';

export function createDate(value: string): Date {
  return new Date(`${value}T00:00:00+09:00`);
}

export function createTimestampLike(value: Date) {
  return {
    toDate: () => value
  };
}

export function createMembership(overrides: Partial<UserMembership> = {}): UserMembership {
  const startDate = overrides.period?.startDate ?? createDate('2026-04-01');
  const endDate = overrides.period?.endDate ?? createDate('2026-04-30');
  const originalEndDate = overrides.period?.originalEndDate ?? endDate;
  const purchaseAt = overrides.purchase?.at ?? createDate('2026-03-25');

  return {
    key: overrides.key ?? 'membership-key',
    plan: overrides.plan ?? '무제한 1개월',
    type: overrides.type ?? 'periodPass',
    purchase: {
      price: overrides.purchase?.price ?? 150000,
      paid: overrides.purchase?.paid ?? 150000,
      paymentType: overrides.purchase?.paymentType ?? 'card',
      at: purchaseAt
    },
    quota: {
      total: overrides.quota?.total ?? 0,
      used: overrides.quota?.used ?? 0,
      remaining: overrides.quota?.remaining ?? 0
    },
    period: {
      startDate,
      endDate,
      originalEndDate
    },
    holds: overrides.holds ?? [],
    refund: overrides.refund ?? {
      isRefunded: false,
      at: null,
      refundAmount: 0,
      reason: null,
      assignee: null
    },
    adjustments: overrides.adjustments ?? [],
    createdAt: overrides.createdAt ?? purchaseAt,
    updatedAt: overrides.updatedAt ?? purchaseAt,
    assignee: overrides.assignee ?? 'coach-a',
    deleted: overrides.deleted ?? false,
    deletedAt: overrides.deletedAt ?? null,
    boxName: overrides.boxName ?? 'SWEAT'
  };
}

export function createRawMembership(overrides: Partial<UserMembership> = {}) {
  const membership = createMembership(overrides);

  return {
    ...membership,
    purchase: {
      ...membership.purchase,
      at: createTimestampLike(membership.purchase.at)
    },
    period: {
      ...membership.period,
      startDate: createTimestampLike(membership.period.startDate),
      endDate: createTimestampLike(membership.period.endDate),
      originalEndDate: createTimestampLike(membership.period.originalEndDate)
    },
    holds: membership.holds.map((hold) => ({
      ...hold,
      startDate: createTimestampLike(hold.startDate),
      endDate: createTimestampLike(hold.endDate)
    })),
    refund: {
      ...membership.refund,
      at: membership.refund.at ? createTimestampLike(membership.refund.at) : null
    },
    adjustments: membership.adjustments.map((adjustment) => ({
      ...adjustment,
      at: createTimestampLike(adjustment.at),
      before: adjustment.before
        ? {
            ...adjustment.before,
            period: adjustment.before.period
              ? {
                  startDate: createTimestampLike(adjustment.before.period.startDate),
                  endDate: createTimestampLike(adjustment.before.period.endDate)
                }
              : undefined
          }
        : undefined,
      after: adjustment.after
        ? {
            ...adjustment.after,
            period: adjustment.after.period
              ? {
                  startDate: createTimestampLike(adjustment.after.period.startDate),
                  endDate: createTimestampLike(adjustment.after.period.endDate)
                }
              : undefined
          }
        : undefined,
      hold: adjustment.hold
        ? {
            ...adjustment.hold,
            startDate: createTimestampLike(adjustment.hold.startDate),
            endDate: createTimestampLike(adjustment.hold.endDate)
          }
        : undefined
    })),
    createdAt: createTimestampLike(membership.createdAt),
    updatedAt: createTimestampLike(membership.updatedAt),
    deletedAt: membership.deletedAt ? createTimestampLike(membership.deletedAt) : null
  };
}

export function createMemberDocumentData() {
  return {
    email: 'member@example.com',
    realName: '홍길동',
    nickName: '길동',
    gender: 'M' as const,
    birth: '1990-01-01',
    phone: '01012341234',
    memberships: [
      createRawMembership({
        key: 'current-pass',
        type: 'countPass',
        quota: { total: 20, used: 3, remaining: 17 },
        period: {
          startDate: createDate('2026-04-01'),
          endDate: createDate('2026-04-20'),
          originalEndDate: createDate('2026-04-20')
        }
      }),
      createRawMembership({
        key: 'future-pass',
        period: {
          startDate: createDate('2026-05-01'),
          endDate: createDate('2026-05-31'),
          originalEndDate: createDate('2026-05-31')
        }
      }),
      createRawMembership({
        key: 'refunded-pass',
        refund: {
          isRefunded: true,
          at: createDate('2026-03-20'),
          refundAmount: 30000,
          reason: '환불',
          assignee: 'coach-a'
        },
        period: {
          startDate: createDate('2026-03-01'),
          endDate: createDate('2026-03-31'),
          originalEndDate: createDate('2026-03-31')
        }
      })
    ]
  };
}

export function createLockerEntry(overrides: Partial<Locker> = {}): Locker {
  return {
    number: overrides.number ?? 101,
    state: overrides.state ?? LOCKER_STATE.UNUSED,
    id: overrides.id ?? '',
    realName: overrides.realName ?? '',
    phone: overrides.phone ?? '',
    assignee: overrides.assignee ?? '',
    note: overrides.note ?? '',
    startDate: overrides.startDate ?? '',
    endDate: overrides.endDate ?? '',
    createdAt: overrides.createdAt ?? '2026-04-01',
    key: overrides.key ?? '',
    price: overrides.price,
    paymentType: overrides.paymentType
  };
}

export function createLockerDocumentData(): LockerDocumentData {
  return {
    '101': [createLockerEntry({ number: 101, state: LOCKER_STATE.UNUSED })],
    '102': [
      createLockerEntry({ number: 102, state: LOCKER_STATE.UNUSED }),
      createLockerEntry({
        number: 102,
        state: LOCKER_STATE.USED,
        realName: '홍길동',
        id: 'member@example.com',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        key: 'locker-102'
      })
    ]
  };
}

export function createMemberForBadge(overrides: Partial<Member> = {}): Member {
  const membership = createMembership({
    type: 'countPass',
    quota: { total: 10, used: 2, remaining: 8 }
  });

  return {
    email: overrides.email ?? 'member@example.com',
    realName: overrides.realName ?? '홍길동',
    nickName: overrides.nickName ?? '길동',
    gender: overrides.gender ?? 'M',
    birthDate: overrides.birthDate ?? '1990-01-01',
    phone: overrides.phone ?? '01012341234',
    membershipInfo: overrides.membershipInfo ?? {
      type: '횟수권',
      expiryDate: '2026.04.30',
      remainingDays: 21,
      remainingVisits: 8
    },
    memberships: overrides.memberships ?? [membership],
    futureMemberships: overrides.futureMemberships ?? []
  };
}
