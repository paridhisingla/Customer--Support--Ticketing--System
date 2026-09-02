import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Building,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const RegisterPage = () => {
  const [role, setRole] = useState('client'); // 'client' | 'agent'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Technical');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await register({
      name,
      email,
      password,
      role,
      department: role === 'agent' ? department : undefined,
    });
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'agent') {
        navigate('/agent/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/15 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 p-0.5 shadow-neon">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <span className="text-xl font-bold text-white">Desk<span className="text-indigo-400">Flow</span></span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Join DeskFlow to submit or resolve support tickets
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800">
          {/* Role Choice */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-300 mb-2">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  role === 'client'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold">Client</div>
                  <div className="text-[10px] text-slate-400">Raise & track issues</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('agent')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  role === 'agent'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-xs font-semibold">Support Agent</div>
                  <div className="text-[10px] text-slate-400">Triage & resolve</div>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rachel Zane"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {role === 'agent' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department Specialty</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Technical">Technical & Infrastructure</option>
                    <option value="Billing">Billing & Payments</option>
                    <option value="Account">Account Security & Access</option>
                    <option value="General">General Inquiries</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full pl-10 pr-10 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-neon transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse">Creating Account...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Register Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
