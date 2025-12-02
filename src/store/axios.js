import axios from 'axios';
import router from '../router';

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (router.currentRoute.value.name !== "login") {
        await router.push("/");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
