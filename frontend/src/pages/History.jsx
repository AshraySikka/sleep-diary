import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diaryAPI } from '../utils/api';
import { formatMinutes, getSEColor, getSEStatus } from '../utils/sleepMath';
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const qualityLabels = { 1: 'Very Poor', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Very Good' };
const restLabels = { 1: 'Not at all', 2: 'Slightly', 3: 'Somewhat', 4: 'Well-rested', 5: 'Very well' };

function EntryRow({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const seColor = getSEColor(entry.sleep_efficiency);

  const fmt = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${period}`;
  };

  return (
    <div style={{
      background: 'rgba(15,30,24,0.5)',
      border: '1px solid rgba(16,185,129,0.1)',
      borderRadius: '14px', overflow: 'hidden', marginBottom: '10px',
    }}>
      {/* Summary row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 18px', flexWrap: 'wrap',
      }}>
        {/* Date */}
        <div style={{ minWidth: '110px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#d1fae5' }}>
            {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p style={{ fontSize: '11px', color: '#4b5563' }}>{entry.date}</p>
        </div>

        {/* Key metrics */}
        <div style={{ display: 'flex', gap: '20px', flex: 1, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TST</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#818cf8' }}>
              {entry.tst_min ? formatMinutes(entry.tst_min) : '—'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TIB</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
              {entry.tib_min ? formatMinutes(entry.tib_min) : '—'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SE</p>
            <p style={{ fontSize: '14px', fontWeight: '600', color: seColor }}>
              {entry.sleep_efficiency ? `${parseFloat(entry.sleep_efficiency).toFixed(1)}%` : '—'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quality</p>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {qualityLabels[entry.q9_sleep_quality] || '—'}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</p>
            <span style={{
              fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '6px',
              background: entry.is_complete ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
              color: entry.is_complete ? '#10b981' : '#4b5563',
              border: entry.is_complete ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.05)',
            }}>
              {entry.is_complete ? '✓ Complete' : 'Partial'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => navigate(`/entry/${entry.date}`)}
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#10b981', display: 'flex', alignItems: 'center' }}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(entry.date)}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center' }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '16px 18px', borderTop: '1px solid rgba(16,185,129,0.08)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Bed Time (Q1)', value: fmt(entry.q1_bed_time) },
              { label: 'Sleep Attempt (Q2)', value: fmt(entry.q2_sleep_attempt_time) },
              { label: 'Sleep Latency (Q3)', value: entry.q3_sleep_latency_min != null ? `${entry.q3_sleep_latency_min} min` : '—' },
              { label: 'Awakenings (Q4)', value: entry.q4_awakening_count != null ? entry.q4_awakening_count : '—' },
              { label: 'WASO (Q5)', value: entry.q5_waso_min != null ? `${entry.q5_waso_min} min` : '—' },
              { label: 'Final Awakening (Q6a)', value: fmt(entry.q6a_final_awakening_time) },
              { label: 'Post-Awake Bed (Q6b)', value: entry.q6b_post_awakening_bed_min != null ? `${entry.q6b_post_awakening_bed_min} min` : '—' },
              { label: 'Early Awakening (Q6c)', value: entry.q6c_early_awakening === true ? 'Yes' : entry.q6c_early_awakening === false ? 'No' : '—' },
              { label: 'Earlier By (Q6d)', value: entry.q6d_early_awakening_min != null ? `${entry.q6d_early_awakening_min} min` : 'N/A' },
              { label: 'Out of Bed (Q7)', value: fmt(entry.q7_out_of_bed_time) },
              { label: 'Sleep Quality (Q9)', value: qualityLabels[entry.q9_sleep_quality] || '—' },
              { label: 'Restfulness (Q10)', value: restLabels[entry.q10_restfulness] || '—' },
              { label: 'Nap Count (Q11a)', value: entry.q11a_nap_count != null ? entry.q11a_nap_count : '—' },
              { label: 'Nap Duration (Q11b)', value: entry.q11b_nap_duration_min != null ? `${entry.q11b_nap_duration_min} min` : 'N/A' },
              { label: 'Alcohol (Q12a)', value: entry.q12a_alcohol_count != null ? entry.q12a_alcohol_count : '—' },
              { label: 'Last Alcohol (Q12b)', value: fmt(entry.q12b_alcohol_last_time) },
              { label: 'Caffeine (Q13a)', value: entry.q13a_caffeine_count != null ? entry.q13a_caffeine_count : '—' },
              { label: 'Last Caffeine (Q13b)', value: fmt(entry.q13b_caffeine_last_time) },
              { label: 'Medication (Q14a)', value: entry.q14a_medication_taken === true ? 'Yes' : entry.q14a_medication_taken === false ? 'No' : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</p>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>{value}</p>
              </div>
            ))}
          </div>
          {entry.q14b_medication_details && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Medication Details (Q14b)</p>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>{entry.q14b_medication_details}</p>
            </div>
          )}
          {entry.q15_comments && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Comments (Q15)</p>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>{entry.q15_comments}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const fetchEntries = () => {
    setLoading(true);
    const params = filter === 'all' ? {} : { days: parseInt(filter) };
    diaryAPI.getEntries(params)
      .then((res) => setEntries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEntries(); }, [filter]);

  const handleDelete = async (date) => {
    if (!window.confirm(`Delete entry for ${date}?`)) return;
    try {
      await diaryAPI.deleteEntry(date);
      setEntries(entries.filter((e) => e.date !== date));
    } catch {
      alert('Failed to delete entry.');
    }
  };

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: '900px', width: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4' }}>History</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>{entries.length} entries total</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { value: '7', label: '7d' },
            { value: '30', label: '30d' },
            { value: '90', label: '90d' },
            { value: 'all', label: 'All' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                border: filter === value ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)',
                background: filter === value ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: filter === value ? '#10b981' : '#6b7280',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#4b5563' }}>Loading entries...</div>
      ) : entries.length === 0 ? (
        <div style={{
          background: 'rgba(15,30,24,0.4)', border: '1px solid rgba(16,185,129,0.1)',
          borderRadius: '16px', padding: '48px', textAlign: 'center',
        }}>
          <p style={{ color: '#4b5563', marginBottom: '16px' }}>No entries found for this period.</p>
          <button
            onClick={() => navigate(`/entry/${new Date().toISOString().split('T')[0]}`)}
            style={{ padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Log today's sleep
          </button>
        </div>
      ) : (
        <div>
          {entries.map((entry) => (
            <EntryRow key={entry.date} entry={entry} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}