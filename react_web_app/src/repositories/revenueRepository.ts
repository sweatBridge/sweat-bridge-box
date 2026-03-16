import { DailyRevenue, MonthlyRevenue, RevenueStats } from '../types/revenue';
import { UserMembership } from '../types/membership';
import { doc, setDoc, getDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatDateToString } from '../utils/dateUtils';

export interface RevenueData {
  assignee: string;
  createdAt: Timestamp;
  id: string;
  paymentType: 'card' | 'cash';
  plan: string;
  price: string;
  realName: string;
  type: string;
  refundAmount: string;
}

export class RevenueRepository {
  private static getBoxName(): string {
    return localStorage.getItem('boxName') || 'SWEAT';
  }

  static async getMonthlyRevenue(year: number, month: number): Promise<MonthlyRevenue> {
    try {
      const boxName = this.getBoxName();
      const revenueDoc = await getDoc(doc(db, `box/${boxName}/revenue/${year}`));

      if (!revenueDoc.exists()) {
        return { year, month, totalRevenue: 0, membershipRevenue: 0, otherRevenue: 0, dailyData: [], dailyTransactions: {} };
      }

      const yearData = revenueDoc.data();
      const monthData = yearData[month.toString()] || {};

      const dailyRevenueMap = new Map<string, {
        membershipRevenue: number; membershipCount: number;
        otherRevenue: number; otherCount: number;
        cashRevenue: number; cashCount: number;
        cardRevenue: number; cardCount: number;
        refundRevenue: number;
      }>();
      const dailyTransactionsMap = new Map<string, RevenueData[]>();

      Object.entries(monthData).forEach(([, data]) => {
        const revenueData = data as RevenueData;
        const createdDate = revenueData.createdAt.toDate();
        const dateStr = formatDateToString(createdDate);

        if (!dailyRevenueMap.has(dateStr)) {
          dailyRevenueMap.set(dateStr, {
            membershipRevenue: 0, membershipCount: 0, otherRevenue: 0, otherCount: 0,
            cashRevenue: 0, cashCount: 0, cardRevenue: 0, cardCount: 0, refundRevenue: 0
          });
          dailyTransactionsMap.set(dateStr, []);
        }

        dailyTransactionsMap.get(dateStr)!.push(revenueData);

        const daily = dailyRevenueMap.get(dateStr)!;
        const price = parseInt(revenueData.price) || 0;
        const refundAmount = parseInt(revenueData.refundAmount) || 0;

        daily.refundRevenue += refundAmount;

        const isMembership = revenueData.type === 'countPass' || revenueData.type === 'periodPass';
        if (isMembership) { daily.membershipRevenue += price; daily.membershipCount++; }
        else { daily.otherRevenue += price; daily.otherCount++; }

        if (revenueData.paymentType === 'cash') { daily.cashRevenue += price; daily.cashCount++; }
        else if (revenueData.paymentType === 'card') { daily.cardRevenue += price; daily.cardCount++; }
      });

      const dailyData: DailyRevenue[] = Array.from(dailyRevenueMap.entries())
        .map(([date, d]) => ({
          date,
          membershipRevenue: d.membershipRevenue, membershipCount: d.membershipCount,
          otherRevenue: d.otherRevenue, otherCount: d.otherCount,
          totalRevenue: d.cashRevenue + d.cardRevenue - d.refundRevenue,
          cashRevenue: d.cashRevenue, cashCount: d.cashCount,
          cardRevenue: d.cardRevenue, cardCount: d.cardCount,
          refundRevenue: d.refundRevenue
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalRevenue = dailyData.reduce((s, d) => s + d.totalRevenue, 0);
      const membershipRevenue = dailyData.reduce((s, d) => s + d.membershipRevenue, 0);
      const otherRevenue = dailyData.reduce((s, d) => s + d.otherRevenue, 0);

      const dailyTransactions: { [date: string]: RevenueData[] } = {};
      dailyTransactionsMap.forEach((v, k) => { dailyTransactions[k] = v; });

      return { year, month, totalRevenue, membershipRevenue, otherRevenue, dailyData, dailyTransactions };
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      throw new Error('매출 데이터를 불러오는데 실패했습니다.');
    }
  }

  static async getRevenueStats(): Promise<RevenueStats> {
    try {
      const boxName = this.getBoxName();
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const today = formatDateToString(now);

      const snap = await getDocs(collection(db, `box/${boxName}/revenue`));

      let totalRevenue = 0;
      let thisMonthRevenue = 0;
      let todayRevenue = 0;

      for (const yearDoc of snap.docs) {
        const yearData = yearDoc.data();
        const year = parseInt(yearDoc.id);

        for (const monthKey in yearData) {
          const monthData = yearData[monthKey];
          const month = parseInt(monthKey);

          if (monthData && typeof monthData === 'object') {
            for (const [, data] of Object.entries(monthData)) {
              const revenueData = data as RevenueData;
              const price = parseInt(revenueData.price) || 0;
              const refundAmount = parseInt(revenueData.refundAmount) || 0;
              const actual = price - refundAmount;
              const dateStr = formatDateToString(revenueData.createdAt.toDate());

              if (year === currentYear) totalRevenue += actual;
              if (year === currentYear && month === currentMonth) thisMonthRevenue += actual;
              if (dateStr === today) todayRevenue += actual;
            }
          }
        }
      }

      const averageDailyRevenue = currentMonth > 0 ? Math.floor(totalRevenue / currentMonth) : 0;

      return { totalRevenue, thisMonthRevenue, todayRevenue, averageDailyRevenue };
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw new Error('매출 통계를 불러오는데 실패했습니다.');
    }
  }

  static async updateDailyRevenue(dailyRevenue: DailyRevenue): Promise<void> {
    try {
      const boxName = this.getBoxName();
      console.log('TODO: Save daily revenue to Firebase', { boxName, dailyRevenue });
    } catch (error) {
      console.error('Error updating daily revenue:', error);
      throw new Error('매출 데이터 저장에 실패했습니다.');
    }
  }

  static async addUserMembership(membership: UserMembership, memberEmail: string, memberRealName: string): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const purchaseDate = membership.purchase.at;
      const year = purchaseDate.getFullYear();
      const month = purchaseDate.getMonth() + 1;

      const revenueDocRef = doc(db, `box/${boxName}/revenue/${year}`);
      const revenueDoc = await getDoc(revenueDocRef);
      const revenueData: { [key: string]: any } = revenueDoc.exists() ? revenueDoc.data() : {};

      if (!revenueData[month.toString()]) revenueData[month.toString()] = {};

      revenueData[month.toString()][membership.key] = {
        assignee: membership.assignee,
        createdAt: Timestamp.fromDate(purchaseDate),
        id: memberEmail,
        paymentType: membership.purchase.paymentType,
        plan: membership.plan,
        price: membership.purchase.price.toString(),
        realName: memberRealName,
        type: membership.type,
        refundAmount: '0'
      };

      await setDoc(revenueDocRef, revenueData);
    } catch (error) {
      console.error('Error adding membership revenue:', error);
      throw new Error('매출 데이터 저장에 실패했습니다.');
    }
  }

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

      const revenueDocRef = doc(db, `box/${boxName}/revenue/${year}`);
      const revenueDoc = await getDoc(revenueDocRef);
      const revenueData: { [key: string]: any } = revenueDoc.exists() ? revenueDoc.data() : {};

      if (!revenueData[month.toString()]) revenueData[month.toString()] = {};

      revenueData[month.toString()][lockerKey] = {
        assignee: '', createdAt: Timestamp.now(), id: userEmail,
        paymentType, plan: '사물함 이용권', price, realName: userName,
        type: 'locker', refundAmount: '0'
      };

      await setDoc(revenueDocRef, revenueData);
    } catch (error) {
      console.error('Error adding locker revenue:', error);
      throw new Error('락커 매출 데이터 저장에 실패했습니다.');
    }
  }

  static async refundUserMembership(membershipKey: string, refundAmount: number): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const snap = await getDocs(collection(db, `box/${boxName}/revenue`));

      for (const yearDoc of snap.docs) {
        const yearData = yearDoc.data();
        let modified = false;

        for (const monthKey in yearData) {
          const monthData = yearData[monthKey];
          if (monthData && typeof monthData === 'object' && membershipKey in monthData) {
            monthData[membershipKey].refundAmount = refundAmount.toString();
            modified = true;
          }
        }

        if (modified) {
          await setDoc(doc(db, `box/${boxName}/revenue/${yearDoc.id}`), yearData);
        }
      }
    } catch (error) {
      console.error('Error refunding membership revenue:', error);
      throw new Error('매출 환불 처리에 실패했습니다.');
    }
  }

  static async removeUserMembership(membershipKey: string): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const snap = await getDocs(collection(db, `box/${boxName}/revenue`));

      for (const yearDoc of snap.docs) {
        const yearData = yearDoc.data();
        let modified = false;

        for (const monthKey in yearData) {
          const monthData = yearData[monthKey];
          if (monthData && typeof monthData === 'object' && membershipKey in monthData) {
            delete monthData[membershipKey];
            if (Object.keys(monthData).length === 0) delete yearData[monthKey];
            modified = true;
          }
        }

        if (modified) {
          await setDoc(doc(db, `box/${boxName}/revenue/${yearDoc.id}`), Object.keys(yearData).length === 0 ? {} : yearData);
        }
      }
    } catch (error) {
      console.error('Error removing membership revenue:', error);
      throw new Error('매출 데이터 삭제에 실패했습니다.');
    }
  }
}
