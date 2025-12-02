<template>
  <div class="dsa-charts-page">
    <div class="header">
      <h1>📊 Dashboard  {{ summaryData.currentYear }}</h1>
    </div>

    <div class="summary-boxes">
      <div class="summary-card coffee-count">
        <h3>Total Coffees</h3>
        <p>{{ summaryData.coffeeCount }}</p>
      </div>
      <div class="summary-card user-count">
        <h3>Total Users</h3>
        <p>{{ summaryData.userCount }}</p>
      </div>
    </div>

    <!-- Trend / Top Coffee Report -->
    <div class="summary-boxes" v-if="!loading">
      <div class="summary-card trend-report">
        <p>Top Recommended Coffee: {{ summaryData.topLikedCoffee?.coffee_name }} <strong>({{ summaryData.topLikedCoffee?.total_likes }} likes)</strong></p>
        <p>Coffee Trend:  <strong>{{ summaryData.trendReport?.coffee_type }}</strong></p>
        <p>Temperature Trend: <strong>{{ summaryData.trendReport?.temperature }}</strong></p>
      </div>
    </div>

    <section v-if="!loading">
      <!-- Coffee Charts -->
      <div class="chart-section">
        <h2>☕ Monthly Coffee Type – Moving Average (3-period)</h2>
        <canvas id="monthlyCoffeeTypeMA"></canvas>
      </div>

      <div class="chart-section">
        <h2>☕ Monthly Coffee Type – Exponential Forecast</h2>
        <canvas id="monthlyCoffeeTypeEXP"></canvas>
      </div>

      <!-- Temperature Charts -->
      <div class="chart-section">
        <h2>🌡️ Temperature – Moving Average (3-period)</h2>
        <canvas id="temperatureMA"></canvas>
      </div>

      <div class="chart-section">
        <h2>🌡️ Temperature – Exponential Forecast</h2>
        <canvas id="temperatureEXP"></canvas>
      </div>

      <!-- Descriptive Charts -->
      <div class="chart-section">
        <h2>🏆 Top 10 Recommended Coffees (Total Likes)</h2>
        <canvas id="topRecommended"></canvas>
      </div>

      <div class="chart-section">
        <h2>⭐ Top 10 Rated Coffees (Average Rating)</h2>
        <canvas id="topRated"></canvas>
      </div>
    </section>
  </div>
</template>

<script>
import api from "../store/axios";
import { Chart, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(...registerables);
Chart.register(ChartDataLabels);

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
    /* ------------------------------------------
      ⭐ YEAR LABEL PLUGIN (small top-right text)
    -------------------------------------------*/
    chartYearPlugin() {
      const vue = this;
      return {
        id: "annotationYear",
        afterDraw(chart) {
          const { ctx } = chart;
          ctx.save();
          ctx.font = "12px Poppins";
          ctx.fillStyle = "#444";
          ctx.textAlign = "right";
          const y = Math.max(chart.height * 0.01, 6);
          ctx.fillText(
            vue.summaryData.currentYear,
            chart.width - 10,
            y
          );
          ctx.restore();
        }
      };
    },

    async fetchSummary() {
      try {
        const res = await api.get("/charts/summary");
        this.summaryData = res.data;

        this.summaryData.topOneRecommended = this.summaryData.topRecommended?.[0] || null;

        this.$nextTick(() => {
          // Coffee charts
          this.renderMonthlyMA();
          this.renderMonthlyEXP();

          // Temperature charts
          this.renderTemperatureMA();
          this.renderTemperatureEXP();

          // Descriptive charts
          this.renderTopRecommended();
          this.renderTopRated();
        });
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    getLineColor(key) {
      const map = {
        "Strong": "rgba(255,99,132,1)",
        "Balanced": "rgba(54,162,235,1)",
        "Sweet": "rgba(255,206,86,1)",
        "Hot": "rgba(255,99,132,1)",
        "Cold": "rgba(54,162,235,1)"
      };
      return map[key] || `hsl(${Math.random() * 360},70%,50%)`;
    },

    /* ---------------- MOVING AVERAGE ---------------- */
    renderMonthlyMA() {
      const ctx = document.getElementById("monthlyCoffeeTypeMA")?.getContext("2d");
      if (!ctx) return;
      if (this.chartInstances.monthlyCoffeeTypeMA) this.chartInstances.monthlyCoffeeTypeMA.destroy();

      const actual = this.summaryData.monthlyData?.coffee_types || {};
      const forecast = this.summaryData.monthlyForecast?.coffee_types || {};
      const labels = [...this.monthLabels];
      const datasets = [];

      Object.entries(actual).forEach(([key, values]) => {
        const color = this.getLineColor(key);

        datasets.push({
          label: `${key} – Actual`,
          data: values,
          borderColor: color,
          borderWidth: 2,
          backgroundColor: "transparent",
          tension: 0.4,
          pointRadius: 4,
          datalabels: { display: false }
        });

        if (forecast[key]) {
          const forecastData = Array(values.length).fill(null).concat(forecast[key].ma_values);
          datasets.push({
            label: `${key} – Forecast (MA)`,
            data: forecastData,
            borderColor: color,
            borderWidth: 2,
            borderDash: [10,5],
            backgroundColor: "transparent",
            tension: 0.4,
            pointRadius: 4,
            datalabels: { display: false }
          });
        }
      });

      const forecastLabels = forecast[Object.keys(forecast)[0]]?.ma_labels || [];

      this.chartInstances.monthlyCoffeeTypeMA = new Chart(ctx, {
        type: "line",
        plugins: [this.chartYearPlugin()],
        data: { labels: [...labels, ...forecastLabels], datasets },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: true },
            tooltip: { enabled: true },
            annotationYear: true
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    },

    /* ---------------- EXPONENTIAL FORECAST ---------------- */
    renderMonthlyEXP() {
      const ctx = document.getElementById("monthlyCoffeeTypeEXP")?.getContext("2d");
      if (!ctx) return;
      if (this.chartInstances.monthlyCoffeeTypeEXP) this.chartInstances.monthlyCoffeeTypeEXP.destroy();

      const actual = this.summaryData.monthlyData?.coffee_types || {};
      const forecast = this.summaryData.monthlyForecast?.coffee_types || {};
      const labels = ["Sep","Oct","Nov","Dec"];
      const datasets = [];

      Object.entries(actual).forEach(([key, values]) => {
        const color = this.getLineColor(key);
        const last4 = values.slice(-4);

        datasets.push({
          label: `${key} – Actual`,
          data: last4,
          borderColor: color,
          borderWidth: 2,
          backgroundColor: "transparent",
          tension: 0.4,
          pointRadius: 4,
          datalabels: { display: false }
        });

        if (forecast[key]) {
          const forecastData = Array(last4.length).fill(null).concat(forecast[key].exp_values);
          datasets.push({
            label: `${key} – Forecast (EXP)`,
            data: forecastData,
            borderColor: color,
            borderWidth: 2,
            borderDash: [10,5],
            backgroundColor: "transparent",
            tension: 0.4,
            pointRadius: 4,
            datalabels: { display: false }
          });
        }
      });

      const forecastLabels = forecast[Object.keys(forecast)[0]]?.exp_labels || [];

      this.chartInstances.monthlyCoffeeTypeEXP = new Chart(ctx, {
        type: "line",
        plugins: [this.chartYearPlugin()],
        data: { labels: [...labels, ...forecastLabels], datasets },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: true },
            tooltip: { enabled: true },
            annotationYear: true
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    },

    /* ---------------- TEMPERATURE ---------------- */
    renderTemperatureMA() {
      const ctx = document.getElementById("temperatureMA")?.getContext("2d");
      if (!ctx) return;
      if (this.chartInstances.temperatureMA) this.chartInstances.temperatureMA.destroy();

      const actual = this.summaryData.monthlyData?.temperature || {};
      const forecast = this.summaryData.monthlyForecast?.temperature || {};
      const labels = [...this.monthLabels];
      const datasets = [];

      Object.entries(actual).forEach(([key, values]) => {
        const color = this.getLineColor(key);

        datasets.push({
          label: `${key} – Actual`,
          data: values,
          borderColor: color,
          borderWidth: 2,
          backgroundColor: "transparent",
          tension: 0.4,
          pointRadius: 4,
          datalabels: { display: false }
        });

        if (forecast[key]) {
          const forecastData = Array(values.length).fill(null).concat(forecast[key].ma_values);
          datasets.push({
            label: `${key} – Forecast (MA)`,
            data: forecastData,
            borderColor: color,
            borderWidth: 2,
            borderDash: [10,5],
            backgroundColor: "transparent",
            tension: 0.4,
            pointRadius: 4,
            datalabels: { display: false }
          });
        }
      });

      const forecastLabels = forecast[Object.keys(forecast)[0]]?.ma_labels || [];

      this.chartInstances.temperatureMA = new Chart(ctx, {
        type: "line",
        plugins: [this.chartYearPlugin()],
        data: { labels: [...labels, ...forecastLabels], datasets },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: true },
            tooltip: { enabled: true },
            annotationYear: true
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    },

    renderTemperatureEXP() {
      const ctx = document.getElementById("temperatureEXP")?.getContext("2d");
      if (!ctx) return;
      if (this.chartInstances.temperatureEXP) this.chartInstances.temperatureEXP.destroy();

      const actual = this.summaryData.monthlyData?.temperature || {};
      const forecast = this.summaryData.monthlyForecast?.temperature || {};
      const labels = ["Sep","Oct","Nov","Dec"];
      const datasets = [];

      Object.entries(actual).forEach(([key, values]) => {
        const color = this.getLineColor(key);
        const last4 = values.slice(-4);

        datasets.push({
          label: `${key} – Actual`,
          data: last4,
          borderColor: color,
          borderWidth: 2,
          backgroundColor: "transparent",
          tension: 0.4,
          pointRadius: 4,
          datalabels: { display: false }
        });

        if (forecast[key]) {
          const forecastData = Array(last4.length).fill(null).concat(forecast[key].exp_values);
          datasets.push({
            label: `${key} – Forecast (EXP)`,
            data: forecastData,
            borderColor: color,
            borderWidth: 2,
            borderDash: [10,5],
            backgroundColor: "transparent",
            tension: 0.4,
            pointRadius: 4,
            datalabels: { display: false }
          });
        }
      });

      const forecastLabels = forecast[Object.keys(forecast)[0]]?.exp_labels || [];

      this.chartInstances.temperatureEXP = new Chart(ctx, {
        type: "line",
        plugins: [this.chartYearPlugin()],
        data: { labels: [...labels, ...forecastLabels], datasets },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: true },
            tooltip: { enabled: true },
            annotationYear: true
          },
          scales: { y: { beginAtZero: true } }
        }
      });
    },

    /* ---------------- TOP RECOMMENDED ---------------- */
    renderTopRecommended() {
      const ctx = document.getElementById("topRecommended")?.getContext("2d");
      if (!ctx) return;
      if (this.chartInstances.topByLikes) this.chartInstances.topByLikes.destroy();

      const labels = this.summaryData.topByLikes.map(c => c.coffee_name);
      const data = this.summaryData.topByLikes.map(c => c.total_likes);

      this.chartInstances.topByLikes= new Chart(ctx, {
        type: "bar",
        data: { labels, datasets: [{ label: "Total Likes", data, backgroundColor: "rgba(54,162,235,0.6)", borderColor: "rgba(54,162,235,1)", borderWidth: 1 }] },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: true }, datalabels: { anchor: 'end', align: 'right', color: '#000' } }, scales: { x: { beginAtZero: true } } }
      });
    },

    /* ---------------- TOP RATED ---------------- */
    renderTopRated() {
      const ctx = document.getElementById("topRated")?.getContext("2d");
      if (!ctx) return;
      if (this.chartInstances.topByRating) this.chartInstances.topByRating.destroy();

      const labels = this.summaryData.topByRating.map(c => c.coffee_name);
      const data = this.summaryData.topByRating.map(c => parseFloat(c.avg_rate));

      this.chartInstances.topByRating = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets: [{ label: "Average Rating", data, backgroundColor: "rgba(255,206,86,0.6)", borderColor: "rgba(255,206,86,1)", borderWidth: 1 }] },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: true }, datalabels: { anchor: 'end', align: 'right', color: '#000' } }, scales: { x: { beginAtZero: true, max: 5 } } }
      });
    }
  }
};
</script>

<style src="../assets/charts.css"></style>
