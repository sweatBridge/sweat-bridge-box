import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, title: '대시보드', path: '/admin/dashboard' },
  { icon: Building2, title: '고객사 관리', path: '/admin/boxes' },
  { icon: PlusCircle, title: '신규 온보딩', path: '/admin/boxes/new' },
];

const ADMIN_SIDEBAR_BG = '#0f172a';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{
      width: isCollapsed ? '80px' : '260px',
      background: ADMIN_SIDEBAR_BG,
      color: 'white',
      height: '100vh',
      position: 'relative',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* 로고 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        minHeight: '80px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #3182f6 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '14px',
          fontWeight: '800',
          color: 'white',
        }}>
          SB
        </div>
        {!isCollapsed && (
          <div style={{ marginLeft: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap' }}>SweatBridge</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap' }}>운영사 관리콘솔</div>
          </div>
        )}
      </div>

      {/* 토글 버튼 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute',
          top: '24px',
          right: '16px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white',
          borderRadius: '6px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        {isCollapsed
          ? <ChevronRight size={14} />
          : <ChevronLeft size={14} />
        }
      </button>

      {/* 메뉴 */}
      <nav style={{ padding: '16px 0' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.title : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: isCollapsed ? '14px 8px' : '13px 16px',
                margin: '3px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: active ? 'rgba(49,130,246,0.25)' : 'transparent',
                borderLeft: active ? '3px solid #3182f6' : '3px solid transparent',
                transition: 'all 0.2s',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Icon size={18} color={active ? '#3182f6' : '#94a3b8'} style={{ flexShrink: 0 }} />
              {!isCollapsed && (
                <span style={{
                  marginLeft: '10px',
                  fontSize: '14px',
                  fontWeight: active ? '600' : '400',
                  color: active ? '#ffffff' : '#cbd5e1',
                  whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
