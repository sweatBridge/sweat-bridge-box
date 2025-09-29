import { DailyRevenue, MonthlyRevenue, RevenueStats } from '../types/revenue';

export class RevenueService {
  private static getBoxName(): string {
    return localStorage.getItem('boxName') || 'SWEAT';
  }

  /**
   * 월별 매출 데이터 조회
   * TODO: Firebase 연동 필요
   */
  static async getMonthlyRevenue(year: number, month: number): Promise<MonthlyRevenue> {
    try {
      const boxName = this.getBoxName();
      
      // TODO: Firebase에서 실제 데이터 가져오기
      // const path = `/box/${boxName}/revenue/${year}/${month}`;
      
      // 임시 더미 데이터
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyData: DailyRevenue[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const membershipRevenue = Math.floor(Math.random() * 500000) + 50000;
        const otherRevenue = Math.floor(Math.random() * 200000);
        
        dailyData.push({
          date,
          membershipRevenue,
          otherRevenue,
          totalRevenue: membershipRevenue + otherRevenue,
          membershipCount: Math.floor(membershipRevenue / 120000),
          otherCount: Math.floor(otherRevenue / 50000)
        });
      }

      const totalRevenue = dailyData.reduce((sum, day) => sum + day.totalRevenue, 0);
      const membershipRevenue = dailyData.reduce((sum, day) => sum + day.membershipRevenue, 0);
      const otherRevenue = dailyData.reduce((sum, day) => sum + day.otherRevenue, 0);

      return {
        year,
        month,
        totalRevenue,
        membershipRevenue,
        otherRevenue,
        dailyData
      };
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      throw new Error('매출 데이터를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 매출 통계 조회
   * TODO: Firebase 연동 필요
   */
  static async getRevenueStats(): Promise<RevenueStats> {
    try {
      const boxName = this.getBoxName();
      
      // TODO: Firebase에서 실제 통계 데이터 가져오기
      // const path = `/box/${boxName}/revenue/stats`;
      
      // 임시 더미 데이터
      return {
        totalRevenue: 12280000,
        thisMonthRevenue: 1750000,
        todayRevenue: 270000,
        averageDailyRevenue: 58000
      };
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw new Error('매출 통계를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 일별 매출 데이터 추가/수정
   * TODO: Firebase 연동 필요
   */
  static async updateDailyRevenue(dailyRevenue: DailyRevenue): Promise<void> {
    try {
      const boxName = this.getBoxName();
      
      // TODO: Firebase에 데이터 저장
      // const path = `/box/${boxName}/revenue/${year}/${month}/${day}`;
      // await setDoc(doc(db, path), dailyRevenue);
      
      console.log('TODO: Save daily revenue to Firebase', { boxName, dailyRevenue });
    } catch (error) {
      console.error('Error updating daily revenue:', error);
      throw new Error('매출 데이터 저장에 실패했습니다.');
    }
  }
} 