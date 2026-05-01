import { useState } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppColors } from '../constants/colors';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

const AdminHeader = ({ title, subtitle }: AdminHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch {
      alert('로그아웃에 실패했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 28px',
        height: '72px',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>{title}</h1>
          {subtitle && <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{subtitle}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '20px',
          }}>
            <Shield size={14} color="#0284c7" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0284c7' }}>운영사</span>
            <span style={{ fontSize: '13px', color: '#374151' }}>{user?.realName || '관리자'}</span>
          </div>

          <button
            onClick={() => setShowLogoutDialog(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: 'white',
              color: '#6b7280',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#f9fafb';
              (e.currentTarget as HTMLElement).style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'white';
              (e.currentTarget as HTMLElement).style.color = '#6b7280';
            }}
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      </header>

      {showLogoutDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          }}
          onClick={() => setShowLogoutDialog(false)}
        >
          <div
            style={{ background: 'white', padding: '28px', borderRadius: '12px', width: '360px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '700' }}>로그아웃</h3>
            <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px' }}>정말 로그아웃하시겠습니까?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLogoutDialog(false)}
                style={{ padding: '8px 18px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '14px' }}
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                style={{
                  padding: '8px 18px', border: 'none', borderRadius: '6px',
                  background: AppColors.primary, color: 'white', cursor: 'pointer', fontSize: '14px',
                }}
              >
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
