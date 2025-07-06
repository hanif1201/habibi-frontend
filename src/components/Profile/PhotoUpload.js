import React, { useState } from "react";
import axios from "axios";

const PhotoUpload = ({ user, onPhotosUpdate, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const handleFile = (file) => {
    setError("");
    setDebugInfo(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Enhanced file validation
    console.log("📁 File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    });

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        `Invalid file type. Please select: ${allowedTypes
          .map((t) => t.split("/")[1])
          .join(", ")}`
      );
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(
        `File size must be less than ${Math.round(
          maxSize / 1024 / 1024
        )}MB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.`
      );
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

  const testCloudinaryConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/photos/test-cloudinary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("habibi_token")}`,
        },
      });

      setDebugInfo({
        type: "cloudinary_test",
        success: response.data.success,
        config: response.data.config,
        message: response.data.message,
      });

      return response.data.success;
    } catch (error) {
      console.error("Cloudinary test failed:", error);
      setDebugInfo({
        type: "cloudinary_test",
        success: false,
        error: error.response?.data || error.message,
        config: error.response?.data?.config,
      });
      return false;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    setDebugInfo(null);

    try {
      // Test Cloudinary connection first
      console.log("🧪 Testing Cloudinary connection...");
      const cloudinaryOk = await testCloudinaryConnection();

      if (!cloudinaryOk) {
        setError(
          "Cloudinary service is not available. Please check server configuration."
        );
        setUploading(false);
        return;
      }

      console.log("📤 Starting file upload...");

      const formData = new FormData();
      formData.append("photo", selectedFile);

      // Log FormData contents for debugging
      console.log("📋 FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(
          `  ${key}:`,
          value instanceof File
            ? `File(${value.name}, ${value.size} bytes)`
            : value
        );
      }

      const token = localStorage.getItem("habibi_token");
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setUploading(false);
        return;
      }

      console.log("🔑 Using token:", token.substring(0, 20) + "...");

      const response = await axios.post(`${API_URL}/photos/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000, // 30 second timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`📊 Upload progress: ${percentCompleted}%`);
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
      let errorDetails = null;

      if (error.code === "ECONNABORTED") {
        errorMessage = "Upload timeout. Please try again with a smaller file.";
      } else if (error.response) {
        // Server responded with error
        const serverError = error.response.data;
        console.error("📊 Server response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: serverError,
        });

        errorMessage =
          serverError.message || `Server error: ${error.response.status}`;
        errorDetails = serverError.details;

        // Set debug info for development
        setDebugInfo({
          type: "upload_error",
          status: error.response.status,
          statusText: error.response.statusText,
          error: serverError.error,
          details: errorDetails,
          config: serverError.config,
        });

        // Handle specific error codes
        switch (serverError.error) {
          case "CLOUDINARY_CONFIG_MISSING":
            errorMessage =
              "Server configuration error. Please contact support.";
            break;
          case "FILE_TOO_LARGE":
            errorMessage = "File is too large. Maximum size is 5MB.";
            break;
          case "INVALID_FILE_TYPE":
            errorMessage =
              "Invalid file type. Please select a JPEG, PNG, or WEBP image.";
            break;
          case "PHOTO_LIMIT_EXCEEDED":
            errorMessage = "You already have the maximum number of photos (6).";
            break;
          case "NO_FILE":
            errorMessage =
              "No file was received. Please select a file and try again.";
            break;
          default:
            break;
        }
      } else if (error.request) {
        // Network error
        console.error("🌐 Network error:", error.request);
        errorMessage =
          "Network error. Please check your connection and try again.";
        errorDetails = "No response received from server";

        setDebugInfo({
          type: "network_error",
          message: "No response from server",
          request: error.config?.url,
        });
      } else {
        // Request setup error
        console.error("⚙️ Request setup error:", error.message);
        errorMessage = `Request error: ${error.message}`;

        setDebugInfo({
          type: "request_error",
          message: error.message,
        });
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
    setDebugInfo(null);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-screen overflow-y-auto'>
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
            <div className='flex items-start'>
              <svg
                className='w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <div>
                <div className='font-medium'>Upload Failed</div>
                <div className='text-sm mt-1'>{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info Display (Development) */}
        {debugInfo && process.env.NODE_ENV === "development" && (
          <div className='bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4'>
            <details>
              <summary className='cursor-pointer font-medium'>
                Debug Information ({debugInfo.type})
              </summary>
              <pre className='text-xs mt-2 overflow-auto bg-blue-100 p-2 rounded'>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Photo Count Warning */}
        {user?.photos?.length >= 5 && (
          <div className='bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4'>
            <div className='flex items-center'>
              <svg
                className='w-5 h-5 text-yellow-500 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              You have {user.photos.length}/6 photos. Maximum 6 photos allowed.
            </div>
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
                  <div className='text-xs text-gray-500'>
                    {selectedFile && Math.round(selectedFile.size / 1024)} KB
                  </div>
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
              accept='image/jpeg,image/jpg,image/png,image/webp'
              onChange={handleFileSelect}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
            />
          </div>
        </div>

        {/* Test Connection Button (Development) */}
        {process.env.NODE_ENV === "development" && (
          <div className='mb-4'>
            <button
              onClick={testCloudinaryConnection}
              className='w-full text-sm py-2 px-4 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors'
            >
              Test Cloudinary Connection
            </button>
          </div>
        )}

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

        {/* Upload Guidelines */}
        <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>
            Photo Guidelines
          </h4>
          <ul className='text-xs text-gray-600 space-y-1'>
            <li>• Use clear, high-quality images</li>
            <li>• Show your face clearly</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Supported formats: JPEG, PNG, WEBP</li>
            <li>• Maximum 6 photos per profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;
