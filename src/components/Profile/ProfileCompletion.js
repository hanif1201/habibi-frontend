import React from "react";

const ProfileCompletion = ({
  profileCompletion,
  onOpenEdit,
  onOpenPhotoUpload,
}) => {
  if (!profileCompletion) return null;

  const { percentage, completed, missing, fields } = profileCompletion;

  const getFieldDisplay = (fieldName) => {
    const displayNames = {
      firstName: "First Name",
      lastName: "Last Name",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      bio: "Bio (10+ characters)",
      photos: "Profile Photos",
    };
    return displayNames[fieldName] || fieldName;
  };

  const getFieldAction = (fieldName) => {
    if (fieldName === "photos") {
      return () => onOpenPhotoUpload();
    }
    return () => onOpenEdit();
  };

  const getStepColor = (fieldName, isCompleted) => {
    if (isCompleted) return "text-green-600 bg-green-100";
    if (fieldName === "photos") return "text-purple-600 bg-purple-100";
    return "text-pink-600 bg-pink-100";
  };

  if (completed) {
    return (
      <div className='bg-green-50 border border-green-200 rounded-xl p-6 mb-6'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <svg
              className='h-8 w-8 text-green-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <div className='ml-4'>
            <h3 className='text-lg font-semibold text-green-900'>
              🎉 Profile Complete!
            </h3>
            <p className='text-green-700'>
              Your profile is 100% complete. You're ready to start matching!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white border border-gray-200 rounded-xl p-6 mb-6'>
      {/* Progress Header */}
      <div className='flex items-center justify-between mb-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Profile Completion
          </h3>
          <p className='text-sm text-gray-600'>
            Complete your profile to get better matches
          </p>
        </div>
        <div className='text-right'>
          <div className='text-2xl font-bold text-pink-600'>{percentage}%</div>
          <div className='text-sm text-gray-500'>Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className='mb-6'>
        <div className='flex justify-between text-sm text-gray-600 mb-2'>
          <span>Progress</span>
          <span>{percentage}% complete</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-3'>
          <div
            className='bg-gradient-to-r from-pink-500 to-red-500 h-3 rounded-full transition-all duration-500 ease-out'
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Completion Steps */}
      <div className='space-y-3'>
        <h4 className='text-sm font-medium text-gray-900 mb-3'>
          {missing.length > 0
            ? "Complete these steps:"
            : "All steps completed!"}
        </h4>

        {fields.map((field) => (
          <div
            key={field.name}
            className='flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors'
          >
            <div className='flex items-center'>
              {/* Status Icon */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${getStepColor(
                  field.name,
                  field.completed
                )}`}
              >
                {field.completed ? (
                  <svg
                    className='w-4 h-4'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                ) : (
                  <svg
                    className='w-4 h-4'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                )}
              </div>

              {/* Field Info */}
              <div>
                <div className='font-medium text-gray-900'>
                  {getFieldDisplay(field.name)}
                </div>
                <div className='text-sm text-gray-500'>
                  {field.completed ? "Completed" : "Not completed"} •{" "}
                  {field.weight}% of profile
                </div>
              </div>
            </div>

            {/* Action Button */}
            {!field.completed && (
              <button
                onClick={getFieldAction(field.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  field.name === "photos"
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                }`}
              >
                {field.name === "photos" ? "Add Photos" : "Edit Info"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {missing.length > 0 && (
        <div className='mt-6 flex space-x-3'>
          <button
            onClick={onOpenEdit}
            className='flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200 text-sm font-medium'
          >
            Complete Profile
          </button>
          {missing.includes("photos") && (
            <button
              onClick={onOpenPhotoUpload}
              className='flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium'
            >
              Add Photos
            </button>
          )}
        </div>
      )}

      {/* Tips */}
      {percentage < 100 && (
        <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
          <div className='flex'>
            <svg
              className='flex-shrink-0 w-5 h-5 text-blue-400 mt-0.5'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
            <div className='ml-3'>
              <h4 className='text-sm font-medium text-blue-900'>
                Profile Tips
              </h4>
              <div className='mt-1 text-sm text-blue-700'>
                <ul className='list-disc list-inside space-y-1'>
                  <li>Add at least 3 photos for better matches</li>
                  <li>Write a compelling bio (50+ characters recommended)</li>
                  <li>Complete all fields to appear in more searches</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletion;
