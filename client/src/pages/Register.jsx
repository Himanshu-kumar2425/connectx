import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { MessageSquare, Mail, Lock, User } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuthStore();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    
    // E2EE keypair generation happens inside the register action in useAuthStore
    const res = await register({ username, email, password });
    if (res.success) {
      toast.success('Account created successfully!');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-dark-panel p-8 shadow-2xl border border-dark-border">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-accent/10 text-brand-accent mb-4">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-dark-muted mt-2">Get started with ConnectX</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-dark-muted">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-muted">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-dark-muted">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-muted">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-dark-muted">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-muted">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-accent hover:bg-violet-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center mt-2"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-dark-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-accent hover:underline font-medium">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
