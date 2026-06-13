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

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [enableLoading, setEnableLoading] = useState(false);

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
      const res = await authAPI.updateProfile({
        ...profile,
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
      if (!('serviceWorker' in navigator)) {
        setError('Service workers are not supported on this browser.');
        return;
      }
      if (!('PushManager' in window)) {
        setError('Push notifications are not supported. Make sure the app is installed to your home screen.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Permission denied. Enable notifications in iPhone Settings → Sleep Diary.');
        return;
      }
      const keyRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/vapid-public-key/`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!keyRes.ok) { setError('Failed to get notification config from server.'); return; }
      const { public_key } = await keyRes.json();
      if (!public_key) { setError('Push notifications not configured on server yet.'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });
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
      if (!saveRes.ok) { setError('Failed to save notification subscription.'); return; }
      setProfile(prev => ({ ...prev, notification_enabled: true }));
      setSuccess('Notifications enabled! Tap Send Test Notification to verify.');
    } catch (e) {
      setError(`Failed to enable notifications: ${e.message}`);
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

          {/* Toggle row */}
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
            {/* Toggle button — only changes enabled/disabled state */}
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

          {/* Reminder time — only shown when enabled */}
          {profile.notification_enabled && (
            <Input
              label="Reminder time"
              type="time"
              value={profile.notification_time}
              onChange={(e) => setProfile(prev => ({ ...prev, notification_time: e.target.value }))}
              hint="We'll remind you to fill in your diary at this time each morning"
            />
          )}

          {/* Test notification button — completely separate from toggle */}
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
      <div style={{ marginTop: '16px', padding: '14px 18px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Terms & Conditions</p>
          <p style={{ fontSize: '12px', color: '#374151' }}>
            Accepted on {user?.terms_accepted_at ? new Date(user.terms_accepted_at).toLocaleDateString() : 'signup'}
          </p>
        </div>
        <span style={{ fontSize: '11px', color: '#10b981', padding: '3px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          ✓ Accepted
        </span>
      </div>
    </div>
  );
}