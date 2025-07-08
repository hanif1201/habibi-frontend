import React, { useState, useEffect } from "react";
import axios from "axios";

const IcebreakerSuggestions = ({ match, onSelect, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    loadIcebreakerSuggestions();
  }, [match]);

  const loadIcebreakerSuggestions = async () => {
    try {
      setLoading(true);

      // Try to get personalized suggestions from backend
      const response = await axios.get(
        `${API_URL}/matching/icebreakers/${match._id}`
      );

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
      } else {
        // Fallback to generating suggestions locally
        generateLocalSuggestions();
      }
    } catch (error) {
      console.error("Error loading icebreaker suggestions:", error);
      // Fallback to generating suggestions locally
      generateLocalSuggestions();
    } finally {
      setLoading(false);
    }
  };

  const generateLocalSuggestions = () => {
    const user = match.user || match.otherUser;
    const localSuggestions = [];

    // Basic greetings
    localSuggestions.push({
      id: 1,
      text: `Hey ${user.firstName}! I'm excited we matched! How's your day going? 😊`,
      category: "greeting",
      confidence: 0.9,
    });

    // Profile-based suggestions
    if (user.bio) {
      const bio = user.bio.toLowerCase();

      if (bio.includes("travel") || bio.includes("adventure")) {
        localSuggestions.push({
          id: 2,
          text: `Hi ${user.firstName}! I noticed you love traveling. What's the most amazing place you've visited?`,
          category: "travel",
          confidence: 0.8,
        });
      }

      if (bio.includes("music") || bio.includes("concert")) {
        localSuggestions.push({
          id: 3,
          text: `Hey! I see you're into music. What's the last song that gave you goosebumps?`,
          category: "music",
          confidence: 0.8,
        });
      }

      if (
        bio.includes("food") ||
        bio.includes("cooking") ||
        bio.includes("restaurant")
      ) {
        localSuggestions.push({
          id: 4,
          text: `Hi there! Fellow foodie here! What's your signature dish or favorite restaurant?`,
          category: "food",
          confidence: 0.8,
        });
      }

      if (
        bio.includes("fitness") ||
        bio.includes("gym") ||
        bio.includes("workout")
      ) {
        localSuggestions.push({
          id: 5,
          text: `Hey ${user.firstName}! I see you're into fitness. What's your favorite workout or sport?`,
          category: "fitness",
          confidence: 0.8,
        });
      }

      if (bio.includes("book") || bio.includes("read")) {
        localSuggestions.push({
          id: 6,
          text: `Hi! I noticed you love reading. What's the best book you've read recently?`,
          category: "books",
          confidence: 0.8,
        });
      }
    }

    // Interest-based suggestions
    if (user.interests && user.interests.length > 0) {
      const interests = user.interests.slice(0, 3);
      localSuggestions.push({
        id: 7,
        text: `Hey ${user.firstName}! I love that you're into ${interests.join(
          ", "
        )}. What got you interested in that?`,
        category: "interests",
        confidence: 0.7,
      });
    }

    // Location-based suggestions
    if (user.location) {
      localSuggestions.push({
        id: 8,
        text: `Hi there! I see you're from ${user.location}. What's the best thing about living there?`,
        category: "location",
        confidence: 0.6,
      });
    }

    // Occupation-based suggestions
    if (user.occupation) {
      localSuggestions.push({
        id: 9,
        text: `Hey! I noticed you work as a ${user.occupation}. What's the most interesting part of your job?`,
        category: "work",
        confidence: 0.7,
      });
    }

    // Weekend activity suggestions
    localSuggestions.push({
      id: 10,
      text: `Hi ${user.firstName}! What's your favorite thing to do on weekends?`,
      category: "weekend",
      confidence: 0.5,
    });

    // Coffee/Drink preferences
    localSuggestions.push({
      id: 11,
      text: `Hey there! Great to match with you! What's your go-to coffee order? ☕`,
      category: "coffee",
      confidence: 0.5,
    });

    // Spontaneous activity
    localSuggestions.push({
      id: 12,
      text: `Hi! I'm curious - what's the most spontaneous thing you've done lately?`,
      category: "spontaneous",
      confidence: 0.5,
    });

    // Sort by confidence and take top 8
    const sortedSuggestions = localSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);

    setSuggestions(sortedSuggestions);
  };

  const handleSuggestionSelect = (suggestion) => {
    setSelectedSuggestion(suggestion.text);
    setShowCustomInput(false);
  };

  const handleCustomMessageChange = (e) => {
    setCustomMessage(e.target.value);
    setSelectedSuggestion("");
  };

  const handleSend = () => {
    const messageContent = selectedSuggestion || customMessage.trim();

    if (!messageContent) {
      alert("Please select a suggestion or write a custom message!");
      return;
    }

    onSelect(messageContent);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      greeting: "👋",
      travel: "✈️",
      music: "🎵",
      food: "🍕",
      fitness: "💪",
      books: "📚",
      interests: "🎯",
      location: "📍",
      work: "💼",
      weekend: "🎉",
      coffee: "☕",
      spontaneous: "🎲",
    };
    return icons[category] || "💬";
  };

  const getCategoryColor = (category) => {
    const colors = {
      greeting: "bg-blue-100 text-blue-800",
      travel: "bg-green-100 text-green-800",
      music: "bg-purple-100 text-purple-800",
      food: "bg-orange-100 text-orange-800",
      fitness: "bg-red-100 text-red-800",
      books: "bg-indigo-100 text-indigo-800",
      interests: "bg-pink-100 text-pink-800",
      location: "bg-gray-100 text-gray-800",
      work: "bg-yellow-100 text-yellow-800",
      weekend: "bg-teal-100 text-teal-800",
      coffee: "bg-amber-100 text-amber-800",
      spontaneous: "bg-cyan-100 text-cyan-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
            <p className='text-gray-600'>Generating icebreakers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='bg-gradient-to-r from-pink-500 to-red-500 p-4 text-white'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold'>Ice Breakers</h2>
              <p className='text-sm opacity-90'>Start the conversation!</p>
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
        <div className='p-4 space-y-4'>
          {/* Selected Message Preview */}
          {(selectedSuggestion || customMessage) && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
              <p className='text-sm text-blue-800 font-medium mb-1'>
                Your message:
              </p>
              <p className='text-sm text-blue-900'>
                {selectedSuggestion || customMessage}
              </p>
            </div>
          )}

          {/* Suggestions */}
          <div>
            <h3 className='font-medium text-gray-900 mb-3'>
              Suggested Ice Breakers
            </h3>
            <div className='space-y-2'>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                    selectedSuggestion === suggestion.text
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className='flex items-start space-x-3'>
                    <span className='text-lg'>
                      {getCategoryIcon(suggestion.category)}
                    </span>
                    <div className='flex-1'>
                      <p className='text-sm text-gray-900'>{suggestion.text}</p>
                      <div className='flex items-center justify-between mt-2'>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                            suggestion.category
                          )}`}
                        >
                          {suggestion.category}
                        </span>
                        <span className='text-xs text-gray-500'>
                          {Math.round(suggestion.confidence * 100)}% match
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className='w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200'
            >
              <div className='flex items-center space-x-3'>
                <span className='text-lg'>✏️</span>
                <span className='text-sm text-gray-900'>
                  Write your own message
                </span>
              </div>
            </button>

            {showCustomInput && (
              <div className='mt-3'>
                <textarea
                  value={customMessage}
                  onChange={handleCustomMessageChange}
                  placeholder='Type your custom message here...'
                  className='w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                  rows='3'
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-gray-200'>
          <div className='flex space-x-3'>
            <button
              onClick={onClose}
              className='flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!selectedSuggestion && !customMessage.trim()}
              className='flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IcebreakerSuggestions;
