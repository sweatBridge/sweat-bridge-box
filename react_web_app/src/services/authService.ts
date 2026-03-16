import { AuthRepository } from '../repositories/authRepository';
import { LoginCredentials, User } from '../types/auth';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<User> {
    return AuthRepository.login(credentials);
  }

  static async logout(): Promise<void> {
    return AuthRepository.logout();
  }

  static async getUserInfo(email: string): Promise<User> {
    return AuthRepository.getUserInfo(email);
  }

  static saveUserToLocalStorage(user: User): void {
    AuthRepository.saveUserToLocalStorage(user);
  }

  static getUserFromLocalStorage(): User | null {
    return AuthRepository.getUserFromLocalStorage();
  }

  static checkTokenExpiration(): boolean {
    return AuthRepository.checkTokenExpiration();
  }

  static isAuthenticated(): boolean {
    return AuthRepository.isAuthenticated();
  }
}
