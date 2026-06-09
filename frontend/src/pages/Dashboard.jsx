import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { diaryAPI } from '../utils/api';
import { formatMinutes, getSEColor, getSEStatus, FORMULA_DESCRIPTIONS } from '../utils/sleepMath';
import Tooltip from '../components/ui/Tooltip';
import { Plus, TrendingUp, Clock, Zap, Moon, Activity } from 'lucide-react';

function MetricCard({ label, value, sub, color, formula, icon: Icon }) {
  return (
    <div style={{
      background: 'rgba(15, 30, 24, 0.6)',
      border: '1px solid rgba(16,185,129,0.12)',
      borderRadius: '16px', padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} color={color} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </span>
        </div>
        {formula && <Tooltip text={formula} />}
      </div>
      <div>
        <span style={{ fontSize: '28px', fontWeight: '700', color: color || '#f0fdf4', letterSpacing: '-0.5px' }}>
          {value ?? '—'}
        </span>
        {sub && (
          <span style={{ fontSize: '12px', color: '#4b5563', marginLeft: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px', display: 'inline-block', verticalAlign: 'middle' }}>{sub}</span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    diaryAPI.getDashboard(days)
      .then((res) => {
        setStats(res.data.stats);
        setTrendData(res.data.trend_data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const profile = user?.profile;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const seColor = getSEColor(stats?.avg_sleep_efficiency);

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: '1100px', width: '100%', overflowX: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f0fdf4', marginBottom: '4px' }}>
            {greeting()}, {user?.first_name} 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => navigate(`/entry/${new Date().toISOString().split('T')[0]}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', color: 'white', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
          }}
        >
          <Plus size={16} />
          Log Today's Sleep
        </button>
      </div>

      {/* BMI + Profile strip */}
      {profile?.bmi && (
        <div style={{
          background: 'rgba(15,30,24,0.4)', border: '1px solid rgba(16,185,129,0.1)',
          borderRadius: '14px', padding: '14px 20px', marginBottom: '24px',
          display: 'flex', gap: '28px', flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[
            { label: 'BMI', value: profile.bmi, sub: profile.bmi_category },
            { label: 'Age', value: profile.age ? `${profile.age} yrs` : '—' },
            { label: 'Height', value: profile.height_cm ? `${profile.height_cm} cm` : '—' },
            { label: 'Weight', value: profile.weight_kg ? `${profile.weight_kg} kg` : '—' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</p>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#d1fae5' }}>
                {value} {sub && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>({sub})</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Day range toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
              border: days === d ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.06)',
              background: days === d ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: days === d ? '#10b981' : '#6b7280',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            {d}d
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <p style={{ color: '#4b5563' }}>Loading your sleep data...</p>
        </div>
      ) : stats?.total_entries === 0 ? (
        <div style={{
          background: 'rgba(15,30,24,0.4)', border: '1px solid rgba(16,185,129,0.1)',
          borderRadius: '16px', padding: '48px', textAlign: 'center',
        }}>
          <Moon size={40} color="#10b981" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f0fdf4', marginBottom: '8px' }}>No entries yet</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
            Start logging your sleep to see your metrics here.
          </p>
          <button
            onClick={() => navigate(`/entry/${new Date().toISOString().split('T')[0]}`)}
            style={{
              padding: '12px 24px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', color: 'white', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Log your first night
          </button>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px', marginBottom: '24px',
          }}>
            <MetricCard
              label="Sleep Efficiency"
              value={stats?.avg_sleep_efficiency ? `${stats.avg_sleep_efficiency}%` : '—'}
              sub={getSEStatus(stats?.avg_sleep_efficiency)}
              color={seColor}
              formula={FORMULA_DESCRIPTIONS.sleep_efficiency}
              icon={Activity}
            />
            <MetricCard
              label="Total Sleep Time"
              value={stats?.avg_tst_min ? formatMinutes(Math.round(stats.avg_tst_min)) : '—'}
              sub="avg per night"
              color="#818cf8"
              formula={FORMULA_DESCRIPTIONS.tst}
              icon={Clock}
            />
            <MetricCard
              label="Sleep Latency"
              value={stats?.avg_sleep_latency ? `${Math.round(stats.avg_sleep_latency)} min` : '—'}
              sub="to fall asleep"
              color="#f59e0b"
              formula={FORMULA_DESCRIPTIONS.sleep_latency}
              icon={Zap}
            />
            <MetricCard
              label="Nights Logged"
              value={stats?.total_entries ?? '—'}
              sub={`last ${days} days`}
              color="#10b981"
              icon={TrendingUp}
            />
          </div>

          {/* Trend table */}
          {trendData.length > 0 && (
            <div style={{
              background: 'rgba(15,30,24,0.6)', border: '1px solid rgba(16,185,129,0.12)',
              borderRadius: '16px', overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#d1fae5' }}>Recent Nights</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      {['Date', 'TST', 'TIB', 'SE %', 'Latency', 'Caffeine', 'Alcohol'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#4b5563', fontWeight: '500', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...trendData].reverse().map((entry) => (
                      <tr key={entry.date} style={{ borderTop: '1px solid rgba(16,185,129,0.05)' }}>
                        <td style={{ padding: '10px 16px', color: '#d1fae5', fontWeight: '500', whiteSpace: 'nowrap' }}>
                          {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#9ca3af' }}>{entry.tst_min ? formatMinutes(entry.tst_min) : '—'}</td>
                        <td style={{ padding: '10px 16px', color: '#9ca3af' }}>{entry.tib_min ? formatMinutes(entry.tib_min) : '—'}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ color: getSEColor(entry.sleep_efficiency), fontWeight: '600' }}>
                            {entry.sleep_efficiency ? `${entry.sleep_efficiency}%` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', color: '#9ca3af' }}>{entry.sleep_latency != null ? `${entry.sleep_latency} min` : '—'}</td>
                        <td style={{ padding: '10px 16px', color: '#9ca3af' }}>{entry.caffeine_count ?? '—'}</td>
                        <td style={{ padding: '10px 16px', color: '#9ca3af' }}>{entry.alcohol_count ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}