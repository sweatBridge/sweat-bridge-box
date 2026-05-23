import { Timestamp } from 'firebase/firestore';

export interface DailyRevenue {
  date: string; // YYYY-MM-DD 형식
  totalRevenue: number; // 총 매출 (현금 + 카드 - 환불액)
  membershipRevenue: number; // 회원권 매출
  otherRevenue: number; // 기타 매출
  membershipCount: number; // 회원권 판매 건수
  otherCount: number; // 기타 판매 건수
  // 결제수단별 분리
  cashRevenue: number; // 현금 매출
  cardRevenue: number; // 카드 매출
  cashCount: number; // 현금 결제 건수
  cardCount: number; // 카드 결제 건수
  refundRevenue: number; // 환불액
}

export interface RevenueData {
  assignee: string;
  createdAt: Timestamp;
  id: string;
  paymentType: 'card' | 'cash' | 'transfer' | 'point';
  plan: string;
  price: string;
  realName: string;
  type: string;
  refundAmount: string;
}

export type RevenueMonthData = Record<string, RevenueData>;

export type RevenueYearData = Record<string, RevenueMonthData>;

export type DailyTransactions = Record<string, RevenueData[]>;

export interface MonthlyRevenue {
  year: number;
  month: number;
  totalRevenue: number;
  membershipRevenue: number;
  otherRevenue: number;
  dailyData: DailyRevenue[];
  dailyTransactions: DailyTransactions; // 날짜별 거래 내역
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
