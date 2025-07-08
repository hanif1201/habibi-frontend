import { useState, useEffect, useCallback } from "react";

export const useMatchUrgency = (match) => {
  const [urgencyInfo, setUrgencyInfo] = useState({
    level: "normal",
    timeRemaining: null,
    timeRemainingText: "",
    urgencyColor: "text-gray-600",
    urgencyBgColor: "bg-gray-100",
    urgencyBorderColor: "border-gray-200",
    showUrgency: false,
    isExpiring: false,
    isCritical: false,
  });

  const calculateTimeRemaining = useCallback((matchDate) => {
    if (!matchDate) return null;

    const now = new Date();
    const matchTime = new Date(matchDate);
    const diffMs = now - matchTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const hoursLeft = 72 - diffHours; // 72 hour expiration

    if (hoursLeft <= 0) return 0;
    return hoursLeft;
  }, []);

  const getUrgencyLevel = useCallback((hoursLeft) => {
    if (hoursLeft <= 0) return "expired";
    if (hoursLeft <= 1) return "critical";
    if (hoursLeft <= 6) return "urgent";
    if (hoursLeft <= 12) return "high";
    if (hoursLeft <= 24) return "medium";
    return "normal";
  }, []);

  const getUrgencyColors = useCallback((level) => {
    switch (level) {
      case "critical":
        return {
          text: "text-red-700",
          bg: "bg-red-100",
          border: "border-red-300",
          pulse: "animate-pulse",
        };
      case "urgent":
        return {
          text: "text-orange-700",
          bg: "bg-orange-100",
          border: "border-orange-300",
          pulse: "animate-pulse",
        };
      case "high":
        return {
          text: "text-yellow-700",
          bg: "bg-yellow-100",
          border: "border-yellow-300",
          pulse: "",
        };
      case "medium":
        return {
          text: "text-blue-700",
          bg: "bg-blue-100",
          border: "border-blue-300",
          pulse: "",
        };
      case "expired":
        return {
          text: "text-gray-500",
          bg: "bg-gray-100",
          border: "border-gray-300",
          pulse: "",
        };
      default:
        return {
          text: "text-gray-600",
          bg: "bg-gray-100",
          border: "border-gray-200",
          pulse: "",
        };
    }
  }, []);

  const formatTimeRemaining = useCallback((hoursLeft) => {
    if (hoursLeft <= 0) return "Expired";
    if (hoursLeft < 1) {
      const minutesLeft = Math.floor(hoursLeft * 60);
      return `${minutesLeft}m left`;
    }
    if (hoursLeft < 24) {
      return `${Math.floor(hoursLeft)}h left`;
    }
    const daysLeft = Math.floor(hoursLeft / 24);
    const remainingHours = hoursLeft % 24;
    if (remainingHours === 0) {
      return `${daysLeft}d left`;
    }
    return `${daysLeft}d ${remainingHours}h left`;
  }, []);

  const getUrgencyIcon = useCallback((level) => {
    switch (level) {
      case "critical":
        return "💥";
      case "urgent":
        return "🚨";
      case "high":
        return "⚠️";
      case "medium":
        return "⏰";
      case "expired":
        return "⏰";
      default:
        return "💬";
    }
  }, []);

  const getUrgencyMessage = useCallback((level, hoursLeft) => {
    switch (level) {
      case "critical":
        return "Match expires soon! Send a message now!";
      case "urgent":
        return "Don't let this match expire!";
      case "high":
        return "Time to start the conversation!";
      case "medium":
        return "Say hello before it expires!";
      case "expired":
        return "This match has expired";
      default:
        return "Start the conversation!";
    }
  }, []);

  useEffect(() => {
    if (!match) return;

    const hoursLeft = calculateTimeRemaining(match.matchedAt);
    const level = getUrgencyLevel(hoursLeft);
    const colors = getUrgencyColors(level);
    const timeText = formatTimeRemaining(hoursLeft);
    const icon = getUrgencyIcon(level);
    const message = getUrgencyMessage(level, hoursLeft);

    setUrgencyInfo({
      level,
      timeRemaining: hoursLeft,
      timeRemainingText: timeText,
      urgencyColor: colors.text,
      urgencyBgColor: colors.bg,
      urgencyBorderColor: colors.border,
      urgencyPulse: colors.pulse,
      urgencyIcon: icon,
      urgencyMessage: message,
      showUrgency: level !== "normal" && level !== "expired",
      isExpiring: level === "critical" || level === "urgent",
      isCritical: level === "critical",
    });
  }, [
    match,
    calculateTimeRemaining,
    getUrgencyLevel,
    getUrgencyColors,
    formatTimeRemaining,
    getUrgencyIcon,
    getUrgencyMessage,
  ]);

  return urgencyInfo;
};
