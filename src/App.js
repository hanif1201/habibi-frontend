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
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard";
import ChatPage from "./components/Chat/ChatPage";
import Debug from "./components/Debug";
import "./App.css";

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className='App'>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />

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
  );
}

export default App;
