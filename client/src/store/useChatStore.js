import { create } from 'zustand';
import axios from '../lib/axios';

export const useChatStore = create((set, get) => ({
  chats: [],
  selectedChat: null,
  messages: [],
  isChatsLoading: false,
  isMessagesLoading: false,

  fetchChats: async () => {
    set({ isChatsLoading: true });
    try {
      const res = await axios.get('/chat');
      set({ chats: res.data });
    } catch (error) {
      console.log('Error fetching chats', error);
    } finally {
      set({ isChatsLoading: false });
    }
  },

  setSelectedChat: (chat) => set({ selectedChat: chat }),

  fetchMessages: async (chatId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axios.get(`/message/${chatId}`);
      set({ messages: res.data });
    } catch (error) {
      console.log('Error fetching messages', error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  addMessage: (message) => {
    set((state) => {
      // Avoid duplicates
      if (state.messages.some(m => m._id === message._id)) return state;
      return { messages: [...state.messages, message] };
    });
  },

  accessChat: async (userId) => {
    try {
      const res = await axios.post('/chat', { userId });
      set((state) => {
        const chatExists = state.chats.find((c) => c._id === res.data._id);
        if (!chatExists) {
          return { chats: [res.data, ...state.chats], selectedChat: res.data };
        }
        return { selectedChat: res.data };
      });
    } catch (error) {
      console.log('Error accessing chat', error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axios.delete(`/message/${messageId}`);
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted', nonce: 'deleted' } : m
        )
      }));
    } catch (error) {
      console.log('Error deleting message', error);
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await axios.post(`/message/${messageId}/react`, { emoji });
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? res.data : m))
      }));
    } catch (error) {
      console.log('Error reacting', error);
    }
  }
}));
