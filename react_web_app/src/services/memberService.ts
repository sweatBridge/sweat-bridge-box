import { Timestamp } from 'firebase/firestore';
import {
  buildMembershipInfo,
  categorizeMemberships,
  convertMembershipsFromFirebase
} from '../models/memberModel';
import { FirebaseMemberData, MemberRepository } from '../repositories/memberRepository';
import { BoxRepository } from '../repositories/boxRepository';
import { BoxUser, Member, MemberApplicant, MemberLockerHistory } from '../types/member';

export class MemberService {
  /**
   * 박스의 회원 목록을 조회하고 화면용 정보로 가공합니다.
   *
   * @param box 박스 이름
   * @returns 회원 목록
   */
  static async getMembers(box: string): Promise<Member[]> {
    try {
      const documents = await MemberRepository.getMemberDocuments(box);

      return documents.map(({ data }) => {
        const memberData = { ...data };
        const rawMemberships = Array.isArray(memberData.memberships) ? memberData.memberships : [];

        if (memberData.birth && !memberData.birthDate) {
          memberData.birthDate = memberData.birth;
        }

        const allMemberships = convertMembershipsFromFirebase(rawMemberships);
        const { pastMemberships, currentMemberships, futureMemberships, refundedMemberships } =
          categorizeMemberships(allMemberships);

        return {
          ...memberData,
          // 변환된 회원권을 노출해서 호출자가 raw Firestore 포맷을 다시 변환할 필요가 없도록 한다.
          memberships: allMemberships,
          futureMemberships,
          membershipInfo: buildMembershipInfo(
            pastMemberships,
            currentMemberships,
            futureMemberships,
            refundedMemberships
          )
        } as Member;
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  }

  /**
   * 회원 문서를 삭제합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   */
  static async deleteMember(box: string, email: string): Promise<void> {
    await MemberRepository.deleteMember(box, email);
    await BoxRepository.adjustMemberCount(box, -1);
  }

  /**
   * 회원 문서의 회원권 관련 필드를 수정합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   * @param membershipData 수정할 회원권 데이터
   */
  static async updateMemberMembership(box: string, email: string, membershipData: Record<string, unknown>): Promise<void> {
    return MemberRepository.updateMember(box, email, membershipData);
  }

  /**
   * 새 회원 문서를 추가합니다.
   *
   * @param box 박스 이름
   * @param memberData 저장할 회원 데이터
   */
  static async addMember(box: string, memberData: FirebaseMemberData): Promise<void> {
    await MemberRepository.addMember(box, memberData);
    await BoxRepository.adjustMemberCount(box, 1);
  }

  /**
   * 이름 기준으로 회원을 검색합니다.
   *
   * @param box 박스 이름
   * @param searchName 검색어
   * @returns 검색 결과 회원 목록
   */
  static async searchMembersByName(box: string, searchName: string): Promise<Member[]> {
    const allMembers = await this.getMembers(box);
    const term = searchName.trim().toLowerCase();
    if (!term) return allMembers;

    return allMembers.filter((member) => member.realName.toLowerCase().includes(term));
  }

  /**
   * 회원 문서의 락커 히스토리에 새 배정 기록을 추가합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   * @param lockerNumber 락커 번호
   * @param startDate 시작일
   * @param endDate 종료일
   * @param key 락커 배정 키
   * @param price 결제 금액
   * @param paymentType 결제 수단
   */
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
    try {
      const member = await MemberRepository.getMemberDocument(box, email);
      const lockerHistory = this.getLockerHistory(member);

      lockerHistory.push({
        lockerNum: lockerNumber,
        startDate,
        endDate,
        createdAt: Timestamp.now(),
        key,
        price,
        paymentType
      });

      await MemberRepository.updateMember(box, email, { lockerHistory });
    } catch (error) {
      console.error('Error assigning locker to member:', error);
      throw error;
    }
  }

  /**
   * 락커 히스토리의 종료일을 수정합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   * @param key 락커 배정 키
   * @param newEndDate 새 종료일
   */
  static async updateLockerHistoryEndDate(box: string, email: string, key: string, newEndDate: string): Promise<void> {
    try {
      const member = await MemberRepository.getMemberDocument(box, email);
      if (!member) throw new Error('회원 정보를 찾을 수 없습니다.');

      const lockerHistory = this.getLockerHistory(member);
      const index = lockerHistory.findIndex((item) => item.key === key);

      if (index === -1) {
        console.warn(`락커 히스토리를 찾을 수 없습니다. email: ${email}, key: ${key}`);
        return;
      }

      lockerHistory[index] = { ...lockerHistory[index], endDate: newEndDate };
      await MemberRepository.updateMember(box, email, { lockerHistory });
    } catch (error) {
      console.error('Error updating locker history endDate:', error);
      throw error;
    }
  }

  /**
   * 특정 락커 할당 기록을 반납 처리합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   * @param lockerNumber 락커 번호
   * @param key 락커 배정 키
   */
  static async unassignLockerFromMember(
    box: string,
    email: string,
    lockerNumber: number,
    key: string
  ): Promise<void> {
    try {
      const member = await MemberRepository.getMemberDocument(box, email);
      if (!member) throw new Error('회원 정보를 찾을 수 없습니다.');

      const lockerHistory = this.getLockerHistory(member);
      const index = lockerHistory.findIndex((item) => item.key === key && item.lockerNum === lockerNumber);

      if (index === -1) {
        throw new Error('해당 락커 할당 기록을 찾을 수 없습니다.');
      }

      const releasedDate = new Date().toISOString().split('T')[0];
      lockerHistory[index] = { ...lockerHistory[index], releasedDate };
      await MemberRepository.updateMember(box, email, { lockerHistory });
    } catch (error) {
      console.error('Error unassigning locker from member:', error);
      throw error;
    }
  }

  /**
   * 이메일 기준으로 사용자 정보를 조회합니다.
   *
   * `user` 컬렉션의 문서 ID가 이메일이므로 `getDoc`으로 1회 read.
   *
   * @param email 사용자 이메일
   * @returns 사용자 정보 또는 `null`
   */
  static async getUserByEmail(email: string): Promise<BoxUser | null> {
    return MemberRepository.getUserByEmail(email);
  }

  /**
   * 전화번호 기준으로 사용자 정보를 조회합니다.
   *
   * @param phone 사용자 전화번호
   * @returns 사용자 정보 또는 `null`
   */
  static async getUserByPhone(phone: string): Promise<BoxUser | null> {
    const users = await MemberRepository.getUsersByField('phone', phone);
    return users[0] ?? null;
  }

  /**
   * 실명 기준으로 사용자 목록을 조회합니다.
   *
   * @param realName 사용자 실명
   * @returns 사용자 목록
   */
  static async getUserByRealName(realName: string): Promise<BoxUser[]> {
    return MemberRepository.getUsersByField('realName', realName);
  }

  /**
   * 실명 + 박스 이름 기준으로 사용자를 조회합니다.
   *
   * 동명이인이 여러 박스에 흩어져 있을 때 결과를 현재 박스 소속으로 좁히기 위해 사용합니다.
   * Firestore 합성 인덱스를 강제하지 않기 위해 realName으로만 쿼리한 뒤 클라이언트에서
   * `boxName`으로 한 번 더 필터링합니다.
   *
   * @param realName 사용자 실명
   * @param boxName 박스 이름
   * @returns 해당 박스에 속한 동명 사용자 목록
   */
  static async getBoxUsersByRealName(realName: string, boxName: string): Promise<BoxUser[]> {
    const users = await MemberRepository.getUsersByField('realName', realName);
    return users.filter((user) => user.boxName === boxName);
  }

  /**
   * 닉네임 기준으로 사용자 목록을 조회합니다.
   *
   * @param nickName 사용자 닉네임
   * @returns 사용자 목록
   */
  static async getUserByNickName(nickName: string): Promise<BoxUser[]> {
    return MemberRepository.getUsersByField('nickName', nickName);
  }

  /**
   * 이메일을 문서 키로 사용하는 회원 문서를 생성합니다.
   *
   * @param box 박스 이름
   * @param memberData 저장할 회원 데이터
   */
  static async createMember(box: string, memberData: BoxUser & Record<string, unknown>): Promise<void> {
    try {
      const existing = await MemberRepository.getMemberDocument(box, memberData.email);
      if (existing) {
        console.log(`Member with email ${memberData.email} already exists. Skipping creation.`);
        return;
      }

      await MemberRepository.setMember(box, memberData.email, memberData);
      await BoxRepository.adjustMemberCount(box, 1);
    } catch (error) {
      console.error('멤버 추가 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 이메일과 일치하는 사용자 문서를 수정합니다.
   *
   * @param email 사용자 이메일
   * @param userData 수정 데이터
   * @returns 수정 데이터 또는 `null`
   */
  static async updateUser(email: string, userData: Partial<BoxUser>): Promise<Partial<BoxUser> | null> {
    try {
      const updated = await MemberRepository.updateUsersByEmail(email, userData);
      if (!updated) {
        console.warn('해당 이메일로 사용자를 찾을 수 없습니다:', email);
      }
      return updated;
    } catch (error) {
      console.error('사용자 업데이트 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 가입 신청자 목록을 조회합니다.
   *
   * @param boxName 박스 이름
   * @returns 신청자 목록
   */
  static async fetchApplicants(boxName: string): Promise<MemberApplicant[]> {
    try {
      const applicantMap = await MemberRepository.getApplicantMap(boxName);
      if (!applicantMap) return [];

      return Object.entries(applicantMap).map(([, applicant]) => ({
        name: applicant.realName || '',
        email: applicant.email || '',
        phone: applicant.phone || '',
        boxName,
        birth: applicant.birth || undefined
      }));
    } catch (error) {
      console.error('Failed to fetch applicants:', error);
      return [];
    }
  }

  /**
   * 가입 신청을 승인해 일반 회원으로 전환합니다.
   *
   * 박스 이름은 신청자의 `userDoc.boxName`(`?{box}` 포맷)에서 추출하므로 인자로 받지 않는다.
   *
   * @param email 신청자 이메일
   */
  static async approveApplicant(email: string, _boxName: string): Promise<void> {
    try {
      const userDoc = await this.getUserByEmail(email);
      if (!userDoc) throw new Error('사용자 정보를 찾을 수 없습니다.');
      if (!userDoc.boxName?.startsWith('?')) throw new Error('유효하지 않은 신청 상태입니다.');

      const actualBoxName = userDoc.boxName.slice(1);

      const memberData: BoxUser & Record<string, unknown> = { ...userDoc };
      if (Object.prototype.hasOwnProperty.call(memberData, 'memberships')) {
        delete memberData.memberships;
      }
      if (memberData.birth && !memberData.birthDate) {
        memberData.birthDate = memberData.birth;
        delete memberData.birth;
      }

      memberData.boxName = actualBoxName;
      memberData.status = 'APPROVED';
      memberData.joinedAt = Timestamp.now();

      // applied 제거 + user.boxName 갱신 + member 생성을 단일 writeBatch로 원자 커밋.
      await MemberRepository.commitApproveApplicantBatch(email, actualBoxName, memberData);
    } catch (error) {
      console.error('Failed to approve applicant:', error);
      throw error;
    }
  }

  /**
   * 가입 신청을 거절합니다.
   *
   * applied 컬렉션에서 신청 제거, user 문서의 boxName을 빈 문자열로, status를 REJECTED로 설정합니다.
   *
   * @param email 신청자 이메일
   * @param boxName 박스 이름
   */
  static async rejectApplicant(email: string, boxName: string): Promise<void> {
    try {
      // applied 제거 + user.boxName 비우기 + status REJECTED 설정을 단일 writeBatch로 원자 커밋.
      await MemberRepository.commitRejectApplicantBatch(email, boxName);
    } catch (error) {
      console.error('Failed to reject applicant:', error);
      throw error;
    }
  }

  /**
   * 가입 신청 문서를 제거하고 사용자 박스 이름과 상태를 APPROVED로 반영합니다.
   *
   * @param email 신청자 이메일
   * @param boxName 반영할 박스 이름
   */
  static async removeApplication(email: string, boxName: string): Promise<void> {
    try {
      await MemberRepository.deleteApplication(email, boxName);
      await MemberRepository.updateUserBoxInfo(email, boxName, 'APPROVED');
    } catch (error) {
      console.error('Failed to remove application:', error);
      throw error;
    }
  }

  /**
   * 회원 메모를 수정합니다.
   *
   * @param box 박스 이름
   * @param email 회원 이메일
   * @param memo 메모 내용
   */
  static async updateMemberMemo(box: string, email: string, memo: string): Promise<void> {
    return MemberRepository.updateMember(box, email, { memo });
  }

  /**
   * 이메일 형식을 검증합니다.
   *
   * @param email 검증할 이메일
   * @returns 유효한 형식이면 true, 그렇지 않으면 false
   */
  static validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 전화번호 형식을 검증합니다. (한국 휴대폰 형식: 01X + 7~8자리)
   *
   * @param phone 검증할 전화번호
   * @returns 유효한 형식이면 true, 그렇지 않으면 false
   */
  static validatePhoneFormat(phone: string): boolean {
    const phoneRegex = /^01[0-9]\d{7,8}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 회원 문서에서 락커 히스토리 배열을 안전하게 추출합니다.
   *
   * @param member 회원 문서 데이터
   * @returns 락커 히스토리 배열
   */
  private static getLockerHistory(member: Record<string, unknown> | null): MemberLockerHistory[] {
    const lockerHistory = member?.lockerHistory;
    return Array.isArray(lockerHistory) ? [...(lockerHistory as MemberLockerHistory[])] : [];
  }
}
