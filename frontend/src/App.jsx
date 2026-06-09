import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/ui/Navbar';
import LoadingSpinner from './components/ui/LoadingSpinner';
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
import { useState, useEffect } from 'react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Footer() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <footer style={{
      borderTop: '1px solid rgba(16,185,129,0.08)',
      textAlign: 'center',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      gap: '8px',
      marginBottom: isMobile ? '0' : '0',
    }}>
      <p style={{ fontSize: '12px', color: '#374151' }}>
        &copy; 2026 Ashray Sikka. All rights reserved.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <a href="mailto:ashray15.sikka@gmail.com" style={{ fontSize: '12px', color: '#4b5563', textDecoration: 'none' }}>
          ashray15.sikka@gmail.com
        </a>
        <a href="https://github.com/AshraySikka" target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#4b5563', textDecoration: 'none' }}>
          github.com/AshraySikka
        </a>
        <span style={{ fontSize: '12px', color: '#374151' }}>
          Built by <span style={{ color: '#10b981', fontWeight: '600' }}>Ashray Sikka</span>
        </span>
      </div>
    </footer>
  );
}

function AppLayout({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#020c12', display: 'flex' }}>
      <Navbar />
      <main style={{
        flex: 1,
        marginLeft: isMobile ? '0' : '240px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: isMobile ? '100%' : 'calc(100% - 240px)',
        overflowX: 'hidden',
        paddingTop: isMobile ? 'env(safe-area-inset-top)' : '0',
        paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : '0',
      }}>
        <div style={{ flex: 1, width: '100%', overflowX: 'hidden' }}>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />

      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><AppLayout><Calendar /></AppLayout></ProtectedRoute>} />
      <Route path="/entry/:date?" element={<ProtectedRoute><AppLayout><EntryForm /></AppLayout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><AppLayout><History /></AppLayout></ProtectedRoute>} />
      <Route path="/instructions" element={<ProtectedRoute><AppLayout><Instructions /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
      <Route path="/export" element={<ProtectedRoute><AppLayout><Export /></AppLayout></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}