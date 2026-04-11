import { getAuth, signInWithEmailAndPassword, signOut, UserCredential } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { LoginCredentials, User } from '../types/auth';

export class AuthRepository {
  /**
   * Firebase Auth로 이메일 로그인 요청을 수행합니다.
   *
   * @param credentials 로그인 자격 정보
   * @returns Firebase 로그인 결과
   */
  static async signIn(credentials: LoginCredentials): Promise<UserCredential> {
    const auth = getAuth();
    return signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  }

  /**
   * 현재 로그인된 Firebase Auth 세션을 종료합니다.
   */
  static async signOut(): Promise<void> {
    const auth = getAuth();
    await signOut(auth);
  }

  /**
   * 이메일과 일치하는 사용자 문서를 조회합니다.
   *
   * @param email 조회할 사용자 이메일
   * @returns 일치하는 사용자 목록
   */
  static async getUsersByEmail(email: string): Promise<User[]> {
    const q = query(collection(db, 'user'), where('email', '==', email));
    const snap = await getDocs(q);

    const users: User[] = [];
    snap.forEach((docSnap) => users.push(docSnap.data() as User));
    return users;
  }
}
