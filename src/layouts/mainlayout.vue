<template>
  <div class="layout">

    <!-- TOPBAR (now contains navigation) -->
    <header class="topbar">
      <h2 class="logo">Kofeetih?</h2>

      <nav class="top-nav">
        <router-link to="/main/catalog" class="nav-item" active-class="active">Catalog</router-link>
        <router-link to="/main/charts" class="nav-item" active-class="active">Charts</router-link>
        <router-link to="/main/profile" class="nav-item" active-class="active">Profile</router-link>
        <router-link to="/main/settings" class="nav-item" active-class="active">Settings</router-link>
      </nav>

      <div class="top-right">
        <router-link v-if="username" to="/main/profile" class="username">
          {{ username }}
        </router-link>

        <button class="logout-icon" @click="showLogoutModal = true">
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M16 17l1.41-1.41L14.83 13H9v-2h5.83l-2.58-2.59L16 7l5 5-5 5z"/>
            <path d="M4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>

      </div>
    </header>

    <!-- MAIN CONTENT -->
    <div class="main-content">
      <h3 class="page-title">{{ pageTitle }}</h3>
      <div class="content">
        <router-view></router-view>
      </div>
    </div>

    <!-- LOGOUT CONFIRMATION MODAL -->
    <div v-if="showLogoutModal" class="modal-overlay">
      <div class="modal">
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to log out?</p>
        <div class="modal-actions">
          <button @click="confirmLogout" class="btn-confirm">Yes, Logout</button>
          <button @click="showLogoutModal = false" class="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>

    <!-- LOGIN REQUIRED MODAL -->
    <div v-if="auth.showLoginNotification" class="modal-overlay">
      <div class="modal">
        <h3>Login Required</h3>
        <p>You must be logged in to access this page.</p>
        <div class="modal-actions">
          <router-link to="/" class="btn-confirm" @click="auth.closeNotification">
            Go to Login
          </router-link>
          <button @click="auth.closeNotification" class="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter, useRoute } from 'vue-router'
import api from '../store/axios'

export default {
  setup() {
    const auth = useAuthStore()
    const router = useRouter()
    const route = useRoute()
    const showLogoutModal = ref(false)

    const confirmLogout = async () => {
      try {
        await auth.logout()
        router.push('/')
      } catch (err) {
        console.error('Logout failed:', err)
      } finally {
        showLogoutModal.value = false
      }
    }

    const pageTitle = computed(() => route.name ? route.name.toUpperCase() : 'PAGE')
    const username = computed(() => auth.user?.display_name || '')

    const fetchUser = async () => {
      if (!auth.user && auth.token) {
        try {
          const res = await api.get('/user')
          auth.user = res.data
        } catch (err) {
          console.error('Error fetching user for layout:', err)
        }
      }
    }

    onMounted(() => {
      fetchUser()
    })

    return { showLogoutModal, confirmLogout, pageTitle, username, auth }
  }
}
</script>

<style src="../assets/mainlayout.css"></style>
