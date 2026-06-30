import { serverRead, serverWrite } from '../../data/apiClient';
import { AdminUserRole, AdminUserSummary } from '../../types/adminUser';
import { BoxStatus, UserRole } from '../../types/auth';
import { AdminUserRepository } from '../adminUserRepository';
import { MemberRepository } from '../memberRepository';
import { ServerUserRepository, ServerUserResponse } from '../server/serverUserRepository';

const USER_ROLES: AdminUserRole[] = ['member', 'coach', 'admin'];
const BOX_STATUSES: BoxStatus[] = ['NONE', 'PENDING', 'APPROVED', 'REJECTED'];

function normalizeRole(value: unknown): AdminUserRole {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'operator') return 'admin';
  return USER_ROLES.includes(normalized as AdminUserRole) ? (normalized as AdminUserRole) : 'unknown';
}

function normalizeStatus(value: unknown, boxName: string): BoxStatus {
  const normalized = String(value ?? '').toUpperCase() as BoxStatus;
  if (BOX_STATUSES.includes(normalized)) return normalized;
  if (!boxName) return 'NONE';
  return boxName.startsWith('?') ? 'PENDING' : 'APPROVED';
}

function formatServerDate(value?: string | null): string {
  return value ? value.split('T')[0] : '-';
}

function toAdminUser(user: ServerUserResponse): AdminUserSummary {
  const boxName = user.box_name ?? '';
  return {
    uid: user.email,
    email: user.email,
    realName: user.real_name,
    nickName: user.nick_name ?? '',
    phone: user.phone ?? '',
    role: normalizeRole(user.role),
    boxName,
    status: normalizeStatus(user.status, boxName),
    createdAt: formatServerDate(user.created_at),
  };
}

export class HybridAdminUserRepository {
  // ---- Server-first read ----

  static async listAllUsers(): Promise<AdminUserSummary[]> {
    const serverUsers = await serverRead(
      async () => (await ServerUserRepository.listUsers()).map(toAdminUser),
      'AdminUser.listAllUsers'
    );
    if (serverUsers && serverUsers.length > 0) return serverUsers;
    return AdminUserRepository.listAllUsers();
  }

  // ---- Firebase primary + server fire-and-forget ----

  static async updateUserRole(email: string, role: UserRole): Promise<void> {
    await AdminUserRepository.updateUserRole(email, role);
    serverWrite(
      () => ServerUserRepository.updateUser(email, { role }),
      `AdminUser.updateUserRole(${email})`
    );
  }

  /**
   * 사용자를 완전 삭제합니다.
   * 서버(PostgreSQL + Firebase Auth) 삭제를 먼저 await한 후
   * Firestore user/member 문서를 삭제합니다.
   * 서버 삭제 실패 시 예외를 던져 호출부에서 처리합니다.
   */
  static async deleteUser(email: string, boxName: string): Promise<void> {
    const actualBoxName = boxName.replace(/^\?+/, '').trim();

    // 서버(PostgreSQL + Firebase Auth) 삭제를 먼저 — 실패 시 예외 전파
    await ServerUserRepository.deleteUser(email);

    // Firestore는 서버 성공 후 삭제
    await AdminUserRepository.deleteUserDoc(email);

    if (actualBoxName) {
      await MemberRepository.deleteMember(actualBoxName, email).catch(() => {});
    }
  }
}
