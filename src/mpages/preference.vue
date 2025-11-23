<template>
  <div class="preference-page">
    <!-- Skip link -->
    <button class="skip-top" @click="skipPreferences" :disabled="loading">
      Skip
    </button>

    <h2>My Coffee Preferences</h2>

    <form class="preference-form" @submit.prevent="savePreferences">
      <div class="form-group">
        <label for="coffee_type">Coffee Type</label>
        <input
          v-model="coffee_type"
          type="text"
          id="coffee_type"
          placeholder="e.g., strong, balanced, sweet"
        />
      </div>

      <div class="form-group">
        <label for="coffee_allowance">Coffee Allowance (₱)</label>
        <input
          v-model.number="coffee_allowance"
          type="number"
          id="coffee_allowance"
          min="120"
          placeholder="Minimum ₱120"
        />
      </div>

      <div class="form-group">
        <label for="temp">Temperature</label>
        <select v-model="temp" id="temp">
          <option value="" disabled>Select Temperature</option>
          <option value="hot">Hot</option>
          <option value="cold">Cold</option>
        </select>
      </div>

      <div class="checkbox-group">
        <div>
          <label for="lactose">Lactose Intolerant</label>
          <select v-model="lactose" id="lactose">
            <option value="" disabled>Select</option>
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
        </div>

        <div>
          <label for="nuts_allergy">Nut Allergy</label>
          <select v-model="nuts_allergy" id="nuts_allergy">
            <option value="" disabled>Select</option>
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
        </div>
      </div>

      <div class="actions">
        <button type="submit" :disabled="loading">
          {{ loading ? "Saving..." : "Save Changes" }}
        </button>
      </div>

      <p class="message">{{ message }}</p>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../store/axios"; // <- use your axios instance

export default {
  setup() {
    const coffee_type = ref("");
    const coffee_allowance = ref(120);
    const temp = ref("");
    const lactose = ref(null); // use null to differentiate unset
    const nuts_allergy = ref(null);
    const message = ref("");
    const loading = ref(false);

    const router = useRouter();

    const loadPreferences = async () => {
      try {
        const res = await api.get("/preferences");
        const data = res.data?.data ?? {};

        coffee_type.value = data.coffee_type ?? "";
        coffee_allowance.value = data.coffee_allowance ?? 120;
        temp.value = data.temp ?? "";
        lactose.value = data.lactose ?? null;
        nuts_allergy.value = data.nuts_allergy ?? null;
      } catch (err) {
        console.error("Error loading preferences:", err);
        message.value = "⚠️ Failed to load preferences.";
      }
    };

    const savePreferences = async () => {
      loading.value = true;
      message.value = "";

      try {
        await api.post("/preferences", {
          coffee_type: coffee_type.value || null,
          coffee_allowance: coffee_allowance.value || 120,
          temp: temp.value || null,
          lactose: lactose.value,
          nuts_allergy: nuts_allergy.value,
        });

        message.value = "☕ Preferences saved successfully!";
        setTimeout(() => router.push("/main/catalog"), 500);
      } catch (err) {
        console.error("Error saving preferences:", err);
        message.value =
          err.response?.data?.message || "⚠️ Failed to save preferences.";
      } finally {
        loading.value = false;
      }
    };

    const skipPreferences = () => {
      router.push("/main/catalog");
    };

    onMounted(() => {
      loadPreferences();
    });

    return {
      coffee_type,
      coffee_allowance,
      temp,
      lactose,
      nuts_allergy,
      message,
      loading,
      savePreferences,
      skipPreferences,
    };
  },
};
</script>

<style src="../assets/preference.css"></style>
