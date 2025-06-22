import React, { useState } from "react";
import axios from "axios";

const PhotoGallery = ({ user, onPhotosUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.delete(`${API_URL}/photos/${photoId}`);

      if (response.data.success) {
        onPhotosUpdate(response.data.user);
      }
    } catch (error) {
      console.error("Delete photo error:", error);
      setError(error.response?.data?.message || "Error deleting photo");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (photoId) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.put(`${API_URL}/photos/${photoId}/primary`);

      if (response.data.success) {
        onPhotosUpdate(response.data.user);
      }
    } catch (error) {
      console.error("Set primary photo error:", error);
      setError(error.response?.data?.message || "Error setting primary photo");
    } finally {
      setLoading(false);
    }
  };

  const PhotoModal = ({ photo, onClose }) => (
    <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
      <div className='relative max-w-4xl max-h-full'>
        <img
          src={photo.url}
          alt='Full size'
          className='max-w-full max-h-full object-contain rounded-lg'
        />
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all'
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
    </div>
  );

  if (!user?.photos || user.photos.length === 0) {
    return (
      <div className='text-center py-8'>
        <svg
          className='mx-auto h-12 w-12 text-gray-400 mb-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
        <p className='text-gray-500'>No photos uploaded yet</p>
        <p className='text-sm text-gray-400 mt-1'>
          Add photos to complete your profile
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4'>
          {error}
        </div>
      )}

      {/* Photo Grid */}
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        {user.photos.map((photo, index) => (
          <div key={photo._id} className='relative group'>
            {/* Photo Container */}
            <div className='aspect-square bg-gray-200 rounded-lg overflow-hidden'>
              <img
                src={photo.url}
                alt={`Upload ${index + 1}`}
                className='w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200'
                onClick={() => setSelectedPhoto(photo)}
              />

              {/* Primary Badge */}
              {photo.isPrimary && (
                <div className='absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium'>
                  Primary
                </div>
              )}

              {/* Photo Actions Overlay */}
              <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100'>
                <div className='flex space-x-2'>
                  {/* View Button */}
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className='bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors'
                    title='View full size'
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
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
                  </button>

                  {/* Set Primary Button */}
                  {!photo.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(photo._id)}
                      disabled={loading}
                      className='bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50'
                      title='Set as primary photo'
                    >
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
                        />
                      </svg>
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeletePhoto(photo._id)}
                    disabled={loading}
                    className='bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50'
                    title='Delete photo'
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Number */}
            <div className='text-center mt-2 text-sm text-gray-500'>
              Photo {index + 1}
              {photo.isPrimary && (
                <span className='text-green-600 font-medium'> (Primary)</span>
              )}
            </div>
          </div>
        ))}

        {/* Add Photo Placeholder (if less than 6 photos) */}
        {user.photos.length < 6 && (
          <div className='aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-pink-400 transition-colors'>
            <div className='text-center'>
              <svg
                className='mx-auto h-8 w-8 text-gray-400 mb-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              <p className='text-sm text-gray-500'>Add Photo</p>
            </div>
          </div>
        )}
      </div>

      {/* Photo Count */}
      <div className='mt-4 text-center text-sm text-gray-500'>
        {user.photos.length}/6 photos uploaded
      </div>

      {/* Full Size Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className='fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40'>
          <div className='bg-white rounded-lg p-4 flex items-center'>
            <svg
              className='animate-spin h-5 w-5 text-pink-500 mr-3'
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
            Processing...
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
