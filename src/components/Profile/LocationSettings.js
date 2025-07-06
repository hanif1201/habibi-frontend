import React, { useState, useEffect } from "react";
import axios from "axios";

const LocationSettings = ({ user, onLocationUpdate, onClose }) => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: "",
    city: "",
    country: "",
  });
  const [manualLocation, setManualLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationMethod, setLocationMethod] = useState("auto"); // auto, manual
  const [permissionStatus, setPermissionStatus] = useState("prompt");
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Initialize with current user location
  useEffect(() => {
    if (user?.location?.coordinates) {
      setLocation({
        latitude: user.location.coordinates[1],
        longitude: user.location.coordinates[0],
        address: user.location.address || "",
        city: user.location.city || "",
        country: user.location.country || "",
      });
    }
    checkGeolocationPermission();
  }, [user]);

  // Check current geolocation permission status
  const checkGeolocationPermission = async () => {
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        setPermissionStatus(permission.state);

        permission.addEventListener("change", () => {
          setPermissionStatus(permission.state);
        });
      } catch (error) {
        console.log("Permissions API not supported");
      }
    }
  };

  // Get current location automatically
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    setLoading(true);
    setError("");

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_OPENCAGE_API_KEY`
          );

          if (response.ok) {
            const data = await response.json();
            const result = data.results[0];

            setLocation({
              latitude,
              longitude,
              address: result?.formatted || "",
              city: result?.components?.city || result?.components?.town || "",
              country: result?.components?.country || "",
            });
          } else {
            // Fallback if geocoding fails
            setLocation({
              latitude,
              longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: "",
              country: "",
            });
          }
        } catch (geocodeError) {
          console.error("Geocoding error:", geocodeError);
          setLocation({
            latitude,
            longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            city: "",
            country: "",
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(
              "Location access denied. Please enable location permissions."
            );
            setPermissionStatus("denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An unknown error occurred while retrieving location.");
            break;
        }
      },
      options
    );
  };

  // Search for location manually
  const searchLocation = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");

    try {
      // Using a geocoding service (replace with your preferred service)
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
          searchQuery
        )}&key=YOUR_OPENCAGE_API_KEY&limit=5`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const { lat, lng } = result.geometry;

          setLocation({
            latitude: lat,
            longitude: lng,
            address: result.formatted,
            city: result.components?.city || result.components?.town || "",
            country: result.components?.country || "",
          });
        } else {
          setError("Location not found. Please try a different search.");
        }
      } else {
        setError("Failed to search location. Please try again.");
      }
    } catch (error) {
      console.error("Location search error:", error);
      setError("Error searching for location.");
    } finally {
      setLoading(false);
    }
  };

  // Save location to backend
  const handleSaveLocation = async () => {
    if (!location.latitude || !location.longitude) {
      setError("Please set a valid location first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.put(`${API_URL}/profile/location`, {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        city: location.city,
        country: location.country,
      });

      if (response.data.success) {
        onLocationUpdate(response.data.user);
        onClose();
      }
    } catch (error) {
      console.error("Save location error:", error);
      setError(error.response?.data?.message || "Error saving location");
    } finally {
      setLoading(false);
    }
  };

  // Handle manual location search
  const handleManualSearch = (e) => {
    e.preventDefault();
    searchLocation(manualLocation);
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Location Settings
          </h2>
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

        {/* Content */}
        <div className='p-6'>
          {/* Error Display */}
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4'>
              {error}
            </div>
          )}

          {/* Current Location Display */}
          {location.latitude && location.longitude && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
              <div className='flex items-center mb-2'>
                <svg
                  className='w-5 h-5 text-green-600 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                </svg>
                <span className='font-medium text-green-800'>
                  Current Location
                </span>
              </div>
              <p className='text-green-700 text-sm'>{location.address}</p>
              <p className='text-green-600 text-xs mt-1'>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
            </div>
          )}

          {/* Location Method Selection */}
          <div className='mb-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-3'>
              How would you like to set your location?
            </h3>

            <div className='space-y-3'>
              {/* Automatic Location */}
              <button
                onClick={() => {
                  setLocationMethod("auto");
                  getCurrentLocation();
                }}
                disabled={loading || permissionStatus === "denied"}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  locationMethod === "auto"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${
                  permissionStatus === "denied"
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className='flex items-center'>
                  <svg
                    className='w-6 h-6 text-blue-600 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v-3m6 6H6l6-6z'
                    />
                  </svg>
                  <div className='text-left'>
                    <div className='font-medium text-gray-900'>
                      Use Current Location
                    </div>
                    <div className='text-sm text-gray-600'>
                      {permissionStatus === "denied"
                        ? "Location access denied"
                        : "Automatically detect your location"}
                    </div>
                  </div>
                </div>
              </button>

              {/* Manual Location */}
              <div
                className={`p-4 rounded-lg border-2 transition-all ${
                  locationMethod === "manual"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200"
                }`}
              >
                <div className='flex items-center mb-3'>
                  <svg
                    className='w-6 h-6 text-purple-600 mr-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                  <div>
                    <div className='font-medium text-gray-900'>
                      Search Location
                    </div>
                    <div className='text-sm text-gray-600'>
                      Enter city, address, or landmark
                    </div>
                  </div>
                </div>

                <form onSubmit={handleManualSearch} className='flex space-x-2'>
                  <input
                    type='text'
                    value={manualLocation}
                    onChange={(e) => {
                      setManualLocation(e.target.value);
                      setLocationMethod("manual");
                    }}
                    placeholder='e.g., New York, Paris, Times Square...'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  />
                  <button
                    type='submit'
                    disabled={loading || !manualLocation.trim()}
                    className='px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Privacy Settings Toggle */}
          <div className='mb-6'>
            <button
              onClick={() => setShowPrivacySettings(!showPrivacySettings)}
              className='flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
            >
              <div className='flex items-center'>
                <svg
                  className='w-5 h-5 text-gray-600 mr-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
                <span className='font-medium text-gray-900'>
                  Privacy Settings
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  showPrivacySettings ? "rotate-180" : ""
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>

            {/* Privacy Settings Content */}
            {showPrivacySettings && (
              <div className='mt-3 p-4 bg-gray-50 rounded-lg space-y-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium text-gray-900'>
                      Show Distance
                    </div>
                    <div className='text-sm text-gray-600'>
                      Let others see how far away you are
                    </div>
                  </div>
                  <input
                    type='checkbox'
                    defaultChecked={
                      user?.settings?.privacy?.showDistance !== false
                    }
                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium text-gray-900'>
                      Precise Location
                    </div>
                    <div className='text-sm text-gray-600'>
                      Show exact location vs approximate area
                    </div>
                  </div>
                  <input
                    type='checkbox'
                    defaultChecked={false}
                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-3'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLocation}
              disabled={loading || !location.latitude || !location.longitude}
              className='flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center'
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
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Location"
              )}
            </button>
          </div>

          {/* Location Permission Help */}
          {permissionStatus === "denied" && (
            <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
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
                  <h3 className='text-sm font-medium text-yellow-800'>
                    Location Access Denied
                  </h3>
                  <div className='mt-1 text-sm text-yellow-700'>
                    To use automatic location, please enable location
                    permissions in your browser settings and reload the page.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSettings;
