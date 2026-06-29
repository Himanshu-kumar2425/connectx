import { create } from 'zustand';
import axios from '../lib/axios';
import { generateKeyPair } from '../utils/crypto';

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axios.get('/user');
      // If we had a verify endpoint, we'd use it here. 
      // For now, if /user fails, they aren't auth'd.
      // Wait, we need a dedicated route to get current user. Let's assume we store user in localstorage for simplicity, or we hit an endpoint.
      // Actually we'll manage auth state via login response.
      const storedUser = localStorage.getItem('connectx_user');
      if (storedUser) {
        set({ authUser: JSON.parse(storedUser) });
      }
    } catch (error) {
      console.log('Error checking auth', error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  register: async (data) => {
    try {
      const { publicKey, secretKey } = generateKeyPair();
      const res = await axios.post('/auth/register', { ...data, publicKey });
      
      const user = res.data;
      localStorage.setItem('connectx_user', JSON.stringify(user));
      localStorage.setItem('connectx_privKey', secretKey); // STRICTLY LOCAL!
      
      set({ authUser: user });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error' };
    }
  },

  login: async (data) => {
    try {
      const res = await axios.post('/auth/login', data);
      const user = res.data;
      
      // We check if the device has the private key. If not, they can't decrypt E2EE messages on this device!
      // In a real app we'd prompt for recovery phrase. Here we just warn.
      const existingPrivKey = localStorage.getItem('connectx_privKey');
      if (!existingPrivKey) {
        console.warn('No private key found on this device! E2EE decryption will fail.');
      }

      localStorage.setItem('connectx_user', JSON.stringify(user));
      set({ authUser: user });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error' };
    }
  },

  logout: async () => {
    try {
      await axios.post('/auth/logout');
      localStorage.removeItem('connectx_user');
      // Intentionally NOT deleting the private key, so they can log back in on the same device.
      set({ authUser: null });
    } catch (error) {
      console.log('Error logging out', error);
    }
  },

  setOnlineUsers: (users) => set({ onlineUsers: users })
}));
