export default [
  // {
  //   component: 'CNavItem',
  //   name: 'Dashboard',
  //   to: '/dashboard',
  //   icon: 'cil-speedometer',
  //   badge: {
  //     color: 'primary',
  //     text: 'NEW',
  //   },
  // },
  {
    component: 'CNavTitle',
    name: '컴포넌트',
  },
  {
    component: 'CNavItem',
    name: '와드 관리',
    to: '/admin/registered-wod-list',
    icon: 'cil-list',
  },
  {
    component: 'CNavItem',
    name: '회원 관리',
    to: '/admin/member',
    icon: 'cil-user',
  },
  {
    component: 'CNavItem',
    name: '수업 관리',
    to: '/admin/reservation',
    icon: 'cil-calendar',
  },
  {
    component: 'CNavItem',
    name: '마이페이지',
    to: '/admin/my-page',
    icon: 'cil-user',
  }
]
