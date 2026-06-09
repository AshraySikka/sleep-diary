import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Input, Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Moon, X } from 'lucide-react';

const TERMS_TEXT = `TERMS AND CONDITIONS — SLEEP DIARY APP

Last updated: June 2025

IMPORTANT: Please read these terms carefully before using this application.

1. NOT A MEDICAL DEVICE
This application is not a medical device and is not intended to diagnose, treat, cure, or prevent any medical condition. The Sleep Diary app is a tool for personal sleep tracking based on the Consensus Sleep Diary-Modified (CSD-M) instrument.

2. NO CLINICAL ADVICE
Information provided by this application, including sleep metrics and calculations, is for informational purposes only. It does not constitute medical advice. Always consult a qualified healthcare professional for medical concerns.

3. ACCURACY OF DATA
Sleep metrics (TST, TIB, SE) are calculated from data you enter. The accuracy of results depends entirely on the accuracy of your input. The developer assumes no responsibility for decisions made based on this data.

4. DATA PRIVACY
Your sleep data is stored securely. Data is not shared with third parties without your consent, except when you explicitly use the Email Report feature to send your data to a clinician.

5. LIMITATION OF LIABILITY
By using this application, you agree that the developer shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use this application.

6. USER RESPONSIBILITY
You are solely responsible for the accuracy of data entered and any decisions made based on the information provided by this application.

7. ACCEPTANCE
By creating an account, you acknowledge that you have read, understood, and agree to these Terms and Conditions.`;

const cardStyle = {
  background: 'rgba(15, 30, 24, 0.8)',
  border: '1px solid rgba(16,185,129,0.15)',
  borderRadius: '20px',
  padding: '40px',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
};

const btnPrimary = (loading) => ({
  width: '100%',
  padding: '14px',
  background: loading ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)',
  border: 'none',
  borderRadius: '12px',
  color: 'white',
  fontSize: '15px',
  fontWeight: '600',
  cursor: loading ? 'not-allowed' : 'pointer',
  boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
  transition: 'all 0.2s ease',
});

const btnSecondary = {
  width: '100%',
  padding: '14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(16,185,129,0.15)',
  borderRadius: '12px',
  color: '#9ca3af',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    first_name: '', last_name: '',
    date_of_birth: '', biological_sex: '',
    height_cm: '', weight_kg: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validateStep1 = () => {
    if (!form.first_name || !form.last_name) return 'Please enter your full name.';
    if (!form.email) return 'Email is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!termsAccepted) return 'You must accept the Terms and Conditions.';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await authAPI.register({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        terms_accepted: termsAccepted,
        date_of_birth: form.date_of_birth || null,
        biological_sex: form.biological_sex || '',
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      });
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      const data = err.response?.data;
      setError(data?.email?.[0] || data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020c12 0%, #051a14 50%, #020c12 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
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

        <div style={cardStyle}>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '600',
                  background: step >= s ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
                  color: step >= s ? 'white' : '#6b7280',
                  border: step >= s ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}>
                  {s}
                </div>
                {s < 2 && (
                  <div style={{
                    width: '32px', height: '1px',
                    background: step > s ? '#10b981' : 'rgba(255,255,255,0.1)',
                  }} />
                )}
              </div>
            ))}
            <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '4px' }}>
              {step === 1 ? 'Account Details' : 'Your Profile'}
            </span>
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

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input label="First Name" placeholder="Jane" value={form.first_name} onChange={set('first_name')} required />
                <Input label="Last Name" placeholder="Doe" value={form.last_name} onChange={set('last_name')} required />
              </div>
              <Input label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required />
              <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />

              {/* Terms */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 16px', borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.1)',
              }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <label htmlFor="terms" style={{ fontSize: '13px', color: '#9ca3af', cursor: 'pointer', lineHeight: '1.5' }}>
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setTermsOpen(true)}
                    style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>

              <button style={btnPrimary(false)} onClick={handleNext}>
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '-8px' }}>
                Optional — used to calculate BMI and age on your dashboard.
              </p>
              <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
              <Select
                label="Biological Sex"
                value={form.biological_sex}
                onChange={set('biological_sex')}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                ]}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Input label="Height (cm)" type="number" placeholder="170" value={form.height_cm} onChange={set('height_cm')} />
                <Input label="Weight (kg)" type="number" placeholder="70" value={form.weight_kg} onChange={set('weight_kg')} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button style={btnSecondary} onClick={() => setStep(1)}>Back</button>
                <button style={btnPrimary(loading)} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '24px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#10b981', fontWeight: '600', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#374151', marginTop: '20px' }}>
          Based on the Consensus Sleep Diary — Modified (CSD-M)
        </p>
      </div>

      {/* Terms Modal */}
      {termsOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setTermsOpen(false)} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: '560px',
            background: '#0f1e18', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '20px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid rgba(16,185,129,0.1)',
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f0fdf4' }}>Terms and Conditions</h2>
              <button onClick={() => setTermsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '24px' }}>
              <pre style={{ fontSize: '13px', color: '#9ca3af', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.7' }}>
                {TERMS_TEXT}
              </pre>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(16,185,129,0.1)' }}>
              <button
                style={btnPrimary(false)}
                onClick={() => { setTermsAccepted(true); setTermsOpen(false); }}
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}