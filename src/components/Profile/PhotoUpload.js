import React, { useState } from "react";
import axios from "axios";

const PhotoUpload = ({ user, onPhotosUpdate, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Create axios instance with interceptor for automatic token handling
  const createApiInstance = () => {
    const apiInstance = axios.create();

    // Add request interceptor to automatically include token
    apiInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("habibi_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(
            "🔑 Token added to request:",
            token.substring(0, 20) + "..."
          );
        } else {
          console.warn("⚠️ No token found in localStorage");
        }
        return config;
      },
      (error) => {
        console.error("❌ Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    apiInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn("🚫 Unauthorized - token may be invalid");
          // Optionally redirect to login or refresh token
        }
        return Promise.reject(error);
      }
    );

    return apiInstance;
  };

  const handleFile = (file) => {
    setError("");

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    // Check for authentication token
    const token = localStorage.getItem("habibi_token");
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setUploading(true);
    setError("");

    console.log("📤 Starting file upload...");
    console.log("📋 File details:", {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    });

    try {
      // Create form data
      const formData = new FormData();
      formData.append("photo", selectedFile);

      // Log FormData contents
      console.log("📋 FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(
          `  ${key}:`,
          value instanceof File
            ? `File(${value.name}, ${value.size} bytes)`
            : value
        );
      }

      // Create API instance with token handling
      const api = createApiInstance();

      console.log("🔑 Token being used:", token.substring(0, 20) + "...");

      // Upload with progress tracking
      const response = await api.post(`${API_URL}/photos/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          // Note: Authorization header will be added by interceptor
        },
        timeout: 30000, // 30 second timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log("📊 Upload progress:", percentCompleted + "%");
        },
      });

      console.log("✅ Upload successful:", response.data);

      if (response.data.success) {
        // Update parent component with new user data
        onPhotosUpdate(response.data.user);

        // Reset form
        setSelectedFile(null);
        setPreviewUrl(null);

        // Close modal
        onClose();
      } else {
        setError(response.data.message || "Upload failed");
      }
    } catch (error) {
      console.error("❌ Upload error:", error);

      let errorMessage = "Error uploading photo";

      if (error.response) {
        console.error("📊 Server response:", error.response);

        // Handle specific error codes
        switch (error.response.status) {
          case 401:
            errorMessage = "Authentication failed. Please log in again.";
            // Optionally redirect to login
            break;
          case 400:
            errorMessage =
              error.response.data?.message || "Invalid file or request";
            break;
          case 413:
            errorMessage = "File too large. Maximum size is 5MB.";
            break;
          case 500:
            errorMessage =
              error.response.data?.message || "Server error. Please try again.";
            break;
          default:
            errorMessage =
              error.response.data?.message || `Error: ${error.response.status}`;
        }
      } else if (error.request) {
        console.error("🌐 No response received:", error.request);
        errorMessage = "No response from server. Please check your connection.";
      } else {
        console.error("⚙️ Request setup error:", error.message);
        errorMessage = error.message || "Request failed";
      }

      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError("");
    onClose();
  };

  // Test authentication function
  const testAuth = async () => {
    try {
      const token = localStorage.getItem("habibi_token");
      console.log("🧪 Testing authentication...");
      console.log("🔑 Token exists:", !!token);

      if (token) {
        console.log("🔑 Token preview:", token.substring(0, 20) + "...");

        const api = createApiInstance();
        const response = await api.get(`${API_URL}/profile`);
        console.log("✅ Auth test successful:", response.data.success);
      } else {
        console.log("❌ No token found");
      }
    } catch (error) {
      console.error(
        "❌ Auth test failed:",
        error.response?.data || error.message
      );
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-xl font-semibold text-gray-900'>Upload Photo</h2>
          <button
            onClick={handleCancel}
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

        {/* Error Display */}
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4'>
            <div className='flex justify-between items-start'>
              <span>{error}</span>
              {error.includes("Authentication") && (
                <button
                  onClick={testAuth}
                  className='text-red-600 hover:text-red-800 text-sm underline ml-2'
                >
                  Test Auth
                </button>
              )}
            </div>
          </div>
        )}

        {/* Photo Count Warning */}
        {user?.photos?.length >= 5 && (
          <div className='bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4'>
            You have {user.photos.length}/6 photos. Maximum 6 photos allowed.
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === "development" && (
          <div className='bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-xs'>
            <div>🔧 Debug Info:</div>
            <div>
              Token exists: {localStorage.getItem("habibi_token") ? "✅" : "❌"}
            </div>
            <div>API URL: {API_URL}</div>
            <button
              onClick={testAuth}
              className='text-blue-600 hover:text-blue-800 underline mt-1'
            >
              Test Authentication
            </button>
          </div>
        )}

        {/* File Upload Area */}
        <div className='mb-6'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Choose Photo
          </label>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors relative ${
              isDragging
                ? "border-pink-500 bg-pink-50"
                : "border-gray-300 hover:border-pink-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <div className='space-y-4'>
                <img
                  src={previewUrl}
                  alt='Preview'
                  className='w-32 h-32 object-cover rounded-lg mx-auto'
                />
                <div className='text-sm text-gray-600'>
                  {selectedFile?.name}
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className='text-red-500 hover:text-red-700 text-sm'
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <svg
                  className='mx-auto h-12 w-12 text-gray-400 mb-4'
                  stroke='currentColor'
                  fill='none'
                  viewBox='0 0 48 48'
                >
                  <path
                    d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                    strokeWidth={2}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <div className='text-gray-600 mb-2'>
                  Click to select a photo or drag and drop
                </div>
                <div className='text-xs text-gray-500'>
                  PNG, JPG, WEBP up to 5MB
                </div>
              </div>
            )}

            <input
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex space-x-3'>
          <button
            onClick={handleCancel}
            className='flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || user?.photos?.length >= 6}
            className='flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center'
          >
            {uploading ? (
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
                Uploading...
              </>
            ) : (
              "Upload Photo"
            )}
          </button>
        </div>

        {/* Upload Tips */}
        <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
          <div className='text-sm text-gray-600'>
            <div className='font-medium mb-1'>💡 Upload Tips:</div>
            <ul className='text-xs space-y-1'>
              <li>• Use high-quality images for best results</li>
              <li>• Square images work best (will be cropped to 800x800)</li>
              <li>• First photo becomes your primary profile photo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;
