// src/components/Auth/ResetPassword.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Validate token on component mount
  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/validate-reset-token`,
        {
          token,
        }
      );

      if (response.data.success) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setError("Invalid or expired reset token");
      }
    } catch (error) {
      console.error("Token validation error:", error);
      setTokenValid(false);
      setError(
        error.response?.data?.message || "Invalid or expired reset token"
      );
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        password,
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'>
        <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
            <p className='text-gray-600'>Validating reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'>
        <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl'>
          <div className='text-center'>
            <div className='mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
              <svg
                className='h-8 w-8 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Invalid Reset Link
            </h2>
            <p className='text-gray-600 mb-6'>{error}</p>
            <div className='space-y-3'>
              <Link
                to='/forgot-password'
                className='block w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg transition-colors text-center'
              >
                Request New Reset Link
              </Link>
              <Link
                to='/login'
                className='block w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'>
        <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl'>
          <div className='text-center'>
            <div className='mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4'>
              <svg
                className='h-8 w-8 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Password Reset Successfully!
            </h2>
            <p className='text-gray-600 mb-6'>
              Your password has been updated. You can now login with your new
              password.
            </p>
            <p className='text-sm text-gray-500 mb-6'>
              Redirecting to login page in 3 seconds...
            </p>
            <Link
              to='/login'
              className='inline-block bg-pink-500 hover:bg-pink-600 text-white py-2 px-6 rounded-lg transition-colors'
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'>
      <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-2'>
            Reset Your Password
          </h2>
          <p className='text-gray-600'>Enter your new password below</p>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              New Password
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
              placeholder='Enter new password'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Confirm New Password
            </label>
            <input
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
              placeholder='Confirm new password'
            />
          </div>

          <button
            type='submit'
            disabled={loading || !password || !confirmPassword}
            className='w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-4 rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center'
          >
            {loading ? (
              <>
                <svg
                  className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
