import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/error',
    name: 'ErrorPage',
    component: () => import('../views/ErrorPage.vue'),
    props: route => ({ 
      message: route.query.message,
      isSubWindow: route.query.isSubWindow === 'true'
    })
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/ErrorPage.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 