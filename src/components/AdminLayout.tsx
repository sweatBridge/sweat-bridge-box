import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/admin/dashboard': { title: '운영 대시보드', subtitle: '전체 고객사 현황을 한눈에 확인하세요' },
  '/admin/boxes': { title: '고객사 관리', subtitle: '등록된 모든 박스를 관리합니다' },
  '/admin/boxes/new': { title: '신규 고객사 등록', subtitle: '새로운 고객사(박스)를 등록합니다' },
  '/admin/classes': { title: '수업 등록 현황', subtitle: '날짜별 고객사 수업 및 예약 현황을 확인합니다' },
  '/admin/users': { title: '유저 관리', subtitle: '전체 유저와 권한을 박스별로 관리합니다' },
};

const AdminLayout = () => {
  const location = useLocation();

  const isDetailPage = location.pathname.match(/^\/admin\/boxes\/[^/]+$/) && location.pathname !== '/admin/boxes/new';
  const meta = isDetailPage
    ? { title: '박스 상세', subtitle: '박스 정보 및 운영 상태를 관리합니다' }
    : PAGE_META[location.pathname] || { title: '어드민', subtitle: '' };

  const adminTheme = {
    '--color-primary': '#1e293b',
    '--color-primary-hover': '#334155',
    '--color-primary-active': '#0f172a',
    '--color-primary-bg': '#f1f5f9',
    '--color-primary-bg-hover': '#e2e8f0',
    '--color-primary-bg-active': '#cbd5e1',
  } as React.CSSProperties;

  return (
    <div style={{ ...adminTheme, display: 'flex', height: '100vh', background: 'var(--bg-app)' }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminHeader title={meta.title} subtitle={meta.subtitle} />
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: 'var(--bg-app)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
