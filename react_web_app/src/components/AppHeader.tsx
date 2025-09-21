import React, { useState } from 'react';
import { Home, Dumbbell, Settings, LogOut } from 'lucide-react';
import { usePageContext } from '../contexts/PageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../constants/colors';

const AppHeader = () => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { pageInfo } = usePageContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutDialog(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('로그아웃에 실패했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  return (
    <>
      <header className="header">
        {/* 페이지 정보 */}
        <div className="page-info">
          <h1 className="page-title">{pageInfo.title}</h1>
          <span className="page-separator">•</span>
          <p className="page-subtitle">{pageInfo.subtitle}</p>
        </div>
        
        <div className="header-right">
          {/* 박스 이름 */}
          <div className="box-name">
            <Home className="box-name-icon" />
            <span className="box-name-text">{user?.boxName || 'CrossFit Box'}</span>
          </div>
          
          {/* 박스 로고 */}
          <div className="box-logo">
            <Dumbbell className="box-logo-icon" />
          </div>
          
          {/* 관리자 설정 */}
          <div style={{ position: 'relative' }}>
            <button 
              className="header-icon-button" 
              onClick={handleSettingsClick}
              title="관리자 설정"
            >
              <Settings className="header-icon" />
            </button>
            
            {showSettingsMenu && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  minWidth: '160px',
                  marginTop: '4px'
                }}
              >
                <div className="settings-menu-header">
                  <div className="user-info">
                    <div className="user-name">{user?.realName || '관리자'}</div>
                    <div className="user-email">{user?.email}</div>
                  </div>
                </div>
                <div className="settings-menu-divider"></div>
                {/* <div 
                  className="settings-menu-item"
                  onClick={() => {
                    console.log('프로필 설정');
                    setShowSettingsMenu(false);
                  }}
                >
                  프로필 설정
                </div> */}
                <div 
                  className="settings-menu-item"
                  onClick={() => {
                    navigate('/settings');
                    setShowSettingsMenu(false);
                  }}
                >
                  박스 설정
                </div>
                <div 
                  className="settings-menu-item"
                  onClick={() => {
                    console.log('시스템 설정');
                    setShowSettingsMenu(false);
                  }}
                >
                  시스템 설정
                </div>
              </div>
            )}
          </div>
          
          {/* 로그아웃 */}
          <button 
            className="header-icon-button" 
            onClick={handleLogoutClick}
            title="로그아웃"
          >
            <LogOut className="header-icon" />
          </button>
        </div>
      </header>
      
      {/* 로그아웃 확인 다이얼로그 */}
      {showLogoutDialog && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={handleLogoutCancel}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
              로그아웃
            </h3>
            <p style={{ marginBottom: '24px', color: '#64748B' }}>
              정말 로그아웃하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleLogoutCancel}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: AppColors.primary,
                  color: 'white',
                  cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                  opacity: isLoggingOut ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isLoggingOut && (
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 설정 메뉴 외부 클릭 시 닫기 */}
      {showSettingsMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowSettingsMenu(false)}
        />
      )}

      <style>{`
        .page-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.2;
        }

        .page-separator {
          color: #d1d5db;
          font-size: 16px;
          font-weight: 500;
        }

        .page-subtitle {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
          line-height: 1.2;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .settings-menu-header {
          padding: 16px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .user-info {
          text-align: left;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .user-email {
          font-size: 12px;
          color: #6b7280;
        }

        .settings-menu-divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 0;
        }

        .settings-menu-item {
          padding: 12px 16px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: background-color 0.2s;
        }

        .settings-menu-item:hover {
          background-color: #f3f4f6;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AppHeader; 