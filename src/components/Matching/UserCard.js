import React, { useState, useRef, useEffect } from "react";

const UserCard = ({
  user,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  disabled = false,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const cardRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  const photos = user.photos || [];
  const primaryPhoto = user.primaryPhoto || photos[0];

  // Reset card position when user changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
    setDragOffset({ x: 0, y: 0 });
    setRotation(0);
    setIsDragging(false);
  }, [user._id]);

  // Handle mouse/touch start
  const handleStart = (clientX, clientY) => {
    if (disabled) return;

    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
  };

  // Handle mouse/touch move
  const handleMove = (clientX, clientY) => {
    if (!isDragging || disabled) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;

    setDragOffset({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1); // Slight rotation based on horizontal movement
  };

  // Handle mouse/touch end
  const handleEnd = () => {
    if (!isDragging || disabled) return;

    setIsDragging(false);

    const threshold = 100;
    const { x, y } = dragOffset;

    // Determine swipe direction
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        // Swipe right (like)
        onSwipeRight?.();
      } else {
        // Swipe left (pass)
        onSwipeLeft?.();
      }
    } else if (y < -threshold) {
      // Swipe up (super like)
      onSwipeUp?.();
    } else {
      // Reset position if not enough movement
      setDragOffset({ x: 0, y: 0 });
      setRotation(0);
    }
  };

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add global mouse move and up listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle photo navigation
  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Calculate card style with transforms
  const cardStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
    transition: isDragging ? "none" : "transform 0.3s ease-out",
    cursor: disabled ? "default" : "grab",
  };

  // Calculate overlay opacity for visual feedback
  const getOverlayStyle = () => {
    const opacity = Math.min(Math.abs(dragOffset.x) / 100, 0.8);
    if (dragOffset.x > 50) {
      return { backgroundColor: "rgba(34, 197, 94, 0.8)", opacity }; // Green for like
    } else if (dragOffset.x < -50) {
      return { backgroundColor: "rgba(239, 68, 68, 0.8)", opacity }; // Red for pass
    } else if (dragOffset.y < -50) {
      return { backgroundColor: "rgba(59, 130, 246, 0.8)", opacity }; // Blue for super like
    }
    return { opacity: 0 };
  };

  return (
    <div
      ref={cardRef}
      className='relative w-full h-full bg-white rounded-xl shadow-xl overflow-hidden select-none'
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo Container */}
      <div className='relative h-3/4 overflow-hidden'>
        {/* Current Photo */}
        <img
          src={photos[currentPhotoIndex]?.url || primaryPhoto?.url}
          alt={`${user.firstName}`}
          className='w-full h-full object-cover'
          draggable={false}
        />

        {/* Photo Navigation Areas */}
        {photos.length > 1 && (
          <>
            {/* Left area for previous photo */}
            <div
              className='absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer'
              onClick={prevPhoto}
            />
            {/* Right area for next photo */}
            <div
              className='absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer'
              onClick={nextPhoto}
            />
          </>
        )}

        {/* Photo Indicators */}
        {photos.length > 1 && (
          <div className='absolute top-4 left-4 right-4 flex space-x-1 z-20'>
            {photos.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full ${
                  index === currentPhotoIndex
                    ? "bg-white"
                    : "bg-white bg-opacity-50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Swipe Overlay */}
        <div
          className='absolute inset-0 flex items-center justify-center'
          style={getOverlayStyle()}
        >
          {dragOffset.x > 50 && (
            <div className='text-white text-4xl font-bold transform rotate-12'>
              LIKE
            </div>
          )}
          {dragOffset.x < -50 && (
            <div className='text-white text-4xl font-bold transform -rotate-12'>
              PASS
            </div>
          )}
          {dragOffset.y < -50 && (
            <div className='text-white text-2xl font-bold'>SUPER LIKE</div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className='h-1/4 p-4 flex flex-col justify-center'>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-xl font-semibold text-gray-900'>
            {user.firstName}, {user.age}
          </h3>
          {user.distance && (
            <span className='text-sm text-gray-500'>
              {user.distance} km away
            </span>
          )}
        </div>

        {user.bio && (
          <p className='text-gray-600 text-sm line-clamp-2'>{user.bio}</p>
        )}

        {/* Additional Info Tags */}
        <div className='flex flex-wrap gap-2 mt-2'>
          <span className='px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full capitalize'>
            {user.gender}
          </span>
          {user.photos && user.photos.length > 1 && (
            <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full'>
              {user.photos.length} photos
            </span>
          )}
        </div>
      </div>

      {/* Swipe Instructions (show on first card) */}
      {!isDragging && (
        <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 text-center'>
          Swipe or use buttons below
        </div>
      )}
    </div>
  );
};

export default UserCard;
