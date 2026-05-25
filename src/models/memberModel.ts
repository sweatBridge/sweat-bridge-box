import { UserMembership, MembershipInfo } from '../types/membership';

/**
 * Firebase 원시 회원권 데이터를 UserMembership 타입으로 변환 (Timestamp → Date)
 */
export function convertMembershipFromFirebase(membership: any): UserMembership | null {
  if (!membership?.period || !membership?.purchase) return null;

  return {
    ...membership,
    purchase: {
      ...membership.purchase,
      at: membership.purchase.at?.toDate?.() ?? new Date(membership.purchase.at)
    },
    period: {
      startDate: membership.period.startDate?.toDate?.() ?? new Date(membership.period.startDate),
      endDate: membership.period.endDate?.toDate?.() ?? new Date(membership.period.endDate),
      originalEndDate: membership.period.originalEndDate?.toDate?.() ?? new Date(membership.period.originalEndDate)
    },
    holds: (membership.holds || []).map((hold: any) => ({
      ...hold,
      startDate: hold.startDate?.toDate?.() ?? new Date(hold.startDate),
      endDate: hold.endDate?.toDate?.() ?? new Date(hold.endDate)
    })),
    refund: {
      ...membership.refund,
      at: membership.refund?.at?.toDate?.() ?? (membership.refund?.at ? new Date(membership.refund.at) : null)
    },
    adjustments: (membership.adjustments || []).map((adj: any) => {
      const result: any = {
        ...adj,
        type: adj.type || 'edit',
        at: adj.at?.toDate?.() ?? new Date(adj.at)
      };
      if (adj.before) {
        result.before = {};
        if (adj.before.period) {
          result.before.period = {
            startDate: adj.before.period.startDate?.toDate?.() ?? new Date(adj.before.period.startDate),
            endDate: adj.before.period.endDate?.toDate?.() ?? new Date(adj.before.period.endDate)
          };
        }
        if (adj.before.quota) result.before.quota = adj.before.quota;
      }
      if (adj.after) {
        result.after = {};
        if (adj.after.period) {
          result.after.period = {
            startDate: adj.after.period.startDate?.toDate?.() ?? new Date(adj.after.period.startDate),
            endDate: adj.after.period.endDate?.toDate?.() ?? new Date(adj.after.period.endDate)
          };
        }
        if (adj.after.quota) result.after.quota = adj.after.quota;
      }
      if (adj.hold) {
        result.hold = {
          ...adj.hold,
          startDate: adj.hold.startDate?.toDate?.() ?? new Date(adj.hold.startDate),
          endDate: adj.hold.endDate?.toDate?.() ?? new Date(adj.hold.endDate)
        };
      }
      return result;
    }),
    createdAt: membership.createdAt?.toDate?.() ?? new Date(membership.createdAt),
    updatedAt: membership.updatedAt?.toDate?.() ?? new Date(membership.updatedAt),
    deletedAt: membership.deletedAt?.toDate?.() ?? (membership.deletedAt ? new Date(membership.deletedAt) : null)
  };
}

/**
 * Firebase 원시 회원권 배열을 변환 (period 없는 레거시 데이터 제외)
 */
export function convertMembershipsFromFirebase(rawMemberships: any[]): UserMembership[] {
  return rawMemberships
    .map(convertMembershipFromFirebase)
    .filter((m): m is UserMembership => m !== null);
}

/**
 * 회원권이 현재 홀딩 중인지 확인
 */
export function isCurrentlyOnHold(membership: UserMembership): boolean {
  if (!membership.holds || membership.holds.length === 0) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (Array.isArray(membership.holds)) {
    return membership.holds.some((hold) => {
      const holdStart = hold.startDate instanceof Date ? hold.startDate : new Date(hold.startDate);
      holdStart.setHours(0, 0, 0, 0);
      const holdEnd = hold.endDate instanceof Date ? hold.endDate : new Date(hold.endDate);
      holdEnd.setHours(0, 0, 0, 0);
      return now >= holdStart && now <= holdEnd;
    });
  }
  return false;
}

/**
 * 회원권 목록을 과거/현재/미래/환불로 분류
 */
export function categorizeMemberships(memberships: UserMembership[]): {
  pastMemberships: UserMembership[];
  currentMemberships: UserMembership[];
  futureMemberships: UserMembership[];
  refundedMemberships: UserMembership[];
} {
  const all = memberships || [];

  const refundedMemberships = all.filter(m => m.refund?.isRefunded);

  const valid = all.filter(m => !m.deleted && !m.refund?.isRefunded);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastMemberships: UserMembership[] = [];
  const currentMemberships: UserMembership[] = [];
  const futureMemberships: UserMembership[] = [];

  valid.forEach(m => {
    if (!m.period) return;

    const startDate = m.period.startDate instanceof Date ? m.period.startDate : new Date(m.period.startDate);
    const endDate = m.period.endDate instanceof Date ? m.period.endDate : new Date(m.period.endDate);

    if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) return;

    const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (endOnly < today) {
      pastMemberships.push(m);
    } else if (startOnly > today) {
      futureMemberships.push(m);
    } else {
      currentMemberships.push(m);
    }
  });

  return { pastMemberships, currentMemberships, futureMemberships, refundedMemberships };
}

function convertDateToString(date: Date): string {
  if (!date) return '-';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * 회원권 정보(MembershipInfo) 계산
 */
export function buildMembershipInfo(
  pastMemberships: UserMembership[],
  currentMemberships: UserMembership[],
  futureMemberships: UserMembership[],
  refundedMemberships: UserMembership[]
): MembershipInfo {
  const currentMembership = currentMemberships?.[0];

  if (
    pastMemberships.length === 0 &&
    currentMemberships.length === 0 &&
    futureMemberships.length === 0 &&
    refundedMemberships.length === 0
  ) {
    return MembershipInfo.create('미등록', '-', 0, 0);
  }

  if (!currentMembership && futureMemberships.length > 0) {
    return MembershipInfo.create('사용 예정', '-', 0, 0);
  }

  if (!currentMembership && (pastMemberships.length > 0 || refundedMemberships.length > 0)) {
    return MembershipInfo.create('만료', '만료됨', 0, 0);
  }

  if (!currentMembership) {
    return MembershipInfo.create('없음', '-', 0, 0);
  }

  const onHold = isCurrentlyOnHold(currentMembership);

  let type = '-';
  if (onHold) {
    type = '홀딩';
  } else if (currentMembership.type) {
    switch (currentMembership.type) {
      case 'periodPass': type = '기간권'; break;
      case 'countPass': type = '횟수권'; break;
      default: type = currentMembership.type;
    }
  }

  const endDate = currentMembership.period.endDate instanceof Date
    ? currentMembership.period.endDate
    : new Date(currentMembership.period.endDate);

  const expiryDate = convertDateToString(endDate);

  const today = new Date();
  const diff = endDate.getTime() - today.getTime();
  const remainingDays: string | number = diff > 0 ? Math.ceil(diff / (1000 * 3600 * 24)) : 0;

  let remainingVisits: string | number = '-';
  if (currentMembership.type === 'periodPass') {
    remainingVisits = '∞';
  } else if (currentMembership.type === 'countPass') {
    remainingVisits = currentMembership.quota.remaining;
  }

  return MembershipInfo.create(type, expiryDate, remainingDays, remainingVisits);
}
