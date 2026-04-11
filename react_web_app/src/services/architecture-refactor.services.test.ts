import { Timestamp } from 'firebase/firestore';
import { ClassService } from './classService';
import { LockerService } from './lockerService';
import { MemberService } from './memberService';
import { MembershipService } from './membershipService';
import { RevenueService } from './revenueService';
import { ClassRepository } from '../repositories/classRepository';
import { LockerRepository } from '../repositories/lockerRepository';
import { MemberRepository } from '../repositories/memberRepository';
import { MembershipRepository } from '../repositories/membershipRepository';
import { RevenueRepository } from '../repositories/revenueRepository';
import {
  createDate,
  createLockerDocumentData,
  createLockerEntry,
  createMemberDocumentData,
  createMembership,
  createRawMembership
} from '../testUtils/architectureFixtures';
import { LOCKER_STATE } from '../types/locker';

jest.mock('../repositories/classRepository');
jest.mock('../repositories/lockerRepository');
jest.mock('../repositories/memberRepository');
jest.mock('../repositories/membershipRepository');
jest.mock('../repositories/revenueRepository');

describe('2. service integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-10T09:00:00+09:00'));
    localStorage.clear();
    localStorage.setItem('boxName', 'SWEAT');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('MemberService', () => {
    it('returns members with normalized birthDate and membership info', async () => {
      const memberDocuments = [
        {
          id: 'member@example.com',
          data: createMemberDocumentData()
        }
      ];
      (MemberRepository.getMemberDocuments as jest.Mock).mockResolvedValue(memberDocuments);

      const members = await MemberService.getMembers('SWEAT');

      expect(members).toHaveLength(1);
      expect(members[0].birthDate).toBe('1990-01-01');
      expect(members[0].futureMemberships.map((membership) => membership.key)).toEqual(['future-pass']);
      expect(members[0].membershipInfo.type).toBe('횟수권');
      expect(members[0].membershipInfo.remainingVisits).toBe(17);
    });
  });

  describe('MembershipService', () => {
    it('adds a user membership and syncs revenue', async () => {
      const membership = createMembership({
        key: 'membership-new',
        type: 'countPass',
        quota: { total: 20, used: 0, remaining: 20 }
      });
      const addRevenueSpy = jest.spyOn(RevenueService, 'addUserMembership').mockResolvedValue();
      (MembershipRepository.getRawUserMemberships as jest.Mock).mockResolvedValue([]);
      (MembershipRepository.setUserMemberships as jest.Mock).mockResolvedValue(undefined);

      await MembershipService.addUserMembership('member@example.com', membership, '홍길동');

      expect(MembershipRepository.setUserMemberships).toHaveBeenCalledWith('SWEAT', 'member@example.com', [membership]);
      expect(addRevenueSpy).toHaveBeenCalledWith(membership, 'member@example.com', '홍길동');
      addRevenueSpy.mockRestore();
    });

    it('adds a hold and shifts subsequent memberships when periods overlap', async () => {
      const memberships = [
        createMembership({
          key: 'first',
          period: {
            startDate: createDate('2026-04-01'),
            endDate: createDate('2026-04-10'),
            originalEndDate: createDate('2026-04-10')
          }
        }),
        createMembership({
          key: 'second',
          period: {
            startDate: createDate('2026-04-11'),
            endDate: createDate('2026-04-20'),
            originalEndDate: createDate('2026-04-20')
          }
        })
      ];
      (MembershipRepository.setUserMemberships as jest.Mock).mockResolvedValue(undefined);

      await MembershipService.addHold(
        'member@example.com',
        0,
        createDate('2026-04-08'),
        createDate('2026-04-10'),
        '여행',
        'coach-a',
        memberships
      );

      const savedMemberships = (MembershipRepository.setUserMemberships as jest.Mock).mock.calls[0][2];
      expect(savedMemberships[0].period.endDate).toEqual(createDate('2026-04-13'));
      expect(savedMemberships[1].period.startDate).toEqual(createDate('2026-04-14'));
      expect(savedMemberships[1].period.endDate).toEqual(createDate('2026-04-24'));
      expect(savedMemberships[0].adjustments[0].type).toBe('hold');
    });

    it('releases a future hold and restores dates', async () => {
      const memberships = [
        createMembership({
          key: 'first',
          period: {
            startDate: createDate('2026-04-01'),
            endDate: createDate('2026-04-13'),
            originalEndDate: createDate('2026-04-10')
          },
          holds: [
            {
              reason: '여행',
              startDate: createDate('2026-04-15'),
              endDate: createDate('2026-04-17'),
              days: 2,
              assignee: 'coach-a'
            }
          ]
        }),
        createMembership({
          key: 'second',
          period: {
            startDate: createDate('2026-04-14'),
            endDate: createDate('2026-04-23'),
            originalEndDate: createDate('2026-04-20')
          }
        })
      ];
      (MembershipRepository.setUserMemberships as jest.Mock).mockResolvedValue(undefined);

      await MembershipService.releaseHold('member@example.com', 0, memberships);

      const savedMemberships = (MembershipRepository.setUserMemberships as jest.Mock).mock.calls[0][2];
      expect(savedMemberships[0].holds).toHaveLength(0);
      expect(savedMemberships[0].period.endDate).toEqual(createDate('2026-04-11'));
      expect(savedMemberships[1].period.startDate).toEqual(createDate('2026-04-14'));
      expect(savedMemberships[1].period.endDate).toEqual(createDate('2026-04-23'));
      expect(savedMemberships[0].adjustments[0].type).toBe('hold_release');
    });
  });

  describe('ClassService', () => {
    it('maps repository documents to class events', async () => {
      (ClassRepository.getClassesInRange as jest.Mock).mockResolvedValue([
        {
          docKey: '2026041010001130',
          data: {
            cap: 12,
            coach: 'Coach Kim',
            date: Timestamp.fromDate(new Date('2026-04-10T10:00:00+09:00')),
            reserved: ['a@example.com']
          }
        }
      ]);

      const events = await ClassService.getMonthlyClasses(
        'SWEAT',
        new Date('2026-04-01T00:00:00+09:00'),
        new Date('2026-04-30T23:59:59+09:00')
      );

      expect(events).toEqual([
        {
          id: '2026041010001130',
          title: 'SWEAT WOD',
          start: '2026-04-10T10:00:00+09:00',
          end: '2026-04-10T11:30:00+09:00',
          extendedProps: {
            coach: 'Coach Kim',
            cap: 12,
            reserved: ['a@example.com']
          }
        }
      ]);
    });
  });

  describe('LockerService', () => {
    it('assigns a locker by replacing the last clean unused entry', async () => {
      let capturedPayload: Record<string, unknown> | undefined;
      (LockerRepository.runLockerDocumentTransaction as jest.Mock).mockImplementation(
        async (_box: string, handler: (context: unknown) => Promise<{ result: void; payload?: Record<string, unknown> }>) => {
          const response = await handler({
            exists: true,
            data: createLockerDocumentData()
          });
          capturedPayload = response.payload;
          return response.result;
        }
      );

      await LockerService.assignLocker(
        'SWEAT',
        101,
        'member@example.com',
        '홍길동',
        '01012341234',
        '2026-04-10',
        '2026-04-30',
        'locker-101',
        '50000',
        'cash'
      );

      expect(capturedPayload).toEqual({
        '101': [
          createLockerEntry({
            number: 101,
            state: LOCKER_STATE.USED,
            id: 'member@example.com',
            realName: '홍길동',
            phone: '01012341234',
            startDate: '2026-04-10',
            endDate: '2026-04-30',
            createdAt: '2026-04-10',
            key: 'locker-101',
            price: '50000',
            paymentType: 'cash'
          })
        ]
      });
    });

    it('extends only active used lockers and returns affected member info', async () => {
      let capturedPayload: Record<string, unknown> | undefined;
      let capturedOperation: string | undefined;
      (LockerRepository.runLockerDocumentTransaction as jest.Mock).mockImplementation(
        async (_box: string, handler: (context: unknown) => Promise<{ result: unknown; payload?: Record<string, unknown>; operation?: string }>) => {
          const response = await handler({
            exists: true,
            data: createLockerDocumentData()
          });
          capturedPayload = response.payload;
          capturedOperation = response.operation;
          return response.result;
        }
      );

      const result = await LockerService.extendAllLockers('SWEAT', 5);

      expect(result).toEqual({
        extendedCount: 1,
        extendedLockers: [
          {
            id: 'member@example.com',
            key: 'locker-102',
            endDate: '2026-05-05'
          }
        ]
      });
      expect(capturedOperation).toBe('update');
      expect(capturedPayload).toHaveProperty('102');
    });
  });

  describe('RevenueService', () => {
    it('aggregates monthly revenue and transaction groups', async () => {
      (RevenueRepository.getRevenueYear as jest.Mock).mockResolvedValue({
        '4': {
          membership1: {
            assignee: 'coach-a',
            createdAt: Timestamp.fromDate(new Date('2026-04-10T10:00:00+09:00')),
            id: 'member@example.com',
            paymentType: 'card',
            plan: '무제한 1개월',
            price: '150000',
            realName: '홍길동',
            type: 'periodPass',
            refundAmount: '0'
          },
          locker1: {
            assignee: '',
            createdAt: Timestamp.fromDate(new Date('2026-04-10T12:00:00+09:00')),
            id: 'member@example.com',
            paymentType: 'cash',
            plan: '사물함 이용권',
            price: '50000',
            realName: '홍길동',
            type: 'locker',
            refundAmount: '10000'
          }
        }
      });

      const monthly = await RevenueService.getMonthlyRevenue(2026, 4);

      expect(monthly.totalRevenue).toBe(190000);
      expect(monthly.membershipRevenue).toBe(150000);
      expect(monthly.otherRevenue).toBe(50000);
      expect(monthly.dailyData).toEqual([
        {
          date: '2026-04-10',
          membershipRevenue: 150000,
          membershipCount: 1,
          otherRevenue: 50000,
          otherCount: 1,
          totalRevenue: 190000,
          cashRevenue: 50000,
          cashCount: 1,
          cardRevenue: 150000,
          cardCount: 1,
          refundRevenue: 10000
        }
      ]);
      expect(monthly.dailyTransactions['2026-04-10']).toHaveLength(2);
    });

    it('calculates revenue stats from yearly documents', async () => {
      (RevenueRepository.getAllRevenueYears as jest.Mock).mockResolvedValue([
        {
          year: '2026',
          data: {
            '4': {
              membership1: {
                assignee: 'coach-a',
                createdAt: Timestamp.fromDate(new Date('2026-04-10T10:00:00+09:00')),
                id: 'member@example.com',
                paymentType: 'card',
                plan: '무제한 1개월',
                price: '150000',
                realName: '홍길동',
                type: 'periodPass',
                refundAmount: '10000'
              }
            }
          }
        }
      ]);

      const stats = await RevenueService.getRevenueStats();

      expect(stats).toEqual({
        totalRevenue: 140000,
        thisMonthRevenue: 140000,
        todayRevenue: 140000,
        averageDailyRevenue: 35000
      });
    });
  });
});
