// src/components/Auth/EmailVerification.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-email`, {
        token,
      });

      if (response.data.success) {
        setVerified(true);
        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate("/login");
        }, 5000);
      }
    } catch (error) {
      console.error("Email verification error:", error);
      setError(
        error.response?.data?.message || "Invalid or expired verification link"
      );
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'>
        <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Verifying Your Email
            </h2>
            <p className='text-gray-600'>
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verified) {
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
              Email Verified Successfully! 🎉
            </h2>
            <p className='text-gray-600 mb-6'>
              Your email has been verified. You can now access all features of
              Habibi.
            </p>
            <p className='text-sm text-gray-500 mb-6'>
              Redirecting to login page in 5 seconds...
            </p>
            <Link
              to='/login'
              className='inline-block bg-pink-500 hover:bg-pink-600 text-white py-2 px-6 rounded-lg transition-colors'
            >
              Continue to Login
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
            Verification Failed
          </h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <div className='space-y-3'>
            <Link
              to='/resend-verification'
              className='block w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg transition-colors text-center'
            >
              Resend Verification Email
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
};

export default EmailVerification;
