import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useMatchUrgency } from "../../hooks/useMatchUrgency";
import ConfettiAnimation from "./ConfettiAnimation";
import MatchInsights from "./MatchInsights";
import IcebreakerSuggestions from "./IcebreakerSuggestions";
import axios from "axios";
import emailService from "../../services/EmailService";

const MatchModal = ({ match, onClose }) => {
  const { user } = useAuth();
  const { setCurrentConversation } = useChat();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("celebrate");
  const [selectedIceBreaker, setSelectedIceBreaker] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Get urgency information
  const urgencyInfo = useMatchUrgency(match);

  // Animation trigger and email notification
  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 100);

    // Trigger confetti animation
    if (match?.celebrationData?.showConfetti !== false) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Send new match email notification if not already sent
    const sendEmailNotification = async () => {
      try {
        const shouldSendEmail = await emailService.shouldSendNewMatchEmail();
        if (shouldSendEmail) {
          // Send email in background - don't wait for it
          emailService.sendNewMatchEmail(match).catch((error) => {
            console.warn("Email notification failed (non-critical):", error);
          });
        }
      } catch (error) {
        console.warn("Failed to check email preferences:", error);
        // Continue with match flow even if email check fails
      }
    };

    sendEmailNotification();

    return () => clearTimeout(timer);
  }, [match]);

  // Use conversation starters from backend or fallback to defaults
  const conversationStarters =
    match?.conversationStarters?.length > 0
      ? match.conversationStarters
      : [
          "Hey! I'm excited we matched! How's your day going? 😊",
          "Hi there! I love your photos! What's your favorite thing to do on weekends?",
          "Hey! Your profile caught my eye. What's something you're passionate about?",
          "Hi! I noticed we matched - what's the best concert/event you've been to recently?",
          "Hey there! Great to match with you! What's your go-to coffee order? ☕",
          "Hi! I'm curious - what's your favorite way to spend a lazy Sunday?",
          "Hey! Love that we matched! What's something that always makes you smile?",
          "Hi there! What's the most spontaneous thing you've done lately?",
        ];

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const handleSendFirstMessage = async () => {
    const messageContent = selectedIceBreaker || customMessage.trim();

    if (!messageContent) {
      alert("Please select an ice breaker or write a custom message!");
      return;
    }

    setSending(true);

    try {
      // Send the first message
      const response = await axios.post(
        `${API_URL}/chat/${match._id}/messages`,
        {
          content: messageContent,
        }
      );

      if (response.data.success) {
        // Create conversation object for chat
        const conversation = {
          matchId: match._id,
          user: match.otherUser,
          lastMessage: {
            content: messageContent,
            createdAt: new Date(),
            isFromMe: true,
          },
          unreadCount: 0,
          matchedAt: match.matchedAt,
        };

        setCurrentConversation(conversation);
        navigate("/chat");
        handleClose();
      }
    } catch (error) {
      console.error("Error sending first message:", error);
      alert("Failed to send message. Please try again!");
    } finally {
      setSending(false);
    }
  };

  const handleStartChatting = () => {
    setActiveTab("message");
  };

  const handleKeepSwiping = () => {
    handleClose();
  };

  const handleViewProfile = () => {
    // You can implement a profile view modal here
    alert(
      `View ${match.otherUser.firstName}'s full profile - Feature coming soon!`
    );
  };

  const handleShowInsights = () => {
    setShowInsights(true);
  };

  const handleShowIcebreakers = () => {
    setShowIcebreakers(true);
  };

  const handleIcebreakerSelect = (message) => {
    setSelectedIceBreaker(message);
    setShowIcebreakers(false);
  };

  if (!match) return null;

  const otherUser = match.otherUser;
  const currentUserPhoto =
    user?.photos?.find((photo) => photo.isPrimary) || user?.photos?.[0];
  const otherUserPhoto =
    otherUser?.photos?.find((photo) => photo.isPrimary) ||
    otherUser?.photos?.[0];

  return (
    <>
      {/* Confetti Animation */}
      <ConfettiAnimation
        show={showConfetti}
        duration={3000}
        colors={[
          "#ff6b6b",
          "#4ecdc4",
          "#45b7d1",
          "#96ceb4",
          "#feca57",
          "#ff9ff3",
        ]}
        particleCount={200}
      />

      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
          showModal ? "bg-opacity-75" : "bg-opacity-0"
        }`}
      >
        <div className='min-h-screen flex items-center justify-center p-4'>
          <div
            className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ${
              showModal ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
          >
            {activeTab === "celebrate" && (
              <div className='bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-8 text-white text-center'>
                {/* Match Animation */}
                <div className='relative mb-8'>
                  {/* Celebration Effects */}
                  <div className='absolute inset-0 flex items-center justify-center'>
                    {/* Animated hearts */}
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute text-2xl animate-bounce`}
                        style={{
                          animationDelay: `${i * 0.2}s`,
                          transform: `rotate(${i * 60}deg) translateY(-40px)`,
                        }}
                      >
                        💖
                      </div>
                    ))}
                  </div>

                  {/* User Photos */}
                  <div className='flex justify-center items-center space-x-4 relative z-10'>
                    {/* Current User Photo */}
                    <div className='relative'>
                      {currentUserPhoto ? (
                        <img
                          src={currentUserPhoto.url}
                          alt='You'
                          className='w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg'
                        />
                      ) : (
                        <div className='w-20 h-20 rounded-full bg-white bg-opacity-30 border-4 border-white shadow-lg flex items-center justify-center'>
                          <span className='text-2xl font-bold'>
                            {user?.firstName?.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Heart Icon */}
                    <div className='text-4xl animate-pulse'>❤️</div>

                    {/* Other User Photo */}
                    <div className='relative'>
                      {otherUserPhoto ? (
                        <img
                          src={otherUserPhoto.url}
                          alt={otherUser.firstName}
                          className='w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg'
                        />
                      ) : (
                        <div className='w-20 h-20 rounded-full bg-white bg-opacity-30 border-4 border-white shadow-lg flex items-center justify-center'>
                          <span className='text-2xl font-bold'>
                            {otherUser?.firstName?.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Text */}
                <div className='mb-6'>
                  <h2 className='text-3xl font-bold mb-2 animate-pulse'>
                    It's a Match! 🎉
                  </h2>
                  <p className='text-lg opacity-90'>
                    You and {otherUser.firstName} liked each other
                  </p>
                </div>

                {/* Enhanced Other User Info */}
                <div className='bg-white bg-opacity-20 rounded-xl p-4 mb-6'>
                  <h3 className='text-xl font-semibold mb-1'>
                    {otherUser.firstName}, {otherUser.age}
                  </h3>
                  {otherUser.bio && (
                    <p className='text-sm opacity-90 line-clamp-2 mb-2'>
                      {otherUser.bio}
                    </p>
                  )}

                  {/* Enhanced profile details */}
                  <div className='flex flex-wrap gap-2 text-xs opacity-90'>
                    {otherUser.occupation && (
                      <span className='bg-white bg-opacity-30 px-2 py-1 rounded-full'>
                        💼 {otherUser.occupation}
                      </span>
                    )}
                    {otherUser.education && (
                      <span className='bg-white bg-opacity-30 px-2 py-1 rounded-full'>
                        🎓 {otherUser.education}
                      </span>
                    )}
                    {otherUser.location && (
                      <span className='bg-white bg-opacity-30 px-2 py-1 rounded-full'>
                        📍 {otherUser.location}
                      </span>
                    )}
                    {otherUser.interests && otherUser.interests.length > 0 && (
                      <span className='bg-white bg-opacity-30 px-2 py-1 rounded-full'>
                        🎯 {otherUser.interests.slice(0, 2).join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Urgency Indicator */}
                {urgencyInfo.showUrgency && (
                  <div
                    className={`mb-6 p-3 rounded-lg border ${urgencyInfo.urgencyBgColor} ${urgencyInfo.urgencyBorderColor} ${urgencyInfo.urgencyPulse}`}
                  >
                    <div className='flex items-center justify-center space-x-2'>
                      <span className='text-lg'>{urgencyInfo.urgencyIcon}</span>
                      <div className='text-center'>
                        <p
                          className={`font-semibold ${urgencyInfo.urgencyColor}`}
                        >
                          {urgencyInfo.urgencyMessage}
                        </p>
                        <p className={`text-sm ${urgencyInfo.urgencyColor}`}>
                          {urgencyInfo.timeRemainingText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='space-y-3'>
                  {/* Primary Action - Start Chatting */}
                  <button
                    onClick={handleStartChatting}
                    className='w-full bg-white text-pink-600 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors duration-200 shadow-lg flex items-center justify-center'
                  >
                    <svg
                      className='w-5 h-5 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                      />
                    </svg>
                    Send First Message
                  </button>

                  {/* Secondary Actions */}
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      onClick={handleViewProfile}
                      className='bg-transparent border-2 border-white text-white font-semibold py-2 px-4 rounded-xl hover:bg-white hover:text-pink-600 transition-all duration-200 text-sm'
                    >
                      View Profile
                    </button>

                    <button
                      onClick={handleShowInsights}
                      className='bg-transparent border-2 border-white text-white font-semibold py-2 px-4 rounded-xl hover:bg-white hover:text-pink-600 transition-all duration-200 text-sm'
                    >
                      Match Insights
                    </button>

                    <button
                      onClick={handleShowIcebreakers}
                      className='bg-transparent border-2 border-white text-white font-semibold py-2 px-4 rounded-xl hover:bg-white hover:text-pink-600 transition-all duration-200 text-sm'
                    >
                      Ice Breakers
                    </button>

                    <button
                      onClick={handleKeepSwiping}
                      className='bg-transparent border-2 border-white text-white font-semibold py-2 px-4 rounded-xl hover:bg-white hover:text-pink-600 transition-all duration-200 text-sm'
                    >
                      Keep Swiping
                    </button>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className='absolute top-4 right-4 text-white hover:text-gray-200 transition-colors'
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
            )}

            {activeTab === "message" && (
              <div className='p-6'>
                {/* Header */}
                <div className='flex items-center justify-between mb-6'>
                  <div className='flex items-center space-x-3'>
                    <button
                      onClick={() => setActiveTab("celebrate")}
                      className='p-1 hover:bg-gray-100 rounded-full transition-colors'
                    >
                      <svg
                        className='w-5 h-5 text-gray-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 19l-7-7 7-7'
                        />
                      </svg>
                    </button>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Send first message to {otherUser.firstName}
                      </h3>
                      <p className='text-sm text-gray-600'>
                        Break the ice and start the conversation!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className='text-gray-400 hover:text-gray-600 transition-colors'
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

                {/* Urgency Warning */}
                {urgencyInfo.isExpiring && (
                  <div
                    className={`mb-4 p-3 rounded-lg border ${urgencyInfo.urgencyBgColor} ${urgencyInfo.urgencyBorderColor} ${urgencyInfo.urgencyPulse}`}
                  >
                    <div className='flex items-center space-x-2'>
                      <span className='text-lg'>{urgencyInfo.urgencyIcon}</span>
                      <div>
                        <p
                          className={`font-semibold ${urgencyInfo.urgencyColor}`}
                        >
                          {urgencyInfo.urgencyMessage}
                        </p>
                        <p className={`text-sm ${urgencyInfo.urgencyColor}`}>
                          {urgencyInfo.timeRemainingText}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Conversation Starters */}
                <div className='mb-6'>
                  <h4 className='text-sm font-medium text-gray-700 mb-3'>
                    Choose an ice breaker:
                  </h4>
                  <div className='space-y-2 max-h-48 overflow-y-auto'>
                    {conversationStarters.map((iceBreaker, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedIceBreaker(iceBreaker);
                          setCustomMessage("");
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedIceBreaker === iceBreaker
                            ? "border-pink-500 bg-pink-50 text-pink-800"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <p className='text-sm'>{iceBreaker}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or write custom message */}
                <div className='mb-6'>
                  <h4 className='text-sm font-medium text-gray-700 mb-3'>
                    Or write your own message:
                  </h4>
                  <textarea
                    value={customMessage}
                    onChange={(e) => {
                      setCustomMessage(e.target.value);
                      setSelectedIceBreaker("");
                    }}
                    placeholder={`Write a personalized message to ${otherUser.firstName}...`}
                    className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none'
                    rows={3}
                    maxLength={500}
                  />
                  <div className='text-right text-xs text-gray-500 mt-1'>
                    {customMessage.length}/500 characters
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendFirstMessage}
                  disabled={
                    (!selectedIceBreaker && !customMessage.trim()) || sending
                  }
                  className='w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center'
                >
                  {sending ? (
                    <>
                      <svg
                        className='animate-spin -ml-1 mr-2 h-5 w-5 text-white'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg
                        className='w-5 h-5 mr-2'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                        />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Insights Modal */}
      {showInsights && (
        <MatchInsights match={match} onClose={() => setShowInsights(false)} />
      )}

      {/* Icebreaker Suggestions Modal */}
      {showIcebreakers && (
        <IcebreakerSuggestions
          match={match}
          onSelect={handleIcebreakerSelect}
          onClose={() => setShowIcebreakers(false)}
        />
      )}
    </>
  );
};

export default MatchModal;
