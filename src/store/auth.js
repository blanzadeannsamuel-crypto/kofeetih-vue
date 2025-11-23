import { defineStore } from "pinia"
import api from "../store/axios"

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: localStorage.getItem("token") || null, 
    showLoginNotification: false,
  }),

  actions: {
    async register(form) {
      const res = await api.post("/register", form)

      this.token = res.data.token
      localStorage.setItem("token", this.token) 

      this.user = res.data.user
    },

    async login(form) {
      const res = await api.post("/login", form)

      this.token = res.data.token
      localStorage.setItem("token", this.token) 

      this.user = res.data.user
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