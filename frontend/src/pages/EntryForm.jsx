import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { diaryAPI } from '../utils/api';
import { Input, Select, Textarea } from '../components/ui/Input';
import { computeTST, computeTIB, computeSleepEfficiency, formatMinutes, getSEColor } from '../utils/sleepMath';
import { Save, Trash2, ChevronLeft, ChevronRight, Moon, Sun, Coffee, Wine, Pill, Info } from 'lucide-react';

// ── Styles ──────────────────────────────────────────────────────────────
const sectionStyle = {
  background: 'rgba(15,30,24,0.6)',
  border: '1px solid rgba(16,185,129,0.12)',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '20px',
};

const LiveMetric = ({ label, value, color }) => (
  <div style={{
    background: 'rgba(0,0,0,0.2)', border: `1px solid ${color}25`,
    borderRadius: '12px', padding: '12px 16px', textAlign: 'center', flex: 1,
  }}>
    <p style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</p>
    <p style={{ fontSize: '20px', fontWeight: '700', color }}>{value || '—'}</p>
  </div>
);

// ── Wizard steps for mobile ──────────────────────────────────────────────
const STEPS = [
  { title: 'Bed & Sleep Time', icon: '🛏️' },
  { title: 'Night Awakenings', icon: '🌙' },
  { title: 'Morning Details', icon: '☀️' },
  { title: 'Sleep Quality', icon: '⭐' },
  { title: 'Naps & Alcohol', icon: '🥂' },
  { title: 'Caffeine & Meds', icon: '☕' },
  { title: 'Comments', icon: '📝' },
];

export default function EntryForm() {
  const { date } = useParams();
  const navigate = useNavigate();
  const today = date || new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const [form, setForm] = useState({
    date: today,
    q1_bed_time: '', q2_sleep_attempt_time: '',
    q3_sleep_latency_min: '', q4_awakening_count: '',
    q5_waso_min: '', q6a_final_awakening_time: '',
    q6b_post_awakening_bed_min: '', q6c_early_awakening: '',
    q6d_early_awakening_min: '', q7_out_of_bed_time: '',
    q9_sleep_quality: '', q10_restfulness: '',
    q11a_nap_count: '', q11b_nap_duration_min: '',
    q12a_alcohol_count: '', q12b_alcohol_last_time: '',
    q13a_caffeine_count: '', q13b_caffeine_last_time: '',
    q14a_medication_taken: '', q14b_medication_details: '',
    q15_comments: '', is_complete: false,
  });

  useEffect(() => {
    setLoading(true);
    diaryAPI.getEntry(today)
      .then((res) => {
        const d = res.data;
        setIsExisting(true);
        setForm({
          date: d.date,
          q1_bed_time: d.q1_bed_time || '',
          q2_sleep_attempt_time: d.q2_sleep_attempt_time || '',
          q3_sleep_latency_min: d.q3_sleep_latency_min ?? '',
          q4_awakening_count: d.q4_awakening_count ?? '',
          q5_waso_min: d.q5_waso_min ?? '',
          q6a_final_awakening_time: d.q6a_final_awakening_time || '',
          q6b_post_awakening_bed_min: d.q6b_post_awakening_bed_min ?? '',
          q6c_early_awakening: d.q6c_early_awakening === true ? 'true' : d.q6c_early_awakening === false ? 'false' : '',
          q6d_early_awakening_min: d.q6d_early_awakening_min ?? '',
          q7_out_of_bed_time: d.q7_out_of_bed_time || '',
          q9_sleep_quality: d.q9_sleep_quality ?? '',
          q10_restfulness: d.q10_restfulness ?? '',
          q11a_nap_count: d.q11a_nap_count ?? '',
          q11b_nap_duration_min: d.q11b_nap_duration_min ?? '',
          q12a_alcohol_count: d.q12a_alcohol_count ?? '',
          q12b_alcohol_last_time: d.q12b_alcohol_last_time || '',
          q13a_caffeine_count: d.q13a_caffeine_count ?? '',
          q13b_caffeine_last_time: d.q13b_caffeine_last_time || '',
          q14a_medication_taken: d.q14a_medication_taken === true ? 'true' : d.q14a_medication_taken === false ? 'false' : '',
          q14b_medication_details: d.q14b_medication_details || '',
          q15_comments: d.q15_comments || '',
          is_complete: d.is_complete || false,
        });
      })
      .catch(() => setIsExisting(false))
      .finally(() => setLoading(false));
  }, [today]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const tst = computeTST(form.q2_sleep_attempt_time, form.q6a_final_awakening_time, parseInt(form.q3_sleep_latency_min) || 0, parseInt(form.q5_waso_min) || 0);
  const tib = computeTIB(form.q2_sleep_attempt_time, form.q7_out_of_bed_time);
  const se = computeSleepEfficiency(tst, tib);

  const buildPayload = () => ({
    date: form.date,
    q1_bed_time: form.q1_bed_time || null,
    q2_sleep_attempt_time: form.q2_sleep_attempt_time || null,
    q3_sleep_latency_min: form.q3_sleep_latency_min !== '' ? parseInt(form.q3_sleep_latency_min) : null,
    q4_awakening_count: form.q4_awakening_count !== '' ? parseInt(form.q4_awakening_count) : null,
    q5_waso_min: form.q5_waso_min !== '' ? parseInt(form.q5_waso_min) : null,
    q6a_final_awakening_time: form.q6a_final_awakening_time || null,
    q6b_post_awakening_bed_min: form.q6b_post_awakening_bed_min !== '' ? parseInt(form.q6b_post_awakening_bed_min) : null,
    q6c_early_awakening: form.q6c_early_awakening === 'true' ? true : form.q6c_early_awakening === 'false' ? false : null,
    q6d_early_awakening_min: form.q6c_early_awakening === 'true' && form.q6d_early_awakening_min !== '' ? parseInt(form.q6d_early_awakening_min) : null,
    q7_out_of_bed_time: form.q7_out_of_bed_time || null,
    q9_sleep_quality: form.q9_sleep_quality !== '' ? parseInt(form.q9_sleep_quality) : null,
    q10_restfulness: form.q10_restfulness !== '' ? parseInt(form.q10_restfulness) : null,
    q11a_nap_count: form.q11a_nap_count !== '' ? parseInt(form.q11a_nap_count) : null,
    q11b_nap_duration_min: parseInt(form.q11a_nap_count) > 0 && form.q11b_nap_duration_min !== '' ? parseInt(form.q11b_nap_duration_min) : null,
    q12a_alcohol_count: form.q12a_alcohol_count !== '' ? parseInt(form.q12a_alcohol_count) : null,
    q12b_alcohol_last_time: parseInt(form.q12a_alcohol_count) > 0 ? form.q12b_alcohol_last_time || null : null,
    q13a_caffeine_count: form.q13a_caffeine_count !== '' ? parseInt(form.q13a_caffeine_count) : null,
    q13b_caffeine_last_time: parseInt(form.q13a_caffeine_count) > 0 ? form.q13b_caffeine_last_time || null : null,
    q14a_medication_taken: form.q14a_medication_taken === 'true' ? true : form.q14a_medication_taken === 'false' ? false : null,
    q14b_medication_details: form.q14a_medication_taken === 'true' ? form.q14b_medication_details : '',
    q15_comments: form.q15_comments || '',
    is_complete: form.is_complete,
  });

  const handleSave = async () => {
    setError(''); setSuccess(''); setSaving(true);
    try {
      const payload = buildPayload();
      if (isExisting) {
        await diaryAPI.updateEntry(today, payload);
      } else {
        await diaryAPI.createEntry(payload);
        setIsExisting(true);
      }
      setSuccess('Entry saved!');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await diaryAPI.deleteEntry(today);
      navigate('/calendar');
    } catch {
      setError('Failed to delete entry.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: '#4b5563' }}>Loading...</p>
    </div>
  );

  // ── Wizard step content ────────────────────────────────────────────────
  const renderStep = (s) => {
    switch (s) {
      case 0: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '280px', boxSizing: 'border-box' }}>
          <Input label="Q1. What time did you get into bed?" type="time" value={form.q1_bed_time} onChange={set('q1_bed_time')} />
          <Input label="Q2. What time did you try to go to sleep?" type="time" value={form.q2_sleep_attempt_time} onChange={set('q2_sleep_attempt_time')} hint="This may be different from when you got into bed" />
        </div>
      );
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '280px', boxSizing: 'border-box' }}>
          <Input label="Q3. How long did it take to fall asleep? (minutes)" type="number" min="0" placeholder="e.g. 20" value={form.q3_sleep_latency_min} onChange={set('q3_sleep_latency_min')} hint="Give your best estimate — do not watch the clock" />
          <Input label="Q4. How many times did you wake up during the night?" type="number" min="0" placeholder="e.g. 2" value={form.q4_awakening_count} onChange={set('q4_awakening_count')} hint="Not counting your final awakening" />
          <Input label="Q5. Total time spent awake during the night (minutes)" type="number" min="0" placeholder="e.g. 30" value={form.q5_waso_min} onChange={set('q5_waso_min')} hint="Add up all your mid-night awakenings" />
        </div>
      );
      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '280px', boxSizing: 'border-box' }}>
          <Input label="Q6a. What time was your final awakening?" type="time" value={form.q6a_final_awakening_time} onChange={set('q6a_final_awakening_time')} />
          <Input label="Q6b. After final awakening, how long did you stay in bed? (minutes)" type="number" min="0" placeholder="e.g. 15" value={form.q6b_post_awakening_bed_min} onChange={set('q6b_post_awakening_bed_min')} hint="Time spent in bed trying to sleep after final awakening" />
          <Select label="Q6c. Did you wake up earlier than planned?" value={form.q6c_early_awakening} onChange={set('q6c_early_awakening')} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
          {form.q6c_early_awakening === 'true' && (
            <Input label="Q6d. How much earlier did you wake up? (minutes)" type="number" min="0" placeholder="e.g. 45" value={form.q6d_early_awakening_min} onChange={set('q6d_early_awakening_min')} />
          )}
          <Input label="Q7. What time did you get out of bed for the day?" type="time" value={form.q7_out_of_bed_time} onChange={set('q7_out_of_bed_time')} />
        </div>
      );
      case 3: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '280px', boxSizing: 'border-box' }}>
          <Select label="Q9. How would you rate the quality of your sleep?" value={form.q9_sleep_quality} onChange={set('q9_sleep_quality')} options={[{ value: '1', label: 'Very Poor' }, { value: '2', label: 'Poor' }, { value: '3', label: 'Fair' }, { value: '4', label: 'Good' }, { value: '5', label: 'Very Good' }]} />
          <Select label="Q10. How rested did you feel when you woke up?" value={form.q10_restfulness} onChange={set('q10_restfulness')} options={[{ value: '1', label: 'Not at all rested' }, { value: '2', label: 'Slightly rested' }, { value: '3', label: 'Somewhat rested' }, { value: '4', label: 'Well-rested' }, { value: '5', label: 'Very well-rested' }]} />
          {(tst !== null || tib !== null || se !== null) && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <LiveMetric label="TST" value={tst !== null ? formatMinutes(tst) : null} color="#818cf8" />
              <LiveMetric label="TIB" value={tib !== null ? formatMinutes(tib) : null} color="#10b981" />
              <LiveMetric label="SE" value={se !== null ? `${se}%` : null} color={getSEColor(se)} />
            </div>
          )}
        </div>
      );
      case 4: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '280px', boxSizing: 'border-box' }}>
          <Input label="Q11a. How many times did you nap or doze?" type="number" min="0" placeholder="0" value={form.q11a_nap_count} onChange={set('q11a_nap_count')} />
          {parseInt(form.q11a_nap_count) > 0 && (
            <Input label="Q11b. Total nap duration (minutes)" type="number" min="0" placeholder="e.g. 40" value={form.q11b_nap_duration_min} onChange={set('q11b_nap_duration_min')} hint="1 nap of 30 min + 1 nap of 10 min = 40 min" />
          )}
          <Input label="Q12a. How many alcoholic drinks did you have?" type="number" min="0" placeholder="0" value={form.q12a_alcohol_count} onChange={set('q12a_alcohol_count')} hint="1 drink = 12oz beer, 5oz wine, or 1.5oz liquor" />
          {parseInt(form.q12a_alcohol_count) > 0 && (
            <Input label="Q12b. What time was your last alcoholic drink?" type="time" value={form.q12b_alcohol_last_time} onChange={set('q12b_alcohol_last_time')} />
          )}
        </div>
      );
      case 5: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '280px', boxSizing: 'border-box' }}>
          <Input label="Q13a. How many caffeinated drinks did you have?" type="number" min="0" placeholder="0" value={form.q13a_caffeine_count} onChange={set('q13a_caffeine_count')} hint="Coffee, tea, soda, energy drinks — 1 drink = 6–8oz" />
          {parseInt(form.q13a_caffeine_count) > 0 && (
            <Input label="Q13b. What time was your last caffeinated drink?" type="time" value={form.q13b_caffeine_last_time} onChange={set('q13b_caffeine_last_time')} />
          )}
          <Select label="Q14a. Did you take any medication to help you sleep?" value={form.q14a_medication_taken} onChange={set('q14a_medication_taken')} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
          {form.q14a_medication_taken === 'true' && (
            <Textarea label="Q14b. List medication(s), dose, and time taken" placeholder="e.g. Sleepwell 50mg 11pm" value={form.q14b_medication_details} onChange={set('q14b_medication_details')} rows={2} />
          )}
        </div>
      );
      case 6: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '280px', boxSizing: 'border-box' }}>
          <Textarea label="Q15. Comments (optional)" placeholder="Note any unusual events — illness, stress, travel, etc." value={form.q15_comments} onChange={set('q15_comments')} rows={4} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px', borderRadius: '12px',
            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.1)',
          }}>
            <input type="checkbox" id="is_complete" checked={form.is_complete} onChange={(e) => setForm({ ...form, is_complete: e.target.checked })} style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }} />
            <label htmlFor="is_complete" style={{ fontSize: '13px', color: '#9ca3af', cursor: 'pointer' }}>Mark this entry as complete for the day</label>
          </div>
        </div>
      );
      default: return null;
    }
  };

  // ── Shared header ──────────────────────────────────────────────────────
const Header = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', padding: 0, marginBottom: '6px' }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4' }}>Sleep Entry</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          {new Date(today + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* New Info Button for Mobile */}
        {isMobile && (
          <button 
            onClick={() => navigate('/instructions')} 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              width: '36px', height: '36px', borderRadius: '50%', 
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', 
              color: '#10b981', cursor: 'pointer' 
            }}
            aria-label="Instructions"
          >
            <Info size={18} />
          </button>
        )}
        
        {isExisting && (
          <button onClick={handleDelete} disabled={deleting} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>
            <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
        <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', background: saving ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.25)' }}>
          <Save size={14} /> {saving ? 'Saving...' : isExisting ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>
    </div>
  );

  const Alerts = () => (
    <>
      {error && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '14px' }}>{error}</div>}
      {success && <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '14px' }}>{success}</div>}
    </>
  );

  // ── MOBILE: Wizard layout ──────────────────────────────────────────────
  if (isMobile) {
    const progress = ((step + 1) / STEPS.length) * 100;
    return (
      <div style={{ padding: '20px 16px 100px' }}>
        <Header />
        <Alerts />

        {/* Progress bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#4b5563' }}>Step {step + 1} of {STEPS.length}</span>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>{STEPS[step].icon} {STEPS[step].title}</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Step card */}
        <div style={sectionStyle}>
          {renderStep(step)}
        </div>

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.15)', color: '#9ca3af', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: saving ? '#065f46' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
              {saving ? 'Saving...' : '✓ Save Entry'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── DESKTOP: Full form layout ──────────────────────────────────────────
  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: '780px', width: '100%' }}>
      <Header />
      <Alerts />

      {/* Live metrics */}
      {(tst !== null || tib !== null || se !== null) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <LiveMetric label="Total Sleep Time" value={tst !== null ? formatMinutes(tst) : null} color="#818cf8" />
          <LiveMetric label="Time in Bed" value={tib !== null ? formatMinutes(tib) : null} color="#10b981" />
          <LiveMetric label="Sleep Efficiency" value={se !== null ? `${se}%` : null} color={getSEColor(se)} />
        </div>
      )}

      {/* Part A */}
      <div style={sectionStyle}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Moon size={16} color="#818cf8" />
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#d1fae5' }}>Part A — Night & Awakening</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#4b5563', marginLeft: '24px' }}>Complete in the morning within 1 hour of waking up</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Q1. What time did you get into bed?" type="time" value={form.q1_bed_time} onChange={set('q1_bed_time')} />
          <Input label="Q2. What time did you try to go to sleep?" type="time" value={form.q2_sleep_attempt_time} onChange={set('q2_sleep_attempt_time')} hint="May differ from when you got into bed" />
          <Input label="Q3. How long did it take to fall asleep? (minutes)" type="number" min="0" placeholder="e.g. 20" value={form.q3_sleep_latency_min} onChange={set('q3_sleep_latency_min')} hint="Best estimate — do not watch the clock" />
          <Input label="Q4. How many times did you wake up during the night?" type="number" min="0" placeholder="e.g. 2" value={form.q4_awakening_count} onChange={set('q4_awakening_count')} hint="Not counting your final awakening" />
          <Input label="Q5. Total time awake during the night (minutes)" type="number" min="0" placeholder="e.g. 30" value={form.q5_waso_min} onChange={set('q5_waso_min')} hint="Add up all mid-night awakenings" />
          <Input label="Q6a. What time was your final awakening?" type="time" value={form.q6a_final_awakening_time} onChange={set('q6a_final_awakening_time')} />
          <Input label="Q6b. After final awakening, how long did you stay in bed? (minutes)" type="number" min="0" placeholder="e.g. 15" value={form.q6b_post_awakening_bed_min} onChange={set('q6b_post_awakening_bed_min')} />
          <Select label="Q6c. Did you wake up earlier than planned?" value={form.q6c_early_awakening} onChange={set('q6c_early_awakening')} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
          {form.q6c_early_awakening === 'true' && (
            <Input label="Q6d. How much earlier did you wake up? (minutes)" type="number" min="0" placeholder="e.g. 45" value={form.q6d_early_awakening_min} onChange={set('q6d_early_awakening_min')} />
          )}
          <Input label="Q7. What time did you get out of bed for the day?" type="time" value={form.q7_out_of_bed_time} onChange={set('q7_out_of_bed_time')} />
          <Select label="Q9. How would you rate the quality of your sleep?" value={form.q9_sleep_quality} onChange={set('q9_sleep_quality')} options={[{ value: '1', label: 'Very Poor' }, { value: '2', label: 'Poor' }, { value: '3', label: 'Fair' }, { value: '4', label: 'Good' }, { value: '5', label: 'Very Good' }]} />
          <Select label="Q10. How rested did you feel when you woke up?" value={form.q10_restfulness} onChange={set('q10_restfulness')} options={[{ value: '1', label: 'Not at all rested' }, { value: '2', label: 'Slightly rested' }, { value: '3', label: 'Somewhat rested' }, { value: '4', label: 'Well-rested' }, { value: '5', label: 'Very well-rested' }]} />
        </div>
      </div>

      {/* Part B */}
      <div style={sectionStyle}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sun size={16} color="#f59e0b" />
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#d1fae5' }}>Part B — Daytime Behaviours</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#4b5563', marginLeft: '24px' }}>Complete in the evening</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Q11a. How many times did you nap or doze?" type="number" min="0" placeholder="0" value={form.q11a_nap_count} onChange={set('q11a_nap_count')} />
          {parseInt(form.q11a_nap_count) > 0 && (
            <Input label="Q11b. Total nap duration (minutes)" type="number" min="0" placeholder="e.g. 40" value={form.q11b_nap_duration_min} onChange={set('q11b_nap_duration_min')} hint="1 nap of 30 min + 1 nap of 10 min = 40 min" />
          )}
          <Input label="Q12a. How many alcoholic drinks did you have?" type="number" min="0" placeholder="0" value={form.q12a_alcohol_count} onChange={set('q12a_alcohol_count')} hint="1 drink = 12oz beer, 5oz wine, or 1.5oz liquor" />
          {parseInt(form.q12a_alcohol_count) > 0 && (
            <Input label="Q12b. What time was your last alcoholic drink?" type="time" value={form.q12b_alcohol_last_time} onChange={set('q12b_alcohol_last_time')} />
          )}
          <Input label="Q13a. How many caffeinated drinks did you have?" type="number" min="0" placeholder="0" value={form.q13a_caffeine_count} onChange={set('q13a_caffeine_count')} hint="Coffee, tea, soda, energy drinks — 1 drink = 6–8oz" />
          {parseInt(form.q13a_caffeine_count) > 0 && (
            <Input label="Q13b. What time was your last caffeinated drink?" type="time" value={form.q13b_caffeine_last_time} onChange={set('q13b_caffeine_last_time')} />
          )}
          <Select label="Q14a. Did you take any medication to help you sleep?" value={form.q14a_medication_taken} onChange={set('q14a_medication_taken')} options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
          {form.q14a_medication_taken === 'true' && (
            <Textarea label="Q14b. List medication(s), dose, and time taken" placeholder="e.g. Sleepwell 50mg 11pm" value={form.q14b_medication_details} onChange={set('q14b_medication_details')} rows={2} />
          )}
          <Textarea label="Q15. Comments (optional)" placeholder="Note any unusual events — illness, stress, travel, etc." value={form.q15_comments} onChange={set('q15_comments')} rows={3} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16,185,129,0.1)' }}>
            <input type="checkbox" id="is_complete" checked={form.is_complete} onChange={(e) => setForm({ ...form, is_complete: e.target.checked })} style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }} />
            <label htmlFor="is_complete" style={{ fontSize: '13px', color: '#9ca3af', cursor: 'pointer' }}>Mark this entry as complete for the day</label>
          </div>
        </div>
      </div>
    </div>
  );
}