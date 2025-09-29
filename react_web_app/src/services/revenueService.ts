import { DailyRevenue, MonthlyRevenue, RevenueStats } from '../types/revenue';
import { UserMembership } from '../types/membership';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

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
        
        // 현금/카드 비율 랜덤 생성 (현금 30-70%, 카드 30-70%)
        const cashRatio = 0.3 + Math.random() * 0.4; // 30-70%
        const totalRevenue = membershipRevenue + otherRevenue;
        const cashRevenue = Math.floor(totalRevenue * cashRatio);
        const cardRevenue = totalRevenue - cashRevenue;
        
        const membershipCount = Math.floor(membershipRevenue / 120000);
        const otherCount = Math.floor(otherRevenue / 50000);
        const totalCount = membershipCount + otherCount;
        const cashCount = Math.floor(totalCount * cashRatio);
        const cardCount = totalCount - cashCount;
        
        dailyData.push({
          date,
          membershipRevenue,
          otherRevenue,
          totalRevenue,
          membershipCount,
          otherCount,
          cashRevenue,
          cardRevenue,
          cashCount,
          cardCount
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

  /**
   * 회원권 추가 시 매출 데이터 저장
   */
  static async addUserMembership(membership: UserMembership, memberEmail: string, memberRealName: string): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const year = membership.createdAt.getFullYear();
      const month = membership.createdAt.getMonth() + 1; // JavaScript month는 0부터 시작
      
      // Firebase 경로: box/${boxName}/revenue/${year}
      const revenueDocRef = doc(db, `box/${boxName}/revenue/${year}`);
      
      // 기존 문서 가져오기 (없으면 빈 객체로 초기화)
      const revenueDoc = await getDoc(revenueDocRef);
      let revenueData: { [key: string]: any } = {};
      
      if (revenueDoc.exists()) {
        revenueData = revenueDoc.data();
      } else {
        revenueData = {};
      }
      
      // 해당 월 데이터가 없으면 초기화
      if (!revenueData[month.toString()]) {
        revenueData[month.toString()] = {};
        console.log(`Initialized month ${month} data`);
      }
      
      // 회원권 매출 데이터 구성
      const membershipRevenueData = {
        assignee: membership.assignee,
        createdAt: membership.createdAt,
        id: memberEmail,
        paymentType: membership.paymentType,
        plan: membership.plan,
        price: membership.price,
        realName: memberRealName,
        type: membership.type
      };
      
      // 회원권 키를 사용하여 데이터 저장
      revenueData[month.toString()][membership.key] = membershipRevenueData;
      
      // Firebase에 저장
      await setDoc(revenueDocRef, revenueData);
      
    } catch (error) {
      console.error('Error adding membership revenue:', error);
      throw new Error('매출 데이터 저장에 실패했습니다.');
    }
  }

  /**
   * 회원권 삭제 시 매출 데이터에서도 제거
   */
  static async removeUserMembership(membershipKey: string): Promise<void> {
    try {
      const boxName = this.getBoxName();
      
      // revenue 컬렉션의 모든 문서 가져오기
      const revenueCollectionRef = collection(db, `box/${boxName}/revenue`);
      const revenueSnapshot = await getDocs(revenueCollectionRef);
      
      let found = false;
      let foundLocation = '';
      
      // 각 연도 문서를 순회하면서 회원권 키 찾기
      for (const yearDoc of revenueSnapshot.docs) {
        const yearData = yearDoc.data();
        const yearId = yearDoc.id;
        let yearDataModified = false;
        
        // 각 월을 순회
        for (const monthKey in yearData) {
          const monthData = yearData[monthKey];
          
          // 해당 월에 회원권 키가 있는지 확인
          if (monthData && typeof monthData === 'object' && membershipKey in monthData) {
            // 회원권 키 삭제
            delete monthData[membershipKey];
            yearDataModified = true;
            found = true;
            foundLocation = `${yearId}/${monthKey}`;
            
            console.log(`Found and removing membership key ${membershipKey} from ${foundLocation}`);
            
            // 월 데이터가 비어있으면 월 키도 삭제
            if (Object.keys(monthData).length === 0) {
              delete yearData[monthKey];
              console.log(`Removed empty month ${monthKey} from year ${yearId}`);
            }
          }
        }
        
        // 해당 연도 문서가 수정되었으면 Firebase에 업데이트
        if (yearDataModified) {
          const yearDocRef = doc(db, `box/${boxName}/revenue/${yearId}`);
          
          // 연도 데이터가 완전히 비어있으면 빈 객체로 설정
          if (Object.keys(yearData).length === 0) {
            await setDoc(yearDocRef, {});
            console.log(`Year ${yearId} is now empty but document preserved`);
          } else {
            await setDoc(yearDocRef, yearData);
          }
          
          console.log(`Updated revenue document for year ${yearId}`);
        }
      }
      
      if (found) {
        console.log(`Successfully removed membership key ${membershipKey} from ${foundLocation}`);
      } else {
        console.log(`Membership key ${membershipKey} not found in revenue data`);
      }
      
    } catch (error) {
      console.error('Error removing membership revenue:', error);
      throw new Error('매출 데이터 삭제에 실패했습니다.');
    }
  }
} 