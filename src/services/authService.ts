import { AuthRepository } from '../repositories';
import { BoxStatus, LoginCredentials, User, UserRole } from '../types/auth';

const AUTH_STORAGE_KEYS = [
  'userToken',
  'tokenExpiration',
  'id',
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
      const userCredential = await AuthRepository.signIn(credentials);
      const idToken = await userCredential.user.getIdToken();
      const idTokenResult = await userCredential.user.getIdTokenResult();
      const user = await this.getUserInfo(credentials.email);

      localStorage.setItem('userToken', idToken);
      localStorage.setItem('tokenExpiration', idTokenResult.expirationTime);
      localStorage.setItem('id', JSON.stringify(idTokenResult));
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
   * 저장된 토큰의 만료 여부를 확인하고, 만료 시 로컬 인증 정보를 제거합니다.
   *
   * @returns 토큰이 만료되었으면 `true`
   */
  static checkTokenExpiration(): boolean {
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    if (!tokenExpiration) return true;

    const expired = new Date(tokenExpiration) < new Date();
    if (expired) {
      this.clearAuthStorage();
    }

    return expired;
  }

  /**
   * 현재 사용자가 인증 상태인지 확인합니다.
   *
   * @returns 유효한 토큰이 있으면 `true`
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('userToken');
    return !!(token && !this.checkTokenExpiration());
  }

  /**
   * 인증 관련 로컬 스토리지 키를 일괄 삭제합니다.
   */
  private static clearAuthStorage(): void {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }
}
