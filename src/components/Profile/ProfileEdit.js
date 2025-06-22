import React, { useState, useEffect } from "react";
import axios from "axios";

const ProfileEdit = ({ user, onProfileUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    dateOfBirth: "",
    gender: "",
  });

  const [preferences, setPreferences] = useState({
    ageRange: {
      min: 18,
      max: 50,
    },
    maxDistance: 50,
    interestedIn: "both",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
        gender: user.gender || "",
      });

      setPreferences({
        ageRange: {
          min: user.preferences?.ageRange?.min || 18,
          max: user.preferences?.ageRange?.max || 50,
        },
        maxDistance: user.preferences?.maxDistance || 50,
        interestedIn: user.preferences?.interestedIn || "both",
      });
    }
  }, [user]);

  const handleBasicChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;

    if (name === "minAge" || name === "maxAge") {
      setPreferences({
        ...preferences,
        ageRange: {
          ...preferences.ageRange,
          [name === "minAge" ? "min" : "max"]: parseInt(value),
        },
      });
    } else if (name === "maxDistance") {
      setPreferences({
        ...preferences,
        maxDistance: parseInt(value),
      });
    } else {
      setPreferences({
        ...preferences,
        [name]: value,
      });
    }
  };

  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.put(`${API_URL}/profile/basic`, formData);

      if (response.data.success) {
        onProfileUpdate(response.data.user);
        setActiveTab("preferences"); // Move to next tab
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setError(error.response?.data?.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.put(`${API_URL}/profile/preferences`, {
        preferences,
      });

      if (response.data.success) {
        onProfileUpdate(response.data.user);
        onClose(); // Close modal after successful update
      }
    } catch (error) {
      console.error("Preferences update error:", error);
      setError(error.response?.data?.message || "Error updating preferences");
    } finally {
      setLoading(false);
    }
  };

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h2 className='text-2xl font-semibold text-gray-900'>Edit Profile</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <svg
              className='w-6 h-6'
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
          </button>
        </div>

        {/* Tab Navigation */}
        <div className='border-b'>
          <nav className='flex px-6'>
            <button
              onClick={() => setActiveTab("basic")}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "basic"
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "preferences"
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Preferences
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
            {error}
          </div>
        )}

        {/* Tab Content */}
        <div className='p-6'>
          {activeTab === "basic" && (
            <form onSubmit={handleBasicSubmit} className='space-y-6'>
              {/* Name Fields */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    First Name
                  </label>
                  <input
                    type='text'
                    name='firstName'
                    value={formData.firstName}
                    onChange={handleBasicChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Last Name
                  </label>
                  <input
                    type='text'
                    name='lastName'
                    value={formData.lastName}
                    onChange={handleBasicChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                  />
                </div>
              </div>

              {/* Date of Birth and Gender */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Date of Birth
                  </label>
                  <input
                    type='date'
                    name='dateOfBirth'
                    value={formData.dateOfBirth}
                    onChange={handleBasicChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                  />
                  {formData.dateOfBirth && (
                    <p className='text-sm text-gray-500 mt-1'>
                      Age: {getAge(formData.dateOfBirth)} years old
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Gender
                  </label>
                  <select
                    name='gender'
                    value={formData.gender}
                    onChange={handleBasicChange}
                    required
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                  >
                    <option value=''>Select Gender</option>
                    <option value='male'>Male</option>
                    <option value='female'>Female</option>
                    <option value='other'>Other</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Bio
                </label>
                <textarea
                  name='bio'
                  value={formData.bio}
                  onChange={handleBasicChange}
                  rows={4}
                  maxLength={500}
                  placeholder='Tell others about yourself...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none'
                />
                <div className='text-right text-sm text-gray-500 mt-1'>
                  {formData.bio.length}/500 characters
                </div>
              </div>

              {/* Submit Button */}
              <div className='flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={onClose}
                  className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
                >
                  {loading ? "Saving..." : "Save & Continue"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "preferences" && (
            <form onSubmit={handlePreferencesSubmit} className='space-y-6'>
              {/* Age Range */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-4'>
                  Age Range: {preferences.ageRange.min} -{" "}
                  {preferences.ageRange.max} years
                </label>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-xs text-gray-500 mb-1'>
                      Minimum Age
                    </label>
                    <input
                      type='range'
                      name='minAge'
                      min='18'
                      max='80'
                      value={preferences.ageRange.min}
                      onChange={handlePreferenceChange}
                      className='w-full'
                    />
                    <div className='text-center text-sm text-gray-600'>
                      {preferences.ageRange.min}
                    </div>
                  </div>
                  <div>
                    <label className='block text-xs text-gray-500 mb-1'>
                      Maximum Age
                    </label>
                    <input
                      type='range'
                      name='maxAge'
                      min='18'
                      max='80'
                      value={preferences.ageRange.max}
                      onChange={handlePreferenceChange}
                      className='w-full'
                    />
                    <div className='text-center text-sm text-gray-600'>
                      {preferences.ageRange.max}
                    </div>
                  </div>
                </div>
              </div>

              {/* Maximum Distance */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Maximum Distance: {preferences.maxDistance} km
                </label>
                <input
                  type='range'
                  name='maxDistance'
                  min='1'
                  max='500'
                  value={preferences.maxDistance}
                  onChange={handlePreferenceChange}
                  className='w-full'
                />
                <div className='flex justify-between text-xs text-gray-500 mt-1'>
                  <span>1 km</span>
                  <span>500 km</span>
                </div>
              </div>

              {/* Interested In */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Interested In
                </label>
                <select
                  name='interestedIn'
                  value={preferences.interestedIn}
                  onChange={handlePreferenceChange}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                >
                  <option value='male'>Men</option>
                  <option value='female'>Women</option>
                  <option value='both'>Everyone</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className='flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={() => setActiveTab("basic")}
                  className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  Back
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
                >
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
