  <template>
    <div class="auth-container">
      <div class="auth-logo">Kofeetih?</div>
      <h2>Register</h2>

      <form @submit.prevent="registerUser">
        <input
          v-model="last_name"
          type="text"
          placeholder="Last Name"
          required
        />

        <input
          v-model="first_name"
          type="text"
          placeholder="First Name"
          required
        />

        <select v-model="age" required>
          <option value="" disabled>Select Age</option>
          <option v-for="n in ages" :key="n" :value="n">{{ n }}</option>
        </select>

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

        <input
          v-model="password_confirmation"
          type="password"
          placeholder="Confirm Password"
          required
        />

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
  import { ref } from "vue";
  import { useAuthStore } from "../store/auth";
  import { useRouter } from "vue-router";

  export default {
    setup() {
      const last_name = ref("");
      const first_name = ref("");
      const age = ref("");
      const email = ref("");
      const password = ref("");
      const password_confirmation = ref("");
      const message = ref("");
      const loading = ref(false);

      const auth = useAuthStore();
      const router = useRouter();

      const ages = Array.from({ length: 87 }, (_, i) => i + 13);

      const registerUser = async () => {
        loading.value = true;
        message.value = "";

        try {
          await auth.register({
            last_name: last_name.value,
            first_name: first_name.value,
            age: age.value,
            email: email.value,
            password: password.value,
            password_confirmation: password_confirmation.value,
          });

          message.value = "☕ Registered successfully!";
          
          await auth.login({
            email: email.value,
            password: password.value
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
        age,
        ages,
        email,
        password,
        password_confirmation,
        message,
        loading,
        registerUser,
      };
    },
  };
  </script>

  <style src="../assets/auth.css"></style>
