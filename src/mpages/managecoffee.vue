<template>
  <div class="catalog-page">
    <h2 align="center">☕ Manage Coffees</h2>

    <!-- Search -->
    <div class="controls">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search coffee..."
        class="search-bar"
        @input="applyFilters"
      />
    </div>
    <button class="add-coffee-btn" @click="openCreateModal">+ Add Coffee</button>

    <!-- Coffee Grid -->
    <div v-if="loading" class="loading">Loading coffees...</div>
    <div v-else class="grid">
      <div v-for="coffee in filteredCoffees" :key="coffee.id" class="card">
        <img 
          :src="coffee.coffee_image || '/images/placeholder.png'" 
          class="coffee-img" 
          @error="onImageError($event)"
        />
        <h3>{{ coffee.coffee_name }}</h3>
        <p><strong>Type:</strong> {{ coffee.coffee_type }}</p>
        <p><strong>Ingredients:</strong> {{ coffee.ingredients }}</p>
        <p><strong>Price:</strong> ₱{{ coffee.price }}</p>

        <div class="card-actions">
          <button class="edit-btn" @click="openEditModal(coffee)">Edit</button>
          <button class="delete-btn" @click="deleteCoffee(coffee.id)">Delete</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <button class="close-btn" @click="closeModal">✖</button>
        <h3>{{ editingCoffee ? "Edit Coffee" : "Add Coffee" }}</h3>

        <form @submit.prevent="editingCoffee ? updateCoffee() : createCoffee()">

          <label>
            Coffee Name:
            <input v-model="form.coffee_name" placeholder="e.g., Espresso" required />
          </label>

          <label>
            Coffee Type:
            <select v-model="form.coffee_type" required>
              <option value="" disabled>Select coffee type</option>
              <option value="arabica">Arabica</option>
              <option value="robusta">Robusta</option>
              <option value="liberica">Liberica</option>
            </select>
          </label>

          <label>
            Price (₱):
            <input type="number" v-model.number="form.price" min="120" placeholder="Minimum 120" required />
          </label>

          <label>
            Serving Temperature:
            <select v-model="form.serving_temp">
              <option value="hot">Hot</option>
              <option value="iced">Iced</option>
              <option value="both">Both</option>
            </select>
          </label>

          <label>
            Description:
            <textarea v-model="form.description" placeholder="Describe your coffee..."></textarea>
          </label>

          <label>
            Ingredients:
            <textarea v-model="form.ingredients" placeholder="List ingredients separated by commas"></textarea>
          </label>

          <label>
            Lactose:
            <input type="checkbox" v-model="form.lactose" /> Check if contains lactose
          </label>

          <label>
            Nuts:
            <input type="checkbox" v-model="form.nuts" /> Check if contains nuts
          </label>

          <label>
            Coffee Image:
            <input type="file" @change="handleImageUpload" />
            <small>Upload an image of the coffee</small>
          </label>

          <div class="modal-actions">
            <button type="submit">{{ editingCoffee ? "Update" : "Create" }}</button>
            <button type="button" @click="closeModal">Cancel</button>
          </div>
        </form>
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
      showModal: false,
      editingCoffee: null,
      form: {
        coffee_name: "",
        coffee_type: "",
        price: 120,
        serving_temp: "hot",
        description: "",
        ingredients: "",
        lactose: false,
        nuts: false,
        coffee_image: null,
      },
    };
  },
  methods: {
    async fetchCoffees() {
      try {
        const res = await api.get("/coffees");
        this.coffees = res.data.map(c => ({
          ...c,
          id: c.coffee_id,
          lactose: c.lactose === true || c.lactose === "1" || c.lactose === 1,
          nuts: c.nuts === true || c.nuts === "1" || c.nuts === 1,
          coffee_type: c.coffee_type.toLowerCase(),
        }));
        this.applyFilters();
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    applyFilters() {
      const search = this.searchQuery.toLowerCase();
      this.filteredCoffees = this.coffees.filter(c =>
        c.coffee_name.toLowerCase().includes(search) ||
        (c.coffee_type && c.coffee_type.toLowerCase().includes(search))
      );
    },
    onImageError(event) {
      event.target.src = "/images/placeholder.png";
    },

    openCreateModal() {
      this.resetForm();
      this.editingCoffee = null;
      this.showModal = true;
    },
    openEditModal(coffee) {
      this.editingCoffee = coffee;
      this.form = {
        coffee_name: coffee.coffee_name,
        coffee_type: coffee.coffee_type.toLowerCase(),
        price: coffee.price,
        serving_temp: coffee.serving_temp || "hot",
        description: coffee.description,
        ingredients: coffee.ingredients,
        lactose: coffee.lactose === 1 || coffee.lactose === true,
        nuts: coffee.nuts === 1 || coffee.nuts === true,
        coffee_image: null,
      };
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.resetForm();
    },
    resetForm() {
      this.form = {
        coffee_name: "",
        coffee_type: "",
        price: 120,
        serving_temp: "hot",
        description: "",
        ingredients: "",
        lactose: false,
        nuts: false,
        coffee_image: null,
      };
    },
    handleImageUpload(event) {
      this.form.coffee_image = event.target.files[0];
    },
    async createCoffee() {
      const data = new FormData();

      for (const key in this.form) {
        let value = this.form[key];

        if (key === "lactose" || key === "nuts") value = value ? 1 : 0;
        if (key === "coffee_type" && value) value = value.toLowerCase();
        if (value !== null && value !== undefined) data.append(key, value);
      }

      if (this.form.coffee_image) data.append("coffee_image", this.form.coffee_image);

      try {
        await api.post("/coffees", data);
        await this.fetchCoffees();
        this.closeModal();
      } catch (err) {
        if (err.response && err.response.status === 422) {
          console.error("Validation Error:", err.response.data.errors);
        } else {
          console.error(err);
        }
      }
    },
    async updateCoffee() {
      const data = new FormData();

      for (const key in this.form) {
        let value = this.form[key];

        if (key === "lactose" || key === "nuts") value = value ? 1 : 0;
        if (key === "coffee_type" && value) value = value.toLowerCase();
        if (value !== null && value !== undefined) data.append(key, value);
      }

      if (this.form.coffee_image) data.append("coffee_image", this.form.coffee_image);

      try {
        await api.post(`/coffees/${this.editingCoffee.id}?_method=PUT`, data);
        await this.fetchCoffees();
        this.closeModal();
      } catch (err) {
        if (err.response && err.response.status === 422) {
          console.error("Validation Error:", err.response.data.errors);
        } else {
          console.error(err);
        }
      }
    },
    async deleteCoffee(id) {
      if (!confirm("Are you sure you want to delete this coffee?")) return;
      try {
        await api.delete(`/coffees/${id}`);
        await this.fetchCoffees();
      } catch (err) {
        console.error(err);
      }
    }
  },
  mounted() {
    this.fetchCoffees();
  }
};
</script>

<style src="../assets/managecoffee.css"></style>
