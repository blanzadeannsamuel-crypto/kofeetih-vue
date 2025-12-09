<template>
  <div class="dsa-charts-page">
    <div class="header">
      <h1>📊 Dashboard {{ summaryData.currentYear }}</h1>
    </div>

    <div class="summary-boxes">
      <div class="summary-card coffee-count">
        <h3>Total Coffees</h3>
        <h4>{{ summaryData.coffeeCount }}</h4>
      </div>
      <div class="summary-card user-count">
        <h3>Total Users</h3>
        <h4>{{ summaryData.userCount }}</h4>
      </div>
    </div>

    <div class="summary-boxes" v-if="!loading">
      <div class="summary-card trend-report">
        <p>Top Recommended Coffee: {{ summaryData.topLikedCoffee?.coffee_name }}
          <strong>({{ summaryData.topLikedCoffee?.total_likes }} likes)</strong>
        </p>
        <p>Top Rated Coffee: {{ summaryData.topRatedCoffee?.coffee_name }}
            <strong>({{ summaryData.topRatedCoffee?.avg_rate }}⭐)</strong>
        </p>
        <p>Coffee Type Trend: <strong>{{ summaryData.trendReport?.coffee_type }}</strong></p>
        <p>Serving Temperature Trend: <strong>{{ summaryData.trendReport?.temperature }}</strong></p>
        <p>Coffee Type Trend 3 months from now: 
      <strong>{{ summaryData.trendReport?.coffee_type_ma }}</strong>
      </p>
      <p>Serving temperature Trend 3 months from now: 
        <strong>{{ summaryData.trendReport?.temperature_ma }}</strong>
      </p>
      </div>
    </div>

    <section v-if="!loading">
      <div class="chart-section">
        <h2>☕ Monthly Coffee Type – Moving Average</h2>
        <canvas id="coffeeMA"></canvas>
      </div>

      <div class="chart-section">
        <h2>☕ Monthly Coffee Type – Exponential Forecast</h2>
        <canvas id="coffeeEXP"></canvas>
      </div>

      <div class="chart-section">
        <h2>🌡️ Serving Temperature – Moving Average</h2>
        <canvas id="tempMA"></canvas>
      </div>

      <div class="chart-section">
        <h2>🌡️ Serving Temperature – Exponential Forecast</h2>
        <canvas id="tempEXP"></canvas>
      </div>

      <div class="chart-section">
        <h2>🏆 Top 10 Recommended Coffees (Likes)</h2>
        <canvas id="topLikes"></canvas>
      </div>

      <div class="chart-section">
        <h2>⭐ Top 10 Rated Coffees</h2>
        <canvas id="topRated"></canvas>
      </div>
    </section>
  </div>
</template>

<script>
import api from "../store/axios";
import { Chart, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(...registerables, ChartDataLabels);

export default {
  data() {
    return {
      summaryData: {},
      loading: true,
      chartInstances: {},
      monthLabels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    };
  },

  mounted() {
    this.fetchSummary();
  },

  methods: {
    async fetchSummary() {
      try {
        const res = await api.get("/charts/summary");
        this.summaryData = res.data;

        this.$nextTick(() => {
          this.renderCoffeeMA();
          this.renderCoffeeEXP();
          this.renderTempMA();
          this.renderTempEXP();
          this.renderTopLikes();
          this.renderTopRated();
        });
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    getColor(key) {
      return `hsl(${Math.random() * 360},70%,45%)`;
    },

    /* ====================== COFFEE TYPE MOVING AVERAGE ====================== */
    renderCoffeeMA() {
      const ctx = document.getElementById("coffeeMA");
      if (!ctx) return;

      const actual = this.summaryData.monthlyData?.coffee_types || {};
      const forecast = this.summaryData.monthlyForecast?.coffee_types || {};

      const datasets = [];

      Object.entries(actual).forEach(([label, values]) => {
        const color = this.getColor(label);

        datasets.push({
          label: `${label} – Actual`,
          data: values,
          borderColor: color,
          backgroundColor: "transparent",
          tension: 0.4
        });

        const f = forecast[label];
        if (f) {
          datasets.push({
            label: `${label} – MA Forecast`,
            data: [...Array(values.length).fill(null), ...f.ma_forecast],
            borderColor: color,
            borderDash: [8,4],
            backgroundColor: "transparent",
            tension: 0.4
          });
        }
      });

      const maLabels = forecast[Object.keys(forecast)[0]]?.ma_labels || [];

      this.chartInstances.coffeeMA = new Chart(ctx, {
        type: "line",
        data: {
          labels: [...this.monthLabels, ...maLabels],
          datasets
        },
        options: { 
          responsive: true,
          plugins: { datalabels: { display: false } }
        }
      });
    },

    /* ====================== COFFEE TYPE EXPONENTIAL FORECAST ====================== */
    renderCoffeeEXP() {
      const ctx = document.getElementById("coffeeEXP");
      if (!ctx) return;

      const actual = this.summaryData.monthlyData?.coffee_types || {};
      const forecast = this.summaryData.monthlyForecast?.coffee_types || {};

      const datasets = [];

      Object.entries(actual).forEach(([label, values]) => {
        const color = this.getColor(label);
        const last4 = values.slice(-4);

        datasets.push({
          label: `${label} – Actual`,
          data: last4,
          borderColor: color,
          backgroundColor: "transparent",
          tension: 0.4
        });

        const f = forecast[label];
        if (f) {
          datasets.push({
            label: `${label} – EXP Forecast`,
            data: [...Array(last4.length).fill(null), ...f.exp_forecast],
            borderColor: color,
            borderDash: [8,4],
            backgroundColor: "transparent",
            tension: 0.4
          });
        }
      });

      const expLabels = forecast[Object.keys(forecast)[0]]?.exp_labels || [];

      this.chartInstances.coffeeEXP = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Sep","Oct","Nov","Dec", ...expLabels],
          datasets
        },
        options: { 
          responsive: true,
          plugins: { datalabels: { display: false } }
        }
      });
    },

    /* ====================== TEMPERATURE (serving_temp) MA ====================== */
    renderTempMA() {
      const ctx = document.getElementById("tempMA");
      if (!ctx) return;

      const actual = this.summaryData.monthlyData?.serving_temp || {};
      const forecast = this.summaryData.monthlyForecast?.serving_temp || {};

      const datasets = [];

      Object.entries(actual).forEach(([label, values]) => {
        const color = this.getColor(label);

        datasets.push({
          label: `${label} – Actual`,
          data: values,
          borderColor: color,
          backgroundColor: "transparent",
          tension: 0.4
        });

        const f = forecast[label];
        if (f) {
          datasets.push({
            label: `${label} – MA Forecast`,
            data: [...Array(values.length).fill(null), ...f.ma_forecast],
            borderColor: color,
            borderDash: [8,4],
            backgroundColor: "transparent",
            tension: 0.4
          });
        }
      });

      const maLabels = forecast[Object.keys(forecast)[0]]?.ma_labels || [];

      this.chartInstances.tempMA = new Chart(ctx, {
        type: "line",
        data: {
          labels: [...this.monthLabels, ...maLabels],
          datasets
        },
        options: { 
          responsive: true,
          plugins: { datalabels: { display: false } }
        }
      });
    },

    /* ====================== TEMPERATURE (serving_temp) EXP ====================== */
    renderTempEXP() {
      const ctx = document.getElementById("tempEXP");
      if (!ctx) return;

      const actual = this.summaryData.monthlyData?.serving_temp || {};
      const forecast = this.summaryData.monthlyForecast?.serving_temp || {};

      const datasets = [];

      Object.entries(actual).forEach(([label, values]) => {
        const color = this.getColor(label);
        const last4 = values.slice(-4);

        datasets.push({
          label: `${label} – Actual`,
          data: last4,
          borderColor: color,
          tension: 0.4
        });

        const f = forecast[label];
        if (f) {
          datasets.push({
            label: `${label} – EXP Forecast`,
            data: [...Array(last4.length).fill(null), ...f.exp_forecast],
            borderColor: color,
            borderDash: [8,4],
            tension: 0.4
          });
        }
      });

      const expLabels = forecast[Object.keys(forecast)[0]]?.exp_labels || [];

      this.chartInstances.tempEXP = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Sep","Oct","Nov","Dec", ...expLabels],
          datasets
        },
        options: { 
          responsive: true,
          plugins: { datalabels: { display: false } }
        }
      });
    },

    /* ====================== TOP LIKES ====================== */
    renderTopLikes() {
      const ctx = document.getElementById("topLikes");
      if (!ctx) return;

      const labels = this.summaryData.topByLikes.map(c => c.coffee_name);
      const data = this.summaryData.topByLikes.map(c => c.total_likes);

      this.chartInstances.topLikes = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Total Likes",
            data
          }]
        },
        options: { 
          indexAxis: "y",
          responsive: true,
          plugins: { datalabels: { display: false } }
        }
      });
    },

    /* ====================== TOP RATED ====================== */
    renderTopRated() {
      const ctx = document.getElementById("topRated");
      if (!ctx) return;

      const labels = this.summaryData.topByRating.map(c => c.coffee_name);
      const data = this.summaryData.topByRating.map(c => parseFloat(c.avg_rate));

      this.chartInstances.topRated = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Avg Rating",
            data
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          scales: { x: { max: 5 } },
          plugins: { datalabels: { display: false } }
        }
      });
    }
  }
};
</script>

<style src="../assets/charts.css"></style>
