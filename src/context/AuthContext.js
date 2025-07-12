import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem("habibi_token"),
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Action types
const actionTypes = {
  USER_LOADED: "USER_LOADED",
  AUTH_SUCCESS: "AUTH_SUCCESS",
  AUTH_ERROR: "AUTH_ERROR",
  LOGOUT: "LOGOUT",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_LOADING: "SET_LOADING",
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
        error: null,
      };

    case actionTypes.AUTH_SUCCESS:
      localStorage.setItem("habibi_token", action.payload.token);
      // Set global axios header
      setAuthToken(action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case actionTypes.AUTH_ERROR:
      localStorage.removeItem("habibi_token");
      clearAuthToken();
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case actionTypes.LOGOUT:
      localStorage.removeItem("habibi_token");
      clearAuthToken();
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// API base URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Token management functions
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("🔑 Auth token set in axios defaults");
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

const clearAuthToken = () => {
  delete axios.defaults.headers.common["Authorization"];
  console.log("🗑️ Auth token cleared from axios defaults");
};

// Create axios instance with interceptors
const createAuthenticatedAxios = () => {
  const instance = axios.create({
    timeout: 30000, // 30 seconds
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("habibi_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem("habibi_token");
        clearAuthToken();
        console.warn("🚫 Token expired or invalid - cleared from storage");
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Create authenticated axios instance
  const authAxios = createAuthenticatedAxios();

  // Load user on app start
  const loadUser = async () => {
    const token = localStorage.getItem("habibi_token");

    if (token) {
      setAuthToken(token);
      console.log("🔄 Loading user with existing token...");

      try {
        const res = await authAxios.get(`${API_URL}/auth/profile`);
        console.log("✅ User loaded successfully:", res.data.user?.firstName);

        dispatch({
          type: actionTypes.USER_LOADED,
          payload: res.data.user,
        });
      } catch (error) {
        console.error(
          "❌ Load user error:",
          error.response?.data?.message || error.message
        );

        // Clear invalid token
        if (error.response?.status === 401) {
          console.log("🗑️ Invalid token detected, clearing...");
        }

        dispatch({
          type: actionTypes.AUTH_ERROR,
          payload: error.response?.data?.message || "Failed to load user",
        });
      }
    } else {
      console.log("ℹ️ No token found, user not authenticated");
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: false,
      });
    }
  };

  // Register user
  const register = async (userData) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    console.log("📝 Attempting user registration...");

    try {
      const res = await axios.post(`${API_URL}/auth/register`, userData);
      console.log("✅ Registration successful:", res.data.user?.firstName);

      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: {
          token: res.data.token,
          user: res.data.user,
        },
      });

      return { success: true, message: res.data.message };
    } catch (error) {
      console.error(
        "❌ Registration error:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      dispatch({
        type: actionTypes.AUTH_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  };

  // Login user
  const login = async (credentials) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    console.log("🔐 Attempting user login...");

    try {
      const res = await axios.post(`${API_URL}/auth/login`, credentials);
      console.log("✅ Login successful:", res.data.user?.firstName);

      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: {
          token: res.data.token,
          user: res.data.user,
        },
      });

      return { success: true, message: res.data.message };
    } catch (error) {
      console.error("❌ Login error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Login failed";
      dispatch({
        type: actionTypes.AUTH_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  };

  // Logout user
  const logout = () => {
    console.log("👋 User logging out...");
    dispatch({ type: actionTypes.LOGOUT });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    console.log("📝 Updating user profile...");

    try {
      const res = await authAxios.put(`${API_URL}/auth/profile`, profileData);
      console.log("✅ Profile updated successfully");

      dispatch({
        type: actionTypes.USER_LOADED,
        payload: res.data.user,
      });

      return { success: true, message: res.data.message };
    } catch (error) {
      console.error(
        "❌ Profile update error:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.message || "Profile update failed";
      return { success: false, message: errorMessage };
    }
  };

  // Refresh user data (useful after photo uploads, etc.)
  const refreshUser = async () => {
    console.log("🔄 Refreshing user data...");

    try {
      const res = await authAxios.get(`${API_URL}/auth/profile`);
      console.log("✅ User data refreshed");

      dispatch({
        type: actionTypes.USER_LOADED,
        payload: res.data.user,
      });

      return { success: true, user: res.data.user };
    } catch (error) {
      console.error(
        "❌ Refresh user error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message: error.response?.data?.message || "Failed to refresh user data",
      };
    }
  };

  // Check authentication status
  const checkAuth = () => {
    const token = localStorage.getItem("habibi_token");
    const isValid = !!token && !!state.user;
    console.log("🔍 Auth check:", {
      hasToken: !!token,
      hasUser: !!state.user,
      isValid,
    });
    return isValid;
  };

  // Load user on component mount and set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem("habibi_token");
    if (token) {
      setAuthToken(token);
    }
    loadUser();
  }, []);

  // Debug effect to monitor auth state changes
  useEffect(() => {
    console.log("🔍 Auth state changed:", {
      isAuthenticated: state.isAuthenticated,
      hasUser: !!state.user,
      hasToken: !!state.token,
      loading: state.loading,
      error: state.error,
    });
  }, [
    state.isAuthenticated,
    state.user,
    state.token,
    state.loading,
    state.error,
  ]);

  // Context value
  const contextValue = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    register,
    login,
    logout,
    clearError,
    updateProfile,
    loadUser,
    refreshUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
