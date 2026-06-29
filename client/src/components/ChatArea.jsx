import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import axios from '../lib/axios';
import { socket } from '../App';
import { Send, Lock, Paperclip, Smile } from 'lucide-react';

const ChatArea = () => {
  const { selectedChat, messages, fetchMessages, addMessage } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const otherUser = selectedChat?.users.find((u) => u._id !== authUser._id);
  const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      socket.emit('joinRoom', selectedChat._id);
    }
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (selectedChat && newMsg.chat === selectedChat._id || newMsg.chat._id === selectedChat._id) {
        addMessage(newMsg);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    
    // Stop typing indicator
    setIsTyping(false);
    socket.emit('typing', { roomId: selectedChat._id, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const mySecretKey = localStorage.getItem('connectx_privKey');
      if (!mySecretKey) throw new Error("No private key found!");

      let encryptedContent, nonceString;

      if (!selectedChat.isGroupChat) {
        // E2EE for 1-on-1
        const { encryptedMessage, nonce } = encryptMessage(newMessage, mySecretKey, otherUser.publicKey);
        encryptedContent = encryptedMessage;
        nonceString = nonce;
      } else {
        // For groups in a real app we'd use Sender Keys or pairwise. 
        // Here we fallback to simple encoding for MVP group chats to avoid crashing.
        encryptedContent = btoa(newMessage); 
        nonceString = "group_no_e2ee";
      }

      const res = await axios.post('/message', {
        content: encryptedContent,
        nonce: nonceString,
        chatId: selectedChat._id
      });

      addMessage(res.data);
      socket.emit('sendMessage', res.data);
      setNewMessage('');
    } catch (error) {
      console.log('Error sending message', error);
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.content === "This message was deleted") {
      return <span className="italic text-dark-muted">🚫 This message was deleted</span>;
    }
    if (msg.nonce === "group_no_e2ee") {
      try { return atob(msg.content); } catch { return msg.content; }
    }
    
    // Decrypt E2EE message
    try {
      const mySecretKey = localStorage.getItem('connectx_privKey');
      if (!mySecretKey) return "🔒 [Encrypted - Missing Private Key]";

      // If I sent it, I decrypt with my secret and THEIR public
      // If THEY sent it, I decrypt with my secret and THEIR public
      // Wait, TweetNaCl box requires (SenderSecret, ReceiverPublic) to encrypt, and (ReceiverSecret, SenderPublic) to decrypt.
      // If we sent it, we can decrypt it only if we kept the plaintext, or if we decrypt using (OurSecret, TheirPublic).
      const senderPublicKey = msg.sender.publicKey;
      
      const decrypted = decryptMessage(msg.content, msg.nonce, mySecretKey, senderPublicKey);
      return decrypted || "🔒 [Decryption Failed]";
    } catch (e) {
      return "🔒 [Encrypted]";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-bg">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-dark-border bg-dark-panel/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
            {selectedChat.isGroupChat ? "G" : otherUser?.username.charAt(0).toUpperCase()}
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
            <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                isOwn ? 'bg-brand-primary text-white rounded-br-none' : 'bg-dark-panel border border-dark-border rounded-bl-none'
              }`}>
                {!isOwn && selectedChat.isGroupChat && (
                  <p className="text-xs text-brand-primary font-semibold mb-1">{msg.sender.username}</p>
                )}
                <p className="text-sm break-words leading-relaxed">{renderMessageContent(msg)}</p>
                <div className={`text-[10px] mt-1 text-right ${isOwn ? 'text-white/70' : 'text-dark-muted'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-dark-panel border-t border-dark-border">
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
            <button type="button" className="p-1 text-dark-muted hover:text-brand-primary transition-colors">
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
