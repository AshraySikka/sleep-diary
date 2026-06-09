import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { diaryAPI } from '../utils/api';
import { getSEColor } from '../utils/sleepMath';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    setLoading(true);
    diaryAPI.getCalendar(monthStr)
      .then((res) => {
        const map = {};
        res.data.forEach((e) => { map[e.date] = e; });
        setEntries(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [monthStr]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date().toISOString().split('T')[0];

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  // Previous month filler days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, currentMonth: false, dateStr: null });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, currentMonth: true, dateStr });
  }

  // Next month filler
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, currentMonth: false, dateStr: null });
  }

  const monthName = currentDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  const qualityLabels = { 1: 'Very Poor', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Very Good' };

  return (
    <div style={{ padding: 'clamp(12px, 4vw, 28px)', maxWidth: '900px', width: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4' }}>Sleep Calendar</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Click any date to add or edit an entry</p>
        </div>
        <button
          onClick={() => navigate(`/entry/${today}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', color: 'white', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
          }}
        >
          <Plus size={15} /> Log Today
        </button>
      </div>

      {/* Calendar card */}
      <div style={{
        background: 'rgba(15,30,24,0.6)',
        border: '1px solid rgba(16,185,129,0.12)',
        borderRadius: '20px', overflow: 'hidden',
      }}>
        {/* Month nav */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid rgba(16,185,129,0.08)',
        }}>
          <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f0fdf4' }}>{monthName}</h2>
          <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} style={{ padding: '12px 0', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#4b5563' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#4b5563' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((cell, idx) => {
              const entry = cell.dateStr ? entries[cell.dateStr] : null;
              const isToday = cell.dateStr === today;
              const isFuture = cell.dateStr > today;
              const seColor = entry ? getSEColor(entry.sleep_efficiency) : null;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (!cell.currentMonth || isFuture) return;
                    navigate(`/entry/${cell.dateStr}`);
                  }}
                  style={{
                    minHeight: 'clamp(55px, 10vw, 80px)',
                    padding: '8px',
                    borderTop: '1px solid rgba(16,185,129,0.05)',
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid rgba(16,185,129,0.05)' : 'none',
                    cursor: cell.currentMonth && !isFuture ? 'pointer' : 'default',
                    background: isToday ? 'rgba(16,185,129,0.08)' : 'transparent',
                    transition: 'background 0.15s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (cell.currentMonth && !isFuture) e.currentTarget.style.background = 'rgba(16,185,129,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isToday ? 'rgba(16,185,129,0.08)' : 'transparent';
                  }}
                >
                  {/* Day number */}
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: isToday ? '700' : '400',
                    color: !cell.currentMonth ? '#1f2937' : isFuture ? '#374151' : isToday ? '#10b981' : '#9ca3af',
                    background: isToday ? 'rgba(16,185,129,0.15)' : 'transparent',
                    border: isToday ? '1px solid rgba(16,185,129,0.3)' : 'none',
                    marginBottom: '4px',
                  }}>
                    {cell.day}
                  </div>

                  {/* Entry indicator */}
                  {entry && (
                    <div>
                      {/* SE dot */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: seColor, flexShrink: 0 }} />
                        <span style={{ fontSize: '10px', color: seColor, fontWeight: '600' }}>
                          {entry.sleep_efficiency ? `${Math.round(entry.sleep_efficiency)}%` : ''}
                        </span>
                      </div>
                      {/* TST */}
                      {entry.tst_hours && (
                        <div style={{ fontSize: '10px', color: '#4b5563' }}>
                          {parseFloat(entry.tst_hours).toFixed(1)}h sleep
                        </div>
                      )}
                      {/* Complete badge */}
                      {entry.is_complete && (
                        <div style={{ fontSize: '9px', color: '#10b981', marginTop: '2px' }}>✓ complete</div>
                      )}
                    </div>
                  )}

                  {/* Empty past day — show + */}
                  {!entry && cell.currentMonth && !isFuture && (
                    <div style={{ fontSize: '16px', color: '#1f2937', textAlign: 'center', marginTop: '8px' }}>+</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
        {[
          { color: '#10b981', label: 'SE ≥ 85% (Healthy)' },
          { color: '#f59e0b', label: 'SE 70–84% (Fair)' },
          { color: '#ef4444', label: 'SE < 70% (Poor)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '12px', color: '#4b5563' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}