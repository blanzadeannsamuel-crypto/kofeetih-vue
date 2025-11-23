import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

// import Program from '../program.vue'
// import LoginPage from '../loginpage.vue'

import AuthLayout from '../layouts/authlayout.vue'
import MainLayout from '../layouts/mainlayout.vue'

import Login from '../pages/login.vue'
import Register from '../pages/register.vue'
import preference from '@/mpages/preference.vue'
import Catalog from '../mpages/catalog.vue'
import Profile from '../mpages/profile.vue'
import Charts from '../mpages/charts.vue'
import Settings from '../mpages/settings.vue'
import Preference from '@/mpages/preference.vue'


const routes = [
  // {
  //   path: '/program',
  //   name: 'program',
  //   component: Program,
  //   meta: { requiresAuth: true },
  // },
  // {
  //   path: '/loginpage',
  //   name: 'loginpage',
  //   component: LoginPage
  // },
  {
    path: '/',
    component: AuthLayout,
    children: [
      { path: '/', name: 'login', component: Login },
      { path: '/register', name: 'register', component: Register }
    ]
  },

  {
    path: '/main',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'preference', name: 'preference', component: Preference},
      { path: 'catalog', name: 'catalog', component: Catalog },
      { path: 'profile', name: 'profile', component: Profile },
      { path: 'charts', name: 'charts', component: Charts },
      { path: 'settings', name: 'settings', component: Settings },

    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.token) {
    return next('/')
  }

  if ((to.name === 'login' || to.name === 'register') 
      && auth.token 
      && auth.token !== "undefined") {
    return next('/main/preference')
  }


  next()
})

export default router
