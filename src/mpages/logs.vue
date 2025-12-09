<template>
  <div class="audit-logs-page">
    <h2 align="center">Audit Logs Dashboard</h2>

    <!-- ==================== AUDIT LOGS ==================== -->
    <h3>Authentication Logs</h3>
    <div v-if="loadingLogs" class="loading">Loading logs...</div>
    <div v-else class="audit-table-box">
      <table class="audit-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>Description</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in auditLogs" :key="log.id">
            <td>{{ formatDate(log.created_at) }}</td>
            <td>{{ log.action }}</td>
            <td>{{ log.description }}</td>
            <td>{{ log.user?.display_name || "N/A" }}</td>
          </tr>
        </tbody>
      </table>
      <button
        v-if="nextLogsPage"
        class="load-more-btn"
        @click="fetchAuditLogs(nextLogsPage)"
      >
        Load More
      </button>
    </div>

    <!-- ==================== AUDIT REPORT ==================== -->
    <h3 style="margin-top: 50px;">Interaction Reports</h3>
    <div v-if="loadingReport" class="loading">Loading reports...</div>
    <div v-else class="audit-table-box">
      <table class="audit-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>Description</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in auditReport" :key="log.id">
            <td>{{ formatDate(log.created_at) }}</td>
            <td>{{ log.action }}</td>
            <td>{{ log.description }}</td>
            <td>{{ log.user?.display_name || "N/A" }}</td>
          </tr>
        </tbody>
      </table>
      <button
        v-if="nextReportPage"
        class="load-more-btn"
        @click="fetchAuditReport(nextReportPage)"
      >
        Load More
      </button>
    </div>
  </div>
</template>

<script>
import api from "../store/axios";
import dayjs from "dayjs";

export default {
  data() {
    return {
      // Audit Logs
      auditLogs: [],
      loadingLogs: true,
      nextLogsPage: null,

      // Audit Reports
      auditReport: [],
      loadingReport: true,
      nextReportPage: null,
    };
  },

  mounted() {
    this.fetchAuditLogs();
    this.fetchAuditReport();
  },

  methods: {
    formatDate(datetime) {
      return datetime ? dayjs(datetime).format("YYYY-MM-DD HH:mm") : "N/A";
    },

    // Fetch audit logs
    async fetchAuditLogs(url = "/audit-logs") {
      this.loadingLogs = true;
      try {
        const res = await api.get(url);
        this.auditLogs.push(...res.data.data);
        this.nextLogsPage = res.data.next_page_url;
      } catch (err) {
        console.error("Fetch audit logs failed:", err);
      } finally {
        this.loadingLogs = false;
      }
    },

    // Fetch audit report
    async fetchAuditReport(url = "/audit-reports") {
      this.loadingReport = true;
      try {
        const res = await api.get(url);
        this.auditReport.push(...res.data.data);
        this.nextReportPage = res.data.next_page_url;
      } catch (err) {
        console.error("Fetch audit report failed:", err);
      } finally {
        this.loadingReport = false;
      }
    },
  },
};
</script>

<style src="../assets/manageUser.css"></style>
