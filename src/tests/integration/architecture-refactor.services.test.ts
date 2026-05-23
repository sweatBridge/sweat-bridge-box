import { Timestamp } from 'firebase/firestore';
import { ClassService } from '../../services/classService';
import { LockerService } from '../../services/lockerService';
import { MemberService } from '../../services/memberService';
import { MembershipService } from '../../services/membershipService';
import { RevenueService } from '../../services/revenueService';
import { ClassRepository } from '../../repositories/classRepository';
import { LockerRepository } from '../../repositories/lockerRepository';
import { MemberRepository } from '../../repositories/memberRepository';
import { MembershipRepository } from '../../repositories/membershipRepository';
import { RevenueRepository } from '../../repositories/revenueRepository';
import {
  createDate,
  createLockerDocumentData,
  createLockerEntry,
  createMemberDocumentData,
  createMembership
} from '../fixtures/architectureFixtures';
import { LOCKER_STATE } from '../../types/locker';

jest.mock('../../repositories/classRepository');
jest.mock('../../repositories/lockerRepository');
jest.mock('../../repositories/memberRepository');
jest.mock('../../repositories/membershipRepository');
jest.mock('../../repositories/revenueRepository');

describe('2. 서비스 통합 테스트', () => {
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
    it('정규화된 birthDate와 회원권 정보를 포함한 회원 목록을 반환한다', async () => {
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
    it('회원권 추가와 매출 엔트리를 단일 batch로 원자 커밋한다', async () => {
      const purchaseAt = new Date('2026-04-05T14:30:00+09:00');
      const membership = createMembership({
        key: 'membership-new',
        type: 'countPass',
        quota: { total: 20, used: 0, remaining: 20 },
        purchase: {
          price: 200000,
          paid: 200000,
          paymentType: 'card',
          at: purchaseAt
        },
        assignee: 'coach-a'
      });
      (MembershipRepository.getRawUserMemberships as jest.Mock).mockResolvedValue([]);
      (MembershipRepository.commitAddMembershipBatch as jest.Mock).mockResolvedValue(undefined);

      await MembershipService.addUserMembership('member@example.com', membership, '홍길동');

      expect(MembershipRepository.commitAddMembershipBatch).toHaveBeenCalledWith(
        'SWEAT',
        'member@example.com',
        [membership],
        expect.objectContaining({
          year: 2026,
          month: 4,
          key: 'membership-new',
          entry: expect.objectContaining({
            id: 'member@example.com',
            realName: '홍길동',
            paymentType: 'card',
            price: '200000',
            type: 'countPass',
            refundAmount: '0'
          })
        })
      );
      // 분리된 setUserMemberships / RevenueService.addUserMembership 경로는 더 이상 사용하지 않는다.
      expect(MembershipRepository.setUserMemberships).not.toHaveBeenCalled();
    });

    it('홀딩을 추가하고 기간이 겹치면 뒤 회원권 일정을 밀어낸다', async () => {
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

    it('미래 홀딩을 해제하고 날짜를 복원한다', async () => {
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

    it('부분 환불 금액으로 회원권을 환불 처리하고 원 결제 매출에 반영한다', async () => {
      const memberships = [
        createMembership({
          key: 'membership-partial-refund',
          purchase: {
            price: 150000,
            paid: 150000,
            paymentType: 'card',
            at: createDate('2026-03-25')
          }
        })
      ];
      const refundRevenueSpy = jest.spyOn(RevenueService, 'refundUserMembership').mockResolvedValue();
      (MembershipRepository.setUserMemberships as jest.Mock).mockResolvedValue(undefined);

      await MembershipService.refundUserMembership(
        'member@example.com',
        0,
        '30000',
        '부분 환불',
        'coach-a',
        memberships
      );

      const savedMemberships = (MembershipRepository.setUserMemberships as jest.Mock).mock.calls[0][2];
      expect(savedMemberships[0].refund).toEqual(
        expect.objectContaining({
          isRefunded: true,
          refundAmount: 30000,
          reason: '부분 환불',
          assignee: 'coach-a'
        })
      );
      expect(refundRevenueSpy).toHaveBeenCalledWith(
        'membership-partial-refund',
        30000,
        expect.any(Date)
      );
      refundRevenueSpy.mockRestore();
    });

    it('결제 금액을 초과하는 환불은 거부한다', async () => {
      const memberships = [
        createMembership({
          purchase: {
            price: 150000,
            paid: 150000,
            paymentType: 'card',
            at: createDate('2026-03-25')
          }
        })
      ];

      await expect(
        MembershipService.refundUserMembership(
          'member@example.com',
          0,
          '160000',
          '과환불',
          'coach-a',
          memberships
        )
      ).rejects.toThrow('환불 금액은 결제 금액을 초과할 수 없습니다.');
    });

    it('회원권 기간과 횟수를 수정하고 변경 이력을 남긴다', async () => {
      const memberships = [
        createMembership({
          key: 'editable-pass',
          type: 'countPass',
          quota: { total: 20, used: 3, remaining: 17 },
          period: {
            startDate: createDate('2026-04-01'),
            endDate: createDate('2026-04-30'),
            originalEndDate: createDate('2026-04-30')
          }
        })
      ];
      (MembershipRepository.setUserMemberships as jest.Mock).mockResolvedValue(undefined);

      await MembershipService.editMembershipPeriod(
        'member@example.com',
        0,
        createDate('2026-04-02'),
        createDate('2026-05-02'),
        16,
        4,
        '일정 조정',
        'coach-a',
        memberships
      );

      const savedMemberships = (MembershipRepository.setUserMemberships as jest.Mock).mock.calls[0][2];
      expect(savedMemberships[0].period.startDate).toEqual(createDate('2026-04-02'));
      expect(savedMemberships[0].period.endDate).toEqual(createDate('2026-05-02'));
      expect(savedMemberships[0].quota).toEqual({ total: 20, used: 4, remaining: 16 });
      expect(savedMemberships[0].adjustments.at(-1)).toEqual(
        expect.objectContaining({
          type: 'edit',
          reason: '일정 조정',
          assignee: 'coach-a',
          before: expect.objectContaining({
            period: expect.objectContaining({
              startDate: createDate('2026-04-01'),
              endDate: createDate('2026-04-30')
            }),
            quota: { used: 3, remaining: 17 }
          }),
          after: expect.objectContaining({
            period: expect.objectContaining({
              startDate: createDate('2026-04-02'),
              endDate: createDate('2026-05-02')
            }),
            quota: { used: 4, remaining: 16 }
          })
        })
      );
    });

    it('회원권 삭제 시 회원 문서와 매출 데이터를 함께 정리한다', async () => {
      const memberships = [
        createMembership({ key: 'membership-delete-1' }),
        createMembership({ key: 'membership-delete-2' })
      ];
      const removeRevenueSpy = jest.spyOn(RevenueService, 'removeUserMembership').mockResolvedValue();
      (MembershipRepository.setUserMemberships as jest.Mock).mockResolvedValue(undefined);

      await MembershipService.removeUserMembership('member@example.com', 0, memberships);

      expect(MembershipRepository.setUserMemberships).toHaveBeenCalledWith('SWEAT', 'member@example.com', [
        expect.objectContaining({ key: 'membership-delete-2' })
      ]);
      expect(removeRevenueSpy).toHaveBeenCalledWith(
        'membership-delete-1',
        expect.any(Date)
      );
      removeRevenueSpy.mockRestore();
    });
  });

  describe('ClassService', () => {
    it('저장소 문서를 수업 이벤트 형식으로 변환한다', async () => {
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
    it('마지막 미사용 항목을 교체해 락커를 배정한다', async () => {
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

    it('활성 사용 중인 락커만 연장하고 대상 회원 정보를 반환한다', async () => {
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
    it('월별 매출과 거래 내역을 집계한다', async () => {
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

    it('현재 연도 매출 문서에서 매출 통계를 계산한다', async () => {
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
            refundAmount: '10000'
          }
        }
      });

      const stats = await RevenueService.getRevenueStats();

      expect(RevenueRepository.getRevenueYear).toHaveBeenCalledWith('SWEAT', 2026);
      expect(RevenueRepository.getAllRevenueYears).not.toHaveBeenCalled();
      expect(stats).toEqual({
        totalRevenue: 140000,
        thisMonthRevenue: 140000,
        todayRevenue: 140000,
        averageDailyRevenue: 35000
      });
    });

    it('회원권 결제 데이터를 결제 월 매출 문서에 저장한다', async () => {
      const membership = createMembership({
        key: 'revenue-membership-1',
        purchase: {
          price: 180000,
          paid: 180000,
          paymentType: 'card',
          at: new Date('2026-04-05T14:30:00+09:00')
        },
        assignee: 'coach-a'
      });
      (RevenueRepository.setRevenueEntry as jest.Mock).mockResolvedValue(undefined);

      await RevenueService.addUserMembership(membership, 'member@example.com', '홍길동');

      expect(RevenueRepository.setRevenueEntry).toHaveBeenCalledWith(
        'SWEAT',
        2026,
        4,
        'revenue-membership-1',
        expect.objectContaining({
          id: 'member@example.com',
          realName: '홍길동',
          paymentType: 'card',
          price: '180000',
          refundAmount: '0'
        })
      );
    });

    it('락커 결제 데이터를 현재 월 매출 문서에 저장한다', async () => {
      (RevenueRepository.setRevenueEntry as jest.Mock).mockResolvedValue(undefined);

      await RevenueService.addLockerRevenue('locker-revenue-1', 'member@example.com', '홍길동', '50000', 'cash');

      expect(RevenueRepository.setRevenueEntry).toHaveBeenCalledWith(
        'SWEAT',
        2026,
        4,
        'locker-revenue-1',
        expect.objectContaining({
          id: 'member@example.com',
          realName: '홍길동',
          paymentType: 'cash',
          type: 'locker',
          price: '50000'
        })
      );
    });

    it('purchaseAt이 주어지면 해당 연/월 문서만 환불액을 갱신한다', async () => {
      (RevenueRepository.updateRevenueEntryField as jest.Mock).mockResolvedValue(undefined);

      await RevenueService.refundUserMembership(
        'targetMembership',
        30000,
        new Date('2026-03-25T10:00:00+09:00')
      );

      expect(RevenueRepository.updateRevenueEntryField).toHaveBeenCalledWith(
        'SWEAT',
        2026,
        3,
        'targetMembership',
        'refundAmount',
        '30000'
      );
      expect(RevenueRepository.getAllRevenueYears).not.toHaveBeenCalled();
    });

    it('purchaseAt이 없으면 전체 연도 스캔 폴백으로 해당 엔트리만 갱신한다', async () => {
      (RevenueRepository.getAllRevenueYears as jest.Mock).mockResolvedValue([
        {
          year: '2026',
          data: {
            '3': {
              targetMembership: {
                assignee: 'coach-a',
                createdAt: Timestamp.fromDate(new Date('2026-03-25T10:00:00+09:00')),
                id: 'member@example.com',
                paymentType: 'card',
                plan: '무제한 1개월',
                price: '150000',
                realName: '홍길동',
                type: 'periodPass',
                refundAmount: '0'
              }
            }
          }
        }
      ]);
      (RevenueRepository.updateRevenueEntryField as jest.Mock).mockResolvedValue(undefined);

      await RevenueService.refundUserMembership('targetMembership', 30000);

      expect(RevenueRepository.updateRevenueEntryField).toHaveBeenCalledWith(
        'SWEAT',
        2026,
        3,
        'targetMembership',
        'refundAmount',
        '30000'
      );
    });

    it('purchaseAt이 주어지면 해당 매출 엔트리만 삭제한다', async () => {
      (RevenueRepository.deleteRevenueEntry as jest.Mock).mockResolvedValue(undefined);

      await RevenueService.removeUserMembership(
        'removableMembership',
        new Date('2026-03-25T10:00:00+09:00')
      );

      expect(RevenueRepository.deleteRevenueEntry).toHaveBeenCalledWith(
        'SWEAT',
        2026,
        3,
        'removableMembership'
      );
      expect(RevenueRepository.getAllRevenueYears).not.toHaveBeenCalled();
    });
  });
});
