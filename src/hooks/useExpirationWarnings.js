// src/hooks/useExpirationWarnings.js

import { useState, useEffect, useCallback, useRef } from "react";
import notificationService from "../services/NotificationService";

export const useExpirationWarnings = (matches = []) => {
  const [expiringMatches, setExpiringMatches] = useState([]);
  const [warningHistory, setWarningHistory] = useState(new Set());
  const intervalRef = useRef(null);

  // Check for matches that need expiration warnings
  const checkExpiringMatches = useCallback(() => {
    const now = new Date();
    const newExpiringMatches = [];

    matches.forEach((match) => {
      // Skip matches that already have conversations
      if (match.lastMessage) return;

      const matchDate = new Date(match.matchedAt);
      const diffHours = Math.floor((now - matchDate) / (1000 * 60 * 60));
      const hoursLeft = 72 - diffHours;

      // Check different warning intervals
      const warningIntervals = [24, 12, 6, 2, 1];

      warningIntervals.forEach((interval) => {
        if (hoursLeft === interval) {
          const warningKey = `${match._id}-${interval}h`;

          // Check if we've already sent this warning
          if (!warningHistory.has(warningKey)) {
            newExpiringMatches.push({
              match,
              hoursLeft: interval,
              warningType: `${interval}h`,
              warningKey,
            });
          }
        }
      });
    });

    setExpiringMatches(newExpiringMatches);
  }, [matches, warningHistory]);

  // Send expiration warnings
  const sendExpirationWarnings = useCallback(async () => {
    for (const expiringMatch of expiringMatches) {
      try {
        // Send notification
        await notificationService.handleMatchExpirationWarning(
          expiringMatch.match,
          expiringMatch.hoursLeft,
          expiringMatch.warningType
        );

        // Mark warning as sent
        setWarningHistory(
          (prev) => new Set([...prev, expiringMatch.warningKey])
        );

        // Store in localStorage to persist across sessions
        const storedWarnings = JSON.parse(
          localStorage.getItem("expirationWarnings") || "[]"
        );
        storedWarnings.push({
          matchId: expiringMatch.match._id,
          warningType: expiringMatch.warningType,
          sentAt: new Date().toISOString(),
        });
        localStorage.setItem(
          "expirationWarnings",
          JSON.stringify(storedWarnings)
        );
      } catch (error) {
        console.error("Failed to send expiration warning:", error);
      }
    }

    // Clear processed warnings
    setExpiringMatches([]);
  }, [expiringMatches]);

  // Load warning history from localStorage
  const loadWarningHistory = useCallback(() => {
    try {
      const storedWarnings = JSON.parse(
        localStorage.getItem("expirationWarnings") || "[]"
      );
      const warningKeys = storedWarnings.map(
        (w) => `${w.matchId}-${w.warningType}`
      );
      setWarningHistory(new Set(warningKeys));
    } catch (error) {
      console.error("Failed to load warning history:", error);
    }
  }, []);

  // Clean up old warnings (older than 72 hours)
  const cleanupOldWarnings = useCallback(() => {
    try {
      const storedWarnings = JSON.parse(
        localStorage.getItem("expirationWarnings") || "[]"
      );
      const cutoffTime = new Date(Date.now() - 72 * 60 * 60 * 1000); // 72 hours ago

      const filteredWarnings = storedWarnings.filter(
        (warning) => new Date(warning.sentAt) > cutoffTime
      );

      localStorage.setItem(
        "expirationWarnings",
        JSON.stringify(filteredWarnings)
      );

      // Update warning history
      const warningKeys = filteredWarnings.map(
        (w) => `${w.matchId}-${w.warningType}`
      );
      setWarningHistory(new Set(warningKeys));
    } catch (error) {
      console.error("Failed to cleanup old warnings:", error);
    }
  }, []);

  // Initialize the hook
  useEffect(() => {
    loadWarningHistory();
    cleanupOldWarnings();

    // Check for expiring matches every minute
    intervalRef.current = setInterval(() => {
      checkExpiringMatches();
    }, 60000); // 1 minute

    // Initial check
    checkExpiringMatches();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadWarningHistory, cleanupOldWarnings, checkExpiringMatches]);

  // Send warnings when expiring matches are detected
  useEffect(() => {
    if (expiringMatches.length > 0) {
      sendExpirationWarnings();
    }
  }, [expiringMatches, sendExpirationWarnings]);

  // Get matches that are expiring soon for UI display
  const getExpiringSoonMatches = useCallback(() => {
    const now = new Date();
    return matches.filter((match) => {
      if (match.lastMessage) return false;

      const matchDate = new Date(match.matchedAt);
      const diffHours = Math.floor((now - matchDate) / (1000 * 60 * 60));
      const hoursLeft = 72 - diffHours;

      return hoursLeft <= 24 && hoursLeft > 0;
    });
  }, [matches]);

  return {
    expiringMatches,
    getExpiringSoonMatches,
    warningHistory: Array.from(warningHistory),
  };
};
