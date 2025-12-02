<template>
  <div class="profile-page" v-if="!loading">

    <!-- HEADER -->
    <div class="profile-header">
      <h1>{{ displayName }}'s Profile</h1>
      <button class="settings-btn" @click="openSettingsModal">⚙️</button>
    </div>

    <!-- BIO BOX -->
    <div class="bio-box">

      <!-- DISPLAY NAME -->
      <label for="displayName">Display Name:</label>
      <input 
        id="displayName" 
        v-model="tempDisplayName" 
        placeholder="Enter display name"
        @input="checkLength"
        maxlength="15"
      />
      <p v-if="nameTooLong" class="notif">Display name cannot exceed 15 characters!</p>
      
      <div class="bio-actions">
        <button @click="openDisplayNameConfirmation" class="save-btn">
          Save Display Name
        </button>
        <button @click="goToPreference" class="preference-btn">
          My Preferences
        </button>
      </div>

      <p class="first_name"><strong>First Name:</strong> {{ firstName }}</p>
      <p class="age"><strong>Age:</strong> {{ age }}</p>
      <p class="email"><strong>Email:</strong> {{ email }}</p>
    </div>

    <!-- LIKED COFFEES -->
    <div class="coffee-section">
      <h2>Liked Coffees</h2>
      <div v-if="likedCoffees.length === 0" class="empty-msg">
        No liked coffees yet.
      </div>
      <div class="coffee-grid">
        <div
          v-for="coffee in likedCoffees"
          :key="coffee.id"
          class="coffee-card"
        >
          <img v-if="coffee.image_url" :src="coffee.image_url" class="coffee-img"/>
          <h3>{{ coffee.coffee_name }}</h3>
          <p>Type: {{ coffee.coffee_type }}</p>
          <p>Likes: {{ coffee.likes }}</p>
        </div>
      </div>
    </div>

    <!-- FAVORITED COFFEES -->
    <div class="coffee-section">
      <h2>Favorited Coffees</h2>
      <div v-if="favoritedCoffees.length === 0" class="empty-msg">
        No favorited coffees yet.
      </div>
      <div class="coffee-grid">
        <div
          v-for="coffee in favoritedCoffees"
          :key="coffee.id"
          class="coffee-card"
        >
          <img v-if="coffee.image_url" :src="coffee.image_url" class="coffee-img"/>
          <h3>{{ coffee.coffee_name }}</h3>
          <p>Type: {{ coffee.coffee_type }}</p>
          <p>Favorites: {{ coffee.favorites }}</p>
        </div>
      </div>
    </div>

    <!-- DISPLAY NAME CONFIRMATION MODAL -->
    <div v-if="showDisplayNameModal" class="modal-overlay">
      <div class="modal">
        <h3>Confirm Update</h3>
        <p>
          Are you sure you want to change your display name to
          "<strong>{{ tempDisplayName }}</strong>"?
        </p>
        <div class="modal-actions">
          <button @click="confirmDisplayNameUpdate" class="confirm-btn">Yes</button>
          <button @click="cancelDisplayNameUpdate" class="cancel-btn">No</button>
        </div>
      </div>
    </div>

    <!-- SETTINGS MODAL -->
    <div v-if="settingsModal" class="modal-overlay">
      <div class="modal settings-modal">
        <h3>Account Settings</h3>

        <label>Email:</label>
        <input v-model="tempEmail" placeholder="Enter new email" />

        <label>Old Password:</label>
        <input
          type="password"
          v-model="oldPassword"
          placeholder="Enter current password"
        />

        <label>New Password:</label>
        <input
          type="password"
          v-model="newPassword"
          placeholder="Enter new password"
        />

        <label>Confirm New Password:</label>
        <input
          type="password"
          v-model="confirmPassword"
          placeholder="Confirm new password"
        />

        <label>First Name:</label>
        <input v-model="firstName" placeholder="Enter first name" />

        <div class="modal-actions">
          <button class="confirm-btn" @click="openSettingsConfirmation">Save</button>
          <button class="cancel-btn" @click="closeSettingsModal">Cancel</button>
        </div>
      </div>
    </div>

    <!-- SETTINGS CONFIRMATION MODAL -->
    <div v-if="showSettingsConfirm" class="modal-overlay">
      <div class="modal">
        <h3>Confirm Update</h3>
        <p>{{ confirmationMessage }}</p>
        <div class="modal-actions">
          <button @click="confirmSettingsUpdate" class="confirm-btn">Yes</button>
          <button @click="cancelSettingsUpdate" class="cancel-btn">No</button>
        </div>
      </div>
    </div>

  </div>

  <!-- LOADING -->
  <div v-else class="loading">Loading profile...</div>
</template>

<script>
import api from "../store/axios";
import { useAuthStore } from "../store/auth";
import { useRouter } from "vue-router";

export default {
  data() {
    return {
      displayName: "",
      tempDisplayName: "",
      firstName: "",
      age: "",
      email: "",
      tempEmail: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      coffees: [],
      showDisplayNameModal: false,
      settingsModal: false,
      showSettingsConfirm: false,
      confirmationMessage: "",
      pendingField: "",
      originalEmail: "",
      originalFirstName: "",
      loading: true,
      nameTooLong: false,
    };
  },

  computed: {
    auth() {
      return useAuthStore();
    },
    likedCoffees() {
      return this.coffees.filter(c => c.likedByUser);
    },
    favoritedCoffees() {
      return this.coffees.filter(c => c.favoritedByUser);
    },
  },

  methods: {
    checkLength() {
      if (this.tempDisplayName.length > 15) {
        this.nameTooLong = true;
        this.tempDisplayName = this.tempDisplayName.slice(0, 15);
      } else {
        this.nameTooLong = false;
      }
    },

    async fetchUser() {
      try {
        const res = await api.get("/user");
        const user = res.data;

        this.displayName = user.display_name || user.first_name;
        this.tempDisplayName = this.displayName;

        this.firstName = user.first_name;
        this.age = user.age;
        this.email = user.email;
        this.tempEmail = user.email;

        this.originalEmail = user.email;
        this.originalFirstName = user.first_name;

        if (!this.auth.user) {
          this.auth.user = user;
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        this.loading = false;
      }
    },

    async fetchCoffees() {
      try {
        const res = await api.get("/coffees");
        this.coffees = res.data.map(c => ({
          ...c,
          id: c.coffee_id || c.id,
          image_url: c.image_url || null,
          likedByUser: !!c.likedByUser,
          favoritedByUser: !!c.favoritedByUser,
          likes: c.likes ?? 0,
          favorites: c.favorites ?? 0,
        }));
      } catch (err) {
        console.error(err);
      }
    },

    goToPreference() {
      this.router.push("/main/preference");
    },

    // DISPLAY NAME CONFIRMATION
    openDisplayNameConfirmation() {
      if (!this.tempDisplayName || this.tempDisplayName === this.displayName) return;
      this.showDisplayNameModal = true;
    },
    confirmDisplayNameUpdate() {
      this.showDisplayNameModal = false;
      this.saveDisplayName();
    },
    cancelDisplayNameUpdate() {
      this.showDisplayNameModal = false;
      this.tempDisplayName = this.displayName;
    },
    async saveDisplayName() {
      try {
        const res = await api.put("/user/display-name", {
          display_name: this.tempDisplayName
        });

        this.displayName = res.data.display_name;
        this.tempDisplayName = res.data.display_name;
        this.auth.user.display_name = res.data.display_name;

      } catch (err) {
        console.error("Error updating display name:", err);
        alert("Failed to update display name.");
      }
    },

    // SETTINGS MODAL
    openSettingsModal() {
      this.settingsModal = true;
    },
    closeSettingsModal() {
      this.settingsModal = false;
      this.oldPassword = "";
      this.newPassword = "";
      this.confirmPassword = "";
      this.tempEmail = this.email;
    },

    // SETTINGS CONFIRMATION
    openSettingsConfirmation() {
      if (this.tempEmail && this.tempEmail !== this.originalEmail) {
        this.pendingField = "email";
        this.confirmationMessage = `Are you sure you want to change your email to "${this.tempEmail}"?`;
      } else if (this.newPassword) {
        this.pendingField = "password";
        this.confirmationMessage = `Are you sure you want to change your password?`;
      } else if (this.firstName && this.firstName !== this.originalFirstName) {
        this.pendingField = "first_name";
        this.confirmationMessage = `Are you sure you want to change your first name to "${this.firstName}"?`;
      } else {
        alert("No changes detected.");
        return;
      }

      this.showSettingsConfirm = true;
    },

    async confirmSettingsUpdate() {
      this.showSettingsConfirm = false;
      await this.saveSettings();
    },

    cancelSettingsUpdate() {
      this.showSettingsConfirm = false;

      if (this.pendingField === "email") this.tempEmail = this.originalEmail;
      if (this.pendingField === "first_name") this.firstName = this.originalFirstName;
      if (this.pendingField === "password") {
        this.oldPassword = "";
        this.newPassword = "";
        this.confirmPassword = "";
      }

      this.pendingField = "";
    },

    async saveSettings() {
      if (this.newPassword && this.newPassword !== this.confirmPassword) {
        alert("New password and confirmation do not match!");
        return;
      }

      if (this.newPassword && !this.oldPassword) {
        alert("Please enter your current password to change it.");
        return;
      }

      try {
        const payload = {
          first_name: this.firstName,
          age: this.age,
          email: this.tempEmail,
          old_password: this.oldPassword || undefined,
          new_password: this.newPassword || undefined,
          new_password_confirmation: this.confirmPassword || undefined, 
        };

        const res = await api.patch("/user/settings", payload);

        this.email = res.data.user.email;
        this.firstName = res.data.user.first_name;
        this.age = res.data.user.age;

        this.oldPassword = "";
        this.newPassword = "";
        this.confirmPassword = "";
        this.settingsModal = false;

        alert("Credentials updated!");
      } catch (err) {
        console.error("Error updating settings:", err);
        alert(err.response?.data?.error || "Failed to update settings.");
      }
    },
  },

  async mounted() {
    this.router = useRouter();
    await this.fetchUser();
    await this.fetchCoffees();
  },
};
</script>

<style src="../assets/profile.css"></style>
