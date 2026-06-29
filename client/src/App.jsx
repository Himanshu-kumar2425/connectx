import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatApp from './pages/ChatApp';
import io from 'socket.io-client';

export let socket;

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, setOnlineUsers } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true,
      });

      socket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [authUser, setOnlineUsers]);

  if (isCheckingAuth) return <div className="flex h-screen items-center justify-center bg-dark-bg text-dark-text">Loading...</div>;

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text font-sans">
      <Toaster position="top-center" toastOptions={{ className: 'bg-dark-panel text-dark-text' }} />
      <Routes>
        <Route path="/" element={authUser ? <ChatApp /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!authUser ? <Register /> : <Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;
