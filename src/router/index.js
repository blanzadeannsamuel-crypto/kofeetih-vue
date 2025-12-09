import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../store/axios'

import AuthLayout from '../layouts/authlayout.vue'
import MainLayout from '../layouts/mainlayout.vue'

import Login from '../pages/login.vue'
import Register from '../pages/register.vue'
import Menu from '../mpages/catalog.vue'
import Profile from '../mpages/profile.vue'
import Charts from '../mpages/charts.vue'
import ManageCoffee from '../mpages/managecoffee.vue'
import UserLogs from '../mpages/logs.vue'
import Preference from '@/mpages/preference.vue'

const routes = [
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: '', name: 'login', component: Login },
      { path: 'register', name: 'register', component: Register }
    ]
  },

  {
    path: '/main',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'preference', name: 'preference', component: Preference, meta: { role: ['user','admin'] }},
      { path: 'menu', name: 'menu', component: Menu, meta: { role: ['user','admin'] }},
      { path: 'profile', name: 'profile', component: Profile, meta: { role: ['user','admin'] }},
      { path: 'mancoffee', name: 'manage coffee', component: ManageCoffee, meta: { role: ['admin'] }},
      { path: 'userlogs', name: 'userlogs', component: UserLogs, meta: { role: ['admin'] }},
      { path: 'charts', name: 'charts', component: Charts, meta: { role: ['admin'] }},
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.token) return next('/')

  if (auth.token && !auth.user) {
    try {
      const res = await api.get('/user')
      auth.user = res.data
    } catch (err) {
      console.error('Error fetching user in router guard:', err)
      auth.token = null
      localStorage.removeItem('token')
      return next('/')
    }
  }

  if ((to.name === 'login' || to.name === 'register') && auth.token) {
    return next('/main/menu')
  }

  const userRole = auth.user?.role
  if (to.meta.role && !to.meta.role.includes(userRole)) {
    return next('/main/menu') 
  }

  next()
})

export default router
