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
    component: 'CNavGroup',
    name: '와드 관리',
    to: '/admin/wod/register',
    icon: 'cil-list',
    items: [
      {
        component: 'CNavItem',
        name: '등록 와드 목록',
        to: '/admin/registered-wod-list',
      },
      {
        component: 'CNavItem',
        name: '새 와드 등록',
        to: '/admin/wod/register',
      }
    ],
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
    name: '수업 관리',
    to: '/admin/reservation',
    icon: 'cil-calendar',
  },
]
