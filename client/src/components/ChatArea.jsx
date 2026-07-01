import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import axios from '../lib/axios';
import { socket } from '../App';
import { Send, Lock, Paperclip, Smile, Trash2, Reply, X, Check, CheckCheck } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const ChatArea = () => {
  const { selectedChat, messages, fetchMessages, addMessage, deleteMessage, reactToMessage } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null); // For showing message actions on hover
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const otherUser = selectedChat?.users.find((u) => u._id !== authUser._id);
  const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  // Request Notification Permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      socket.emit('joinRoom', selectedChat._id);
      setReplyingTo(null);
    }
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (selectedChat && (newMsg.chat === selectedChat._id || newMsg.chat._id === selectedChat._id)) {
        addMessage(newMsg);
        
        // Push notification if tab is hidden
        if (document.hidden && Notification.permission === 'granted') {
          new Notification('New Message on ConnectX', {
            body: `You received a new secure message.`,
          });
        }
      }
    };

    const handleTyping = ({ userId, isTyping }) => {
      if (userId !== authUser._id) {
        setTypingUser(isTyping ? userId : null);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleTyping);
    };
  }, [selectedChat, addMessage, authUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { roomId: selectedChat._id, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { roomId: selectedChat._id, isTyping: false });
    }, 2000);
  };

  const onEmojiClick = (emojiData, event) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    
    setIsTyping(false);
    socket.emit('typing', { roomId: selectedChat._id, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const mySecretKey = localStorage.getItem('connectx_privKey');
      if (!mySecretKey) throw new Error("No private key found!");

      let encryptedContent, nonceString;

      if (!selectedChat.isGroupChat) {
        const { encryptedMessage, nonce } = encryptMessage(newMessage, mySecretKey, otherUser.publicKey);
        encryptedContent = encryptedMessage;
        nonceString = nonce;
      } else {
        encryptedContent = btoa(newMessage); 
        nonceString = "group_no_e2ee";
      }

      const res = await axios.post('/message', {
        content: encryptedContent,
        nonce: nonceString,
        chatId: selectedChat._id,
        replyTo: replyingTo ? replyingTo._id : null
      });

      addMessage(res.data);
      socket.emit('sendMessage', res.data);
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.log('Error sending message', error);
    }
  };

  const handleReaction = (msgId, emoji) => {
    reactToMessage(msgId, emoji);
  };

  const renderMessageContent = (msg) => {
    if (msg.content === "This message was deleted") {
      return <span className="italic text-dark-muted">🚫 This message was deleted</span>;
    }
    if (msg.nonce === "group_no_e2ee") {
      try { return atob(msg.content); } catch { return msg.content; }
    }
    
    try {
      const mySecretKey = localStorage.getItem('connectx_privKey');
      if (!mySecretKey) return "🔒 [Encrypted - Missing Private Key]";
      const senderIsMe = msg.sender._id === authUser._id;
      const theirPublicKey = senderIsMe ? otherUser.publicKey : msg.sender.publicKey;
      const decrypted = decryptMessage(msg.content, msg.nonce, mySecretKey, theirPublicKey);
      return decrypted || "🔒 [Decryption Failed]";
    } catch (e) {
      return "🔒 [Encrypted]";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-bg relative">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-dark-border bg-dark-panel/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold overflow-hidden">
            {selectedChat.isGroupChat ? "G" : (otherUser?.profilePic ? <img src={otherUser.profilePic} alt="pfp" className="w-full h-full object-cover" /> : otherUser?.username.charAt(0).toUpperCase())}
          </div>
          <div>
            <h2 className="font-semibold">{selectedChat.isGroupChat ? selectedChat.chatName : otherUser?.username}</h2>
            {!selectedChat.isGroupChat && (
              <p className={`text-xs ${isOnline ? 'text-green-500' : 'text-dark-muted'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center text-brand-primary gap-2 text-xs font-medium bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
          <Lock size={12} />
          <span>E2EE Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.sender._id === authUser._id;
          return (
            <div 
              key={msg._id} 
              className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              onMouseEnter={() => setActiveMessageId(msg._id)}
              onMouseLeave={() => setActiveMessageId(null)}
            >
              <div className="flex items-center gap-2 group">
                {/* Actions (Reply, Delete) for non-own messages */}
                {!isOwn && activeMessageId === msg._id && !msg.isDeleted && (
                  <div className="flex gap-2 text-dark-muted">
                    <button onClick={() => setReplyingTo(msg)} className="hover:text-brand-primary p-1 rounded bg-dark-panel"><Reply size={14} /></button>
                    <button onClick={() => handleReaction(msg._id, '👍')} className="hover:text-yellow-500 p-1 rounded bg-dark-panel">👍</button>
                    <button onClick={() => handleReaction(msg._id, '❤️')} className="hover:text-red-500 p-1 rounded bg-dark-panel">❤️</button>
                  </div>
                )}

                <div className={`relative max-w-md rounded-2xl px-4 py-2.5 ${
                  isOwn ? 'bg-brand-primary text-white rounded-br-none' : 'bg-dark-panel border border-dark-border rounded-bl-none'
                }`}>
                  {/* Replied Message Banner */}
                  {msg.replyTo && (
                    <div className={`text-xs p-2 rounded mb-2 border-l-2 ${isOwn ? 'bg-white/10 border-white/50' : 'bg-dark-bg border-brand-primary'}`}>
                      <p className="font-semibold">{msg.replyTo.sender?.username}</p>
                      <p className="truncate opacity-80">{renderMessageContent(msg.replyTo)}</p>
                    </div>
                  )}

                  {!isOwn && selectedChat.isGroupChat && (
                    <p className="text-xs text-brand-primary font-semibold mb-1">{msg.sender.username}</p>
                  )}
                  <p className="text-sm break-words leading-relaxed">{renderMessageContent(msg)}</p>
                  
                  <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-white/70' : 'text-dark-muted'}`}>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {/* Read Receipts ✓✓ */}
                    {isOwn && (
                      <CheckCheck size={12} className={msg.readBy.length > 1 ? 'text-blue-200' : 'text-white/40'} />
                    )}
                  </div>
                  
                  {/* Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="absolute -bottom-3 left-4 flex gap-1 bg-dark-panel border border-dark-border rounded-full px-2 py-0.5 shadow-sm text-xs">
                      {msg.reactions.map((r, idx) => (
                        <span key={idx}>{r.emoji}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions (Reply, Delete) for own messages */}
                {isOwn && activeMessageId === msg._id && !msg.isDeleted && (
                  <div className="flex gap-2 text-dark-muted">
                    <button onClick={() => handleReaction(msg._id, '❤️')} className="hover:text-red-500 p-1 rounded bg-dark-panel">❤️</button>
                    <button onClick={() => setReplyingTo(msg)} className="hover:text-brand-primary p-1 rounded bg-dark-panel"><Reply size={14} /></button>
                    <button onClick={() => deleteMessage(msg._id)} className="hover:text-red-500 p-1 rounded bg-dark-panel"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-dark-panel border border-dark-border rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
              <span className="w-2 h-2 bg-dark-muted rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-dark-muted rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Reply Banner overlaying input */}
      {replyingTo && (
        <div className="px-6 py-2 bg-dark-panel border-t border-dark-border flex justify-between items-center text-sm">
          <div className="border-l-2 border-brand-primary pl-2">
            <p className="text-brand-primary font-semibold text-xs">Replying to {replyingTo.sender.username}</p>
            <p className="text-dark-muted truncate max-w-md">{renderMessageContent(replyingTo)}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-dark-muted hover:text-white"><X size={16} /></button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-dark-panel border-t border-dark-border relative">
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50 shadow-2xl">
            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <button type="button" className="p-2 text-dark-muted hover:text-brand-primary transition-colors">
            <Paperclip size={20} />
          </button>
          <div className="flex-1 bg-dark-bg border border-dark-border rounded-xl flex items-center px-4 py-2 focus-within:border-brand-primary transition-colors">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a secure message..."
              className="flex-1 bg-transparent focus:outline-none text-sm"
            />
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1 text-dark-muted hover:text-brand-primary transition-colors">
              <Smile size={18} />
            </button>
          </div>
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-brand-primary text-white rounded-xl hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-primary/20"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
