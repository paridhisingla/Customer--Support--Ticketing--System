import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy,
  PlusCircle,
  LayoutDashboard,
  BarChart3,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  Sparkles,
  Inbox,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isClient = user?.role === 'client';
  const isAgent = user?.role === 'agent' || user?.role === 'admin';

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-neon group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Desk<span className="text-indigo-400">Flow</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">
                Support Hub
              </span>
            </div>
          </Link>

          {/* Center Navigation for Logged In Users */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {isClient && (
                <>
                  <Link
                    to="/client/dashboard"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/client/dashboard')
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                    My Tickets
                  </Link>
                  <Link
                    to="/client/dashboard?action=new"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-indigo-400" />
                    Raise Ticket
                  </Link>
                </>
              )}

              {isAgent && (
                <>
                  <Link
                    to="/agent/dashboard"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/agent/dashboard')
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Inbox className="w-4 h-4 text-indigo-400" />
                    Ticket Queue
                  </Link>
                  <Link
                    to="/agent/dashboard?tab=analytics"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      location.search.includes('tab=analytics')
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    SLA & Analytics
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
                    alt={user?.name}
                    className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/30"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
                    <span className="text-[10px] font-medium text-indigo-300/80 flex items-center gap-1">
                      {isAgent ? (
                        <>
                          <Shield className="w-2.5 h-2.5 text-purple-400" /> Agent ({user?.department || 'General'})
                        </>
                      ) : (
                        <>
                          <User className="w-2.5 h-2.5 text-sky-400" /> Client
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-neon transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 bg-slate-900 border-b border-slate-800">
          {isAuthenticated ? (
            <>
              <div className="p-3 bg-slate-800/80 rounded-xl mb-3 flex items-center gap-3">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-lg"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-indigo-400">{user?.role} • {user?.email}</p>
                </div>
              </div>

              {isClient && (
                <Link
                  to="/client/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                >
                  My Tickets
                </Link>
              )}
              {isAgent && (
                <Link
                  to="/agent/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
                >
                  Ticket Queue & Analytics
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 text-sm text-slate-200 bg-slate-800 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
