import { Timestamp } from 'firebase/firestore';
import { ClassService } from './classService';
import { MemberService } from './memberService';
import { RevenueService } from './revenueService';
import { ClassRepository } from '../repositories/classRepository';
import { MemberRepository } from '../repositories/memberRepository';
import { RevenueRepository } from '../repositories/revenueRepository';
import { createMemberDocumentData } from '../testUtils/architectureFixtures';

jest.mock('../repositories/classRepository');
jest.mock('../repositories/memberRepository');
jest.mock('../repositories/revenueRepository');

describe('3. golden regression tests', () => {
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

  it('keeps MemberService.getMembers output shape aligned with the develop/v1.1 contract', async () => {
    (MemberRepository.getMemberDocuments as jest.Mock).mockResolvedValue([
      {
        id: 'member@example.com',
        data: createMemberDocumentData()
      }
    ]);

    const members = await MemberService.getMembers('SWEAT');

    expect(JSON.parse(JSON.stringify(members))).toEqual([
      {
        email: 'member@example.com',
        realName: '홍길동',
        nickName: '길동',
        gender: 'M',
        birth: '1990-01-01',
        phone: '01012341234',
        memberships: [
          expect.objectContaining({
            key: 'current-pass',
            type: 'countPass',
            quota: { total: 20, used: 3, remaining: 17 }
          }),
          expect.objectContaining({
            key: 'future-pass',
            type: 'periodPass'
          }),
          expect.objectContaining({
            key: 'refunded-pass',
            refund: expect.objectContaining({ isRefunded: true, refundAmount: 30000 })
          })
        ],
        birthDate: '1990-01-01',
        futureMemberships: [
          expect.objectContaining({
            key: 'future-pass'
          })
        ],
        membershipInfo: {
          type: '횟수권',
          expiryDate: '2026. 04. 20.',
          remainingDays: 10,
          remainingVisits: 17
        }
      }
    ]);
  });

  it('keeps ClassService.getMonthlyClasses event mapping aligned with the legacy contract', async () => {
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

  it('keeps RevenueService.getMonthlyRevenue aggregation aligned with the previous contract', async () => {
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

    const result = await RevenueService.getMonthlyRevenue(2026, 4);

    expect(result).toEqual({
      year: 2026,
      month: 4,
      totalRevenue: 190000,
      membershipRevenue: 150000,
      otherRevenue: 50000,
      dailyData: [
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
      ],
      dailyTransactions: {
        '2026-04-10': [
          {
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
          {
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
        ]
      }
    });
  });
});
