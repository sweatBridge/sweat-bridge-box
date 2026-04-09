import { LOCKER_STATE } from '../types/locker';
import {
  buildMembershipInfo,
  categorizeMemberships,
  convertMembershipsFromFirebase
} from './memberModel';
import {
  filterWarningMembers,
  getCurrentMemberships,
  getMemberStatusBadge,
  isFutureHold,
  isHold,
  isValidActiveMembership
} from './membershipModel';
import { extractDateTimeFromDocKey, generateDocKey } from './classModel';
import { getLatestLocker, hasActiveAssignedUser } from './lockerModel';
import {
  createDate,
  createLockerEntry,
  createMemberForBadge,
  createMembership,
  createRawMembership
} from '../testUtils/architectureFixtures';

describe('1. model unit tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-10T09:00:00+09:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('memberModel', () => {
    it('converts Firebase membership payloads into app memberships', () => {
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

    it('categorizes memberships into past/current/future/refunded buckets', () => {
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

    it('builds membership info for an active count pass', () => {
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
    it('detects current and future holds correctly', () => {
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

    it('returns only active memberships for the given date', () => {
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

    it('calculates warning badge and filters warning members', () => {
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
    it('generates and parses doc keys consistently', () => {
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
    it('extracts the latest locker entry from an array history', () => {
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

    it('checks whether a locker has an active assigned user', () => {
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
