import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LoginCredentials, User } from '../types/auth';

export class AuthRepository {
  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);

      const idToken = await userCredential.user.getIdToken();
      const idTokenResult = await userCredential.user.getIdTokenResult();

      localStorage.setItem('userToken', idToken);
      localStorage.setItem('tokenExpiration', idTokenResult.expirationTime);
      localStorage.setItem('id', JSON.stringify(idTokenResult));

      const user = await this.getUserInfo(credentials.email);
      this.saveUserToLocalStorage(user);

      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('아이디와 비밀번호를 다시 확인해주세요.');
    }
  }

  static async logout(): Promise<void> {
    try {
      const auth = getAuth();
      await signOut(auth);

      const keys = ['userToken', 'tokenExpiration', 'id', 'boxName', 'realName', 'nickName', 'userEmail', 'userPhone', 'userRole'];
      keys.forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error('로그아웃에 실패했습니다.');
    }
  }

  static async getUserInfo(email: string): Promise<User> {
    try {
      const q = query(collection(db, 'user'), where('email', '==', email));
      const snap = await getDocs(q);

      const users: User[] = [];
      snap.forEach(doc => users.push(doc.data() as User));

      if (users.length === 1) return users[0];
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw new Error('사용자 정보 조회에 실패했습니다.');
    }
  }

  static saveUserToLocalStorage(user: User): void {
    localStorage.setItem('boxName', user.boxName);
    localStorage.setItem('realName', user.realName);
    localStorage.setItem('nickName', user.nickName);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userPhone', user.phone);
    localStorage.setItem('userRole', user.role);
  }

  static getUserFromLocalStorage(): User | null {
    const boxName = localStorage.getItem('boxName');
    const realName = localStorage.getItem('realName');
    const nickName = localStorage.getItem('nickName');
    const email = localStorage.getItem('userEmail');
    const phone = localStorage.getItem('userPhone');
    const role = localStorage.getItem('userRole');

    if (boxName && realName && nickName && email && phone && role) {
      return { boxName, realName, nickName, email, phone, role };
    }
    return null;
  }

  static checkTokenExpiration(): boolean {
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    if (!tokenExpiration) return true;

    const expired = new Date(tokenExpiration) < new Date();
    if (expired) {
      const keys = ['userToken', 'tokenExpiration', 'id', 'boxName', 'realName', 'nickName', 'userEmail', 'userPhone', 'userRole'];
      keys.forEach(k => localStorage.removeItem(k));
      return true;
    }
    return false;
  }

  static isAuthenticated(): boolean {
    const token = localStorage.getItem('userToken');
    return !!(token && !this.checkTokenExpiration());
  }
}
