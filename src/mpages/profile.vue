<template>
  <div class="profile-page">

    <div class="profile-header">
      <h1>{{ displayName }}'s Profile</h1>
      <button class="settings-btn" @click="goToSettings">⚙️</button>
    </div>

    <div class="bio-box">
      <label for="displayName">Display Name:</label>
      <input 
        id="displayName" 
        v-model="tempDisplayName" 
        placeholder="Enter display name"
      />

      <div class="bio-actions">
        <button @click="openConfirmationModal" class="save-btn">
          Save
        </button>
        <button @click="goToPreference" class="preference-btn">
          My Preferences
        </button>
      </div>

      <p class="email">{{ email }}</p>
    </div>

    <!-- Coffee Sections -->
    <div class="coffee-section">
      <h2>Liked Coffees</h2>
      <div v-if="likedCoffees.length === 0" class="empty-msg">No liked coffees yet.</div>
      <div class="coffee-grid">
        <div v-for="coffee in likedCoffees" :key="coffee.id" class="coffee-card">
          <img v-if="coffee.image_url" :src="coffee.image_url" class="coffee-img"/>
          <h3>{{ coffee.coffee_name }}</h3>
          <p>Type: {{ coffee.coffee_type }}</p>
          <p>Likes: {{ coffee.likes }}</p>
        </div>
      </div>
    </div>

    <div class="coffee-section">
      <h2>Favorited Coffees</h2>
      <div v-if="favoritedCoffees.length === 0" class="empty-msg">No favorited coffees yet.</div>
      <div class="coffee-grid">
        <div v-for="coffee in favoritedCoffees" :key="coffee.id" class="coffee-card">
          <img v-if="coffee.image_url" :src="coffee.image_url" class="coffee-img"/>
          <h3>{{ coffee.coffee_name }}</h3>
          <p>Type: {{ coffee.coffee_type }}</p>
          <p>Favorites: {{ coffee.favorites }}</p>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h3>Confirm Update</h3>
        <p>Are you sure you want to change your display name to "<strong>{{ tempDisplayName }}</strong>"?</p>
        <div class="modal-actions">
          <button @click="confirmUpdate" class="confirm-btn">Yes</button>
          <button @click="cancelUpdate" class="cancel-btn">No</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import api from "../store/axios";
import { useAuthStore } from "../store/auth";
import { useRouter } from "vue-router";

export default {
  data() {
    return {
      displayName: "coffee",
      tempDisplayName: "",
      email: "",
      coffees: [],
      showModal: false
    };
  },

  computed: {
    likedCoffees() {
      return this.coffees.filter(c => c.likedByUser);
    },
    favoritedCoffees() {
      return this.coffees.filter(c => c.favoritedByUser);
    }
  },

  methods: {
    async fetchUser() {
      try {
        const res = await api.get("/user");
        const user = res.data;

        // Get display name from localStorage first if available
        const localName = localStorage.getItem("displayName");
        this.displayName = localName || user.display_name || "coffee";
        this.tempDisplayName = this.displayName;
        this.email = user.email;

        this.auth.user = user;
      } catch (err) {
        console.error("Error fetching user:", err);

        // fallback to localStorage if backend fails
        const localName = localStorage.getItem("displayName");
        if (localName) {
          this.displayName = localName;
          this.tempDisplayName = localName;
        }
      }
    },

    async fetchCoffees() {
      try {
        const res = await api.get("/coffees");
        this.coffees = res.data.map(c => ({
          ...c,
          image_url: c.image_url || null,
          likedByUser: !!c.likedByUser,
          favoritedByUser: !!c.favoritedByUser,
          likes: c.likes ?? 0,
          favorites: c.favorites ?? 0
        }));
      } catch (err) {
        console.error("Error fetching coffees:", err);
      }
    },

    goToSettings() {
      this.router.push("/main/settings");
    },

    openConfirmationModal() {
      if (!this.tempDisplayName || this.tempDisplayName === this.displayName) return;
      this.showModal = true;
    },

    async confirmUpdate() {
      this.showModal = false;
      await this.saveDisplayName();
    },

    cancelUpdate() {
      this.showModal = false;
      this.tempDisplayName = this.displayName;
    },

    async saveDisplayName() {
      try {
        const res = await api.patch("/user/display-name", {
          display_name: this.tempDisplayName
        });

        // Update frontend
        this.displayName = res.data.display_name;
        this.tempDisplayName = res.data.display_name;
        this.auth.user.display_name = res.data.display_name;

        // Save to localStorage for persistence
        localStorage.setItem("displayName", res.data.display_name);
      } catch (err) {
        console.error("Error updating display name:", err);
        alert("Failed to update display name. Please try again.");
      }
    },

    goToPreference() {
      this.router.push("/main/preference");
    }
  },

  mounted() {
    this.router = useRouter();
    this.auth = useAuthStore();

    this.fetchUser();
    this.fetchCoffees();
  }
};
</script>

<style src="../assets/profile.css"></style>
<style src="../assets/modal.css"></style>
