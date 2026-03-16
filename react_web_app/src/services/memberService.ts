import { MemberRepository, FirebaseMemberData } from '../repositories/memberRepository';
import { Member, MemberLockerHistory } from '../types/member';

export class MemberService {
  static async getMembers(box: string): Promise<Member[]> {
    return MemberRepository.getMembers(box);
  }

  static async deleteMember(box: string, email: string): Promise<void> {
    return MemberRepository.deleteMember(box, email);
  }

  static async updateMemberMembership(box: string, email: string, membershipData: any): Promise<void> {
    return MemberRepository.updateMemberMembership(box, email, membershipData);
  }

  static async addMember(box: string, memberData: FirebaseMemberData): Promise<void> {
    return MemberRepository.addMember(box, memberData);
  }

  static async searchMembersByName(box: string, searchName: string): Promise<Member[]> {
    return MemberRepository.searchMembersByName(box, searchName);
  }

  static async assignLockerToMember(
    box: string,
    email: string,
    lockerNumber: number,
    startDate: string,
    endDate: string,
    key: string,
    price: string,
    paymentType: 'cash' | 'card'
  ): Promise<void> {
    return MemberRepository.assignLockerToMember(box, email, lockerNumber, startDate, endDate, key, price, paymentType);
  }

  static async updateLockerHistoryEndDate(box: string, email: string, key: string, newEndDate: string): Promise<void> {
    return MemberRepository.updateLockerHistoryEndDate(box, email, key, newEndDate);
  }

  static async unassignLockerFromMember(box: string, email: string, lockerNumber: number, endDate: string, key: string): Promise<void> {
    return MemberRepository.unassignLockerFromMember(box, email, lockerNumber, endDate, key);
  }

  static async getUserByEmail(email: string): Promise<any> {
    return MemberRepository.getUserByEmail(email);
  }

  static async getUserByPhone(phone: string): Promise<any> {
    return MemberRepository.getUserByPhone(phone);
  }

  static async getUserByRealName(realName: string): Promise<any[]> {
    return MemberRepository.getUserByRealName(realName);
  }

  static async getUserByNickName(nickName: string): Promise<any[]> {
    return MemberRepository.getUserByNickName(nickName);
  }

  static async createMember(box: string, memberData: any): Promise<void> {
    return MemberRepository.createMember(box, memberData);
  }

  static async updateUser(email: string, userData: any): Promise<any> {
    return MemberRepository.updateUser(email, userData);
  }

  static async fetchApplicants(boxName: string): Promise<any[]> {
    return MemberRepository.fetchApplicants(boxName);
  }

  static async approveApplicant(email: string, boxName: string): Promise<void> {
    return MemberRepository.approveApplicant(email, boxName);
  }

  static async rejectApplicant(email: string, boxName: string): Promise<void> {
    return MemberRepository.rejectApplicant(email, boxName);
  }

  static async removeApplication(email: string, boxName: string): Promise<void> {
    return MemberRepository.removeApplication(email, boxName);
  }

  static async updateMemberMemo(box: string, email: string, memo: string): Promise<void> {
    return MemberRepository.updateMemberMemo(box, email, memo);
  }
}
