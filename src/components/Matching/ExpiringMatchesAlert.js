// src/components/Matching/ExpiringMatchesAlert.js

import React from "react";
import { useNavigate } from "react-router-dom";

const ExpiringMatchesAlert = ({ expiringMatches, onClose }) => {
  const navigate = useNavigate();

  if (!expiringMatches || expiringMatches.length === 0) {
    return null;
  }

  const getUrgencyLevel = (hoursLeft) => {
    if (hoursLeft <= 1) return "critical";
    if (hoursLeft <= 6) return "urgent";
    if (hoursLeft <= 12) return "warning";
    return "info";
  };

  const getUrgencyConfig = (urgency) => {
    switch (urgency) {
      case "critical":
        return {
          bgColor: "bg-red-500",
          textColor: "text-white",
          borderColor: "border-red-600",
          icon: "💥",
          title: "FINAL WARNING",
        };
      case "urgent":
        return {
          bgColor: "bg-orange-500",
          textColor: "text-white",
          borderColor: "border-orange-600",
          icon: "🔥",
          title: "URGENT",
        };
      case "warning":
        return {
          bgColor: "bg-yellow-500",
          textColor: "text-white",
          borderColor: "border-yellow-600",
          icon: "⚠️",
          title: "WARNING",
        };
      default:
        return {
          bgColor: "bg-blue-500",
          textColor: "text-white",
          borderColor: "border-blue-600",
          icon: "⏰",
          title: "REMINDER",
        };
    }
  };

  const mostUrgentMatch = expiringMatches.reduce((prev, current) => {
    const prevHours =
      72 -
      Math.floor((new Date() - new Date(prev.matchedAt)) / (1000 * 60 * 60));
    const currentHours =
      72 -
      Math.floor((new Date() - new Date(current.matchedAt)) / (1000 * 60 * 60));
    return prevHours < currentHours ? prev : current;
  });

  const hoursLeft =
    72 -
    Math.floor(
      (new Date() - new Date(mostUrgentMatch.matchedAt)) / (1000 * 60 * 60)
    );
  const urgency = getUrgencyLevel(hoursLeft);
  const config = getUrgencyConfig(urgency);

  return (
    <div
      className={`${config.bgColor} ${config.textColor} rounded-lg border ${config.borderColor} p-4 mb-6 shadow-lg animate-pulse`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <span className='text-2xl'>{config.icon}</span>
          <div>
            <h3 className='font-bold text-lg'>
              {config.title}: Match Expiring
            </h3>
            <p className='text-sm opacity-90'>
              {expiringMatches.length === 1
                ? `Your match with ${
                    mostUrgentMatch.user.firstName
                  } expires in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}`
                : `${expiringMatches.length} matches expire soon. Most urgent: ${mostUrgentMatch.user.firstName} (${hoursLeft}h left)`}
            </p>
          </div>
        </div>

        <div className='flex space-x-2'>
          <button
            onClick={() => navigate("/matches")}
            className='bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-all duration-200'
          >
            View Matches
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className='bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-all duration-200'
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {expiringMatches.length > 1 && (
        <div className='mt-3 pt-3 border-t border-white border-opacity-20'>
          <p className='text-sm opacity-90 mb-2'>Other expiring matches:</p>
          <div className='flex flex-wrap gap-2'>
            {expiringMatches.slice(0, 3).map((match) => {
              const matchHoursLeft =
                72 -
                Math.floor(
                  (new Date() - new Date(match.matchedAt)) / (1000 * 60 * 60)
                );
              return (
                <span
                  key={match._id}
                  className='bg-white bg-opacity-20 px-2 py-1 rounded text-xs'
                >
                  {match.user.firstName} ({matchHoursLeft}h)
                </span>
              );
            })}
            {expiringMatches.length > 4 && (
              <span className='bg-white bg-opacity-20 px-2 py-1 rounded text-xs'>
                +{expiringMatches.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiringMatchesAlert;
