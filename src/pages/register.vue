<template>
  <div class="auth-container">
    <div class="auth-logo">Kofeetih?</div>
    <h2>Register</h2>

    <form @submit.prevent="registerUser">
      <input v-model="last_name" type="text" placeholder="Last Name" required />
      <input v-model="first_name" type="text" placeholder="First Name" required />
      <input type="date" v-model="birthdate" required class="calendar-input" />
      <input v-model="email" type="email" placeholder="Email" required />


      <div class="password-strength">
        <div
          class="strength-bar"
          :class="passwordStrengthClass"
        ></div>
        <p class="strength-text">{{ passwordStrengthText }}</p>
      </div>
      <!-- Password Field with Strength Indicator -->
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        required
        @input="checkPasswordStrength"
      />

      <input v-model="password_confirmation" type="password" placeholder="Confirm Password" required />

      <button type="submit" :disabled="loading">
        {{ loading ? "Registering..." : "Register" }}
      </button>
    </form>

    <p class="message">{{ message }}</p>

    <nav>
      <span>Already have an account?</span>
      <router-link to="/">Login</router-link>
    </nav>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { useAuthStore } from "../store/auth";
import { useRouter } from "vue-router";

export default {
  setup() {
    const last_name = ref("");
    const first_name = ref("");
    const birthdate = ref("");
    const email = ref("");
    const password = ref("");
    const password_confirmation = ref("");
    const message = ref("");
    const loading = ref(false);

    const auth = useAuthStore();
    const router = useRouter();

    const passwordStrengthScore = ref(0);

    const checkPasswordStrength = () => {
      const pwd = password.value;
      let score = 0;

      if (pwd.length >= 8) score += 1;
      if (/[A-Z]/.test(pwd)) score += 1;
      if (/[a-z]/.test(pwd)) score += 1;
      if (/\d/.test(pwd)) score += 1;
      if (/[\W_]/.test(pwd)) score += 1;

      passwordStrengthScore.value = score;
    };

    const passwordStrengthText = computed(() => {
      switch (passwordStrengthScore.value) {
        case 0:
        case 1:
        case 2:
          return "Weak";
        case 3:
        case 4:
          return "Good";
        case 5:
          return "Strong";
        default:
          return "";
      }
    });

    const passwordStrengthClass = computed(() => {
      switch (passwordStrengthScore.value) {
        case 0:
        case 1:
        case 2:
          return "weak";
        case 3:
        case 4:
          return "good";
        case 5:
          return "strong";
        default:
          return "";
      }
    });

    const registerUser = async () => {
      loading.value = true;
      message.value = "";

      // Validate password before submitting
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(password.value)) {
        message.value =
          "⚠️ Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.";
        loading.value = false;
        return;
      }

      if (password.value !== password_confirmation.value) {
        message.value = "⚠️ Passwords do not match.";
        loading.value = false;
        return;
      }

      try {
        await auth.register({
          last_name: last_name.value,
          first_name: first_name.value,
          birthdate: birthdate.value,
          email: email.value,
          password: password.value,
          password_confirmation: password_confirmation.value,
        });

        message.value = "☕ Registered successfully!";

        await auth.login({
          email: email.value,
          password: password.value,
        });

        setTimeout(() => router.push("/main/preference"), 500);
      } catch (err) {
        if (err.response?.data?.message) {
          message.value = "⚠️ " + err.response.data.message;
        } else {
          message.value = "⚠️ Registration failed.";
        }
      } finally {
        loading.value = false;
      }
    };

    return {
      last_name,
      first_name,
      birthdate,
      email,
      password,
      password_confirmation,
      message,
      loading,
      checkPasswordStrength,
      passwordStrengthText,
      passwordStrengthClass,
      registerUser,
    };
  },
};
</script>

<style src="../assets/auth.css"></style>
