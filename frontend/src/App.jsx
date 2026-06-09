// App.jsx
// -----------------------------------------------------------------------
// Root component. Defines all routes and handles protected vs public paths.
// Protected routes redirect to /login if not authenticated.
// -----------------------------------------------------------------------

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/ui/Navbar';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import EntryForm from './pages/EntryForm';
import History from './pages/History';
import Instructions from './pages/Instructions';
import Settings from './pages/Settings';
import Export from './pages/Export';

// ProtectedRoute — redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// AppLayout — wraps protected pages with the navbar
function AppLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#020c12', display: 'flex' }}>
      <Navbar />
      <main style={{ flex: 1, marginLeft: '240px', minHeight: '100vh', paddingBottom: '0' }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route path="/verify-otp" element={<VerifyOTP />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/calendar" element={
        <ProtectedRoute>
          <AppLayout><Calendar /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/entry/:date?" element={
        <ProtectedRoute>
          <AppLayout><EntryForm /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <AppLayout><History /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/instructions" element={
        <ProtectedRoute>
          <AppLayout><Instructions /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout><Settings /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/export" element={
        <ProtectedRoute>
          <AppLayout><Export /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}