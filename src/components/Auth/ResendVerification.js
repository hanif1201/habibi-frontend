// src/components/Auth/ResendVerification.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/auth/resend-verification`, {
        email: email.trim().toLowerCase(),
      });

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to send verification email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
              Verification Email Sent!
            </h2>
            <p className='text-gray-600 mb-6'>
              We've sent a new verification email to <strong>{email}</strong>
            </p>
            <p className='text-sm text-gray-500 mb-6'>
              Please check your email and click the verification link to
              activate your account.
            </p>
            <div className='space-y-3'>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                className='w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg transition-colors'
              >
                Send to Different Email
              </button>
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

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'>
      <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl'>
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-2'>
            Resend Verification Email
          </h2>
          <p className='text-gray-600'>
            Enter your email to receive a new verification link
          </p>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email Address
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
              placeholder='Enter your email'
            />
          </div>

          <button
            type='submit'
            disabled={loading || !email.trim()}
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
                Sending...
              </>
            ) : (
              "Send Verification Email"
            )}
          </button>

          <div className='text-center'>
            <Link
              to='/login'
              className='text-pink-600 hover:text-pink-500 text-sm transition-colors'
            >
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResendVerification;
