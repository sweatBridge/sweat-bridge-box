import React from 'react';
import { Dumbbell, LayoutDashboard, Users, Calendar } from 'lucide-react';

interface AppSidebarProps {
  selectedIndex: number;
  onItemSelected: (index: number) => void;
}

const menuItems = [
  { icon: LayoutDashboard, title: '대시보드', index: 0 },
  { icon: Dumbbell, title: '와드 관리', index: 1 },
  { icon: Users, title: '회원 관리', index: 2 },
  { icon: Calendar, title: '수업 관리', index: 3 },
];

const AppSidebar: React.FC<AppSidebarProps> = ({ selectedIndex, onItemSelected }) => {
  return (
    <div className="sidebar">
      {/* 로고 영역 */}
      <div className="sidebar-logo">
        <Dumbbell className="sidebar-logo-icon" />
        <span className="sidebar-logo-text">Sweat Bridge Box</span>
      </div>
      
      {/* 메뉴 항목들 */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isSelected = selectedIndex === item.index;
          
          return (
            <div
              key={item.index}
              className={`sidebar-nav-item ${isSelected ? 'active' : ''}`}
              onClick={() => onItemSelected(item.index)}
            >
              <IconComponent className="sidebar-nav-icon" />
              <span>{item.title}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default AppSidebar; 