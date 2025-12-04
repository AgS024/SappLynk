// react/src/axios.js
import axios from "axios";
import router from "./router";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("TOKEN");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token inválido / sesión caducada
      localStorage.removeItem("TOKEN");
      try {
        router.navigate("/login");
      } catch (e) {
        console.error("Error navegando a /login:", e);
      }
    }
    // Muy importante: rechazar el error para que llegue a los .catch
    return Promise.reject(error);
  }
);

export default axiosClient;
