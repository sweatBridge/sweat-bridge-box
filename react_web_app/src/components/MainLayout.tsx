import React, { useState } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import Dashboard from '../pages/Dashboard';
import ClassReservation from '../pages/ClassReservation';

const MainLayout: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const renderContent = () => {
    switch (selectedIndex) {
      case 0:
        return <Dashboard />;
      case 1:
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            fontSize: '24px',
            color: '#64748B'
          }}>
            와드 관리
          </div>
        );
      case 2:
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            fontSize: '24px',
            color: '#64748B'
          }}>
            회원 관리
          </div>
        );
      case 3:
        return <ClassReservation />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="main-layout">
      {/* 사이드바 */}
      <AppSidebar 
        selectedIndex={selectedIndex}
        onItemSelected={setSelectedIndex}
      />
      
      {/* 메인 컨텐츠 영역 */}
      <div className="main-content">
        {/* 헤더 */}
        <AppHeader />
        
        {/* 메인 컨텐츠 */}
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MainLayout; 