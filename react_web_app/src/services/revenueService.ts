import { RevenueRepository } from '../repositories/revenueRepository';
import { DailyRevenue, MonthlyRevenue, RevenueStats } from '../types/revenue';
import { UserMembership } from '../types/membership';

export class RevenueService {
  static async getMonthlyRevenue(year: number, month: number): Promise<MonthlyRevenue> {
    return RevenueRepository.getMonthlyRevenue(year, month);
  }

  static async getRevenueStats(): Promise<RevenueStats> {
    return RevenueRepository.getRevenueStats();
  }

  static async updateDailyRevenue(dailyRevenue: DailyRevenue): Promise<void> {
    return RevenueRepository.updateDailyRevenue(dailyRevenue);
  }

  static async addUserMembership(membership: UserMembership, memberEmail: string, memberRealName: string): Promise<void> {
    return RevenueRepository.addUserMembership(membership, memberEmail, memberRealName);
  }

  static async addLockerRevenue(
    lockerKey: string,
    userEmail: string,
    userName: string,
    price: string,
    paymentType: 'cash' | 'card'
  ): Promise<void> {
    return RevenueRepository.addLockerRevenue(lockerKey, userEmail, userName, price, paymentType);
  }

  static async refundUserMembership(membershipKey: string, refundAmount: number): Promise<void> {
    return RevenueRepository.refundUserMembership(membershipKey, refundAmount);
  }

  static async removeUserMembership(membershipKey: string): Promise<void> {
    return RevenueRepository.removeUserMembership(membershipKey);
  }
}
