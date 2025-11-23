<template>
  <div class="charts-page">
    <div class="header">
      <h1>Coffee Charts</h1>
    </div>

    <!-- Summary Boxes -->
    <div class="summary-boxes">
      <div class="summary-card coffee-count">
        <h3>Total Coffees</h3>
        <p>{{ coffeeCount }}</p>
      </div>
      <div class="summary-card user-count">
        <h3>Total Users</h3>
        <p>{{ userCount }}</p>
      </div>
    </div>

    <section v-if="loading" class="loading">
      Loading chart data...
    </section>

    <section v-else>
      <!-- Predictive Forecast -->
      <div class="chart-section">
        <div class="section-header">
          <h2>Predictive Forecast (Exponential Smoothing)</h2>
          <button class="chart-btn" @click="openModal('predictive')">☑ View List</button>
        </div>
        <canvas id="predictiveChart" style="max-height:400px;"></canvas>
      </div>

      <!-- Prescriptive Recommendation -->
      <div class="chart-section">
        <div class="section-header">
          <h2>Prescriptive Recommendation</h2>
          <button class="chart-btn" @click="openModal('prescriptive')">☑ View List</button>
        </div>
        <canvas id="prescriptiveChart" style="max-height:400px;"></canvas>
      </div>

      <!-- Top 10 Recommended Coffee -->
      <div class="chart-section">
        <div class="section-header">
          <h2>Top 10 Recommended Coffee</h2>
          <button class="chart-btn" @click="openModal('recommended')">☑ View List</button>
        </div>
        <canvas id="recommendedChart" style="max-height:400px;"></canvas>
      </div>

      <!-- Trending Coffee -->
      <div class="chart-section">
        <div class="section-header">
          <h2>Trending Coffee</h2>
          <button class="chart-btn" @click="openModal('trending')">☑ View List</button>
        </div>
        <canvas id="trendingChart" style="max-height:400px;"></canvas>
      </div>

      <!-- Highest Rated Coffee -->
      <div class="chart-section" v-if="highestRated.length">
        <div class="section-header">
          <h2>Highest Rated Coffee</h2>
          <button class="chart-btn" @click="openModal('rating')">☑ View List</button>
        </div>
        <canvas id="ratingChart" style="max-height:400px;"></canvas>
      </div>
    </section>

    <!-- Modal for Coffee Lists -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <button class="close-btn" @click="closeModal">✖</button>
        <h2>{{ modalTitle }}</h2>
        <ul>
          <li v-for="coffee in modalCoffees" :key="coffee.id" class="coffee-item">
            <img v-if="coffee.image_url" :src="coffee.image_url" class="coffee-thumb" />
            <span>
              {{ coffee.coffee_name }}
              <template v-if="modalType==='recommended'"> - Likes: {{ coffee.likes }}</template>
              <template v-else-if="modalType==='trending'"> - Favorites: {{ coffee.favorites }}</template>
              <template v-else-if="modalType==='rating'"> - Rating: {{ coffee.rating }}</template>
              <template v-else-if="modalType==='predictive'"> - Forecast Next Month: {{ coffee.forecast[0] }}</template>
              <template v-else-if="modalType==='prescriptive'"> - Recommended Forecast: {{ coffee.forecast[0] }}</template>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../store/axios";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default {
  data() {
    return {
      coffees: [],
      predictiveCoffees: [],
      prescriptiveCoffees: [],
      loading: true,
      chartInstances: {},
      showModal: false,
      modalType: "",
      modalTitle: "",
      modalCoffees: [],
      userCount: 0,
    };
  },
  computed: {
    topRecommended() {
      return [...this.coffees].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 10);
    },
    trending() {
      return [...this.coffees].sort((a, b) => (b.favorites || 0) - (a.favorites || 0)).slice(0, 10);
    },
    highestRated() {
      return [...this.coffees]
        .filter(c => c.rating !== null && c.rating !== undefined)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);
    },
    coffeeCount() {
      return this.coffees.length;
    },
  },
  mounted() {
    this.fetchCoffees();
    this.fetchUserCount();
  },
  methods: {
    async fetchCoffees() {
      try {
        const res = await api.get("/coffees");
        this.coffees = res.data;
        await this.fetchPredictive();
        this.$nextTick(() => this.renderAllCharts());
      } catch (err) {
        console.error("Error fetching coffees:", err);
      } finally {
        this.loading = false;
      }
    },
    async fetchUserCount() {
      try {
        const res = await api.get("/users/count");
        this.userCount = res.data.count;
      } catch (err) {
        console.error("Error fetching user count:", err);
      }
    },
    async fetchPredictive() {
      try {
        const res = await api.get("/charts/predictive?alpha=0.5&months=3");
        const predictiveData = res.data;

        this.predictiveCoffees = predictiveData.map(p => {
          const match = this.coffees.find(c => c.id === p.id);
          return { ...p, image_url: match?.image_url ?? null };
        });

        this.prescriptiveCoffees = [...this.predictiveCoffees]
          .sort((a, b) => b.forecast[0] - a.forecast[0])
          .slice(0, 5);
      } catch (err) {
        console.error("Error fetching predictive data:", err);
      }
    },
    renderAllCharts() {
      this.renderPredictiveChart();
      this.renderPrescriptiveChart();
      this.renderBarChart("recommendedChart", this.topRecommended, "Likes", c => c.likes);
      this.renderBarChart("trendingChart", this.trending, "Favorites", c => c.favorites);
      this.renderBarChart("ratingChart", this.highestRated, "Rating", c => c.rating);
    },
    renderPredictiveChart() {
      this.$nextTick(() => {
        const canvas = document.getElementById("predictiveChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (this.chartInstances.predictive) this.chartInstances.predictive.destroy();

        const datasets = this.predictiveCoffees.map(coffee => ({
          label: coffee.coffee_name,
          data: [...coffee.smoothed, ...coffee.forecast],
          borderColor: `rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 1)`,
          backgroundColor: "transparent",
          tension: 0.3,
          fill: false,
        }));

        const maxLength = Math.max(...this.predictiveCoffees.map(c => c.smoothed.length + c.forecast.length));
        const labels = Array.from({ length: maxLength }, (_, i) => `Month ${i + 1}`);

        this.chartInstances.predictive = new Chart(ctx, {
          type: "line",
          data: { labels, datasets },
          options: { responsive: true, plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true } } },
        });
      });
    },
    renderPrescriptiveChart() {
      this.$nextTick(() => {
        const canvas = document.getElementById("prescriptiveChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (this.chartInstances.prescriptive) this.chartInstances.prescriptive.destroy();

        const data = this.prescriptiveCoffees.map(c => c.forecast[0]);
        const labels = this.prescriptiveCoffees.map(c => c.coffee_name);

        this.chartInstances.prescriptive = new Chart(ctx, {
          type: "bar",
          data: { labels, datasets: [{ label: "Forecast", data, backgroundColor: "rgba(75, 192, 192, 0.6)" }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
        });
      });
    },
    renderBarChart(canvasId, dataArr, labelName, valueFn) {
      this.$nextTick(() => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (this.chartInstances[canvasId]) this.chartInstances[canvasId].destroy();

        const labels = dataArr.map(c => c.coffee_name);
        const data = dataArr.map(valueFn);

        this.chartInstances[canvasId] = new Chart(ctx, {
          type: "bar",
          data: { labels, datasets: [{ label: labelName, data, backgroundColor: "rgba(255, 99, 132, 0.6)" }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
        });
      });
    },
    openModal(type) {
      this.modalType = type;
      if (type === "recommended") this.modalTitle = "Top 10 Recommended Coffee";
      else if (type === "trending") this.modalTitle = "Trending Coffee";
      else if (type === "rating") this.modalTitle = "Highest Rated Coffee";
      else if (type === "predictive") this.modalTitle = "Predictive Forecast";
      else if (type === "prescriptive") this.modalTitle = "Prescriptive Recommendation";

      this.modalCoffees =
        type === "recommended" ? this.topRecommended :
        type === "trending" ? this.trending :
        type === "rating" ? this.highestRated :
        type === "predictive" ? this.predictiveCoffees :
        type === "prescriptive" ? this.prescriptiveCoffees : [];

      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
  },
};
</script>

<style src="../assets/charts.css"></style>
