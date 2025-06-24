import React, { useState } from "react";
import { useChat } from "../../context/ChatContext";
import ConversationsList from "./ConversationsList";
import ChatInterface from "./ChatInterface";

const ChatPage = () => {
  const { currentConversation, setCurrentConversation, connected } = useChat();
  const [showMobileChat, setShowMobileChat] = useState(false);

  const handleSelectConversation = (conversation) => {
    setCurrentConversation(conversation);
    setShowMobileChat(true); // For mobile view
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setCurrentConversation(null);
  };

  return (
    <div className='h-screen bg-gray-50'>
      {/* Connection Status */}
      {!connected && (
        <div className='bg-yellow-100 border-b border-yellow-200 px-4 py-2'>
          <div className='flex items-center justify-center'>
            <svg
              className='w-4 h-4 text-yellow-600 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
            <span className='text-yellow-800 text-sm font-medium'>
              Reconnecting to chat...
            </span>
          </div>
        </div>
      )}

      <div className='flex h-full'>
        {/* Desktop Layout */}
        <div className='hidden md:flex w-full'>
          {/* Conversations Sidebar */}
          <div className='w-1/3 bg-white border-r border-gray-200 flex flex-col'>
            <ConversationsList
              onSelectConversation={handleSelectConversation}
            />
          </div>

          {/* Chat Interface */}
          <div className='flex-1 flex flex-col'>
            <ChatInterface conversation={currentConversation} />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className='md:hidden w-full'>
          {!showMobileChat ? (
            /* Mobile Conversations List */
            <div className='h-full bg-white'>
              <div className='px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500'>
                <h1 className='text-xl font-bold text-white'>Messages</h1>
              </div>
              <ConversationsList
                onSelectConversation={handleSelectConversation}
              />
            </div>
          ) : (
            /* Mobile Chat Interface */
            <div className='h-full flex flex-col'>
              {/* Mobile Chat Header */}
              <div className='bg-gradient-to-r from-pink-500 to-red-500 p-4'>
                <div className='flex items-center space-x-3 text-white'>
                  <button
                    onClick={handleBackToList}
                    className='p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors'
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
                        d='M15 19l-7-7 7-7'
                      />
                    </svg>
                  </button>

                  {currentConversation && (
                    <>
                      <div className='relative'>
                        {currentConversation.user.primaryPhoto ? (
                          <img
                            src={currentConversation.user.primaryPhoto.url}
                            alt={currentConversation.user.firstName}
                            className='w-10 h-10 rounded-full object-cover border-2 border-white'
                          />
                        ) : (
                          <div className='w-10 h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center border-2 border-white'>
                            <span className='text-white font-semibold text-sm'>
                              {currentConversation.user.firstName.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className='font-semibold'>
                          {currentConversation.user.firstName}
                        </h3>
                        <p className='text-sm text-pink-100'>
                          {connected ? "Online" : "Offline"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Chat Interface */}
              <div className='flex-1 flex flex-col'>
                <ChatInterface conversation={currentConversation} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Indicator */}
      <div
        className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
          connected ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        {connected ? "Connected" : "Disconnected"}
      </div>
    </div>
  );
};

export default ChatPage;
