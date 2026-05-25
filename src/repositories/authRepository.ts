import { getAuth, signInWithEmailAndPassword, signOut, UserCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
   * 이메일을 문서 ID로 사용해 사용자 문서를 직접 조회합니다.
   *
   * `user` 컬렉션은 이메일을 문서 ID로 사용하므로 `where` 쿼리 대신 `getDoc`을 사용합니다.
   * 호출자 호환을 위해 배열 형태로 반환합니다(0건 또는 1건).
   *
   * @param email 조회할 사용자 이메일
   * @returns 일치하는 사용자 목록(0~1개)
   */
  static async getUsersByEmail(email: string): Promise<User[]> {
    const snap = await getDoc(doc(db, 'user', email));
    return snap.exists() ? [snap.data() as User] : [];
  }
}
