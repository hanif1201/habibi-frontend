import React, { useEffect, useState } from "react";

const MatchNotification = () => {
  const [match, setMatch] = useState(null);
  const [visible, setVisible] = useState(false);

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
    <div className='fixed z-50 top-8 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-xl px-6 py-4 flex items-center border-2 border-pink-400 animate-bounce-in'>
      <span className='text-3xl mr-4'>💖</span>
      <div>
        <div className='font-bold text-pink-600 text-lg mb-1'>
          It's a Match!
        </div>
        <div className='text-gray-700'>
          You and{" "}
          <span className='font-semibold'>{match.otherUser?.firstName}</span>{" "}
          liked each other!
        </div>
      </div>
    </div>
  );
};

export default MatchNotification;
