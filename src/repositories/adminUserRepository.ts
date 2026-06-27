import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AdminUserRole, AdminUserSummary } from '../types/adminUser';
import { BoxStatus, UserRole } from '../types/auth';

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

function formatDate(value: unknown): string {
  if (typeof value === 'string') return value.split('T')[0];
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (value instanceof Timestamp) return value.toDate().toISOString().split('T')[0];
  return '-';
}

export class AdminUserRepository {
  /** Firestore의 전체 사용자 문서를 조회합니다. */
  static async listAllUsers(): Promise<AdminUserSummary[]> {
    const snap = await getDocs(collection(db, 'user'));
    return snap.docs.map((document) => {
      const data = document.data();
      const email = typeof data.email === 'string' ? data.email : document.id;
      const boxName = typeof data.boxName === 'string' ? data.boxName : '';

      return {
        uid: document.id,
        email,
        realName: typeof data.realName === 'string' ? data.realName : '',
        nickName: typeof data.nickName === 'string' ? data.nickName : '',
        phone: typeof data.phone === 'string' ? data.phone : '',
        role: normalizeRole(data.role),
        boxName,
        status: normalizeStatus(data.status, boxName),
        createdAt: formatDate(data.createdAt),
      };
    });
  }

  /** 이메일을 문서 ID로 사용하는 사용자 문서의 역할을 변경합니다. */
  static async updateUserRole(email: string, role: UserRole): Promise<void> {
    await updateDoc(doc(db, 'user', email), { role });
  }
}
