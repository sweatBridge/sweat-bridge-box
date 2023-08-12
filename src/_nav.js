export default [
  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: '/dashboard',
    icon: 'cil-speedometer',
    badge: {
      color: 'primary',
      text: 'NEW',
    },
  },
  {
    component: 'CNavTitle',
    name: 'Components',
  },
  {
    component: 'CNavItem',
    name: '와드 관리',
    to: '/base/accordion',
    icon: 'cil-list',
  },
  {
    component: 'CNavItem',
    name: '와드 기록',
    to: '/base/accordion',
    icon: 'cil-basket',
  },
  {
    component: 'CNavItem',
    name: '회원 관리',
    to: '/base/accordion',
    icon: 'cil-user',
  },
  {
    component: 'CNavItem',
    name: '수업 예약',
    to: '/admin/reservation',
    icon: 'cil-check-circle',
  },
]
