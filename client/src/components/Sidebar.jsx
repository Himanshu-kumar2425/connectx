import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import axios from '../lib/axios';
import { Search, UserPlus, Users } from 'lucide-react';

const Sidebar = () => {
  const { chats, fetchChats, setSelectedChat, selectedChat, accessChat } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleSearch = async (e) => {
    setSearch(e.target.value);
    if (!e.target.value) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`/user?search=${e.target.value}`);
      setSearchResults(res.data);
    } catch (error) {
      console.log('Search error', error);
    }
  };

  const handleAccessChat = async (userId) => {
    await accessChat(userId);
    setSearch('');
    setSearchResults([]);
  };

  return (
    <div className="w-80 h-full bg-dark-panel border-r border-dark-border flex flex-col">
      <div className="p-4 border-b border-dark-border">
        <h1 className="text-xl font-bold text-brand-primary mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
            cx
          </div>
          ConnectX
        </h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-dark-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={handleSearch}
            className="w-full bg-dark-bg border border-dark-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-brand-primary text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {search ? (
          <div className="p-2">
            <h3 className="text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2 px-2">Search Results</h3>
            {searchResults.map((user) => (
              <div
                key={user._id}
                onClick={() => handleAccessChat(user._id)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-bg cursor-pointer transition-colors mb-1"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.includes(user._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark-panel rounded-full"></span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2">
            <h3 className="text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2 px-2">Recent Chats</h3>
            {chats.map((chat) => {
              const otherUser = chat.users.find((u) => u._id !== authUser._id);
              const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

              return (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${selectedChat?._id === chat._id ? 'bg-brand-primary/10 border border-brand-primary/20' : 'hover:bg-dark-bg'}`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                      {chat.isGroupChat ? <Users size={16} /> : otherUser?.username.charAt(0).toUpperCase()}
                    </div>
                    {!chat.isGroupChat && isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark-panel rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-dark-text">
                      {chat.isGroupChat ? chat.chatName : otherUser?.username}
                    </p>
                    {chat.latestMessage && (
                      <p className="text-xs text-dark-muted truncate">
                        {chat.latestMessage.content === "This message was deleted" 
                          ? "🚫 This message was deleted" 
                          : "Encrypted Message 🔒"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
