import React, { useEffect, useState } from "react";
import { useMatchUrgency } from "../../hooks/useMatchUrgency";

const MatchNotification = () => {
  const [match, setMatch] = useState(null);
  const [visible, setVisible] = useState(false);

  // Get urgency information for the match (must be called before any early returns)
  const urgencyInfo = useMatchUrgency(match);

  useEffect(() => {
    const handleNewMatch = (event) => {
      setMatch(event.detail);
      setVisible(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setVisible(false), 5000);
    };
    window.addEventListener("newMatch", handleNewMatch);
    return () => window.removeEventListener("newMatch", handleNewMatch);
  }, []);

  if (!visible || !match) return null;

  return (
    <div className='fixed z-50 top-8 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-xl px-6 py-4 flex items-center border-2 border-pink-400 animate-bounce-in max-w-sm'>
      <span className='text-3xl mr-4'>💖</span>
      <div className='flex-1'>
        <div className='font-bold text-pink-600 text-lg mb-1'>
          It's a Match!
        </div>
        <div className='text-gray-700 text-sm'>
          You and{" "}
          <span className='font-semibold'>{match.otherUser?.firstName}</span>{" "}
          liked each other!
        </div>

        {/* Show urgency information if relevant */}
        {urgencyInfo.showUrgency && (
          <div
            className={`mt-2 p-2 rounded-lg border ${urgencyInfo.urgencyBgColor} ${urgencyInfo.urgencyBorderColor} ${urgencyInfo.urgencyPulse}`}
          >
            <div className='flex items-center space-x-2'>
              <span className='text-sm'>{urgencyInfo.urgencyIcon}</span>
              <div className='text-xs'>
                <p className={`font-semibold ${urgencyInfo.urgencyColor}`}>
                  {urgencyInfo.urgencyMessage}
                </p>
                <p className={`${urgencyInfo.urgencyColor}`}>
                  {urgencyInfo.timeRemainingText}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => setVisible(false)}
        className='ml-2 text-gray-400 hover:text-gray-600 transition-colors'
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
            d='M6 18L18 6M6 6l12 12'
          />
        </svg>
      </button>
    </div>
  );
};

export default MatchNotification;
