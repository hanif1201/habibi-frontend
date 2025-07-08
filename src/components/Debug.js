// src/components/Debug.js
import React, { useState } from "react";
import emailService from "../services/EmailService";
import notificationService from "../services/NotificationService";
import ExpirationWarningTest from "./Debug/ExpirationWarningTest";

const Debug = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (message, type = "info") => {
    setResults((prev) => [
      ...prev,
      { message, type, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testNewMatchEmail = async () => {
    setLoading(true);
    addResult("Testing new match email...", "info");

    try {
      // Create mock match data
      const mockMatch = {
        _id: "test-match-id",
        otherUser: {
          _id: "other-user-id",
          firstName: "Test User",
          lastName: "Example",
          age: 25,
          photos: [
            {
              url: "https://via.placeholder.com/300x400",
              isPrimary: true,
            },
          ],
        },
        matchedAt: new Date().toISOString(),
      };

      const success = await emailService.sendNewMatchEmail(mockMatch);

      if (success) {
        addResult("✅ New match email sent successfully!", "success");
      } else {
        addResult("❌ Failed to send new match email", "error");
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const testEmailPreferences = async () => {
    setLoading(true);
    addResult("Testing email preferences...", "info");

    try {
      const preferences = await emailService.getEmailPreferences();
      addResult(
        `✅ Email preferences loaded: ${JSON.stringify(preferences, null, 2)}`,
        "success"
      );
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const testNotificationService = async () => {
    setLoading(true);
    addResult("Testing notification service...", "info");

    try {
      const mockMatch = {
        _id: "test-match-id",
        otherUser: {
          firstName: "Test User",
        },
      };

      const success = await notificationService.handleNewMatch(mockMatch);

      if (success) {
        addResult("✅ Notification service test successful!", "success");
      } else {
        addResult("❌ Notification service test failed", "error");
      }
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const testLocalNotification = () => {
    addResult("Testing local notification...", "info");

    try {
      notificationService.showLocalNotification("Test Notification", {
        body: "This is a test notification from the debug panel",
        icon: "/logo192.png",
        tag: "debug-test",
      });
      addResult("✅ Local notification sent!", "success");
    } catch (error) {
      addResult(`❌ Error: ${error.message}`, "error");
    }
  };

  const [showExpirationTest, setShowExpirationTest] = useState(false);

  return (
    <div className='fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 w-96 max-h-96 overflow-hidden'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>Debug Panel</h3>
        <button
          onClick={clearResults}
          className='text-sm text-gray-500 hover:text-gray-700'
        >
          Clear
        </button>
      </div>

      <div className='space-y-2 mb-4'>
        <button
          onClick={testNewMatchEmail}
          disabled={loading}
          className='w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50'
        >
          Test New Match Email
        </button>

        <button
          onClick={testEmailPreferences}
          disabled={loading}
          className='w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50'
        >
          Test Email Preferences
        </button>

        <button
          onClick={testNotificationService}
          disabled={loading}
          className='w-full px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50'
        >
          Test Notification Service
        </button>

        <button
          onClick={testLocalNotification}
          disabled={loading}
          className='w-full px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50'
        >
          Test Local Notification
        </button>

        <button
          onClick={() => setShowExpirationTest(!showExpirationTest)}
          className='w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600'
        >
          {showExpirationTest ? "Hide" : "Show"} Expiration Test
        </button>
      </div>

      <div className='bg-gray-100 rounded p-2 max-h-48 overflow-y-auto'>
        <div className='text-xs font-mono space-y-1'>
          {results.map((result, index) => (
            <div
              key={index}
              className={`${
                result.type === "success"
                  ? "text-green-600"
                  : result.type === "error"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              <span className='text-gray-400'>[{result.timestamp}]</span>{" "}
              {result.message}
            </div>
          ))}
          {results.length === 0 && (
            <div className='text-gray-400'>No test results yet...</div>
          )}
        </div>
      </div>

      {showExpirationTest && (
        <div className='mt-4 border-t pt-4'>
          <ExpirationWarningTest />
        </div>
      )}
    </div>
  );
};

export default Debug;
