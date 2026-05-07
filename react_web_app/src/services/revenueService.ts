import { Timestamp } from 'firebase/firestore';
import { RevenueRepository } from '../repositories/revenueRepository';
import { DailyRevenue, MonthlyRevenue, RevenueData, RevenueStats } from '../types/revenue';
import { UserMembership } from '../types/membership';
import { formatDateToString } from '../utils/dateUtils';

export class RevenueService {
  /**
   * 현재 로컬 스토리지 기준 박스 이름을 반환합니다.
   *
   * @returns 박스 이름
   */
  private static getBoxName(): string {
    return localStorage.getItem('boxName') || 'SWEAT';
  }

  /**
   * 월별 매출 데이터를 조회하고 집계합니다.
   *
   * @param year 조회 연도
   * @param month 조회 월
   * @returns 월별 매출 요약
   */
  static async getMonthlyRevenue(year: number, month: number): Promise<MonthlyRevenue> {
    try {
      const yearData = await RevenueRepository.getRevenueYear(this.getBoxName(), year);
      const monthData = yearData[month.toString()] || {};

      const dailyRevenueMap = new Map<string, {
        membershipRevenue: number;
        membershipCount: number;
        otherRevenue: number;
        otherCount: number;
        cashRevenue: number;
        cashCount: number;
        cardRevenue: number;
        cardCount: number;
        refundRevenue: number;
      }>();
      const dailyTransactionsMap = new Map<string, RevenueData[]>();

      Object.entries(monthData).forEach(([, rawData]) => {
        const revenueData = rawData as RevenueData;
        const createdDate = revenueData.createdAt.toDate();
        const dateStr = formatDateToString(createdDate);

        if (!dailyRevenueMap.has(dateStr)) {
          dailyRevenueMap.set(dateStr, {
            membershipRevenue: 0,
            membershipCount: 0,
            otherRevenue: 0,
            otherCount: 0,
            cashRevenue: 0,
            cashCount: 0,
            cardRevenue: 0,
            cardCount: 0,
            refundRevenue: 0
          });
          dailyTransactionsMap.set(dateStr, []);
        }

        dailyTransactionsMap.get(dateStr)!.push(revenueData);

        const daily = dailyRevenueMap.get(dateStr)!;
        const price = parseInt(revenueData.price, 10) || 0;
        const refundAmount = parseInt(revenueData.refundAmount, 10) || 0;
        daily.refundRevenue += refundAmount;

        const isMembership = revenueData.type === 'countPass' || revenueData.type === 'periodPass';
        if (isMembership) {
          daily.membershipRevenue += price;
          daily.membershipCount++;
        } else {
          daily.otherRevenue += price;
          daily.otherCount++;
        }

        if (revenueData.paymentType === 'cash') {
          daily.cashRevenue += price;
          daily.cashCount++;
        } else if (revenueData.paymentType === 'card') {
          daily.cardRevenue += price;
          daily.cardCount++;
        }
      });

      const dailyData: DailyRevenue[] = Array.from(dailyRevenueMap.entries())
        .map(([date, data]) => ({
          date,
          membershipRevenue: data.membershipRevenue,
          membershipCount: data.membershipCount,
          otherRevenue: data.otherRevenue,
          otherCount: data.otherCount,
          totalRevenue: data.cashRevenue + data.cardRevenue - data.refundRevenue,
          cashRevenue: data.cashRevenue,
          cashCount: data.cashCount,
          cardRevenue: data.cardRevenue,
          cardCount: data.cardCount,
          refundRevenue: data.refundRevenue
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalRevenue = dailyData.reduce((sum, daily) => sum + daily.totalRevenue, 0);
      const membershipRevenue = dailyData.reduce((sum, daily) => sum + daily.membershipRevenue, 0);
      const otherRevenue = dailyData.reduce((sum, daily) => sum + daily.otherRevenue, 0);

      const dailyTransactions: { [date: string]: RevenueData[] } = {};
      dailyTransactionsMap.forEach((value, key) => {
        dailyTransactions[key] = value;
      });

      return { year, month, totalRevenue, membershipRevenue, otherRevenue, dailyData, dailyTransactions };
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      throw new Error('매출 데이터를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 전체 매출 통계를 조회합니다.
   *
   * @returns 매출 통계 요약
   */
  static async getRevenueStats(): Promise<RevenueStats> {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const today = formatDateToString(now);

      // 통계 3개(올해 누적/이번 달/오늘) 모두 올해 매출만 사용하므로 현재 연도 문서만 읽는다.
      const yearData = await RevenueRepository.getRevenueYear(this.getBoxName(), currentYear);

      let totalRevenue = 0;
      let thisMonthRevenue = 0;
      let todayRevenue = 0;

      for (const monthKey in yearData) {
        const monthData = yearData[monthKey];
        const month = parseInt(monthKey, 10);
        if (!monthData || typeof monthData !== 'object') continue;

        for (const [, rawData] of Object.entries(monthData)) {
          const revenueData = rawData as RevenueData;
          const price = parseInt(revenueData.price, 10) || 0;
          const refundAmount = parseInt(revenueData.refundAmount, 10) || 0;
          const actualRevenue = price - refundAmount;
          const dateStr = formatDateToString(revenueData.createdAt.toDate());

          totalRevenue += actualRevenue;
          if (month === currentMonth) thisMonthRevenue += actualRevenue;
          if (dateStr === today) todayRevenue += actualRevenue;
        }
      }

      const averageDailyRevenue = currentMonth > 0 ? Math.floor(totalRevenue / currentMonth) : 0;
      return { totalRevenue, thisMonthRevenue, todayRevenue, averageDailyRevenue };
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw new Error('매출 통계를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 일별 매출 저장 API의 자리만 유지합니다.
   *
   * @param dailyRevenue 저장할 일별 매출
   */
  static async updateDailyRevenue(dailyRevenue: DailyRevenue): Promise<void> {
    try {
      const boxName = this.getBoxName();
      console.log('TODO: Save daily revenue to Firebase', { boxName, dailyRevenue });
      await RevenueRepository.updateDailyRevenue(boxName, dailyRevenue);
    } catch (error) {
      console.error('Error updating daily revenue:', error);
      throw new Error('매출 데이터 저장에 실패했습니다.');
    }
  }

  /**
   * 회원권 매출 데이터를 저장합니다.
   *
   * @param membership 구매된 회원권
   * @param memberEmail 회원 이메일
   * @param memberRealName 회원 이름
   */
  static async addUserMembership(membership: UserMembership, memberEmail: string, memberRealName: string): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const purchaseDate = membership.purchase.at;
      const year = purchaseDate.getFullYear();
      const month = purchaseDate.getMonth() + 1;

      await RevenueRepository.setRevenueEntry(boxName, year, month, membership.key, {
        assignee: membership.assignee,
        createdAt: Timestamp.fromDate(purchaseDate),
        id: memberEmail,
        paymentType: membership.purchase.paymentType,
        plan: membership.plan,
        price: membership.purchase.price.toString(),
        realName: memberRealName,
        type: membership.type,
        refundAmount: '0'
      });
    } catch (error) {
      console.error('Error adding membership revenue:', error);
      throw new Error('매출 데이터 저장에 실패했습니다.');
    }
  }

  /**
   * 락커 매출 데이터를 저장합니다.
   *
   * @param lockerKey 락커 결제 키
   * @param userEmail 회원 이메일
   * @param userName 회원 이름
   * @param price 결제 금액
   * @param paymentType 결제 수단
   */
  static async addLockerRevenue(
    lockerKey: string,
    userEmail: string,
    userName: string,
    price: string,
    paymentType: 'cash' | 'card'
  ): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      await RevenueRepository.setRevenueEntry(boxName, year, month, lockerKey, {
        assignee: '',
        createdAt: Timestamp.now(),
        id: userEmail,
        paymentType,
        plan: '사물함 이용권',
        price,
        realName: userName,
        type: 'locker',
        refundAmount: '0'
      });
    } catch (error) {
      console.error('Error adding locker revenue:', error);
      throw new Error('락커 매출 데이터 저장에 실패했습니다.');
    }
  }

  /**
   * 회원권 매출 환불액을 반영합니다.
   *
   * 가능한 경우 `purchaseAt`을 넘겨 정확한 연/월 문서 1개만 갱신합니다.
   * 누락 시에만 전체 연도 스캔으로 폴백합니다.
   *
   * @param membershipKey 회원권 키
   * @param refundAmount 환불 금액
   * @param purchaseAt 회원권 구매 시각(연/월 결정용)
   */
  static async refundUserMembership(
    membershipKey: string,
    refundAmount: number,
    purchaseAt?: Date
  ): Promise<void> {
    try {
      const boxName = this.getBoxName();

      if (purchaseAt) {
        await RevenueRepository.updateRevenueEntryField(
          boxName,
          purchaseAt.getFullYear(),
          purchaseAt.getMonth() + 1,
          membershipKey,
          'refundAmount',
          refundAmount.toString()
        );
        return;
      }

      // 폴백: purchaseAt이 없으면 전체 연도 스캔
      const documents = await RevenueRepository.getAllRevenueYears(boxName);
      for (const document of documents) {
        for (const monthKey in document.data) {
          const monthData = document.data[monthKey];
          if (monthData && typeof monthData === 'object' && membershipKey in monthData) {
            await RevenueRepository.updateRevenueEntryField(
              boxName,
              parseInt(document.year, 10),
              parseInt(monthKey, 10),
              membershipKey,
              'refundAmount',
              refundAmount.toString()
            );
          }
        }
      }
    } catch (error) {
      console.error('Error refunding membership revenue:', error);
      throw new Error('매출 환불 처리에 실패했습니다.');
    }
  }

  /**
   * 회원권 매출 데이터를 삭제합니다.
   *
   * 가능한 경우 `purchaseAt`을 넘겨 정확한 연/월 문서 1개만 갱신합니다.
   * 누락 시에만 전체 연도 스캔으로 폴백합니다.
   *
   * @param membershipKey 회원권 키
   * @param purchaseAt 회원권 구매 시각(연/월 결정용)
   */
  static async removeUserMembership(membershipKey: string, purchaseAt?: Date): Promise<void> {
    try {
      const boxName = this.getBoxName();

      if (purchaseAt) {
        await RevenueRepository.deleteRevenueEntry(
          boxName,
          purchaseAt.getFullYear(),
          purchaseAt.getMonth() + 1,
          membershipKey
        );
        return;
      }

      // 폴백: purchaseAt이 없으면 전체 연도 스캔
      const documents = await RevenueRepository.getAllRevenueYears(boxName);
      for (const document of documents) {
        for (const monthKey in document.data) {
          const monthData = document.data[monthKey];
          if (monthData && typeof monthData === 'object' && membershipKey in monthData) {
            await RevenueRepository.deleteRevenueEntry(
              boxName,
              parseInt(document.year, 10),
              parseInt(monthKey, 10),
              membershipKey
            );
          }
        }
      }
    } catch (error) {
      console.error('Error removing membership revenue:', error);
      throw new Error('매출 데이터 삭제에 실패했습니다.');
    }
  }
}
