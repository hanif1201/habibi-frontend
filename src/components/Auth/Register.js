import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const { register, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, []); // Only run on mount

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear field-specific error when user types
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Required field validation
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.password) errors.password = "Password is required";
    if (!formData.confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.gender) errors.gender = "Please select your gender";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    // Password confirmation
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Age validation (must be 18+)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        errors.dateOfBirth = "You must be at least 18 years old to register";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create registration data (excluding confirmPassword)
    const registrationData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
    };

    const result = await register(registrationData);

    if (result.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 py-8'>
      <div className='max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl'>
        {/* Header */}
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-2'>Join Habibi</h2>
          <p className='text-gray-600'>Create your account to start dating</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form className='mt-8 space-y-4' onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='firstName'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                First Name
              </label>
              <input
                id='firstName'
                name='firstName'
                type='text'
                required
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  formErrors.firstName ? "border-red-300" : "border-gray-300"
                }`}
                placeholder='First name'
              />
              {formErrors.firstName && (
                <p className='text-red-500 text-xs mt-1'>
                  {formErrors.firstName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='lastName'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Last Name
              </label>
              <input
                id='lastName'
                name='lastName'
                type='text'
                required
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  formErrors.lastName ? "border-red-300" : "border-gray-300"
                }`}
                placeholder='Last name'
              />
              {formErrors.lastName && (
                <p className='text-red-500 text-xs mt-1'>
                  {formErrors.lastName}
                </p>
              )}
            </div>
          </div>

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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                formErrors.email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder='Enter your email'
            />
            {formErrors.email && (
              <p className='text-red-500 text-xs mt-1'>{formErrors.email}</p>
            )}
          </div>

          {/* Password Fields */}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-10 ${
                  formErrors.password ? "border-red-300" : "border-gray-300"
                }`}
                placeholder='Create a password'
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
            {formErrors.password && (
              <p className='text-red-500 text-xs mt-1'>{formErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Confirm Password
            </label>
            <input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                formErrors.confirmPassword
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
              placeholder='Confirm your password'
            />
            {formErrors.confirmPassword && (
              <p className='text-red-500 text-xs mt-1'>
                {formErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Date of Birth and Gender */}
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='dateOfBirth'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Date of Birth
              </label>
              <input
                id='dateOfBirth'
                name='dateOfBirth'
                type='date'
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  formErrors.dateOfBirth ? "border-red-300" : "border-gray-300"
                }`}
              />
              {formErrors.dateOfBirth && (
                <p className='text-red-500 text-xs mt-1'>
                  {formErrors.dateOfBirth}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='gender'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Gender
              </label>
              <select
                id='gender'
                name='gender'
                required
                value={formData.gender}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                  formErrors.gender ? "border-red-300" : "border-gray-300"
                }`}
              >
                <option value=''>Select...</option>
                <option value='male'>Male</option>
                <option value='female'>Female</option>
                <option value='other'>Other</option>
              </select>
              {formErrors.gender && (
                <p className='text-red-500 text-xs mt-1'>{formErrors.gender}</p>
              )}
            </div>
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
                Creating account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Login Link */}
          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              Already have an account?{" "}
              <Link
                to='/login'
                className='font-medium text-pink-600 hover:text-pink-500 transition-colors duration-200'
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
