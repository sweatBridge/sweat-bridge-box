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
    to: '/admin/wod',
    icon: 'cil-list',
  },
  {
    component: 'CNavItem',
    name: '기록 관리',
    to: '/admin/record',
    icon: 'cil-basket',
  },
  {
    component: 'CNavItem',
    name: '회원 관리',
    to: '/admin/member',
    icon: 'cil-user',
  },
  {
    component: 'CNavItem',
    name: '수업 예약',
    to: '/admin/reservation',
    icon: 'cil-check-circle',
  },
]
