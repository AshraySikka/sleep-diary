import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp+newpassword
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputs = useRef([]);

  useEffect(() => {
    if (step === 2) inputs.current[0]?.focus();
  }, [step]);

  const handleSendOTP = async () => {
    if (!email) { setError('Please enter your email address.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      setSuccess(data.message);
      setStep(2);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleReset = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    if (!newPassword) { setError('Please enter a new password.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setError(''); setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: code, new_password: newPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed.'); return; }
      setSuccess('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    fontSize: '14px', background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(16,185,129,0.15)', color: '#f0fdf4',
    outline: 'none', fontFamily: 'inherit',
    colorScheme: 'dark',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020c12 0%, #051a14 50%, #020c12 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom))',
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
          borderRadius: '20px', padding: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}>
          {/* Icon */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px', margin: '0 0 20px',
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <KeyRound size={22} color="#10b981" />
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4', marginBottom: '6px' }}>
            {step === 1 ? 'Reset your password' : 'Enter reset code'}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px' }}>
            {step === 1
              ? 'Enter your email and we\'ll send you a reset code.'
              : `We sent a 6-digit code to ${email}`
            }
          </p>

          {error && (
            <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '14px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '14px' }}>
              {success}
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af' }}>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.15)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <button
                onClick={handleSendOTP}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  background: loading ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', color: 'white', fontSize: '15px', fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* OTP boxes */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }} onPaste={handlePaste}>
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
                      width: '46px', height: '56px',
                      textAlign: 'center', fontSize: '20px', fontWeight: '700',
                      background: 'rgba(0,0,0,0.3)',
                      border: digit ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(16,185,129,0.15)',
                      borderRadius: '12px', color: '#f0fdf4', outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'; }}
                    onBlur={(e) => { e.target.style.borderColor = digit ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.15)'; e.target.style.boxShadow = 'none'; }}
                  />
                ))}
              </div>

              {/* New password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af' }}>New Password</label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.15)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Confirm password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af' }}>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.15)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <button
                onClick={handleReset}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  background: loading ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', color: 'white', fontSize: '15px', fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
                {"Didn't get the code? "}
                <button
                  onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
                >
                  Try again
                </button>
              </p>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
            <Link to="/login" style={{ color: '#10b981', fontWeight: '600', textDecoration: 'none' }}>
              Back to Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}