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
      background: 'linear-gradient(135deg, var(--sd-bg) 0%, var(--sd-bg-alt) 50%, var(--sd-bg) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      paddingTop: 'max(24px, env(safe-area-inset-top))'
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, var(--sd-em-06) 0%, transparent 70%)',
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
          <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--sd-text-strong)', letterSpacing: '-0.5px' }}>
            Sleep Diary
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--sd-surface-80)',
          border: '1px solid var(--sd-em-15)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px var(--sd-shadow-50), 0 0 0 1px var(--sd-em-05)',
        }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--sd-text-strong)', marginBottom: '6px' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--sd-text-muted)' }}>
              Sign in to continue tracking your sleep
            </p>
          </div>

          {error && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--sd-danger-soft)', fontSize: '14px',
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

            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--sd-accent)', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

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
                boxShadow: '0 4px 15px var(--sd-em-30)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--sd-text-muted)', marginTop: '24px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--sd-accent)', fontWeight: '600', textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p style={{ fontSize: '12px', color: 'var(--sd-text-faint)', marginBottom: '4px' }}>
            Based on the Consensus Sleep Diary — Modified (CSD-M)
        </p>
        <p style={{ fontSize: '11px', color: 'var(--sd-text-faint)' }}>
            Built by{' '}
            <a href="mailto:ashray15.sikka@gmail.com" style={{ color: 'var(--sd-accent)', textDecoration: 'none', fontWeight: '500' }}>
            Ashray Sikka
            </a>
            {' '}·{' '}
            <a href="https://github.com/AshraySikka" target="_blank" rel="noreferrer" style={{ color: 'var(--sd-accent)', textDecoration: 'none', fontWeight: '500' }}>
            GitHub
            </a>
        </p>
        </div>
      </div>
    </div>
  );
}