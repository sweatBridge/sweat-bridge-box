import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    setIsLoading(true);
    
    try {
      // 로그인 로직 (임시)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 성공 시 메인 페이지로 이동
      console.log('로그인 성공');
      // 실제로는 라우터를 사용해서 페이지 이동
    } catch (error) {
      alert('로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
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
          <Dumbbell className="login-logo-icon" />
        </div>
        
        {/* 제목 */}
        <h1 className="login-title">Sweat Bridge Box</h1>
        <p className="login-subtitle">관리자 로그인</p>
        
        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit}>
          {/* 이메일 입력 */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              disabled={isLoading}
            />
          </div>
          
          {/* 비밀번호 입력 */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                disabled={isLoading}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  fontSize: '14px'
                }}
              >
                {showPassword ? '숨김' : '표시'}
              </button>
            </div>
          </div>
          
          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
          
          {/* 비밀번호 찾기 */}
          <button
            type="button"
            className="forgot-password"
            onClick={handleForgotPassword}
          >
            비밀번호를 잊으셨나요?
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 