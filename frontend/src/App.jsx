import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ClientDashboard } from './pages/ClientDashboard';
import { AgentDashboard } from './pages/AgentDashboard';
import { TicketDetailPage } from './pages/TicketDetailPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'agent' ? '/agent/dashboard' : '/client/dashboard'} replace />;
  }

  return children;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Client Portal Routes */}
              <Route
                path="/client/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['client', 'agent', 'admin']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Agent Command Center Routes */}
              <Route
                path="/agent/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['agent', 'admin']}>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Shared Ticket Detail Route */}
              <Route
                path="/tickets/:id"
                element={
                  <ProtectedRoute>
                    <TicketDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
