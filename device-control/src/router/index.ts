import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue')
    },
    {
      path: '/devices',
      name: 'devices',
      component: () => import('@/views/DevicesView.vue')
    },
    {
      path: '/commands',
      name: 'commands',
      component: () => import('@/views/CommandsView.vue')
    },
    {
      path: '/config',
      name: 'config',
      component: () => import('@/views/ConfigView.vue')
    },
    {
      path: '/logs',
      name: 'logs',
      component: () => import('@/views/LogsView.vue')
    }
  ]
})

export default router
