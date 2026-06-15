import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { Input, Select } from '../components/ui/Input';
import { User, Bell, Shield, Mail } from 'lucide-react';

const sectionStyle = {
  background: 'rgba(15,30,24,0.6)',
  border: '1px solid rgba(16,185,129,0.12)',
  borderRadius: '16px', padding: '24px', marginBottom: '16px',
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
};

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

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [enableLoading, setEnableLoading] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const [profile, setProfile] = useState({
    date_of_birth: '',
    biological_sex: '',
    height_cm: '',
    weight_kg: '',
    clinician_email: '',
    notification_enabled: false,
    notification_time: '09:00',
  });

  useEffect(() => {
    if (user?.profile) {
      const p = user.profile;
      setProfile({
        date_of_birth: p.date_of_birth || '',
        biological_sex: p.biological_sex || '',
        height_cm: p.height_cm || '',
        weight_kg: p.weight_kg || '',
        clinician_email: p.clinician_email || '',
        notification_enabled: p.notification_enabled ?? false,
        notification_time: p.notification_time || '09:00',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setError(''); setSuccess(''); setSaving(true);
    try {
      let notificationTimeUTC = profile.notification_time;
      if (profile.notification_time) {
        const [hours, minutes] = profile.notification_time.split(':').map(Number);
        const now = new Date();
        now.setHours(hours, minutes, 0, 0);
        const utcHours = String(now.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
        notificationTimeUTC = `${utcHours}:${utcMinutes}`;
      }
      const res = await authAPI.updateProfile({
        ...profile,
        notification_time: notificationTimeUTC,
        height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
        weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
      });
      updateUser(res.data);
      setSuccess('Settings saved successfully.');
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableNotifications = async () => {
    setEnableLoading(true);
    setError('');
    setSuccess('');
    try {
      console.log('Step 1: checking support...');
      console.log('serviceWorker:', 'serviceWorker' in navigator);
      console.log('PushManager:', 'PushManager' in window);
      console.log('Notification:', 'Notification' in window);

      if (!('serviceWorker' in navigator)) {
        setError('Service workers not supported.');
        return;
      }
      if (!('PushManager' in window)) {
        setError('Push not supported. Install app to home screen first.');
        return;
      }

      console.log('Step 2: requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);

      if (permission !== 'granted') {
        setError('Permission denied. Enable in iPhone Settings → Sleep Diary.');
        return;
      }

      console.log('Step 3: fetching VAPID key...');
      const keyRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/vapid-public-key/`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('VAPID key response status:', keyRes.status);
      const { public_key } = await keyRes.json();
      console.log('VAPID public key received:', !!public_key);

      if (!public_key) {
        setError('Push notifications not configured on server.');
        return;
      }

      console.log('Step 4: waiting for service worker...');
      const reg = await navigator.serviceWorker.ready;
      console.log('Service worker state:', reg.active?.state);

      console.log('Step 5: subscribing to push...');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });
      console.log('Subscription created:', JSON.stringify(sub.toJSON()));

      console.log('Step 6: saving subscription to backend...');
      const token = localStorage.getItem('access_token');
      const saveRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/push-subscription/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        }
      );
      const saveData = await saveRes.json();
      console.log('Save result:', saveRes.status, saveData);

      if (!saveRes.ok) {
        setError('Failed to save subscription.');
        return;
      }

      setProfile(prev => ({ ...prev, notification_enabled: true }));
      setSuccess('Notifications enabled! Tap Send Test to verify.');

    } catch (e) {
      console.error('Push subscription error:', e);
      setError(`Failed: ${e.message}`);
    } finally {
      setEnableLoading(false);
    }
  };

  const handleDisableNotifications = () => {
    setProfile(prev => ({ ...prev, notification_enabled: false }));
    setSuccess('Notifications disabled. Save Settings to apply.');
  };

  const handleTestNotification = async () => {
    setTestSending(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications/send-test/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await res.json();
      if (res.ok) setSuccess('Test notification sent! Check your phone.');
      else setError(data.error || 'Failed to send test notification.');
    } catch {
      setError('Failed to send test notification.');
    } finally {
      setTestSending(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    window.location.href = '/login';
  };

  const bmi = profile.height_cm && profile.weight_kg
    ? (parseFloat(profile.weight_kg) / ((parseFloat(profile.height_cm) / 100) ** 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
    : null;

  const bmiColor = bmi
    ? bmi < 18.5 ? '#818cf8' : bmi < 25 ? '#10b981' : bmi < 30 ? '#f59e0b' : '#ef4444'
    : '#6b7280';

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: '680px', width: '100%' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4', marginBottom: '6px' }}>Settings</h1>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>Manage your profile and preferences</p>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '14px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '14px' }}>
          {success}
        </div>
      )}

      {/* Account */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <User size={15} color="#10b981" />
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#d1fae5' }}>Account</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', marginBottom: '4px' }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#f0fdf4' }}>{user?.full_name}</p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>{user?.email}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: user?.is_verified ? '#10b981' : '#f59e0b' }} />
            <span style={{ fontSize: '12px', color: user?.is_verified ? '#10b981' : '#f59e0b' }}>
              {user?.is_verified ? 'Email verified' : 'Email not verified'}
            </span>
          </div>
        </div>
      </div>

      {/* Body metrics */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={15} color="#10b981" />
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#d1fae5' }}>Body Metrics</h2>
          </div>
          {bmi && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#4b5563' }}>BMI</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: bmiColor }}>{bmi}</span>
              <span style={{ fontSize: '11px', color: bmiColor, padding: '2px 8px', borderRadius: '6px', background: `${bmiColor}15`, border: `1px solid ${bmiColor}30` }}>{bmiCategory}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Date of Birth" type="date" value={profile.date_of_birth} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} />
          <Select
            label="Biological Sex"
            value={profile.biological_sex}
            onChange={(e) => setProfile({ ...profile, biological_sex: e.target.value })}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
              { value: 'prefer_not_to_say', label: 'Prefer not to say' },
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="Height (cm)" type="number" placeholder="170" value={profile.height_cm} onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })} />
            <Input label="Weight (kg)" type="number" placeholder="70" value={profile.weight_kg} onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Clinician */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Mail size={15} color="#10b981" />
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#d1fae5' }}>Clinician Email</h2>
        </div>
        <Input
          label="Your doctor or sleep specialist's email"
          type="email"
          placeholder="doctor@clinic.com"
          value={profile.clinician_email}
          onChange={(e) => setProfile({ ...profile, clinician_email: e.target.value })}
          hint="Saved here so you don't have to re-enter it every time you export"
        />
      </div>

      {/* Notifications */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Bell size={15} color="#10b981" />
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#d1fae5' }}>Morning Reminder</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: '12px',
            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.08)',
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '500', color: '#d1fae5', marginBottom: '2px' }}>
                Daily sleep reminder
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                Reminds you to log your sleep each morning
              </p>
            </div>
            <button
              type="button"
              onClick={profile.notification_enabled ? handleDisableNotifications : handleEnableNotifications}
              disabled={enableLoading}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                background: profile.notification_enabled
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(255,255,255,0.1)',
                cursor: enableLoading ? 'not-allowed' : 'pointer',
                position: 'relative', transition: 'background 0.2s ease',
                flexShrink: 0, opacity: enableLoading ? 0.6 : 1,
              }}
            >
              <div style={{
                position: 'absolute', top: '3px',
                left: profile.notification_enabled ? '23px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'white', transition: 'left 0.2s ease',
              }} />
            </button>
          </div>

          {profile.notification_enabled && (
            <Input
              label="Reminder time"
              type="time"
              value={profile.notification_time}
              onChange={(e) => setProfile(prev => ({ ...prev, notification_time: e.target.value }))}
              hint="Your local time — we handle the UTC conversion automatically"
            />
          )}

          {profile.notification_enabled && (
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={testSending}
              style={{
                padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                color: '#10b981', cursor: testSending ? 'not-allowed' : 'pointer',
                width: '100%', opacity: testSending ? 0.6 : 1,
              }}
            >
              {testSending ? 'Sending...' : 'Send Test Notification'}
            </button>
          )}
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px',
          background: saving ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)',
          border: 'none', color: 'white', fontSize: '15px', fontWeight: '600',
          cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 15px rgba(16,185,129,0.25)',
        }}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Terms */}
      <div
        onClick={() => setTermsOpen(true)}
        style={{
          marginTop: '16px', padding: '14px 18px', borderRadius: '12px',
          background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Terms & Conditions</p>
          <p style={{ fontSize: '12px', color: '#374151' }}>
            Accepted on {user?.terms_accepted_at ? new Date(user.terms_accepted_at).toLocaleDateString() : 'signup'}
          </p>
        </div>
        <span style={{ fontSize: '11px', color: '#10b981', padding: '3px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          ✓ View
        </span>
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        style={{
          marginTop: '12px', width: '100%', padding: '14px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontSize: '15px', fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Sign Out
      </button>

      {/* Terms modal */}
      {termsOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setTermsOpen(false)}
          />
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
              <button
                onClick={() => setTermsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '22px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '24px' }}>
              <pre style={{ fontSize: '13px', color: '#9ca3af', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.7' }}>
                {TERMS_TEXT}
              </pre>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(16,185,129,0.1)' }}>
              <button
                onClick={() => setTermsOpen(false)}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', color: 'white', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}