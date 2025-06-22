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

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Load user on app start
  const loadUser = async () => {
    const token = localStorage.getItem("habibi_token");

    if (token) {
      setAuthToken(token);
      try {
        const res = await axios.get(`${API_URL}/auth/profile`);
        dispatch({
          type: actionTypes.USER_LOADED,
          payload: res.data.user,
        });
      } catch (error) {
        console.error("Load user error:", error);
        dispatch({
          type: actionTypes.AUTH_ERROR,
          payload: error.response?.data?.message || "Failed to load user",
        });
      }
    } else {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: false,
      });
    }
  };

  // Register user
  const register = async (userData) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });

    try {
      const res = await axios.post(`${API_URL}/auth/register`, userData);

      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: {
          token: res.data.token,
          user: res.data.user,
        },
      });

      setAuthToken(res.data.token);
      return { success: true, message: res.data.message };
    } catch (error) {
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

    try {
      const res = await axios.post(`${API_URL}/auth/login`, credentials);

      dispatch({
        type: actionTypes.AUTH_SUCCESS,
        payload: {
          token: res.data.token,
          user: res.data.user,
        },
      });

      setAuthToken(res.data.token);
      return { success: true, message: res.data.message };
    } catch (error) {
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
    setAuthToken(null);
    dispatch({ type: actionTypes.LOGOUT });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put(`${API_URL}/auth/profile`, profileData);

      dispatch({
        type: actionTypes.USER_LOADED,
        payload: res.data.user,
      });

      return { success: true, message: res.data.message };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Profile update failed";
      return { success: false, message: errorMessage };
    }
  };

  // Load user on component mount
  useEffect(() => {
    loadUser();
  }, []);

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
