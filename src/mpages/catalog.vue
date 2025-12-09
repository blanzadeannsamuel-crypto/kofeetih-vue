<template>
  <div class="catalog-page">
    <h2 align="center">Coffee Menu</h2>

    <!-- Recommended Coffees -->
    <div v-if="topRecommendations.length" class="recommendation-section">
      <h3 align="center">☕ Recommended Coffees</h3>
      <div class="grid recommendation-grid">
        <div v-for="coffee in topRecommendations" :key="coffee.id" class="card recommendation-card">
          <img 
            :src="coffee.coffee_image || '/images/placeholder.png'" 
            class="coffee-img recommendation-img" 
            @error="onImageError($event)" 
          />
          <h3>{{ coffee.coffee_name }}</h3>
          <p>Type: {{ coffee.coffee_type }}</p>
          <p>Ingredients: {{ coffee.ingredients }}</p>
          <p class="reason">{{ coffee.reasons?.length ? coffee.reasons.join(', ') : 'Recommended for you' }}</p>
          <p><strong>Average Rating:</strong> ⭐ {{ coffee.rating }}</p>
          <p><strong>Likes:</strong> {{ coffee.likes }}</p>
          <p><strong>Favorites:</strong> {{ coffee.favorites }}</p>
          <button class="view-btn" @click="openModal(coffee)">View Coffee</button>
        </div>
      </div>
    </div>

    <!-- Filters & Active Filters -->
    <div v-if="activeFilters.length" class="active-filters-box">
      <span class="filter-label">Applied Filters:</span>
      <span v-for="f in activeFilters" :key="f" class="filter-tag">
        {{ f }}
        <span class="remove-tag" @click="removeFilter(f)">×</span>
      </span>
    </div>

    <div class="controls">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search coffee..."
        class="search-bar"
        @input="applyFilters"
      />
      <div class="filter-container">
        <div class="filter-group">
          <label>Type:</label>
          <div class="checkbox-group">
            <label v-for="type in coffeeTypes" :key="type" class="checkbox">
              <input type="checkbox" :value="type" v-model="selectedTypes" @change="applyFilters" />
              {{ type }}
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label>Milk:</label>
          <select v-model="selectedMilk" class="milk-select" @change="applyFilters">
            <option value="">All</option>
            <option value="true">Has Milk</option>
            <option value="false">No Milk</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Nuts:</label>
          <select v-model="selectedNuts" class="nuts-select" @change="applyFilters">
            <option value="">All</option>
            <option value="true">Contains Nuts</option>
            <option value="false">Nut-Free</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Coffee List -->
    <div v-if="loading" class="loading">Loading coffees...</div>
    <div v-else class="grid">
      <div v-for="coffee in filteredCoffees" :key="coffee.id" class="card">
        <img 
          v-if="coffee.coffee_image" 
          :src="coffee.coffee_image" 
          class="coffee-img" 
          @error="onImageError($event)"
        />
        <h3>{{ coffee.coffee_name }}</h3>
        <p><strong>Type:</strong> {{ coffee.coffee_type }}</p>
        <p><strong>Ingredients:</strong> {{ coffee.ingredients }}</p>
        <p><strong>Average Rating:</strong> ⭐ {{ coffee.rating }}</p>
        <p><strong>Likes:</strong> {{ coffee.likes }}</p>
        <p><strong>Favorites:</strong> {{ coffee.favorites }}</p>
        <div class="card-actions">
          <button class="view-btn" @click="openModal(coffee)">View</button>
          <button class="must-try-btn" @click="toggleMustTry(coffee)">
            {{ coffee.inMustTry ? "Added" : "Must Try" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Coffee Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <button class="close-btn" @click="closeModal">✖</button>
        <img 
          v-if="selectedCoffee?.coffee_image" 
          :src="selectedCoffee.coffee_image" 
          class="modal-img" 
          @error="onImageError($event)"
        />
        <h2>{{ selectedCoffee.coffee_name }}</h2>
        <p><strong>Type:</strong> {{ selectedCoffee.coffee_type }}</p>
        <p><strong>Description:</strong> {{ selectedCoffee.description }}</p>
        <p><strong>Ingredients:</strong> {{ selectedCoffee.ingredients }}</p>
        <p><strong>Price:</strong> {{ selectedCoffee.price }}</p>
        <p><strong>Average Rating:</strong> ⭐ {{ selectedCoffee.rating }}</p>
        <p><strong>Likes:</strong> {{ selectedCoffee.likes }}</p>
        <p><strong>Favorites:</strong> {{ selectedCoffee.favorites }}</p>
        <p><strong>Must Try:</strong> {{ selectedCoffee.inMustTry ? "Added" : "Must Try" }}</p>

        <div class="actions">
          <button @click="toggleLike">{{ liked ? "Unlike" : "Like" }}</button>
          <button @click="toggleFavorite">{{ favorited ? "Unfavorite" : "Favorite" }}</button>
          <button @click="toggleMustTry(selectedCoffee)">
            {{ selectedCoffee.inMustTry ? "Remove Must Try" : "Add Must Try" }}
          </button>
          <div class="rate">
            <label>Your Rating:</label>
            <select v-model.number="userRating" @change="rateCoffee">
              <option disabled value="">Rate</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>

        <!-- Comment Section -->
        <div class="comment-section">
          <h4>Reviews / Comments</h4>

          <!-- Add Comment -->
          <div v-if="!userComment" class="add-comment">
            <textarea v-model="newComment" placeholder="Add your comment..." rows="2"></textarea>
            <button class="btn-add-comment" @click="addComment">Post</button>
          </div>

          <!-- Comment List -->
          <div v-if="comments.length" class="comments-list">
            <div v-for="c in comments" :key="c.id" class="comment-card">
              <p>
                <strong>{{ c.user_display_name }}</strong>
                <span class="email">({{ c.user_email }})</span>
                <span v-if="c.user_id === currentUserId" class="own-comment">(You)</span>
                <span v-if="c.user_rating !== null"> - ⭐ {{ c.user_rating }}</span>
              </p>

              <p v-if="editingCommentId !== c.id">{{ c.comment }}</p>

              <!-- Edit Comment -->
              <div v-else>
                <input type="text" v-model="editingCommentText" />
                <button @click="saveEditComment(c.id)">Save</button>
                <button @click="cancelEdit">Cancel</button>
              </div>

              <!-- Actions -->
              <div class="comment-actions" v-if="c.user_id === currentUserId || isAdmin">
                <button class="icon-btn edit" v-if="c.user_id === currentUserId" @click="startEdit(c)">✎</button>
                <button class="icon-btn delete" @click="deleteComment(c.id)">🗑️</button>
              </div>
            </div>
          </div>

          <p v-else>No reviews yet. Be the first to comment!</p>
        </div>
      </div>
    </div>

    <!-- Notification Modal -->
    <div v-if="notification.show" class="notification-backdrop">
      <div class="notification-modal">
        <p>{{ notification.message }}</p>
        <button @click="closeNotification">OK</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../store/axios";

export default {
  data() {
    return {
      coffees: [],
      filteredCoffees: [],
      loading: true,
      searchQuery: "",
      selectedTypes: [],
      selectedMilk: "",
      selectedNuts: "", 
      showModal: false,
      selectedCoffee: {},
      liked: false,
      favorited: false,
      userRating: null,
      topRecommendations: [],
      loadingRecommendation: true,

      comments: [],
      newComment: "",
      editingCommentId: null,
      editingCommentText: "",
      currentUserId: null,
      isAdmin: false,

      notification: { show: false, message: "" }
    };
  },

  computed: {
    coffeeTypes() {
      return [...new Set(this.coffees.map(c => c.coffee_type).filter(Boolean))];
    },
    activeFilters() {
      const filters = [];
      if (this.searchQuery) filters.push(`Search: "${this.searchQuery}"`);
      if (this.selectedTypes.length) filters.push(...this.selectedTypes.map(t => `Type: ${t}`));
      if (this.selectedMilk === "true") filters.push("Has Milk");
      if (this.selectedMilk === "false") filters.push("No Milk");
      if (this.selectedNuts === "true") filters.push("Contains Nuts");
      if (this.selectedNuts === "false") filters.push("Nut-Free");
      return filters;
    },
    userComment() {
      return this.comments.find(c => c.user_id === this.currentUserId);
    }
  },

  mounted() {
    this.fetchCurrentUser();
    this.fetchCoffees();
    this.fetchRecommendations();
  },

  methods: {
    showNotification(message) {
      this.notification.message = message;
      this.notification.show = true;
    },
    closeNotification() {
      this.notification.show = false;
      this.notification.message = "";
    },

    async fetchCurrentUser() {
      try {
        const res = await api.get("/user");
        this.currentUserId = res.data.id;
        this.isAdmin = res.data.role === "admin";
      } catch (err) { console.error(err); }
    },

    applyFilters() {
      const search = this.searchQuery.toLowerCase();
      this.filteredCoffees = this.coffees.filter(c => {
        const typeMatch = this.selectedTypes.length === 0 || this.selectedTypes.includes(c.coffee_type);
        let milkMatch = true;
        if (this.selectedMilk === "true") milkMatch = c.lactose === true;
        else if (this.selectedMilk === "false") milkMatch = c.lactose === false;
        let nutsMatch = true;
        if (this.selectedNuts === "true") nutsMatch = c.nuts === true;
        else if (this.selectedNuts === "false") nutsMatch = c.nuts === false;
        const searchMatch = c.coffee_name.toLowerCase().includes(search) || c.coffee_type.toLowerCase().includes(search);
        return typeMatch && milkMatch && nutsMatch && searchMatch;
      });
    },

    removeFilter(filter) {
      if (filter.startsWith('Search:')) this.searchQuery = '';
      else if (filter.startsWith('Type:')) {
        const type = filter.replace('Type: ', '');
        this.selectedTypes = this.selectedTypes.filter(t => t !== type);
      } else if (filter === 'Has Milk' || filter === 'No Milk') this.selectedMilk = '';
      else if (filter === 'Contains Nuts' || filter === 'Nut-Free') this.selectedNuts = '';
      this.applyFilters();
    },

    async fetchCoffees() {
      try {
        const res = await api.get("/coffees");
        this.coffees = res.data.map(c => ({
          ...c,
          id: c.coffee_id,
          lactose: c.lactose === true || c.lactose === "true" || c.lactose === "yes" || c.lactose === 1,
          nuts: c.nuts === true || c.nuts === "true" || c.nuts === 1,
          inMustTry: c.inMustTry || false
        }));
        this.filteredCoffees = this.coffees;
      } catch (err) { console.error(err); }
      finally { this.loading = false; }
    },

    onImageError(event) { event.target.src = "/images/placeholder.png"; },

    async openModal(coffee) {
      this.selectedCoffee = { ...coffee, id: coffee.id || coffee.coffee_id };
      this.showModal = true;
      this.liked = coffee.likedByUser || false;
      this.favorited = coffee.favoritedByUser || false;
      this.userRating = coffee.userRating || null;
      this.newComment = "";
      this.editingCommentId = null;
      this.editingCommentText = "";
      await this.fetchComments(coffee.id);
    },

    closeModal() { this.showModal = false; },

    async toggleMustTry(coffee) {
      try {
        if (!coffee.inMustTry) {
          await api.post(`/must-try-coffee`, { coffee_id: coffee.id });
          coffee.inMustTry = true;
          this.showNotification(`${coffee.coffee_name} added to your Must Try list!`);
        } else {
          let confirmMsg = `Removing this coffee from your Must Try list will also delete your review/comment. Are you sure you want to proceed?`;
          if (!confirm(confirmMsg)) return;
          
          const res = await api.get(`/must-try-coffee/coffee/${coffee.id}`);
          if (res.data.comments.length) {
            await api.delete(`/must-try-coffee/${res.data.comments[0].id}`);
          }
          coffee.inMustTry = false;
          this.showNotification(`${coffee.coffee_name} removed from your Must Try list.`);
        }
      } catch (err) {
        console.error(err);
        this.showNotification("Failed to update Must Try list.");
      }
    },

    async fetchComments(coffeeId) {
      try {
        const res = await api.get(`/must-try-coffee/coffee/${coffeeId}`);
        this.comments = res.data.comments;
      } catch (err) { console.error(err); }
    },

    async addComment() {
      if (!this.newComment.trim()) return;
      try {
        await api.post(`/must-try-coffee/comment/${this.selectedCoffee.id}`, { comment: this.newComment });
        this.newComment = "";
        await this.fetchComments(this.selectedCoffee.id);
        this.showNotification("Comment added successfully!");
      } catch (err) {
        console.error(err);
        this.showNotification("Failed to add comment.");
      }
    },

    startEdit(comment) {
      this.editingCommentId = comment.id;
      this.editingCommentText = comment.comment;
    },

    cancelEdit() {
      this.editingCommentId = null;
      this.editingCommentText = "";
    },

    async saveEditComment(commentId) {
      if (!this.editingCommentText.trim()) return;
      try {
        await api.put(`/must-try-coffee/comment/${commentId}`, { comment: this.editingCommentText });
        this.editingCommentId = null;
        this.editingCommentText = "";
        await this.fetchComments(this.selectedCoffee.id);
        this.showNotification("Comment updated successfully!");
      } catch (err) {
        console.error(err);
        this.showNotification("Failed to update comment.");
      }
    },

    async deleteComment(commentId) {
      if (!confirm("Are you sure you want to delete this comment?")) return;
      try {
        await api.delete(`/must-try-coffee/${commentId}`);
        await this.fetchComments(this.selectedCoffee.id);
        this.showNotification("Comment deleted successfully!");
      } catch (err) {
        console.error(err);
        this.showNotification("Failed to delete comment.");
      }
    },

    /*** NEW HELPER: update main page counts ***/
    updateCoffeeCounts(updatedCoffee) {
      const updateInList = (arr) => {
        const index = arr.findIndex(c => c.id === updatedCoffee.id);
        if (index !== -1) {
          arr[index] = { ...arr[index], ...updatedCoffee };
        }
      };
      updateInList(this.coffees);
      updateInList(this.filteredCoffees);
      updateInList(this.topRecommendations);
    },

    async toggleLike() {
      try {
        const res = await api.post(`/coffees/${this.selectedCoffee.id}/like`);
        this.selectedCoffee.likes = res.data.likes;
        this.liked = res.data.liked;

        this.updateCoffeeCounts({ id: this.selectedCoffee.id, likes: res.data.likes });
      } catch (err) { console.error(err); }
    },

    async toggleFavorite() {
      try {
        const res = await api.post(`/coffees/${this.selectedCoffee.id}/favorite`);
        this.selectedCoffee.favorites = res.data.favorites;
        this.favorited = res.data.favorited;

        this.updateCoffeeCounts({ id: this.selectedCoffee.id, favorites: res.data.favorites });
      } catch (err) { console.error(err); }
    },

    async rateCoffee() {
      if (!this.userRating) return;
      try {
        const res = await api.post(`/coffees/${this.selectedCoffee.id}/rate`, { rating: this.userRating });
        this.selectedCoffee.rating = res.data.rating;

        this.updateCoffeeCounts({ id: this.selectedCoffee.id, rating: res.data.rating });

        await this.fetchComments(this.selectedCoffee.id);
      } catch (err) { console.error(err); }
    },

    async fetchRecommendations() {
      this.loadingRecommendation = true;
      try {
        const res = await api.get("/coffee-recommendation");
        this.topRecommendations = res.data.coffees.map(c => ({
          id: c.coffee_id,
          coffee_name: c.coffee_name,
          coffee_type: c.coffee_type,
          description: c.description,
          ingredients: c.ingredients,
          favorites: c.favorites,
          likes: c.likes,
          rating: c.rating,
          price: c.price,
          coffee_image: c.coffee_image,
          reasons: c.reasons || [],
          likedByUser: c.likedByUser || false,
          favoritedByUser: c.favoritedByUser || false,
          userRating: c.userRating || null,
          inMustTry: c.inMustTry || false
        }));
      } catch (err) { console.error(err); }
      finally { this.loadingRecommendation = false; }
    },
  }
};
</script>

<style src="../assets/catalog.css"></style>
