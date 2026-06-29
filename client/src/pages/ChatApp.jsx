import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { LogOut } from 'lucide-react';

const ChatApp = () => {
  const { authUser, logout } = useAuthStore();
  const { selectedChat } = useChatStore();

  return (
    <div className="flex h-screen bg-dark-bg text-dark-text overflow-hidden">
      {/* Sidebar - Chat List & Search */}
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {selectedChat ? (
          <ChatArea />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-dark-muted">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-semibold text-dark-text mb-2">Welcome to ConnectX</h2>
            <p>Select a chat or search for a user to start messaging securely.</p>
          </div>
        )}
      </div>

      {/* Simple User Profile / Logout floating button */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={logout}
          className="flex items-center gap-2 bg-dark-panel hover:bg-dark-border px-4 py-2 rounded-full border border-dark-border transition-colors shadow-lg"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium">Logout ({authUser?.username})</span>
        </button>
      </div>
    </div>
  );
};

export default ChatApp;
