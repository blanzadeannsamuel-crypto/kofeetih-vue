<template>
  <div class="catalog-page">
    <h2 align="center">Coffee Catalog</h2>

    <!-- Recommended Coffees -->
    <div v-if="topRecommendations.length" class="recommendation-section">
      <h2>☕ Recommended Coffees</h2>

      <div class="grid recommendation-grid">
        <div class="card recommendation-card" v-for="coffee in topRecommendations" :key="coffee.id">
          <img 
            :src="coffee.coffee_image || '/images/placeholder.png'" 
            class="coffee-img recommendation-img" 
            @error="onImageError($event)" 
          />

          <h3>{{ coffee.coffee_name }}</h3>
          <p>Type: {{ coffee.coffee_type }}</p>
          <p>Ingredients: {{ coffee.ingredients }}</p>

          <p class="reason">
            {{ coffee.reasons?.length ? coffee.reasons.join(', ') : 'Recommended for you' }}
          </p>

          <button class="view-btn" @click="openModal(coffee)">View Coffee</button>
        </div>
      </div>
    </div>

    <!-- Coffee Fact Modal -->
    <div v-if="showFactModal" class="modal-backdrop" @click.self="closeFactModal">
      <div class="modal-card fact-modal">
        <button class="close-btn" @click="closeFactModal">✖</button>
        <h3>☕ Did You Know?</h3>
        <p>{{ coffeeFact }}</p>
      </div>
    </div>

    <!-- Filters -->
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
            <option value="yes">Has Milk</option>
            <option value="no">No Milk</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Coffee List -->
    <div v-if="loading" class="loading">Loading coffees...</div>

    <div v-else class="grid">
      <div class="card" v-for="coffee in filteredCoffees" :key="coffee.id">
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

        <button class="view-btn" @click="openModal(coffee)">View</button>
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
        <p><strong>Price:</strong> {{ selectedCoffee.minimum_price }} - {{ selectedCoffee.maximum_price }}</p>
        <p><strong>Average Rating:</strong> ⭐ {{ selectedCoffee.rating }}</p>
        <p><strong>Likes:</strong> {{ selectedCoffee.likes }}</p>
        <p><strong>Favorites:</strong> {{ selectedCoffee.favorites }}</p>

        <div class="actions">
          <button @click="toggleLike">{{ liked ? "Unlike" : "Like" }}</button>
          <button @click="toggleFavorite">{{ favorited ? "Unfavorite" : "Favorite" }}</button>

          <div class="rate">
            <label>Your Rating:</label>
            <select v-model.number="userRating" @change="rateCoffee">
              <option disabled value="">Rate</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Confirmation -->
    <div v-if="showToast" class="toast-confirm">
      <span>{{ toastMessage }}</span>
      <div class="toast-actions">
        <button @click="toastAction">Yes</button>
        <button @click="showToast = false">Cancel</button>
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

      showModal: false,
      selectedCoffee: {},

      liked: false,
      favorited: false,
      userRating: null,

      coffeeFact: "",
      showFactModal: false,
      fetchingFact: false,
      coffeeFactTimer: null,

      topRecommendations: [],
      loadingRecommendation: true,
      bestMatch: null,
      recommendationExplanation: "",

      showToast: false,
      toastMessage: "",
      toastAction: null,
    };
  },

  mounted() {
    this.fetchCoffees();
    this.fetchCoffeeFact();
    this.fetchRecommendations();

    this.coffeeFactTimer = setInterval(async () => {
      if (!this.showFactModal) {
        await this.fetchCoffeeFact();
        this.showFactModal = true;
      }
    }, 120000);
  },

  beforeUnmount() {
    if (this.coffeeFactTimer) clearInterval(this.coffeeFactTimer);
  },

  computed: {
    coffeeTypes() {
      return [...new Set(this.coffees.map(c => c.coffee_type).filter(Boolean))];
    },
  },

  methods: {
    applyFilters() {
      const search = this.searchQuery.toLowerCase();

      this.filteredCoffees = this.coffees.filter(c => {
        const typeMatch = this.selectedTypes.length === 0 || this.selectedTypes.includes(c.coffee_type);

        let milkMatch = true;
        if (this.selectedMilk === "yes") milkMatch = c.lactose?.toLowerCase() === "yes";
        else if (this.selectedMilk === "no") milkMatch = c.lactose?.toLowerCase() === "no";

        const searchMatch =
          c.coffee_name.toLowerCase().includes(search) ||
          c.coffee_type.toLowerCase().includes(search);

        return typeMatch && milkMatch && searchMatch;
      });
    },

    async fetchCoffees() {
      try {
        const res = await api.get("/coffees");
        this.coffees = res.data.map(c => ({ ...c, id: c.coffee_id }));
        this.filteredCoffees = this.coffees;
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    updateCoffeeInLists(updated) {
      const lists = ["coffees", "filteredCoffees", "topRecommendations"];

      for (const listName of lists) {
        const list = this[listName];
        if (!Array.isArray(list)) continue;

        const index = list.findIndex(c => c.id === updated.id);
        if (index !== -1) {
          this[listName].splice(index, 1, { ...list[index], ...updated });
        }
      }
    },

    openModal(coffee) {
      this.selectedCoffee = { ...coffee };
      this.showModal = true;

      this.liked = coffee.likedByUser || false;
      this.favorited = coffee.favoritedByUser || false;
      this.userRating = coffee.userRating || null;
    },

    closeModal() {
      this.showModal = false;
    },

    async toggleLike() {
      try {
        const res = await api.post(`/coffees/${this.selectedCoffee.id}/like`);

        this.selectedCoffee.likes = res.data.likes;
        this.liked = res.data.liked;

        this.updateCoffeeInLists({
          id: this.selectedCoffee.id,
          likes: res.data.likes,
          likedByUser: res.data.liked
        });
      } catch (err) {
        console.error(err);
      }
    },

    async toggleFavorite() {
      try {
        const res = await api.post(`/coffees/${this.selectedCoffee.id}/favorite`);

        this.selectedCoffee.favorites = res.data.favorites;
        this.favorited = res.data.favorited;

        this.updateCoffeeInLists({
          id: this.selected.selectedCoffee,
          favorites: res.data.favorites,
          favoritedByUser: res.data.favorited
        });
      } catch (err) {
        console.error(err);
      }
    },

    async rateCoffee() {
      if (!this.userRating) return;

      try {
        const res = await api.post(`/coffees/${this.selectedCoffee.id}/rate`, {
          rating: this.userRating
        });

        this.selectedCoffee.rating = res.data.rating;

        this.updateCoffeeInLists({
          id: this.selectedCoffee.id,
          rating: res.data.rating,
          userRating: this.userRating
        });
      } catch (err) {
        console.error(err);
      }
    },

    async fetchCoffeeFact() {
      if (this.fetchingFact) return;

      this.fetchingFact = true;

      try {
        const res = await api.get("/coffee-fact");
        this.coffeeFact = res.data.fact || "Coffee boosts your productivity!";
      } catch (err) {
        this.coffeeFact = "Coffee boosts your productivity!";
      } finally {
        this.fetchingFact = false;
      }
    },

    async fetchRecommendations() {
      this.loadingRecommendation = true;

      try {
        const res = await api.get("/coffee-recommendation");

        // FIX: DO NOT override values — use REAL backend values
        this.topRecommendations = res.data.coffees.map(c => ({
          id: c.coffee_id,
          coffee_name: c.coffee_name,
          coffee_type: c.coffee_type,

          description: c.description,
          ingredients: c.ingredients,

          favorites: c.favorites,
          likes: c.likes,
          rating: c.rating,

          minimum_price: c.minimum_price,
          maximum_price: c.maximum_price,

          coffee_image: c.coffee_image,
          reasons: c.reasons || [],

          likedByUser: c.likedByUser || false,
          favoritedByUser: c.favoritedByUser || false,
          userRating: c.userRating || null
        }));

        if (this.topRecommendations.length > 0) {
          this.bestMatch = this.topRecommendations[0];
          this.recommendationExplanation = this.bestMatch.reasons.join(", ");
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.loadingRecommendation = false;
      }
    },

    onImageError(event) {
      event.target.src = "/images/placeholder.png";
    },

    closeFactModal() {
      this.showFactModal = false;
    }
  }
};
</script>

<style src="../assets/catalog.css"></style>
<style src="../assets/modal.css"></style>
<style src="../assets/recommendation.css"></style>
