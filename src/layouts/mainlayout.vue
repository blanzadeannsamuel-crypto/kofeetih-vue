<template>
  <div class="layout">

    <!-- TOPBAR -->
    <header class="topbar">
      <h2 class="logo">Kofeetih?</h2>

      <nav class="top-nav">
        <template v-if="userFetched">
          <router-link v-if="showCatalog" to="/main/catalog" class="nav-item" active-class="active">Catalog</router-link>
          <router-link v-if="showCharts" to="/main/charts" class="nav-item" active-class="active">Charts</router-link>
          <router-link v-if="showProfile" to="/main/profile" class="nav-item" active-class="active">Profile</router-link>
          <router-link v-if="showSettings" to="/main/ManageUser" class="nav-item" active-class="active">Manage User</router-link>
          <router-link v-if="showPreference" to="/main/preference" class="nav-item" active-class="active">Preference</router-link>

          <!-- LOGOUT NAV ITEM -->
          <button class="nav-item logout" @click="showLogoutModal = true">Logout</button>
        </template>
      </nav>
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
    const userFetched = ref(false) // track if user info is loaded

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

    const fetchUser = async () => {
      if (!auth.user && auth.token) {
        try {
          const res = await api.get('/user')
          auth.user = res.data
        } catch (err) {
          console.error('Error fetching user for layout:', err)
        } finally {
          userFetched.value = true
        }
      } else {
        userFetched.value = true
      }
    }

    onMounted(() => {
      fetchUser()
    })

    // Role-based navigation
    const showCatalog = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'user')
    const showCharts = computed(() => auth.user?.role === 'admin')
    const showProfile = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'user')
    const showSettings = computed(() => auth.user?.role === 'admin')
    const showPreference = computed(() => auth.user?.role === 'user')

    return { 
      showLogoutModal, confirmLogout, pageTitle, auth, userFetched,
      showCatalog, showCharts, showProfile, showSettings, showPreference
    }
  }
}
</script>
<style src="../assets/mainlayout.css"></style>