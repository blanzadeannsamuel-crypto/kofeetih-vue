<template>
  <div class="catalog-page">
    <h2 align="center">Coffee Catalog</h2>

    <!-- Controls: Search + Filters -->
    <div class="controls">
      <!-- Search -->
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search coffee..."
        class="search-bar"
        @input="applyFilters"
      />

      <!-- Combined Filters -->
      <div class="filter-container">
        <!-- Coffee Type (multi-select) -->
        <div class="filter-group">
          <label>Type:</label>
          <div class="checkbox-group">
            <label v-for="type in coffeeTypes" :key="type" class="checkbox">
              <input type="checkbox" :value="type" v-model="selectedTypes" @change="applyFilters" />
              {{ type }}
            </label>
          </div>
        </div>

        <!-- Milk Option (single-select) -->
        <div class="filter-group">
          <label>Milk:</label>
          <select v-model="selectedMilk" class="milk-select" @change="applyFilters">
            <option value="">All</option>
            <option value="yes">Has Milk</option>
            <option value="no">No Milk</option>
          </select>
        </div>

        <!-- Apply Button (optional, still works) -->
        <button class="apply-btn" @click="applyFilters">Apply Filters</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">Loading coffees...</div>

    <!-- Coffee Grid -->
    <div v-else class="grid">
      <div class="card" v-for="coffee in filteredCoffees" :key="coffee.id">
        <img v-if="coffee.image_url" :src="coffee.image_url" class="coffee-img" />
        <h3>{{ coffee.coffee_name }}</h3>
        <p><strong>Type:</strong> {{ coffee.coffee_type }}</p>
        <p><strong>Ingredients:</strong> {{ coffee.ingredients }}</p>
        <p><strong>Average Rating:</strong> {{ coffee.rating || 0 }}</p>
        <p><strong>Likes:</strong> {{ coffee.likes || 0 }}</p>
        <p><strong>Favorites:</strong> {{ coffee.favorites || 0 }}</p>
        <button class="view-btn" @click="openModal(coffee)">View</button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <button class="close-btn" @click="closeModal">✖</button>

        <img v-if="selectedCoffee?.image_url" :src="selectedCoffee.image_url" class="modal-img" />

        <h2>{{ selectedCoffee.coffee_name }}</h2>
        <p><strong>Type:</strong> {{ selectedCoffee.coffee_type }}</p>
        <p><strong>Description:</strong> {{ selectedCoffee.description }}</p>
        <p><strong>Ingredients:</strong> {{ selectedCoffee.ingredients }}</p>
        <p>
          <strong>Price:</strong>
          {{ selectedCoffee.minimum_price }} -
          {{ selectedCoffee.maximum_price }}
        </p>
        <p><strong>Average Rating:</strong> ⭐ {{ selectedCoffee.rating || 0 }}</p>
        <p><strong>Likes:</strong> {{ selectedCoffee.likes || 0 }}</p>
        <p><strong>Favorites:</strong> {{ selectedCoffee.favorites || 0 }}</p>

        <div class="actions">
          <div class="like-favorite">
            <button @click="toggleLike">{{ liked ? "Unlike" : "Like" }}</button>
          </div>
          <div class="like-favorite">
            <button @click="toggleFavorite">{{ favorited ? "Unfavorite" : "Favorite" }}</button>
          </div>
          <div class="rate">
            <label for="rating">Your Rating:</label>
            <select id="rating" v-model.number="userRating" @change="rateCoffee">
              <option disabled value="">Rate</option>
              <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../store/axios";

export default {
  data() {
    return {
      isRating: false,
      userRating: null,
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
    };
  },

  mounted() {
    this.fetchCoffees();
  },

  computed: {
    coffeeTypes() {
      const types = this.coffees.map(c => c.coffee_type).filter(Boolean);
      return [...new Set(types)];
    }
  },

  methods: {
    applyFilters() {
      const search = this.searchQuery.toLowerCase();

      this.filteredCoffees = this.coffees.filter(c => {
        const typeMatch =
          this.selectedTypes.length === 0 || this.selectedTypes.includes(c.coffee_type);

        const milkMatch =
          this.selectedMilk === "" || c.lactose.toLowerCase() === this.selectedMilk;

        const searchMatch =
          c.coffee_name.toLowerCase().includes(search) ||
          c.coffee_type.toLowerCase().includes(search);

        return typeMatch && milkMatch && searchMatch;
      });
    },

    async fetchCoffees() {
      try {
        const res = await api.get("/coffees");
        this.coffees = res.data;
        this.filteredCoffees = this.coffees;
      } catch (err) {
        console.error("Error fetching coffees:", err);
      } finally {
        this.loading = false;
      }
    },

    openModal(coffee) {
      this.selectedCoffee = coffee;
      this.showModal = true;
      this.liked = coffee.likedByUser || false;
      this.favorited = coffee.favoritedByUser || false;
      this.userRating = coffee.userRating || null;
    },

    closeModal() {
      this.showModal = false;
    },

    async toggleLike() {
      if (!this.selectedCoffee) return;
      try {
        const res = await api.post(`/coffees/${this.selectedCoffee.id}/like`);
        this.liked = res.data.liked;
        this.selectedCoffee.likedByUser = this.liked;
        this.selectedCoffee.likes = res.data.likes;
        const i = this.coffees.findIndex(c => c.id === this.selectedCoffee.id);
        if (i !== -1) this.coffees[i].likes = res.data.likes;
      } catch (err) { console.error(err); }
    },

    async toggleFavorite() {
      if (!this.selectedCoffee) return;
      try {
        const res = await api.post(`/coffees/${this.selectedCoffee.id}/favorite`);
        this.favorited = res.data.favorited;
        this.selectedCoffee.favoritedByUser = this.favorited;
        this.selectedCoffee.favorites = res.data.favorites;
        const i = this.coffees.findIndex(c => c.id === this.selectedCoffee.id);
        if (i !== -1) this.coffees[i].favorites = res.data.favorites;
      } catch (err) { console.error(err); }
    },

    async rateCoffee() {
      if (!this.userRating || this.isRating) return;
      this.isRating = true;
      try {
        const res = await api.post(`/coffees/${this.selectedCoffee.id}/rate`, { rating: this.userRating });
        const newAvg = res.data.rating;
        this.selectedCoffee.rating = newAvg;
        this.selectedCoffee.userRating = res.data.userRating;
        const i = this.coffees.findIndex(c => c.id === this.selectedCoffee.id);
        if (i !== -1) {
          Object.assign(this.coffees[i], { rating: newAvg, userRating: res.data.userRating });
        }
      } catch (err) { console.error(err); }
      finally { this.isRating = false; }
    },
  },
};
</script>

<style src="../assets/catalog.css"></style>
<style src="../assets/modal.css"></style>