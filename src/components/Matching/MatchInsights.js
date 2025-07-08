import React from "react";

const MatchInsights = ({ match, onClose }) => {
  const insights = match?.insights || {};
  const compatibility = match?.compatibility || {};
  const sharedInterests = match?.sharedInterests || [];
  const proximity = match?.proximity || {};

  const getCompatibilityScore = () => {
    return compatibility.score || 85; // Default score
  };

  const getCompatibilityLevel = (score) => {
    if (score >= 90)
      return {
        level: "Excellent",
        color: "text-green-600",
        bg: "bg-green-100",
      };
    if (score >= 80)
      return { level: "Great", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 70)
      return { level: "Good", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "Fair", color: "text-gray-600", bg: "bg-gray-100" };
  };

  const compatibilityInfo = getCompatibilityLevel(getCompatibilityScore());

  const getProximityText = () => {
    if (!proximity.distance) return "Distance not available";
    if (proximity.distance < 1) return "Less than 1 km away";
    if (proximity.distance < 5)
      return `${proximity.distance.toFixed(1)} km away`;
    if (proximity.distance < 10)
      return `${proximity.distance.toFixed(1)} km away`;
    return `${proximity.distance.toFixed(1)} km away`;
  };

  const getProximityIcon = () => {
    if (!proximity.distance) return "📍";
    if (proximity.distance < 1) return "🏠";
    if (proximity.distance < 5) return "🚶";
    if (proximity.distance < 10) return "🚗";
    return "✈️";
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='bg-gradient-to-r from-pink-500 to-red-500 p-4 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold'>Match Insights</h2>
              <p className='text-sm opacity-90'>Why you're a great match!</p>
            </div>
            <button
              onClick={onClose}
              className='text-white hover:text-gray-200 transition-colors'
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

        {/* Content */}
        <div className='p-4 space-y-6'>
          {/* Compatibility Score */}
          <div className='text-center'>
            <div className='mb-4'>
              <div className='relative inline-block'>
                <svg className='w-24 h-24 transform -rotate-90'>
                  <circle
                    cx='48'
                    cy='48'
                    r='40'
                    stroke='currentColor'
                    strokeWidth='8'
                    fill='transparent'
                    className='text-gray-200'
                  />
                  <circle
                    cx='48'
                    cy='48'
                    r='40'
                    stroke='currentColor'
                    strokeWidth='8'
                    fill='transparent'
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 40 * (1 - getCompatibilityScore() / 100)
                    }`}
                    className={`${compatibilityInfo.color} transition-all duration-1000`}
                    strokeLinecap='round'
                  />
                </svg>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <span
                    className={`text-2xl font-bold ${compatibilityInfo.color}`}
                  >
                    {getCompatibilityScore()}%
                  </span>
                </div>
              </div>
            </div>
            <h3 className={`text-lg font-semibold ${compatibilityInfo.color}`}>
              {compatibilityInfo.level} Match
            </h3>
            <p className='text-gray-600 text-sm mt-1'>
              {compatibility.reason || "You have great chemistry together!"}
            </p>
          </div>

          {/* Proximity */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center space-x-3'>
              <span className='text-2xl'>{getProximityIcon()}</span>
              <div>
                <h4 className='font-medium text-gray-900'>Location</h4>
                <p className='text-gray-600'>{getProximityText()}</p>
                {proximity.city && (
                  <p className='text-sm text-gray-500'>{proximity.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* Shared Interests */}
          {sharedInterests.length > 0 && (
            <div>
              <h4 className='font-medium text-gray-900 mb-3'>
                Shared Interests
              </h4>
              <div className='flex flex-wrap gap-2'>
                {sharedInterests.map((interest, index) => (
                  <span
                    key={index}
                    className='px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium'
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Compatibility Factors */}
          {compatibility.factors && compatibility.factors.length > 0 && (
            <div>
              <h4 className='font-medium text-gray-900 mb-3'>Why You Match</h4>
              <div className='space-y-3'>
                {compatibility.factors.map((factor, index) => (
                  <div key={index} className='flex items-start space-x-3'>
                    <div className='w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0'></div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {factor.title}
                      </p>
                      <p className='text-xs text-gray-600'>
                        {factor.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Starters */}
          {match?.conversationStarters &&
            match.conversationStarters.length > 0 && (
              <div>
                <h4 className='font-medium text-gray-900 mb-3'>Ice Breakers</h4>
                <div className='space-y-2'>
                  {match.conversationStarters
                    .slice(0, 3)
                    .map((starter, index) => (
                      <div
                        key={index}
                        className='bg-blue-50 border border-blue-200 rounded-lg p-3'
                      >
                        <p className='text-sm text-blue-800'>{starter}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Additional Insights */}
          {insights.additional && (
            <div>
              <h4 className='font-medium text-gray-900 mb-3'>Fun Facts</h4>
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                <p className='text-sm text-yellow-800'>{insights.additional}</p>
              </div>
            </div>
          )}

          {/* Match Timing */}
          {match?.matchedAt && (
            <div className='text-center text-sm text-gray-500'>
              <p>Matched {new Date(match.matchedAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-gray-200'>
          <button
            onClick={onClose}
            className='w-full bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200'
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchInsights;
