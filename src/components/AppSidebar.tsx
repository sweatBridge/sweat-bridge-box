import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, ChevronLeft, ChevronRight, LockIcon, DollarSign } from 'lucide-react';
import NoticeIcon from './icons/NoticeIcon';

interface AppSidebarProps {
  selectedIndex: number;
}

const menuItems = [
  { icon: LayoutDashboard, title: '대시보드', index: 0, path: '/dashboard' },
  { icon: NoticeIcon, title: '공지', index: 1, path: '/notices' },
  // { icon: Dumbbell, title: '와드 관리', index: 1, path: '/wod' },
  { icon: Users, title: '회원 관리', index: 2, path: '/members' },
  { icon: Calendar, title: '수업 관리', index: 3, path: '/classes' },
  { icon: DollarSign, title: '매출 관리', index: 4, path: '/revenue' },
  { icon: LockIcon, title: '락커 관리', index: 5, path: '/lockers' },
  
];

const AppSidebar = ({ selectedIndex }: AppSidebarProps) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleItemClick = (path: string) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 로고 영역 */}
      <div className="sidebar-logo">
        {!isCollapsed && (
          <>
            <img src="/sb_icon.jpg" alt="SweatBridge" className="sidebar-logo-icon" />
            <span className="sidebar-logo-text">SweatBridge</span>
          </>
        )}
      </div>
      
      {/* 토글 버튼 */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isCollapsed ? (
          <ChevronRight className="toggle-icon" />
        ) : (
          <ChevronLeft className="toggle-icon" />
        )}
      </button>
      
      {/* 메뉴 항목들 */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isSelected = selectedIndex === item.index;
          
          return (
            <div
              key={item.index}
              className={`sidebar-nav-item ${isSelected ? 'active' : ''}`}
              onClick={() => handleItemClick(item.path)}
              title={isCollapsed ? item.title : ''}
            >
              <IconComponent className="sidebar-nav-icon" />
              {!isCollapsed && <span className="nav-text">{item.title}</span>}
            </div>
          );
        })}
      </nav>

      <style>{`
        .sidebar {
          width: 248px;
          background: var(--color-primary);
          color: #fff;
          height: 100vh;
          position: relative;
          transition: width 0.24s var(--ease);
          overflow: visible;
          display: flex;
          flex-direction: column;
        }

        .sidebar.collapsed {
          width: 76px;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          padding: 22px 20px;
          min-height: 76px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.16);
        }

        .sidebar-logo-icon {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border-radius: 8px;
          object-fit: cover;
        }

        .sidebar-logo-text {
          margin-left: 10px;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #fff;
          opacity: 1;
          transition: opacity 0.2s ease;
          white-space: nowrap;
        }

        .sidebar.collapsed .sidebar-logo-text {
          opacity: 0;
        }

        .sidebar-toggle {
          position: absolute;
          top: 24px;
          right: -13px;
          background: var(--surface);
          border: 1px solid var(--border-strong);
          color: var(--color-primary);
          border-radius: var(--radius-full);
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--dur) var(--ease);
          box-shadow: var(--shadow-sm);
          z-index: 10;
        }

        .sidebar-toggle:hover {
          color: var(--color-primary-hover);
          border-color: var(--color-primary);
        }

        .toggle-icon {
          width: 15px;
          height: 15px;
        }

        .sidebar-nav {
          padding: 14px 0;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          padding: 11px 14px;
          cursor: pointer;
          transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
          position: relative;
          margin: 3px 12px;
          border-radius: var(--radius-md);
          color: rgba(255, 255, 255, 0.78);
          font-weight: 500;
        }

        .sidebar.collapsed .sidebar-nav-item {
          justify-content: center;
          margin: 3px 14px;
          padding: 11px 8px;
        }

        .sidebar-nav-item:hover {
          background-color: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .sidebar-nav-item.active {
          background-color: rgba(255, 255, 255, 0.18);
          color: #fff;
          font-weight: 600;
        }

        .sidebar-nav-icon {
          width: 19px;
          height: 19px;
          flex-shrink: 0;
        }

        .nav-text {
          margin-left: 11px;
          font-size: 14px;
          transition: opacity 0.2s ease;
          white-space: nowrap;
        }

        .sidebar.collapsed .nav-text {
          opacity: 0;
          width: 0;
          margin-left: 0;
          overflow: hidden;
        }

        /* 툴팁 (접힌 상태에서 호버 시) */
        .sidebar.collapsed .sidebar-nav-item::after {
          content: attr(title);
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          background-color: var(--gray-900);
          color: white;
          padding: 7px 11px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity var(--dur) var(--ease);
          margin-left: 14px;
          box-shadow: var(--shadow-md);
          z-index: 100;
        }

        .sidebar.collapsed .sidebar-nav-item:hover::after {
          opacity: 1;
          visibility: visible;
        }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            z-index: 1000;
            left: ${isCollapsed ? '-76px' : '0'};
          }
        }
      `}</style>
    </div>
  );
};

export default AppSidebar; 