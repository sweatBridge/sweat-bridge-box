import { LOCKER_STATE } from '../../types/locker';
import {
  buildMembershipInfo,
  categorizeMemberships,
  convertMembershipsFromFirebase
} from '../../models/memberModel';
import {
  filterWarningMembers,
  getCurrentMemberships,
  getMemberStatusBadge,
  isFutureHold,
  isHold,
  isValidActiveMembership
} from '../../models/membershipModel';
import { extractDateTimeFromDocKey, generateDocKey } from '../../models/classModel';
import { getLatestLocker, hasActiveAssignedUser } from '../../models/lockerModel';
import {
  createDate,
  createLockerEntry,
  createMemberForBadge,
  createMembership,
  createRawMembership
} from '../fixtures/architectureFixtures';

describe('1. 모델 단위 테스트', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-10T09:00:00+09:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('memberModel', () => {
    it('Firebase 회원권 데이터를 앱 회원권 형식으로 변환한다', () => {
      const converted = convertMembershipsFromFirebase([
        createRawMembership({
          key: 'raw-1',
          type: 'countPass',
          quota: { total: 30, used: 4, remaining: 26 }
        })
      ]);

      expect(converted).toHaveLength(1);
      expect(converted[0].key).toBe('raw-1');
      expect(converted[0].purchase.at).toBeInstanceOf(Date);
      expect(converted[0].period.startDate).toBeInstanceOf(Date);
      expect(converted[0].quota.remaining).toBe(26);
    });

    it('회원권을 과거/현재/미래/환불 상태로 분류한다', () => {
      const past = createMembership({
        key: 'past',
        period: {
          startDate: createDate('2026-03-01'),
          endDate: createDate('2026-03-31'),
          originalEndDate: createDate('2026-03-31')
        }
      });
      const current = createMembership({
        key: 'current',
        type: 'countPass',
        quota: { total: 20, used: 5, remaining: 15 },
        period: {
          startDate: createDate('2026-04-01'),
          endDate: createDate('2026-04-20'),
          originalEndDate: createDate('2026-04-20')
        }
      });
      const future = createMembership({
        key: 'future',
        period: {
          startDate: createDate('2026-05-01'),
          endDate: createDate('2026-05-31'),
          originalEndDate: createDate('2026-05-31')
        }
      });
      const refunded = createMembership({
        key: 'refunded',
        refund: {
          isRefunded: true,
          at: createDate('2026-03-15'),
          refundAmount: 50000,
          reason: '사유',
          assignee: 'coach-a'
        }
      });

      const result = categorizeMemberships([past, current, future, refunded]);

      expect(result.pastMemberships.map((membership) => membership.key)).toEqual(['past']);
      expect(result.currentMemberships.map((membership) => membership.key)).toEqual(['current']);
      expect(result.futureMemberships.map((membership) => membership.key)).toEqual(['future']);
      expect(result.refundedMemberships.map((membership) => membership.key)).toEqual(['refunded']);
    });

    it('활성 횟수권에 대한 회원권 정보를 생성한다', () => {
      const current = createMembership({
        type: 'countPass',
        quota: { total: 20, used: 5, remaining: 15 },
        period: {
          startDate: createDate('2026-04-01'),
          endDate: createDate('2026-04-20'),
          originalEndDate: createDate('2026-04-20')
        }
      });

      const membershipInfo = buildMembershipInfo([], [current], [], []);

      expect(membershipInfo.type).toBe('횟수권');
      expect(membershipInfo.remainingVisits).toBe(15);
      expect(membershipInfo.remainingDays).toBe(10);
      expect(membershipInfo.expiryDate).toContain('2026');
    });
  });

  describe('membershipModel', () => {
    it('현재 홀딩과 미래 홀딩을 올바르게 판별한다', () => {
      const currentHoldMembership = createMembership({
        holds: [
          {
            reason: '여행',
            startDate: createDate('2026-04-08'),
            endDate: createDate('2026-04-12'),
            days: 4,
            assignee: 'coach-a'
          }
        ]
      });
      const futureHoldMembership = createMembership({
        holds: [
          {
            reason: '출장',
            startDate: createDate('2026-04-15'),
            endDate: createDate('2026-04-18'),
            days: 3,
            assignee: 'coach-a'
          }
        ]
      });

      expect(isHold(currentHoldMembership)).toBe(true);
      expect(isFutureHold(currentHoldMembership)).toBe(false);
      expect(isHold(futureHoldMembership)).toBe(false);
      expect(isFutureHold(futureHoldMembership)).toBe(true);
    });

    it('주어진 날짜 기준으로 활성 회원권만 반환한다', () => {
      const memberships = [
        createMembership({
          key: 'active',
          period: {
            startDate: createDate('2026-04-01'),
            endDate: createDate('2026-04-20'),
            originalEndDate: createDate('2026-04-20')
          }
        }),
        createMembership({
          key: 'future',
          period: {
            startDate: createDate('2026-05-01'),
            endDate: createDate('2026-05-31'),
            originalEndDate: createDate('2026-05-31')
          }
        }),
        createMembership({
          key: 'deleted',
          deleted: true
        })
      ];

      expect(isValidActiveMembership(memberships[0], new Date('2026-04-10T09:00:00+09:00'))).toBe(true);
      expect(getCurrentMemberships(memberships).map((membership) => membership.key)).toEqual(['active']);
    });

    it('주의 상태 뱃지를 계산하고 주의 회원만 필터링한다', () => {
      const warningMember = createMemberForBadge({
        membershipInfo: {
          type: '횟수권',
          expiryDate: '2026.04.15',
          remainingDays: 5,
          remainingVisits: 2
        }
      });
      const normalMember = createMemberForBadge({
        email: 'normal@example.com',
        membershipInfo: {
          type: '횟수권',
          expiryDate: '2026.05.10',
          remainingDays: 30,
          remainingVisits: 10
        }
      });

      expect(getMemberStatusBadge(warningMember)).toEqual({ status: '주의', colorClass: 'warning' });
      expect(filterWarningMembers([warningMember, normalMember]).map((member) => member.email)).toEqual([
        'member@example.com'
      ]);
    });
  });

  describe('classModel', () => {
    it('문서 키를 일관되게 생성하고 파싱한다', () => {
      const docKey = generateDocKey(new Date('2026-04-10T09:00:00+09:00'), '10:00', '11:30');

      expect(docKey).toBe('2026041010001130');
      expect(extractDateTimeFromDocKey(docKey)).toEqual({
        year: '2026',
        month: '04',
        day: '10',
        startHour: '10',
        startMin: '00',
        endHour: '11',
        endMin: '30'
      });
    });
  });

  describe('lockerModel', () => {
    it('배열 히스토리에서 가장 최신 락커 항목을 추출한다', () => {
      const latest = getLatestLocker(
        [
          createLockerEntry({ number: 101, state: LOCKER_STATE.UNUSED }),
          createLockerEntry({
            number: 101,
            state: LOCKER_STATE.USED,
            realName: '홍길동',
            id: 'member@example.com',
            startDate: '2026-04-01',
            endDate: '2026-04-30'
          })
        ],
        101
      );

      expect(latest?.state).toBe(LOCKER_STATE.USED);
      expect(latest?.realName).toBe('홍길동');
    });

    it('락커에 현재 활성 배정 사용자가 있는지 확인한다', () => {
      const activeEntry = [
        createLockerEntry({
          number: 102,
          state: LOCKER_STATE.USED,
          realName: '홍길동',
          id: 'member@example.com',
          startDate: '2026-04-01',
          endDate: '2026-04-30'
        })
      ];
      const expiredEntry = [
        createLockerEntry({
          number: 103,
          state: LOCKER_STATE.USED,
          realName: '김철수',
          id: 'expired@example.com',
          startDate: '2026-03-01',
          endDate: '2026-03-31'
        })
      ];

      expect(hasActiveAssignedUser(activeEntry, 102)).toBe(true);
      expect(hasActiveAssignedUser(expiredEntry, 103)).toBe(false);
    });
  });
});
