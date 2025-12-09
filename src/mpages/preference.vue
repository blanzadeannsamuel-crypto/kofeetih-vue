<template>
  <div class="profile-page" v-if="!loading">

    <!-- HEADER -->
    <div class="profile-header">
      <h1>{{ displayName }}'s Profile</h1>
      <button class="settings-btn" @click="openSettingsModal">⚙️</button>
    </div>

    <!-- BIO BOX -->
    <div class="bio-box">
      <div class="display-name-container">
        <label for="displayName">Display Name:</label>
        <input 
          id="displayName"
          v-model="tempDisplayName"
          @input="checkLength"
          maxlength="15"
          class="display-name-input"
        />
        <button class="save-display-btn" @click="openDisplayNameConfirmation">Save</button>
      </div>
      <p v-if="nameTooLong" class="notif">Display name cannot exceed 15 characters!</p>

      <p><strong>First Name:</strong> {{ firstName }}</p>
      <p><strong>Age:</strong> {{ age }}</p>
      <p><strong>Email:</strong> {{ email }}</p>

      <div class="bio-actions">
        <button @click="goToPreference" class="preference-btn">Edit My Preferences</button>
      </div>
    </div>

    <!-- PREFERENCES -->
    <div class="coffee-section">
      <h2>My Preferences</h2>
      <ul class="preferences-list">
        <li v-for="pref in preferences" :key="pref.id">{{ pref.preference_name }}</li>
      </ul>
      <p v-if="preferences.length === 0">No preferences yet.</p>
    </div>

    <!-- MUST TRY COFFEES -->
    <div class="coffee-section">
      <h2>Must Try Coffees</h2>
      <div v-if="mustTryCoffees.length === 0" class="empty-msg">
        You have no must try coffees yet.
      </div>
      <div class="coffee-grid">
        <div v-for="coffee in mustTryCoffees" :key="coffee.id" class="coffee-card">
          <img v-if="coffee.coffee_image" :src="coffee.coffee_image" class="coffee-img"/>
          <h3>{{ coffee.coffee_name }}</h3>
          <p>Type: {{ coffee.coffee_type }}</p>

          <!-- REVIEW BUTTONS -->
          <div class="must-try-comment">
            <button 
              v-if="!coffee.comment" 
              class="save-btn" 
              @click="openReviewModal(coffee)"
            >
              Add Review
            </button>
            <button 
              v-else 
              class="edit-btn" 
              @click="openReviewModal(coffee)"
            >
              Edit Review
            </button>
            <button v-if="coffee.comment" class="delete-btn" @click="deleteReview(coffee)">
              Delete Review
            </button>
            <button @click="openNotificationModal('confirmDelete', coffee)" class="delete-btn">Remove Coffee</button>
          </div>

          <!-- SHOW EXISTING COMMENT -->
          <p v-if="coffee.comment" class="existing-comment"><strong>My Review:</strong> {{ coffee.comment }}</p>
        </div>
      </div>
    </div>

    <!-- DISPLAY NAME MODAL -->
    <div v-if="showDisplayNameModal" class="modal-overlay">
      <div class="modal">
        <h3>Confirm Update</h3>
        <p>Are you sure you want to change your display name to "<strong>{{ tempDisplayName }}</strong>"?</p>
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
        <label>First Name:</label>
        <input v-model="firstName" placeholder="Enter first name" />
        <label>Email:</label>
        <input v-model="tempEmail" placeholder="Enter new email" />
        <label>Old Password:</label>
        <input type="password" v-model="oldPassword" placeholder="Enter current password" />
        <label>New Password:</label>
        <input type="password" v-model="newPassword" placeholder="Enter new password" />
        <label>Confirm New Password:</label>
        <input type="password" v-model="confirmPassword" placeholder="Confirm new password" />
        <div class="modal-actions">
          <button class="confirm-btn" @click="openSettingsConfirmation">Save</button>
          <button class="cancel-btn" @click="closeSettingsModal">Cancel</button>
        </div>
      </div>
    </div>

    <!-- SETTINGS CONFIRM MODAL -->
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

    <!-- REVIEW MODAL -->
    <div v-if="showReviewModal" class="modal-overlay">
      <div class="modal">
        <h3>{{ activeCoffee?.comment ? 'Edit' : 'Add' }} Review for "{{ activeCoffee?.coffee_name }}"</h3>
        <textarea 
          v-model="reviewText"
          maxlength="150"
          placeholder="Write your review here..."
          class="review-textarea"
        ></textarea>
        <div class="modal-actions">
          <button @click="saveReview" class="confirm-btn">Save</button>
          <button @click="closeReviewModal" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>

    <!-- CENTRAL NOTIFICATION MODAL -->
    <div v-if="notificationModal.show" class="modal-overlay">
      <div class="modal">
        <h3 v-if="notificationModal.type === 'info'">Notification</h3>
        <h3 v-if="notificationModal.type === 'confirmDelete'">Confirm Delete</h3>
        <p>{{ notificationModal.message }}</p>
        <div class="modal-actions">
          <button v-if="notificationModal.type === 'info'" @click="closeNotificationModal" class="confirm-btn">OK</button>
          <template v-if="notificationModal.type === 'confirmDelete'">
            <button @click="confirmDelete(notificationModal.data)" class="confirm-btn">Yes</button>
            <button @click="closeNotificationModal" class="cancel-btn">No</button>
          </template>
        </div>
      </div>
    </div>

  </div>

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
      preferences: [],
      mustTryCoffees: [],
      loading: true,
      nameTooLong: false,

      /* REVIEW MODAL DATA */
      showReviewModal: false,
      activeCoffee: null,
      reviewText: "",

      /* CENTRAL NOTIFICATION MODAL */
      notificationModal: {
        show: false,
        message: "",
        type: "info",
        data: null,
      },

      /* SETTINGS MODAL */
      settingsModal: false,
      showDisplayNameModal: false,
      showSettingsConfirm: false,
      confirmationMessage: "",
      pendingField: "",
      originalEmail: "",
      originalFirstName: "",
    };
  },

  computed: {
    auth() { return useAuthStore(); },
  },

  methods: {
    checkLength() {
      if (this.tempDisplayName.length > 15) {
        this.nameTooLong = true;
        this.tempDisplayName = this.tempDisplayName.slice(0, 15);
      } else this.nameTooLong = false;
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
        if (!this.auth.user) this.auth.user = user;
      } catch (err) {
        console.error(err);
        this.showNotification("Failed to fetch user data.");
      }
    },

    async fetchPreferences() {
      try {
        const res = await api.get("/preferences");
        const pref = res.data?.data;
        this.preferences = pref ? [
          { 
            id: pref.id,
            preference_name: `Coffee Type: ${pref.coffee_type}, prefered Serving Temperature: ${pref.serving_temp}, Lactose Intolerant: ${pref.lactose ? "Yes" : "No"}, Nuts Allergy: ${pref.nuts_allergy ? "Yes" : "No"}`
          }
        ] : [];
      } catch (err) {
        console.error(err);
        this.preferences = [];
        this.showNotification("Failed to fetch preferences.");
      }
    },

    async fetchMustTry() {
      try {
        const res = await api.get("/must-try-coffee/my-must-try");
        const list = Array.isArray(res.data.mustTryList) ? res.data.mustTryList : Array.isArray(res.data) ? res.data : [];
        this.mustTryCoffees = list.map(c => ({
          ...c,
          id: c.id || c.mustTryId || c.coffee_id,
          comment: c.comment || null
        }));
      } catch (err) {
        console.error(err);
        this.mustTryCoffees = [];
        this.showNotification("Failed to fetch Must Try list.");
      }
    },

    openReviewModal(coffee) {
      this.activeCoffee = coffee;
      this.reviewText = coffee.comment || "";
      this.showReviewModal = true;
    },

    closeReviewModal() {
      this.showReviewModal = false;
      this.reviewText = "";
      this.activeCoffee = null;
    },

    async saveReview() {
      try {
        if (!this.activeCoffee || !this.reviewText.trim()) {
          this.showNotification("Review cannot be empty.");
          return;
        }

        await api.put(`/must-try-coffee/comment/${this.activeCoffee.id}`, { comment: this.reviewText });

        this.activeCoffee.comment = this.reviewText;
        const idx = this.mustTryCoffees.findIndex(c => c.id === this.activeCoffee.id);
        if (idx !== -1) this.mustTryCoffees[idx].comment = this.reviewText;

        this.showNotification("Review saved!");
        this.closeReviewModal();
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || "Failed to save review.";
        this.showNotification(msg);
      }
    },

    async deleteReview(coffee) {
      if (!confirm("Are you sure you want to delete this review?")) return;
      try {
        await api.delete(`/must-try-coffee/comment/${coffee.id}`);
        coffee.comment = null;
        const idx = this.mustTryCoffees.findIndex(c => c.id === coffee.id);
        if (idx !== -1) this.mustTryCoffees[idx].comment = null;
        this.showNotification("Review deleted successfully!");
      } catch (err) {
        console.error(err);
        this.showNotification("Failed to delete review.");
      }
    },

    showNotification(msg) {
      this.notificationModal.message = msg;
      this.notificationModal.show = true;
      this.notificationModal.type = "info";
    },

    closeNotificationModal() {
      this.notificationModal.show = false;
      this.notificationModal.message = "";
    },

    openDisplayNameConfirmation() {
      if (!this.tempDisplayName || this.tempDisplayName === this.displayName) return;
      this.showDisplayNameModal = true;
    },
    confirmDisplayNameUpdate() { this.showDisplayNameModal = false; this.saveDisplayName(); },
    cancelDisplayNameUpdate() { this.showDisplayNameModal = false; this.tempDisplayName = this.displayName; },
    async saveDisplayName() {
      try {
        const res = await api.put("/user/display-name", { display_name: this.tempDisplayName });
        this.displayName = res.data.display_name;
        this.tempDisplayName = res.data.display_name;
        this.auth.user.display_name = res.data.display_name;
        this.showNotification("Display name updated!");
      } catch (err) {
        console.error(err);
        this.showNotification("Failed to update display name.");
      }
    },

    openSettingsModal() { this.settingsModal = true; },
    closeSettingsModal() { this.settingsModal = false; this.oldPassword = ""; this.newPassword = ""; this.confirmPassword = ""; this.tempEmail = this.email; },
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
      } else { this.showNotification("No changes detected."); return; }
      this.showSettingsConfirm = true;
    },
    async confirmSettingsUpdate() { this.showSettingsConfirm = false; await this.saveSettings(); },
    cancelSettingsUpdate() {
      this.showSettingsConfirm = false;
      if (this.pendingField === "email") this.tempEmail = this.originalEmail;
      if (this.pendingField === "first_name") this.firstName = this.originalFirstName;
      if (this.pendingField === "password") { this.oldPassword = ""; this.newPassword = ""; this.confirmPassword = ""; }
      this.pendingField = "";
    },
    async saveSettings() {
      if (this.newPassword && this.newPassword !== this.confirmPassword) { this.showNotification("New password and confirmation do not match!"); return; }
      if (this.newPassword && !this.oldPassword) { this.showNotification("Please enter your current password to change it."); return; }
      try {
        const payload = {
          first_name: this.firstName,
          email: this.tempEmail,
          old_password: this.oldPassword || undefined,
          new_password: this.newPassword || undefined,
          new_password_confirmation: this.confirmPassword || undefined
        };
        const res = await api.patch("/user/settings", payload);
        this.email = res.data.user.email;
        this.firstName = res.data.user.first_name;
        this.oldPassword = this.newPassword = this.confirmPassword = "";
        this.settingsModal = false;
        this.showNotification("Credentials updated!");
      } catch (err) {
        console.error(err);
        this.showNotification(err.response?.data?.error || "Failed to update settings.");
      }
    },

    goToPreference() { this.router.push("/main/preference"); },
  },

  async mounted() {
    this.router = useRouter();
    await this.fetchUser();
    await this.fetchPreferences();
    await this.fetchMustTry();
    this.loading = false;
  }
};
</script>

<style src="../assets/profile.css"></style>
