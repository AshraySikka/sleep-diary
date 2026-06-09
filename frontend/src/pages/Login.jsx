import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Moon } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.requires_verification) {
        navigate('/verify-otp', { state: { email: form.email } });
        return;
      }
      setError(data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020c12 0%, #051a14 50%, #020c12 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      paddingTop: 'max(24px, env(safe-area-inset-top))', 
      paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '36px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Moon size={20} color="white" />
          </div>
          <span style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4', letterSpacing: '-0.5px' }}>
            Sleep Diary
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(15, 30, 24, 0.8)',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.05)',
        }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0fdf4', marginBottom: '6px' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Sign in to continue tracking your sleep
            </p>
          </div>

          {error && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', borderRadius: '12px',
                color: 'white', fontSize: '15px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#10b981', fontWeight: '600', textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
            Based on the Consensus Sleep Diary — Modified (CSD-M)
        </p>
        <p style={{ fontSize: '11px', color: '#374151' }}>
            Built by{' '}
            <a href="mailto:ashray15.sikka@gmail.com" style={{ color: '#10b981', textDecoration: 'none', fontWeight: '500' }}>
            Ashray Sikka
            </a>
            {' '}·{' '}
            <a href="https://github.com/AshraySikka" target="_blank" rel="noreferrer" style={{ color: '#10b981', textDecoration: 'none', fontWeight: '500' }}>
            GitHub
            </a>
        </p>
        </div>
      </div>
    </div>
  );
}