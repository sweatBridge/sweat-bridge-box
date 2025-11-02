import { DailyRevenue, MonthlyRevenue, RevenueStats } from '../types/revenue';
import { UserMembership } from '../types/membership';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';

interface RevenueData {
  assignee: string;
  createdAt: Timestamp;
  id: string;
  paymentType: 'card' | 'cash';
  plan: string;
  price: string;
  realName: string;
  type: string;
}

export class RevenueService {
  private static getBoxName(): string {
    return localStorage.getItem('boxName') || 'SWEAT';
  }

  /**
   * 월별 매출 데이터 조회
   */
  static async getMonthlyRevenue(year: number, month: number): Promise<MonthlyRevenue> {
    try {
      const boxName = this.getBoxName();
      const revenueDocRef = doc(db, `box/${boxName}/revenue/${year}`);
      
      // Firebase에서 해당 연도 문서 가져오기
      const revenueDoc = await getDoc(revenueDocRef);
      
      if (!revenueDoc.exists()) {
        // 데이터가 없으면 빈 결과 반환
        return {
          year,
          month,
          totalRevenue: 0,
          membershipRevenue: 0,
          otherRevenue: 0,
          dailyData: []
        };
      }

      const yearData = revenueDoc.data();
      const monthData = yearData[month.toString()] || {};

      // 일별 매출 데이터를 담을 Map
      const dailyRevenueMap = new Map<string, {
        membershipRevenue: number;
        membershipCount: number;
        otherRevenue: number;
        otherCount: number;
        cashRevenue: number;
        cashCount: number;
        cardRevenue: number;
        cardCount: number;
      }>();

      // 각 매출 데이터를 일별로 집계
      Object.entries(monthData).forEach(([revenueKey, data]) => {
        const revenueData = data as RevenueData;
        
        // createdAt을 Date로 변환하고 날짜 문자열 생성 (로컬 시간 기준)
        const createdDate = revenueData.createdAt.toDate();
        const year = createdDate.getFullYear();
        const month = String(createdDate.getMonth() + 1).padStart(2, '0');
        const day = String(createdDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // 해당 날짜의 데이터가 없으면 초기화
        if (!dailyRevenueMap.has(dateStr)) {
          dailyRevenueMap.set(dateStr, {
            membershipRevenue: 0,
            membershipCount: 0,
            otherRevenue: 0,
            otherCount: 0,
            cashRevenue: 0,
            cashCount: 0,
            cardRevenue: 0,
            cardCount: 0
          });
        }

        const dailyData = dailyRevenueMap.get(dateStr)!;
        const price = parseInt(revenueData.price) || 0;

        // 회원권과 기타 매출 구분
        // type이 countPass 또는 periodPass면 회원권, 그 외는 기타
        const isMembership = revenueData.type === 'countPass' || revenueData.type === 'periodPass';
        
        if (isMembership) {
          dailyData.membershipRevenue += price;
          dailyData.membershipCount += 1;
        } else {
          dailyData.otherRevenue += price;
          dailyData.otherCount += 1;
        }

        // 결제 수단별 집계
        if (revenueData.paymentType === 'cash') {
          dailyData.cashRevenue += price;
          dailyData.cashCount += 1;
        } else if (revenueData.paymentType === 'card') {
          dailyData.cardRevenue += price;
          dailyData.cardCount += 1;
        }
      });

      // Map을 배열로 변환하고 날짜순 정렬
      const dailyData: DailyRevenue[] = Array.from(dailyRevenueMap.entries())
        .map(([date, data]) => ({
          date,
          membershipRevenue: data.membershipRevenue,
          membershipCount: data.membershipCount,
          otherRevenue: data.otherRevenue,
          otherCount: data.otherCount,
          totalRevenue: data.membershipRevenue + data.otherRevenue,
          cashRevenue: data.cashRevenue,
          cashCount: data.cashCount,
          cardRevenue: data.cardRevenue,
          cardCount: data.cardCount
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 월별 총계 계산
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
   */
  static async getRevenueStats(): Promise<RevenueStats> {
    try {
      const boxName = this.getBoxName();
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const today = now.toISOString().split('T')[0];

      // revenue 컬렉션의 모든 문서 가져오기
      const revenueCollectionRef = collection(db, `box/${boxName}/revenue`);
      const revenueSnapshot = await getDocs(revenueCollectionRef);

      let totalRevenue = 0;
      let thisMonthRevenue = 0;
      let todayRevenue = 0;

      // 모든 연도의 데이터 순회
      for (const yearDoc of revenueSnapshot.docs) {
        const yearData = yearDoc.data();
        const year = parseInt(yearDoc.id);

        // 각 월 데이터 순회
        for (const monthKey in yearData) {
          const monthData = yearData[monthKey];
          const month = parseInt(monthKey);

          if (monthData && typeof monthData === 'object') {
            // 각 매출 데이터 순회
            for (const [, data] of Object.entries(monthData)) {
              const revenueData = data as RevenueData;
              const price = parseInt(revenueData.price) || 0;
              const createdDate = revenueData.createdAt.toDate();
              const dataYear = createdDate.getFullYear();
              const dataMonth = createdDate.getMonth() + 1;
              const dataDay = String(createdDate.getDate()).padStart(2, '0');
              const dateStr = `${dataYear}-${String(dataMonth).padStart(2, '0')}-${dataDay}`;

              // 이번 해 매출 누적
              if (year === currentYear) {
                totalRevenue += price;
              }

              // 이번 달 매출 체크
              if (year === currentYear && month === currentMonth) {
                thisMonthRevenue += price;
              }

              // 오늘 매출 체크
              if (dateStr === today) {
                todayRevenue += price;
              }
            }
          }
        }
      }

      // 월평균 매출 계산 (올해 1월부터 현재 월까지)
      // currentMonth는 1~12 사이의 값
      const averageDailyRevenue = currentMonth > 0 
        ? Math.floor(totalRevenue / currentMonth) 
        : 0;

      return {
        totalRevenue,
        thisMonthRevenue,
        todayRevenue,
        averageDailyRevenue
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
   * 회원권 추가 시 매출 데이터 저장 (새 구조 지원)
   */
  static async addUserMembership(membership: UserMembership, memberEmail: string, memberRealName: string): Promise<void> {
    try {
      const boxName = this.getBoxName();
      const purchaseDate = membership.purchase.at;
      const year = purchaseDate.getFullYear();
      const month = purchaseDate.getMonth() + 1;
      
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
        createdAt: Timestamp.fromDate(purchaseDate),
        id: memberEmail,
        paymentType: membership.purchase.paymentType,
        plan: membership.plan,
        price: membership.purchase.price.toString(),
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
   * 락커 배정 시 매출 데이터 저장
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
      
      // Firebase 경로: box/${boxName}/revenue/${year}
      const revenueDocRef = doc(db, `box/${boxName}/revenue/${year}`);
      
      // 기존 문서 가져오기
      const revenueDoc = await getDoc(revenueDocRef);
      let revenueData: { [key: string]: any } = {};
      
      if (revenueDoc.exists()) {
        revenueData = revenueDoc.data();
      }
      
      // 해당 월 데이터가 없으면 초기화
      if (!revenueData[month.toString()]) {
        revenueData[month.toString()] = {};
        console.log(`Initialized month ${month} data`);
      }
      
      // 락커 매출 데이터 구성
      const lockerRevenueData = {
        assignee: '',
        createdAt: Timestamp.now(),
        id: userEmail,
        paymentType: paymentType,
        plan: '사물함 이용권',
        price: price,
        realName: userName,
        type: 'locker'
      };
      
      // 락커 키를 사용하여 데이터 저장
      revenueData[month.toString()][lockerKey] = lockerRevenueData;
      
      // Firebase에 저장
      await setDoc(revenueDocRef, revenueData);
      
      console.log(`Locker revenue added with key ${lockerKey}`);
    } catch (error) {
      console.error('Error adding locker revenue:', error);
      throw new Error('락커 매출 데이터 저장에 실패했습니다.');
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