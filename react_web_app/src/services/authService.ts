import { AuthRepository } from '../repositories/authRepository';
import { BoxStatus, LoginCredentials, User, UserRole } from '../types/auth';

// 로그아웃/clear 시 정리할 키 목록.
// `userToken`/`tokenExpiration`/`id` 는 더 이상 저장하지 않지만, 과거 빌드에서 저장된
// 잔존 값을 청소하기 위해 의도적으로 목록에 남겨둔다 (Firebase SDK가 자체 세션을 관리).
const AUTH_STORAGE_KEYS = [
  'userToken',           // legacy — 더 이상 set하지 않음, 정리 목적으로만 keep
  'tokenExpiration',     // legacy
  'id',                  // legacy
  'boxName',
  'userBoxStatus',
  'realName',
  'nickName',
  'userEmail',
  'userPhone',
  'userRole'
] as const;

// status 필드가 없는 기존 사용자의 상태를 boxName으로 추론합니다.
function deriveBoxStatus(boxName: string): BoxStatus {
  if (!boxName) return 'NONE';
  if (boxName.startsWith('?')) return 'PENDING';
  return 'APPROVED';
}

export class AuthService {
  /**
   * 로그인 자격 정보를 검증하고, 사용자 정보와 토큰을 로컬 스토리지에 저장합니다.
   *
   * @param credentials 로그인 자격 정보
   * @returns 로그인된 사용자 정보
   * @throws 인증 실패 또는 사용자 정보 조회 실패 시 에러를 던집니다.
   */
  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      // signIn 자체가 Firebase 내부 세션을 IndexedDB에 영구 저장 + 자동 갱신한다.
      // 별도로 localStorage에 idToken/expiration을 저장하지 않는다 (XSS 절취 위험 +
      // 1시간마다 강제 로그아웃 버그 회피).
      await AuthRepository.signIn(credentials);
      const user = await this.getUserInfo(credentials.email);
      this.saveUserToLocalStorage(user);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('아이디와 비밀번호를 다시 확인해주세요.');
    }
  }

  /**
   * Firebase 세션과 로컬 인증 정보를 함께 정리합니다.
   *
   * @throws 로그아웃 처리 중 오류가 발생하면 에러를 던집니다.
   */
  static async logout(): Promise<void> {
    try {
      await AuthRepository.signOut();
      this.clearAuthStorage();
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error('로그아웃에 실패했습니다.');
    }
  }

  /**
   * 이메일로 사용자 정보를 조회합니다.
   *
   * @param email 조회할 사용자 이메일
   * @returns 단일 사용자 정보
   * @throws 사용자 정보가 없거나 중복되면 에러를 던집니다.
   */
  static async getUserInfo(email: string): Promise<User> {
    try {
      const users = await AuthRepository.getUsersByEmail(email);
      if (users.length === 1) return users[0];

      throw new Error('사용자 정보를 찾을 수 없습니다.');
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw new Error('사용자 정보 조회에 실패했습니다.');
    }
  }

  /**
   * 사용자 기본 정보를 로컬 스토리지에 저장합니다.
   *
   * @param user 저장할 사용자 정보
   */
  static saveUserToLocalStorage(user: User): void {
    localStorage.setItem('boxName', user.boxName);
    localStorage.setItem('userBoxStatus', user.status ?? deriveBoxStatus(user.boxName));
    localStorage.setItem('realName', user.realName);
    localStorage.setItem('nickName', user.nickName);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userPhone', user.phone);
    localStorage.setItem('userRole', user.role);
  }

  /**
   * 로컬 스토리지에 저장된 사용자 정보를 읽어옵니다.
   *
   * @returns 저장된 사용자 정보 또는 `null`
   */
  static getUserFromLocalStorage(): User | null {
    const boxName = localStorage.getItem('boxName');
    const savedStatus = localStorage.getItem('userBoxStatus');
    const realName = localStorage.getItem('realName');
    const nickName = localStorage.getItem('nickName');
    const email = localStorage.getItem('userEmail');
    const phone = localStorage.getItem('userPhone');
    const role = localStorage.getItem('userRole');

    if (boxName && realName && nickName && email && phone && role) {
      const status = (savedStatus as BoxStatus | null) ?? deriveBoxStatus(boxName);
      return { boxName, status, realName, nickName, email, phone, role: role as UserRole };
    }

    return null;
  }

  /**
   * 인증 관련 로컬 스토리지 키를 일괄 삭제합니다.
   *
   * 현재/과거 키 모두 정리 — Firebase SDK 자체 세션은 별도(IndexedDB)로 관리되며
   * 로그아웃 시 `AuthRepository.signOut`에서 함께 청소된다.
   */
  private static clearAuthStorage(): void {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }
}
