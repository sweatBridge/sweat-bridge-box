import { serverRead, serverWrite } from '../../data/apiClient';
import { BoxStatus } from '../../types/auth';
import { BoxUser, MemberApplicantRecord } from '../../types/member';
import { FirebaseMemberData, FirebaseMemberDocument, MemberRepository } from '../memberRepository';
import { ServerMemberRepository } from '../server/serverMemberRepository';
import { ServerUserRepository } from '../server/serverUserRepository';
import { ServerAppliedRepository } from '../server/serverAppliedRepository';

export type { FirebaseMemberData, FirebaseMemberDocument };

export class HybridMemberRepository {
  // ---- Server-first reads ----

  static async getMemberDocuments(box: string): Promise<FirebaseMemberDocument[]> {
    const serverDocs = await serverRead(
      () => ServerMemberRepository.listMembersWithDetail(box),
      `Member.getMemberDocuments(${box})`
    );
    if (serverDocs && serverDocs.length > 0) return serverDocs;
    return MemberRepository.getMemberDocuments(box);
  }

  static async getMemberDocument(box: string, email: string): Promise<Record<string, unknown> | null> {
    const serverDoc = await serverRead(
      () => ServerMemberRepository.getMemberWithDetail(box, email),
      `Member.getMemberDocument(${box}/${email})`
    );
    if (serverDoc) return serverDoc;
    return MemberRepository.getMemberDocument(box, email);
  }

  static async getUsersByField(field: string, value: string): Promise<BoxUser[]> {
    const serverUsers = await serverRead(async () => {
      const raw = field === 'phone'
        ? await ServerUserRepository.getUsersByPhone(value)
        : await ServerUserRepository.searchUsers(value);
      return raw.map(toBoxUser);
    }, `Member.getUsersByField(${field}=${value})`);
    if (serverUsers && serverUsers.length > 0) return serverUsers;
    return MemberRepository.getUsersByField(field, value);
  }

  static async getUserByEmail(email: string): Promise<BoxUser | null> {
    const serverUser = await serverRead(
      async () => toBoxUser(await ServerUserRepository.getUserByEmail(email)),
      `Member.getUserByEmail(${email})`
    );
    if (serverUser) return serverUser;
    return MemberRepository.getUserByEmail(email);
  }

  static async getApplicantMap(boxName: string): Promise<Record<string, MemberApplicantRecord> | null> {
    const serverList = await serverRead(
      () => ServerAppliedRepository.listPending(boxName),
      `Member.getApplicantMap(${boxName})`
    );
    if (serverList && serverList.length > 0) {
      return Object.fromEntries(
        serverList.map((a) => [a.email, {
          email: a.email,
          realName: a.real_name,
          phone: a.phone ?? undefined,
          birth: a.birth ?? undefined
        }])
      );
    }
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

import { ServerUserResponse } from '../server/serverUserRepository';

function toBoxUser(u: ServerUserResponse): BoxUser {
  return {
    email: u.email,
    realName: u.real_name,
    nickName: u.nick_name ?? '',
    phone: u.phone ?? '',
    boxName: u.box_name ?? '',
    status: u.status as BoxStatus,
    gender: (u.gender as 'M' | 'F') ?? undefined,
    role: u.role,
  };
}
