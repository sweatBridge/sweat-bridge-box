import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LoginCredentials, User } from '../types/auth';

export class AuthService {
  /**
   * 로그인
   */
  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      
      // Firebase 토큰 정보 저장
      const idToken = await userCredential.user.getIdToken();
      const idTokenResult = await userCredential.user.getIdTokenResult();
      
      localStorage.setItem('userToken', idToken);
      localStorage.setItem('tokenExpiration', idTokenResult.expirationTime);
      localStorage.setItem('id', JSON.stringify(idTokenResult));
      
      // 사용자 정보 조회
      const user = await this.getUserInfo(credentials.email);
      
      // 사용자 정보를 localStorage에 저장
      this.saveUserToLocalStorage(user);
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('아이디와 비밀번호를 다시 확인해주세요.');
    }
  }

  /**
   * 로그아웃
   */
  static async logout(): Promise<void> {
    try {
      const auth = getAuth();
      await signOut(auth);
      
      // localStorage 정리
      const localStorageItems = ['userToken', 'tokenExpiration', 'id', 'boxName', 'realName', 'nickName', 'userEmail', 'userPhone', 'userRole'];
      localStorageItems.forEach(item => localStorage.removeItem(item));
      
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error('로그아웃에 실패했습니다.');
    }
  }

  /**
   * 사용자 정보 조회
   */
  static async getUserInfo(email: string): Promise<User> {
    try {
      const q = query(collection(db, 'user'), where('email', '==', email));
      const querySnap = await getDocs(q);
      
      const users: User[] = [];
      querySnap.forEach((doc) => {
        users.push(doc.data() as User);
      });
      
      if (users.length === 1) {
        return users[0];
      } else {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw new Error('사용자 정보 조회에 실패했습니다.');
    }
  }

  /**
   * 사용자 정보를 localStorage에 저장
   */
  static saveUserToLocalStorage(user: User): void {
    localStorage.setItem('boxName', user.boxName);
    localStorage.setItem('realName', user.realName);
    localStorage.setItem('nickName', user.nickName);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userPhone', user.phone);
    localStorage.setItem('userRole', user.role);
  }

  /**
   * localStorage에서 사용자 정보 조회
   */
  static getUserFromLocalStorage(): User | null {
    const boxName = localStorage.getItem('boxName');
    const realName = localStorage.getItem('realName');
    const nickName = localStorage.getItem('nickName');
    const email = localStorage.getItem('userEmail');
    const phone = localStorage.getItem('userPhone');
    const role = localStorage.getItem('userRole');

    if (boxName && realName && nickName && email && phone && role) {
      return {
        boxName,
        realName,
        nickName,
        email,
        phone,
        role
      };
    }

    return null;
  }

  /**
   * 토큰 만료 확인
   */
  static checkTokenExpiration(): boolean {
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    if (!tokenExpiration) return true;

    const tokenExpired = new Date(tokenExpiration) < new Date();
    
    if (tokenExpired) {
      // 만료된 토큰 정리
      const localStorageItems = ['userToken', 'tokenExpiration', 'id', 'boxName', 'realName', 'nickName', 'userEmail', 'userPhone', 'userRole'];
      localStorageItems.forEach(item => localStorage.removeItem(item));
      return true;
    }

    return false;
  }

  /**
   * 인증 상태 확인
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('userToken');
    const isExpired = this.checkTokenExpiration();
    
    return !!(token && !isExpired);
  }
} 