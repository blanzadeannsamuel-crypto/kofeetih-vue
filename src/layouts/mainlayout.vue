<template>
  <div class="main-layout">
    <!-- TOPBAR -->
    <header class="topbar">
      <h2 class="logo">Kofeetih?</h2>
      <nav class="top-nav" v-if="userFetched">
        <router-link v-if="showCatalog" to="/main/menu" class="nav-item" active-class="active">Coffee Menu</router-link>
        <router-link v-if="showCharts" to="/main/charts" class="nav-item" active-class="active">Charts</router-link>
        <router-link v-if="showProfile" to="/main/profile" class="nav-item" active-class="active">Profile</router-link>
        <router-link v-if="showManCoffee" to="/main/mancoffee" class="nav-item" active-class="active">Manage Coffee</router-link>
        <router-link v-if="showSettings" to="/main/userlogs" class="nav-item" active-class="active">User Logs</router-link>
        <router-link v-if="showPreference" to="/main/preference" class="nav-item" active-class="active">Preference</router-link>
        <button class="nav-item logout" @click="showLogoutModal = true">Logout</button>
      </nav>
      <p v-else>Loading navigation...</p>
    </header>

    <!-- MAIN CONTENT -->
    <main class="main-content">
      <h3 class="page-title">{{ pageTitle }}</h3>
      <div class="content">
        <router-view></router-view>
      </div>
    </main>

    <!-- LOGOUT MODAL -->
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../store/auth';
import api from '../store/axios';

export default {
  setup() {
    const auth = useAuthStore();
    const router = useRouter();
    const route = useRoute();

    const showLogoutModal = ref(false);
    const userFetched = ref(false);

    const fetchUser = async () => {
      try {
        if (!auth.user && auth.token) {
          const res = await api.get('/user');
          auth.user = res.data;
        }
      } catch (err) {
        console.error('Error fetching user for nav:', err);
      } finally {
        userFetched.value = true; // ensure nav shows even if fetch fails
      }
    };

    onMounted(() => {
      // Immediately show nav with auth.user if already present
      if (auth.user) userFetched.value = true;
      fetchUser();
    });

    const confirmLogout = async () => {
      try {
        await auth.logout();
        router.push('/');
      } catch (err) {
        console.error('Logout failed:', err);
      } finally {
        showLogoutModal.value = false;
      }
    };

    const pageTitle = computed(() => route.name?.toUpperCase() || 'PAGE');

    // Role-based nav
    const showCatalog = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'user');
    const showCharts = computed(() => auth.user?.role === 'admin');
    const showProfile = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'user');
    const showManCoffee = computed(() => auth.user?.role === 'admin');
    const showSettings = computed(() => auth.user?.role === 'admin');
    const showPreference = computed(() => auth.user?.role === 'user');

    return {
      auth,
      userFetched,
      showLogoutModal,
      confirmLogout,
      pageTitle,
      showCatalog,
      showCharts,
      showProfile,
      showManCoffee,
      showSettings,
      showPreference
    };
  }
};
</script>

<style src="../assets/mainlayout.css"></style>
