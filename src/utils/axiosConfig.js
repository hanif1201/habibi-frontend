// src/utils/axiosConfig.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create a configured axios instance
const createApiInstance = () => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 seconds
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("habibi_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // console.log("🔑 Token added to request"); // Uncomment for debugging
      } else {
        console.warn("⚠️ No authentication token found");
      }

      return config;
    },
    (error) => {
      console.error("❌ Request interceptor error:", error);
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle common errors
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response) {
        const { status, data } = error.response;

        switch (status) {
          case 401:
            console.warn("🚫 Unauthorized - redirecting to login");
            // Clear invalid token
            localStorage.removeItem("habibi_token");
            // Optionally redirect to login page
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
            break;

          case 403:
            console.warn("🚫 Forbidden - insufficient permissions");
            break;

          case 500:
            console.error(
              "🔥 Server error:",
              data?.message || "Internal server error"
            );
            break;

          default:
            console.error(`❌ HTTP ${status}:`, data?.message || error.message);
        }
      } else if (error.request) {
        console.error("🌐 Network error - no response received");
      } else {
        console.error("⚙️ Request setup error:", error.message);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Create and export the default instance
const api = createApiInstance();

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("habibi_token");
  return !!token;
};

// Helper function to get auth headers manually (if needed)
export const getAuthHeaders = () => {
  const token = localStorage.getItem("habibi_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to clear auth data
export const clearAuth = () => {
  localStorage.removeItem("habibi_token");
  delete axios.defaults.headers.common["Authorization"];
};

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("habibi_token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    clearAuth();
  }
};

// Export the configured axios instance as default
export default api;
