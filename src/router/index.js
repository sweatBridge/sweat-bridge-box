import { h, resolveComponent } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import DefaultLayout from '@/layouts/DefaultLayout'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: DefaultLayout,
    redirect: '/admin/registered-wod-list',
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
          },
          {
            path: '/admin/registerd-wod',
            name: 'RegisteredWod',
            component: () =>
              import('@/views/admin/workout/RegisteredWorkout.vue'),
          },
          {
            path: '/admin/registered-wod-list',
            name: 'RegisteredWodList',
            component: () =>
              import('@/views/admin/workout/RegisteredWorkoutList.vue'),
          },
          {
            path: '/admin/record',
            name: 'Record',
            component: () => import('@/views/admin/workout/WorkoutHistory.vue'),
          },
          {
            path: '/admin/member',
            name: 'Member',
            component: () => import('@/views/admin/member/MemberList.vue'),
          },
          {
            path: '/admin/reservation',
            name: 'Reservation',
            component: () => import('@/views/admin/class/ClassReservation.vue'),
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

export default router
