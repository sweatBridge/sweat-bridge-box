import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, ChevronLeft, ChevronRight, LayoutDashboard, PlusCircle, Users } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, title: '대시보드', path: '/admin/dashboard' },
  { icon: Building2, title: '고객사 관리', path: '/admin/boxes' },
  { icon: Users, title: '유저 관리', path: '/admin/users' },
  { icon: PlusCircle, title: '고객사 등록', path: '/admin/boxes/new' },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isMenuActive = (path: string) => {
    if (path === '/admin/boxes') {
      return location.pathname === path
        || (location.pathname.startsWith('/admin/boxes/') && location.pathname !== '/admin/boxes/new');
    }
    return location.pathname === path;
  };

  return (
    <aside className={`admin-sidebar${isCollapsed ? ' admin-sidebar--collapsed' : ''}`}>
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__mark">SB</div>
        <div className="admin-sidebar__brand-copy">
          <strong>SweatBridge</strong>
          <span>운영사 관리콘솔</span>
        </div>
      </div>

      <button
        className="admin-sidebar__toggle"
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>

      <nav className="admin-sidebar__nav">
        {menuItems.map(({ icon: Icon, title, path }) => {
          const active = isMenuActive(path);
          return (
            <button
              key={path}
              className={`admin-sidebar__item${active ? ' admin-sidebar__item--active' : ''}`}
              type="button"
              title={isCollapsed ? title : undefined}
              onClick={() => navigate(path)}
            >
              <Icon />
              <span>{title}</span>
            </button>
          );
        })}
      </nav>

      <style>{`
        .admin-sidebar {
          width: 248px;
          height: 100vh;
          position: relative;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          overflow: visible;
          color: #fff;
          background: #0f172a;
          transition: width 0.24s var(--ease);
        }
        .admin-sidebar--collapsed { width: 76px; }
        .admin-sidebar__brand {
          min-height: 76px;
          padding: 20px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.16);
        }
        .admin-sidebar__mark {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: linear-gradient(135deg, #3182f6 0%, #1d4ed8 100%);
          font-size: 13px;
          font-weight: 800;
        }
        .admin-sidebar__brand-copy {
          min-width: 0;
          margin-left: 10px;
          display: flex;
          flex-direction: column;
          white-space: nowrap;
          transition: opacity 0.18s var(--ease);
        }
        .admin-sidebar__brand-copy strong { font-size: 15px; letter-spacing: -0.01em; }
        .admin-sidebar__brand-copy span { margin-top: 2px; font-size: 11px; color: rgba(255,255,255,0.68); }
        .admin-sidebar--collapsed .admin-sidebar__brand-copy { opacity: 0; width: 0; margin-left: 0; overflow: hidden; }
        .admin-sidebar__toggle {
          position: absolute;
          top: 25px;
          right: -13px;
          z-index: 10;
          width: 26px;
          height: 26px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
          background: var(--surface);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-sm);
          cursor: pointer;
        }
        .admin-sidebar__toggle svg { width: 15px; height: 15px; }
        .admin-sidebar__nav { padding: 14px 0; display: flex; flex-direction: column; gap: 3px; }
        .admin-sidebar__item {
          min-height: 42px;
          margin: 0 12px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          gap: 11px;
          color: rgba(255,255,255,0.78);
          background: transparent;
          border: 0;
          border-radius: var(--radius-md);
          font: inherit;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
        }
        .admin-sidebar__item:hover { color: #fff; background: rgba(255,255,255,0.12); }
        .admin-sidebar__item--active { color: #fff; background: rgba(49,130,246,0.25); font-weight: 600; }
        .admin-sidebar__item svg { width: 19px; height: 19px; flex-shrink: 0; }
        .admin-sidebar__item span { white-space: nowrap; }
        .admin-sidebar--collapsed .admin-sidebar__item { justify-content: center; padding: 0; margin: 0 14px; }
        .admin-sidebar--collapsed .admin-sidebar__item span { display: none; }
      `}</style>
    </aside>
  );
};

export default AdminSidebar;
