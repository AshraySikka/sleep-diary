import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { saveTokens, saveUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { Moon, Mail } from 'lucide-react';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();

  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const inputs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/register');
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP({ email, otp: code });
      const { access, refresh, user } = res.data;
      saveTokens(access, refresh);
      saveUser(user);
      updateUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    try {
      await authAPI.resendOTP({ email });
      setResendMsg('A new code has been sent to your email.');
    } catch {
      setResendMsg('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020c12 0%, #051a14 50%, #020c12 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      paddingTop: 'max(24px, env(safe-area-inset-top))',
      paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
    }}>
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

        <div style={{
          background: 'rgba(15, 30, 24, 0.8)',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: '20px',
          padding: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          textAlign: 'center'
        }}>
          {/* Icon */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 20px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={24} color="#10b981" />
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4', marginBottom: '8px' }}>
            Check your email
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px', lineHeight: '1.6' }}>
            We sent a 6-digit verification code to{' '}
            <span style={{ color: '#10b981', fontWeight: '500' }}>{email}</span>
          </p>

          {error && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {resendMsg && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              color: '#6ee7b7', fontSize: '14px',
            }}>
              {resendMsg}
            </div>
          )}

          {/* OTP boxes */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}
            onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: '48px', height: '58px',
                  textAlign: 'center', fontSize: '22px', fontWeight: '700',
                  background: 'rgba(0,0,0,0.3)',
                  border: digit ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(16,185,129,0.15)',
                  borderRadius: '12px', color: '#f0fdf4',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = digit ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.15)'; e.target.style.boxShadow = 'none'; }}
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: '12px',
              color: 'white', fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
              marginBottom: '20px',
            }}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {"Didn't get the code? "}
            <button
              onClick={handleResend}
              disabled={resendLoading}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#10b981', fontWeight: '600', fontSize: '14px',
                opacity: resendLoading ? 0.5 : 1,
              }}
            >
              {resendLoading ? 'Sending...' : 'Resend code'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#374151', marginTop: '20px' }}>
          Code expires in 10 minutes
        </p>
      </div>
    </div>
  );
}