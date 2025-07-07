// src/components/Auth/Login.js - Updated with email system features
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailVerificationNotice, setShowEmailVerificationNotice] =
    useState(false);

  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Clear error when component mounts or unmounts
  useEffect(() => {
    clearError();
  }, []); // Only run on mount

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      return;
    }

    const result = await login(formData);

    if (result.success) {
      navigate("/dashboard");
    } else {
      // Check if the error is related to email verification
      if (result.message && result.message.includes("verify")) {
        setShowEmailVerificationNotice(true);
      }
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'>
      <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl'>
        {/* Header */}
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-2'>
            Welcome to Habibi
          </h2>
          <p className='text-gray-600'>Sign in to find your perfect match</p>
        </div>

        {/* Email Verification Notice */}
        {showEmailVerificationNotice && (
          <div className='bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg'>
            <div className='flex'>
              <svg
                className='flex-shrink-0 w-5 h-5 text-yellow-400 mt-0.5'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              <div className='ml-3'>
                <h4 className='text-sm font-medium text-yellow-800'>
                  Email Verification Required
                </h4>
                <p className='mt-1 text-sm text-yellow-700'>
                  Please check your email and click the verification link to
                  activate your account.
                </p>
                <div className='mt-2'>
                  <Link
                    to='/resend-verification'
                    className='text-yellow-800 hover:text-yellow-900 font-medium underline'
                  >
                    Resend verification email
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !showEmailVerificationNotice && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='space-y-4'>
            {/* Email Field */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Email Address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                required
                value={formData.email}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                placeholder='Enter your email'
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Password
              </label>
              <div className='relative'>
                <input
                  id='password'
                  name='password'
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-10'
                  placeholder='Enter your password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700'
                >
                  {showPassword ? (
                    <svg
                      className='h-5 w-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21'
                      />
                    </svg>
                  ) : (
                    <svg
                      className='h-5 w-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className='text-right'>
            <Link
              to='/forgot-password'
              className='text-sm text-pink-600 hover:text-pink-500 transition-colors duration-200'
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={loading}
            className='w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
          >
            {loading ? (
              <div className='flex items-center'>
                <svg
                  className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
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
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Register Link */}
          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              Don't have an account?{" "}
              <Link
                to='/register'
                className='font-medium text-pink-600 hover:text-pink-500 transition-colors duration-200'
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Email Verification Help */}
          <div className='text-center'>
            <p className='text-xs text-gray-500'>
              Having trouble with email verification?{" "}
              <Link
                to='/resend-verification'
                className='text-pink-600 hover:text-pink-500 underline'
              >
                Resend verification email
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
