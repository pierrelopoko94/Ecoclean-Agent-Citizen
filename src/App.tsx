import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NotificationBanner } from './components/NotificationBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { CitizenHome } from './pages/CitizenHome';
import { NewReport } from './pages/NewReport';
import { Profile } from './pages/Profile';
import { AgentMissions } from './pages/AgentMissions';
import { AgentMap } from './pages/AgentMap';
import { Loader2, Leaf } from 'lucide-react';

// Route protection component for logged in users
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: ('CITIZEN' | 'AGENT' | 'ADMIN')[] }> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 bg-ecogreen-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-spin">
          <Leaf className="w-6 h-6 fill-current" />
        </div>
        <p className="text-sm font-semibold text-slate-500">EcoClean Kinshasa...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect role mismatch to appropriate homepage
    return <Navigate to={profile.role === 'AGENT' ? '/missions' : '/'} replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <NotificationBanner />
      
      {/* Show header only if authenticated */}
      {user && <Header />}

      <main className="flex-1">
        <Routes>
          {/* Guest Auth Route */}
          <Route 
            path="/login" 
            element={user ? <Navigate to={profile?.role === 'AGENT' ? '/missions' : '/'} replace /> : <Login />} 
          />

          {/* CITIZEN ROUTES */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <ErrorBoundary>
                  <CitizenHome />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report/new" 
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <ErrorBoundary>
                  <NewReport />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />

          {/* SHARED ACCOUNT PROFILE ROUTE */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* AGENT ROUTES */}
          <Route 
            path="/missions" 
            element={
              <ProtectedRoute allowedRoles={['AGENT', 'ADMIN']}>
                <AgentMissions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/map" 
            element={
              <ProtectedRoute allowedRoles={['AGENT', 'ADMIN']}>
                <AgentMap />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Catch-all Route */}
          <Route 
            path="*" 
            element={<Navigate to={profile?.role === 'AGENT' ? '/missions' : '/'} replace />} 
          />
        </Routes>
      </main>

      {/* Persistent Tactile Navigation Bottom-Bar */}
      {user && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
