// src/App.js - Updated with email system routes
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Components
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import EmailVerification from "./components/Auth/EmailVerification";
import ResendVerification from "./components/Auth/ResendVerification";

// Main App Components
import Dashboard from "./components/Dashboard";
import ChatPage from "./components/Chat/ChatPage";
import Debug from "./components/Debug";
import MatchNotification from "./components/Matching/MatchNotification";

import "./App.css";

function App() {
  return (
    <>
      <MatchNotification />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className='App'>
          <AuthProvider>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route
                path='/reset-password/:token'
                element={<ResetPassword />}
              />
              <Route
                path='/verify-email/:token'
                element={<EmailVerification />}
              />
              <Route
                path='/resend-verification'
                element={<ResendVerification />}
              />

              {/* Protected Routes with Chat Provider */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute>
                    <ChatProvider>
                      <Dashboard />
                    </ChatProvider>
                  </ProtectedRoute>
                }
              />

              <Route
                path='/chat'
                element={
                  <ProtectedRoute>
                    <ChatProvider>
                      <ChatPage />
                    </ChatProvider>
                  </ProtectedRoute>
                }
              />

              {/* Debug Route - Remove in production */}
              <Route
                path='/debug'
                element={
                  <ProtectedRoute>
                    <Debug />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path='/' element={<Navigate to='/dashboard' replace />} />

              {/* Catch all route */}
              <Route path='*' element={<Navigate to='/dashboard' replace />} />
            </Routes>
          </AuthProvider>
        </div>
      </Router>
    </>
  );
}

export default App;
