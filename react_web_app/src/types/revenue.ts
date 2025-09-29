export interface DailyRevenue {
  date: string; // YYYY-MM-DD 형식
  totalRevenue: number; // 총 매출
  membershipRevenue: number; // 회원권 매출
  otherRevenue: number; // 기타 매출
  membershipCount: number; // 회원권 판매 건수
  otherCount: number; // 기타 판매 건수
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  totalRevenue: number;
  membershipRevenue: number;
  otherRevenue: number;
  dailyData: DailyRevenue[];
}

export interface RevenueStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  todayRevenue: number;
  averageDailyRevenue: number;
}

export interface RevenueState {
  monthlyRevenue: MonthlyRevenue | null;
  stats: RevenueStats;
  loading: boolean;
  error: string | null;
} 