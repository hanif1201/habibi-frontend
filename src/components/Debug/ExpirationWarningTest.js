// src/components/Debug/ExpirationWarningTest.js

import React, { useState } from "react";
import notificationService from "../../services/NotificationService";

const ExpirationWarningTest = () => {
  const [testResults, setTestResults] = useState([]);

  const testWarningTypes = [
    { type: "24h", hoursLeft: 24, description: "24 Hours Before" },
    { type: "12h", hoursLeft: 12, description: "12 Hours Before" },
    { type: "6h", hoursLeft: 6, description: "6 Hours Before" },
    { type: "2h", hoursLeft: 2, description: "2 Hours Before" },
    { type: "1h", hoursLeft: 1, description: "1 Hour Before" },
  ];

  const mockMatchData = {
    _id: "test-match-123",
    otherUser: {
      firstName: "Test User",
      lastName: "Example",
    },
    matchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
  };

  const testExpirationWarning = async (warningType, hoursLeft) => {
    try {
      setTestResults((prev) => [
        ...prev,
        {
          type: warningType,
          status: "sending",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      await notificationService.handleMatchExpirationWarning(
        mockMatchData,
        hoursLeft,
        warningType
      );

      setTestResults((prev) =>
        prev.map((result) =>
          result.type === warningType
            ? { ...result, status: "success" }
            : result
        )
      );
    } catch (error) {
      console.error(`Failed to test ${warningType} warning:`, error);
      setTestResults((prev) =>
        prev.map((result) =>
          result.type === warningType
            ? { ...result, status: "error", error: error.message }
            : result
        )
      );
    }
  };

  const testAllWarnings = async () => {
    setTestResults([]);

    for (const warning of testWarningTypes) {
      await testExpirationWarning(warning.type, warning.hoursLeft);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className='bg-white rounded-lg shadow-sm border p-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        Progressive Expiration Warnings Test
      </h3>

      <div className='mb-6'>
        <p className='text-sm text-gray-600 mb-4'>
          Test the different expiration warning types. Each will show a
          notification with different urgency levels.
        </p>

        <div className='flex flex-wrap gap-2 mb-4'>
          <button
            onClick={testAllWarnings}
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          >
            Test All Warnings
          </button>
          <button
            onClick={clearResults}
            className='bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'
          >
            Clear Results
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {testWarningTypes.map((warning) => (
            <button
              key={warning.type}
              onClick={() =>
                testExpirationWarning(warning.type, warning.hoursLeft)
              }
              className='bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200'
            >
              {warning.description}
            </button>
          ))}
        </div>
      </div>

      {testResults.length > 0 && (
        <div className='border-t pt-4'>
          <h4 className='text-md font-medium text-gray-900 mb-3'>
            Test Results
          </h4>
          <div className='space-y-2'>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  result.status === "success"
                    ? "bg-green-50 border-green-200"
                    : result.status === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className='flex items-center space-x-3'>
                  <span className='text-lg'>
                    {result.status === "success"
                      ? "✅"
                      : result.status === "error"
                      ? "❌"
                      : "⏳"}
                  </span>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {
                        testWarningTypes.find((w) => w.type === result.type)
                          ?.description
                      }
                    </p>
                    <p className='text-sm text-gray-600'>{result.timestamp}</p>
                  </div>
                </div>
                {result.error && (
                  <p className='text-sm text-red-600'>{result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
        <h4 className='text-md font-medium text-gray-900 mb-2'>
          Warning Types Overview
        </h4>
        <div className='space-y-2 text-sm text-gray-600'>
          <div className='flex items-center space-x-2'>
            <span>⏰ 24h:</span>
            <span>Gentle reminder when match expires tomorrow</span>
          </div>
          <div className='flex items-center space-x-2'>
            <span>⚠️ 12h:</span>
            <span>Early warning when match expires soon</span>
          </div>
          <div className='flex items-center space-x-2'>
            <span>🚨 6h:</span>
            <span>Urgent reminder when match expires today</span>
          </div>
          <div className='flex items-center space-x-2'>
            <span>🔥 2h:</span>
            <span>Critical warning when match expires soon</span>
          </div>
          <div className='flex items-center space-x-2'>
            <span>💥 1h:</span>
            <span>Final warning when match expires</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpirationWarningTest;
