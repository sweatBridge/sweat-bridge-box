import { serverWrite } from '../../data/apiClient';
import { BoxStatus } from '../../types/auth';
import { BoxUser, MemberApplicantRecord } from '../../types/member';
import { FirebaseMemberData, FirebaseMemberDocument, MemberRepository } from '../memberRepository';
import { ServerMemberRepository } from '../server/serverMemberRepository';
import { ServerUserRepository } from '../server/serverUserRepository';
import { ServerAppliedRepository } from '../server/serverAppliedRepository';

export type { FirebaseMemberData, FirebaseMemberDocument };

export class HybridMemberRepository {
  // ---- Firebase-only reads (server lacks embedded memberships/lockerHistory) ----

  static getMemberDocuments(box: string): Promise<FirebaseMemberDocument[]> {
    return MemberRepository.getMemberDocuments(box);
  }

  static getMemberDocument(box: string, email: string): Promise<Record<string, unknown> | null> {
    return MemberRepository.getMemberDocument(box, email);
  }

  static getUsersByField(field: string, value: string): Promise<BoxUser[]> {
    return MemberRepository.getUsersByField(field, value);
  }

  static getUserByEmail(email: string): Promise<BoxUser | null> {
    return MemberRepository.getUserByEmail(email);
  }

  static getApplicantMap(boxName: string): Promise<Record<string, MemberApplicantRecord> | null> {
    return MemberRepository.getApplicantMap(boxName);
  }

  // ---- Firebase primary writes + server fire-and-forget ----

  static async deleteMember(box: string, email: string): Promise<void> {
    await MemberRepository.deleteMember(box, email);
    serverWrite(async () => {
      const member = await ServerMemberRepository.getMemberByEmail(box, email).catch(() => null);
      if (member) await ServerMemberRepository.deleteMemberById(member.id);
    }, `Member.deleteMember(${email})`);
  }

  static async updateMember(box: string, email: string, payload: Record<string, unknown>): Promise<void> {
    await MemberRepository.updateMember(box, email, payload);
    serverWrite(async () => {
      const member = await ServerMemberRepository.getMemberByEmail(box, email).catch(() => null);
      if (!member) return;
      await ServerMemberRepository.updateMemberById(member.id, {
        real_name: payload.realName as string | undefined ?? undefined,
        nick_name: payload.nickName as string | null | undefined,
        gender: payload.gender as string | null | undefined,
        birth_date: payload.birthDate as string | null | undefined,
        phone: payload.phone as string | null | undefined,
        memo: payload.memo as string | null | undefined
      });
    }, `Member.updateMember(${email})`);
  }

  static async setMember(box: string, email: string, payload: Record<string, unknown>): Promise<void> {
    await MemberRepository.setMember(box, email, payload);
    serverWrite(async () => {
      const existing = await ServerMemberRepository.getMemberByEmail(box, email).catch(() => null);
      if (existing) {
        await ServerMemberRepository.updateMemberById(existing.id, {
          real_name: payload.realName as string | undefined ?? undefined,
          nick_name: payload.nickName as string | null | undefined,
          gender: payload.gender as string | null | undefined,
          birth_date: payload.birthDate as string | null | undefined,
          phone: payload.phone as string | null | undefined,
          memo: payload.memo as string | null | undefined
        });
      } else {
        await ServerMemberRepository.createMember({
          box_name: box,
          email,
          real_name: (payload.realName as string) || '',
          nick_name: (payload.nickName as string | null) ?? null,
          gender: (payload.gender as string | null) ?? null,
          birth_date: (payload.birthDate as string | null) ?? null,
          phone: (payload.phone as string | null) ?? null,
          memo: (payload.memo as string | null) ?? null
        });
      }
    }, `Member.setMember(${email})`);
  }

  static async addMember(box: string, memberData: FirebaseMemberData): Promise<void> {
    await MemberRepository.addMember(box, memberData);
    serverWrite(
      () => ServerMemberRepository.createMember({
        box_name: box,
        email: memberData.email,
        real_name: memberData.realName,
        nick_name: memberData.nickName ?? null,
        gender: memberData.gender ?? null,
        birth_date: memberData.birthDate ?? null,
        phone: memberData.phone ?? null
      }),
      `Member.addMember(${memberData.email})`
    );
  }

  // ---- Firebase primary + server fire-and-forget (user collection) ----

  static async updateUsersByEmail(
    email: string,
    userData: Partial<BoxUser>
  ): Promise<Partial<BoxUser> | null> {
    const result = await MemberRepository.updateUsersByEmail(email, userData);
    serverWrite(
      () => ServerUserRepository.updateUser(email, {
        real_name: userData.realName ?? undefined,
        nick_name: userData.nickName ?? undefined,
        phone: userData.phone ?? undefined,
        gender: userData.gender ?? undefined,
        birth: userData.birth ?? userData.birthDate ?? undefined,
        box_name: userData.boxName ?? undefined,
        role: userData.role ?? undefined,
        status: userData.status ?? undefined,
      }),
      `User.updateUsersByEmail(${email})`
    );
    return result;
  }

  static async deleteApplication(email: string, boxName: string): Promise<void> {
    await MemberRepository.deleteApplication(email, boxName);
    serverWrite(async () => {
      const applied = await ServerAppliedRepository.findByEmail(boxName, email);
      if (applied) await ServerAppliedRepository.deleteApplied(applied.id);
    }, `User.deleteApplication(${email})`);
  }

  static async updateUserBoxName(email: string, boxName: string): Promise<void> {
    await MemberRepository.updateUserBoxName(email, boxName);
    serverWrite(
      () => ServerUserRepository.updateUser(email, { box_name: boxName }),
      `User.updateUserBoxName(${email})`
    );
  }

  static async commitApproveApplicantBatch(
    email: string,
    boxName: string,
    memberData: Record<string, unknown>
  ): Promise<void> {
    await MemberRepository.commitApproveApplicantBatch(email, boxName, memberData);
    serverWrite(
      () => ServerMemberRepository.createMember({
        box_name: boxName,
        email,
        real_name: (memberData.realName as string) || '',
        nick_name: (memberData.nickName as string | null) ?? null,
        gender: (memberData.gender as string | null) ?? null,
        birth_date: (memberData.birthDate as string | null) ?? null,
        phone: (memberData.phone as string | null) ?? null,
        memo: (memberData.memo as string | null) ?? null
      }),
      `Member.commitApproveApplicantBatch(${email})`
    );
  }

  static commitRejectApplicantBatch(email: string, boxName: string): Promise<void> {
    return MemberRepository.commitRejectApplicantBatch(email, boxName);
  }

  static async updateUserBoxInfo(email: string, boxName: string, status: BoxStatus): Promise<void> {
    await MemberRepository.updateUserBoxInfo(email, boxName, status);
    serverWrite(
      () => ServerUserRepository.updateUser(email, { box_name: boxName, status }),
      `User.updateUserBoxInfo(${email})`
    );
  }

  static async updateUserStatus(email: string, status: BoxStatus): Promise<void> {
    await MemberRepository.updateUserStatus(email, status);
    serverWrite(
      () => ServerUserRepository.updateUser(email, { status }),
      `User.updateUserStatus(${email})`
    );
  }
}
