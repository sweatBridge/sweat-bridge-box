import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { PageProvider } from '../contexts/PageContext';

const MainLayout = () => {
  const location = useLocation();
  
  // URL path에 따라 selectedIndex 결정
  const getSelectedIndex = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 0;
      case '/wod':
        return 1;
      case '/members':
        return 2;
      case '/classes':
        return 3;
      case '/revenue':
        return 4;
      case '/lockers':
        return 5;
      default:
        return 0;
    }
  };

  return (
    <PageProvider>
      <div className="main-layout">
        {/* 사이드바 */}
        <AppSidebar 
          selectedIndex={getSelectedIndex()}
        />
        
        {/* 메인 컨텐츠 영역 */}
        <div className="main-content">
          {/* 헤더 */}
          <AppHeader />
          
          {/* 메인 컨텐츠 */}
          <div className="content-area">
            <Outlet />
          </div>
        </div>
      </div>
    </PageProvider>
  );
};

export default MainLayout; 