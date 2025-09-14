import React, { useState } from 'react';
import { Home, Dumbbell, Settings, LogOut } from 'lucide-react';

const AppHeader = () => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleSettingsClick = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    // 로그아웃 처리
    console.log('로그아웃 처리');
    setShowLogoutDialog(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  return (
    <>
      <header className="header">
        <div></div> {/* 좌측 빈 공간 */}
        
        <div className="header-right">
          {/* 박스 이름 */}
          <div className="box-name">
            <Home className="box-name-icon" />
            <span className="box-name-text">CrossFit Box</span>
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
                <div 
                  style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}
                  onClick={() => {
                    console.log('프로필 설정');
                    setShowSettingsMenu(false);
                  }}
                >
                  프로필 설정
                </div>
                <div 
                  style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}
                  onClick={() => {
                    console.log('박스 설정');
                    setShowSettingsMenu(false);
                  }}
                >
                  박스 설정
                </div>
                <div 
                  style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}
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
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                로그아웃
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
    </>
  );
};

export default AppHeader; 