import React, { useState } from "react";
import axios from "axios";

const FirstMessagePrompt = ({ match, onMessageSent, onClose }) => {
  const [selectedIceBreaker, setSelectedIceBreaker] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Ice breaker templates based on common interests or profile elements
  const getPersonalizedIceBreakers = (user) => {
    const defaultBreakers = [
      `Hey ${user.firstName}! I'm excited we matched! How's your day going? 😊`,
      `Hi there! I love your photos! What's your favorite thing to do on weekends?`,
      `Hey! Your profile caught my eye. What's something you're passionate about?`,
      `Hi! I noticed we matched - what's the best concert/event you've been to recently?`,
      `Hey there! Great to match with you! What's your go-to coffee order? ☕`,
    ];

    // Add personalized ice breakers based on profile
    const personalizedBreakers = [];

    if (user.bio) {
      if (user.bio.toLowerCase().includes("travel")) {
        personalizedBreakers.push(
          `Hi ${user.firstName}! I noticed you love traveling. What's the most amazing place you've visited?`
        );
      }
      if (user.bio.toLowerCase().includes("music")) {
        personalizedBreakers.push(
          `Hey! I see you're into music. What's the last song that gave you goosebumps?`
        );
      }
      if (
        user.bio.toLowerCase().includes("food") ||
        user.bio.toLowerCase().includes("cooking")
      ) {
        personalizedBreakers.push(
          `Hi there! Fellow foodie here! What's your signature dish or favorite restaurant?`
        );
      }
      if (
        user.bio.toLowerCase().includes("fitness") ||
        user.bio.toLowerCase().includes("gym")
      ) {
        personalizedBreakers.push(
          `Hey ${user.firstName}! I see you're into fitness. What's your favorite workout or sport?`
        );
      }
    }

    return [...personalizedBreakers, ...defaultBreakers].slice(0, 6);
  };

  const iceBreakers = getPersonalizedIceBreakers(match.user);

  const handleSendMessage = async () => {
    const messageContent = selectedIceBreaker || customMessage.trim();

    if (!messageContent) {
      alert("Please select an ice breaker or write a custom message!");
      return;
    }

    setSending(true);

    try {
      const response = await axios.post(
        `${API_URL}/chat/${match._id}/messages`,
        {
          content: messageContent,
        }
      );

      if (response.data.success) {
        onMessageSent(messageContent);
        handleClose();
      }
    } catch (error) {
      console.error("Error sending first message:", error);
      alert("Failed to send message. Please try again!");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
        showModal ? "bg-opacity-75" : "bg-opacity-0"
      }`}
    >
      <div className='min-h-screen flex items-center justify-center p-4'>
        <div
          className={`bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden transform transition-all duration-300 ${
            showModal ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          {/* Header */}
          <div className='bg-gradient-to-r from-pink-500 to-red-500 p-4 text-white'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='relative'>
                  {match.user.primaryPhoto ? (
                    <img
                      src={match.user.primaryPhoto.url}
                      alt={match.user.firstName}
                      className='w-12 h-12 rounded-full object-cover border-2 border-white'
                    />
                  ) : (
                    <div className='w-12 h-12 rounded-full bg-white bg-opacity-30 border-2 border-white flex items-center justify-center'>
                      <span className='text-lg font-bold'>
                        {match.user.firstName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className='text-lg font-semibold'>
                    Message {match.user.firstName}
                  </h3>
                  <p className='text-sm opacity-90'>Break the ice!</p>
                </div>
              </div>
              <button
                onClick={handleClose}
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

          <div className='p-6'>
            {/* Ice Breakers */}
            <div className='mb-6'>
              <h4 className='text-sm font-medium text-gray-700 mb-3'>
                Quick ice breakers:
              </h4>
              <div className='space-y-2 max-h-48 overflow-y-auto'>
                {iceBreakers.map((iceBreaker, index) => (
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

            {/* Custom Message */}
            <div className='mb-6'>
              <h4 className='text-sm font-medium text-gray-700 mb-3'>
                Or write your own:
              </h4>
              <textarea
                value={customMessage}
                onChange={(e) => {
                  setCustomMessage(e.target.value);
                  setSelectedIceBreaker("");
                }}
                placeholder={`Write a personalized message to ${match.user.firstName}...`}
                className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none'
                rows={3}
                maxLength={500}
              />
              <div className='text-right text-xs text-gray-500 mt-1'>
                {customMessage.length}/500 characters
              </div>
            </div>

            {/* Action Buttons */}
            <div className='space-y-3'>
              <button
                onClick={handleSendMessage}
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

              <button
                onClick={handleClose}
                className='w-full border border-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition-colors'
              >
                Maybe Later
              </button>
            </div>

            {/* Tip */}
            <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
              <div className='flex'>
                <svg
                  className='flex-shrink-0 w-4 h-4 text-blue-400 mt-0.5'
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
                  <p className='text-sm text-blue-700'>
                    💡 <strong>Tip:</strong> Personalized messages get 3x more
                    responses than generic ones!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstMessagePrompt;
