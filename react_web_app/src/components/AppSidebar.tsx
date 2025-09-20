import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface AppSidebarProps {
  selectedIndex: number;
}

const menuItems = [
  { icon: LayoutDashboard, title: '대시보드', index: 0, path: '/dashboard' },
  { icon: Dumbbell, title: '와드 관리', index: 1, path: '/wod' },
  { icon: Users, title: '회원 관리', index: 2, path: '/members' },
  { icon: Calendar, title: '수업 관리', index: 3, path: '/classes' },
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
            <Dumbbell className="sidebar-logo-icon" />
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
          width: 280px;
          background: #2563EB;
          color: white;
          height: 100vh;
          position: relative;
          transition: width 0.3s ease;
          overflow: hidden;
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          min-height: 80px;
        }

        .sidebar-logo-icon {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }

        .sidebar-logo-text {
          margin-left: 12px;
          font-size: 20px;
          font-weight: 700;
          opacity: 1;
          transition: opacity 0.3s ease;
          white-space: nowrap;
        }

        .sidebar.collapsed .sidebar-logo-text {
          opacity: 0;
        }

        .sidebar-toggle {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }

        .toggle-icon {
          width: 16px;
          height: 16px;
        }

        .sidebar-nav {
          padding: 20px 0;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          margin: 4px 12px;
          border-radius: 8px;
        }

        .sidebar.collapsed .sidebar-nav-item {
          justify-content: center;
          margin: 4px 8px;
          padding: 16px 8px;
        }

        .sidebar-nav-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
        }

        .sidebar.collapsed .sidebar-nav-item:hover {
          transform: scale(1.05);
        }

        .sidebar-nav-item.active {
          background-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .sidebar-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: white;
          border-radius: 0 2px 2px 0;
        }

        .sidebar.collapsed .sidebar-nav-item.active::before {
          display: none;
        }

        .sidebar-nav-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .nav-text {
          margin-left: 12px;
          font-weight: 500;
          transition: opacity 0.3s ease;
          white-space: nowrap;
        }

        .sidebar.collapsed .nav-text {
          opacity: 0;
        }

        /* 툴팁 스타일 (접힌 상태에서 호버 시) */
        .sidebar.collapsed .sidebar-nav-item {
          position: relative;
        }

        .sidebar.collapsed .sidebar-nav-item::after {
          content: attr(title);
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          background-color: #1f2937;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          margin-left: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 100;
        }

        .sidebar.collapsed .sidebar-nav-item::before {
          content: '';
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-style: solid;
          border-width: 6px 6px 6px 0;
          border-color: transparent #1f2937 transparent transparent;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          margin-left: 6px;
          z-index: 100;
        }

        .sidebar.collapsed .sidebar-nav-item:hover::after,
        .sidebar.collapsed .sidebar-nav-item:hover::before {
          opacity: 1;
          visibility: visible;
        }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            z-index: 1000;
            left: ${isCollapsed ? '-280px' : '0'};
          }

          .sidebar.collapsed {
            left: -80px;
          }
        }
      `}</style>
    </div>
  );
};

export default AppSidebar; 