import { useState } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdminColors } from '../constants/adminColors';

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
        padding: '0 32px',
        height: '68px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', letterSpacing: '-0.01em', color: 'var(--text-strong)' }}>{title}</h1>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: AdminColors.primaryLight,
            border: `1px solid ${AdminColors.border}`,
            borderRadius: 'var(--radius-full)',
          }}>
            <Shield size={14} color={AdminColors.primary} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: AdminColors.primary }}>운영사</span>
            <span style={{ fontSize: '13px', color: 'var(--text)' }}>{user?.realName || '관리자'}</span>
          </div>

          <button
            onClick={() => setShowLogoutDialog(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
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
            style={{ background: 'var(--surface)', padding: '28px', borderRadius: 'var(--radius-lg)', width: '360px', boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '700', color: 'var(--text-strong)' }}>로그아웃</h3>
            <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: '14px' }}>정말 로그아웃하시겠습니까?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="ds-btn ds-btn--ghost"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="ds-btn ds-btn--primary"
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
