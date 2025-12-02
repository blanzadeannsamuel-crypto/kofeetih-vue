<template>
  <div class="auth-container">
    <div class="auth-logo">Kofeetih?</div>
    <h2>Login</h2>

    <form @submit.prevent="loginUser">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        required
      />

      <input
        v-model="password"
        type="password"
        placeholder="Password"
        required
      />

      <button type="submit" :disabled="loading">
        {{ loading ? "Logging in..." : "Login" }}
      </button>
    </form>

    <p class="message">{{ message }}</p>

    <nav>
      <span>Don't have an account?</span>
      <router-link to="/register">Register</router-link>
    </nav>
  </div>
</template>

<script>
import { useAuthStore } from "../store/auth";

export default {
  data() {
    return {
      email: "",
      password: "",
      message: "",
      loading: false,
    };
  },

  methods: {
    async loginUser() {
      this.loading = true;
      this.message = "";

      const auth = useAuthStore();

      try {
        // 🔥 LOGIN
        const userData = await auth.login({
          email: this.email,
          password: this.password,
        });

        // userData contains: id, name, email, role
        const role = userData?.role;

        this.message = "☕ Login successful!";

        // Small pause for UI feedback
        setTimeout(() => {
          // 🔥 REDIRECT BASED ON ROLE
          if (role === "admin") {
            this.$router.push("/admin/catalog");
          } else {
            this.$router.push("/main/catalog");
          }
        }, 500);

      } catch (err) {
        this.message = "⚠️ Invalid email or password.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style src="../assets/auth.css"></style>
