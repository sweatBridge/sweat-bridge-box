import { h, resolveComponent } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import DefaultLayout from '@/layouts/DefaultLayout'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: DefaultLayout,
    redirect: '/pages/login',
    children: [
      {
        path: '/admin',
        redirect: '/admin/reservation',
        name: 'Admin',
        component: {
          render() {
            return h(resolveComponent('router-view'))
          },
        },
        children: [
          {
            path: '/admin/wod/register',
            name: 'Wod',
            component: () =>
              import('@/views/admin/workout/WorkoutRegister.vue'),
            meta: { requiresAuth: true } 
          },
          {
            path: '/admin/registerd-wod',
            name: 'RegisteredWod',
            component: () =>
              import('@/views/admin/workout/RegisteredWorkout.vue'),
            meta: { requiresAuth: true } 
          },
          {
            path: '/admin/registered-wod-list',
            name: 'RegisteredWodList',
            component: () =>
              import('@/views/admin/workout/RegisteredWorkoutList.vue'),
            meta: { requiresAuth: true } 
          },
          {
            path: '/admin/member',
            name: 'Member',
            component: () => import('@/views/admin/member/MemberList.vue'),
            meta: { requiresAuth: true } 
          },
          {
            path: '/admin/reservation',
            name: 'Reservation',
            component: () => import('@/views/admin/class/ClassReservation.vue'),
            meta: { requiresAuth: true } 
          },
          {
            path: '/admin/monetary',
            name: 'Accounting',
            component: () => import('@/views/admin/monetary/Accounting.vue'),
            meta: { requiresAuth: true } 
          },
          {
            path: '/admin/my-page',
            name: 'MyPage',
            component: () => import('@/views/pages/MyPage.vue'),
            meta: { requiresAuth: true } 
          },
        ],
      },
    ],
  },
  {
    path: '/pages',
    redirect: '/pages/404',
    name: 'Pages',
    component: {
      render() {
        return h(resolveComponent('router-view'))
      },
    },
    children: [
      {
        path: '404',
        name: 'Page404',
        component: () => import('@/views/pages/Page404'),
      },
      {
        path: '500',
        name: 'Page500',
        component: () => import('@/views/pages/Page500'),
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/pages/Login'),
      },
      {
        path: 'register/account',
        name: '계정 등록',
        component: () => import('@/views/pages/RegisterAccount.vue'),
      },
      {
        path: 'register/box',
        name: '박스 등록',
        component: () => import('@/views/pages/RegisterBox.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    // always scroll to top
    return { top: 0 }
  },
})

function checkTokenExpiration() {
  const tokenExpiration = localStorage.getItem('tokenExpiration');
  const tokenExpired = tokenExpiration && new Date(tokenExpiration) < new Date();

  if (tokenExpired) {
    // Remove token and redirect to login page
    ['userToken', 'tokenExpiration', 'id'].forEach(item => localStorage.removeItem(item));
    return true; // Indicate that the token is expired
  }

  return false; // Token is still valid
}

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const token = localStorage.getItem('userToken');

  if (requiresAuth) {
    if (checkTokenExpiration() || !token) {
      return router.push("/pages/login"); // Redirect to login if token is expired or missing
    }
  }

  next(); // Proceed to the next route
});

export default router
