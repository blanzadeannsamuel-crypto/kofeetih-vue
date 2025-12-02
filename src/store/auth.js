import { defineStore } from "pinia"
import api from "../store/axios"

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    showLoginNotification: false,
  }),

  actions: {
    async register(form) {
      const res = await api.post("/register", form)

      this.token = res.data.token
      localStorage.setItem("token", this.token)

      this.user = res.data.user     // MUST contain "role"
      localStorage.setItem("user", JSON.stringify(this.user))
    },

    async login(form) {
      const res = await api.post("/login", form)

      this.token = res.data.token
      localStorage.setItem("token", this.token)

      this.user = res.data.user     // MUST contain "role"
      localStorage.setItem("user", JSON.stringify(this.user))
    },

    async fetchUser() {
      // If no token, don't request
      if (!this.token) return

      try {
        const res = await api.get("/user")
        this.user = res.data
        localStorage.setItem("user", JSON.stringify(this.user))
      } catch (err) {
        console.error("Failed to fetch user:", err)
        this.logout()
      }
    },
    async updateDisplayName(newName) {
      try {
        const res = await api.put("/user/display-name", { display_name: newName })
        this.user.display_name = res.data.display_name
        localStorage.setItem("user", JSON.stringify(this.user)) // persist immediately
      } catch (err) {
        console.error("Failed to update display name:", err)
      }
    },
    async logout() {
      try {
        if (this.token) {
          await api.post("/logout")
        }
      } catch (err) {
        console.error("Logout failed:", err)
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    },

    triggerLoginNotification() {
      this.showLoginNotification = true
    },

    closeNotification() {
      this.showLoginNotification = false
    }
  }
})
