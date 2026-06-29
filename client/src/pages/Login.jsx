import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { MessageSquare, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await login({ email, password });
    if (res.success) {
      toast.success('Welcome back!');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-dark-panel p-8 shadow-2xl border border-dark-border">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary mb-4">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-dark-muted mt-2">Sign in to continue to ConnectX</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-dark-muted">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-muted">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                className="w-full bg-dark-bg border border-dark-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
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
                className="w-full bg-dark-bg border border-dark-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-hover text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-dark-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-primary hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
