import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Gradients } from '../constants/gradients';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  
  const { login, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // 이메일 쿠키에서 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  // 로그인 성공 시 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // 에러 상태 정리
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 간단한 유효성 검사
    if (!email || !password) {
      alert('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (!email.includes('@')) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    
    try {
      await login({ email, password });
      
      // 이메일 저장 옵션
      if (rememberEmail) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }
      
      // 로그인 성공 - useEffect에서 리다이렉트 처리
    } catch (error) {
      // 에러는 AuthContext에서 처리
      console.error('Login error:', error);
    }
  };

  const handleForgotPassword = () => {
    alert('비밀번호 찾기 기능은 개발 중입니다.');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* 로고 */}
        <div className="login-logo">
          <img src="/sb_icon.jpg" alt="SweatBridge" className="login-logo-icon" />
        </div>
        
        {/* 제목 */}
        <h1 className="login-title">Sweat Bridge Box</h1>
        <p className="login-subtitle">관리자 로그인</p>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit}>
          {/* 이메일 입력 */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              이메일
            </label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className="form-input with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                disabled={loading}
              />
            </div>
          </div>
          
          {/* 비밀번호 입력 */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              비밀번호
            </label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input with-icon password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 이메일 저장 옵션 */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                disabled={loading}
              />
              <span className="checkbox-text">이메일 저장</span>
            </label>
          </div>
          
          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>
          
          {/* 비밀번호 찾기 */}
          <button
            type="button"
            className="forgot-password"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            비밀번호를 잊으셨나요?
          </button>
        </form>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${Gradients.primary};
          padding: 20px;
        }

        .login-card {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }

        .login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .login-logo-icon {
          width: 90px;
          height: 90px;
          border-radius: 8px;
          object-fit: cover;
        }

        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .login-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px 0;
          font-weight: 500;
        }

        .error-message {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          text-align: left;
        }

        .form-group {
          margin-bottom: 24px;
          text-align: left;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          z-index: 1;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s;
          background: white;
        }

        .form-input.with-icon {
          padding-left: 44px;
        }

        .password-input {
          padding-right: 44px;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-input:disabled {
          background-color: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }

        .password-toggle:hover:not(:disabled) {
          color: #667eea;
        }

        .password-toggle:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .checkbox-group {
          margin-bottom: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 14px;
        }

        .checkbox-label input[type="checkbox"] {
          margin-right: 8px;
          width: 16px;
          height: 16px;
          accent-color: #667eea;
        }

        .checkbox-text {
          color: #6b7280;
          font-weight: 500;
        }

        .login-button {
          width: 100%;
          background: ${Gradients.primary};
          color: white;
          border: none;
          padding: 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .forgot-password {
          background: none;
          border: none;
          color: #667eea;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .forgot-password:hover:not(:disabled) {
          color: #5a67d8;
        }

        .forgot-password:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 24px;
            margin: 16px;
          }

          .login-title {
            font-size: 24px;
          }

          .form-input {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login; 