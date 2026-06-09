import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { AuthState, LoginCredentials } from '../types/auth';
import { AuthService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  // 인증 상태는 Firebase SDK가 IndexedDB로 영구 저장 + 자동 갱신하므로,
  // localStorage의 토큰 만료 시각을 우리가 따로 추적하지 않는다.
  // onAuthStateChanged가 세션의 진실(true source)을 알려준다.
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser?.email) {
        setAuthState({ isAuthenticated: false, user: null, loading: false, error: null });
        return;
      }

      // 프로필은 localStorage 캐시 우선(빠른 렌더). 없으면 Firestore에서 fetch 후 캐시.
      let user = AuthService.getUserFromLocalStorage();
      if (!user) {
        try {
          user = await AuthService.getUserInfo(firebaseUser.email);
          AuthService.saveUserToLocalStorage(user);
        } catch (error) {
          console.error('Failed to hydrate user profile after auth state change:', error);
          user = null;
        }
      }

      setAuthState({
        isAuthenticated: !!user,
        user,
        loading: false,
        error: null,
      });
    });

    return unsubscribe;
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const user = await AuthService.login(credentials);
      
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: errorMessage
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      await AuthService.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그아웃에 실패했습니다.';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    clearError,
    isAdmin: authState.user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 