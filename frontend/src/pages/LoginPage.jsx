import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  User,
  Shield,
} from 'lucide-react';
import { QuickDemoAccounts } from '../components/QuickDemoAccounts';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'agent' ? 'agent' : 'client';

  const [activeTab, setActiveTab] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'agent' || user.role === 'admin') {
        navigate('/agent/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'agent' || res.user.role === 'admin') {
        navigate('/agent/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  const handleSelectDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 p-0.5 shadow-neon">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <span className="text-xl font-bold text-white">Desk<span className="text-indigo-400">Flow</span></span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your support workspace & ticket records
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/90 rounded-2xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('client');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'client'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Client Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('agent');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'agent'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Support Agent
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'client' ? 'client@acme.com' : 'alex.tech@support.io'}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold text-white transition-all shadow-neon ${
                activeTab === 'client'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
              } disabled:opacity-50`}
            >
              {loading ? (
                <span className="animate-pulse">Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as {activeTab === 'client' ? 'Client' : 'Agent'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Helper */}
          <QuickDemoAccounts onSelectDemo={handleSelectDemo} />

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
