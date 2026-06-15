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

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, currentMonth: false, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, currentMonth: true, dateStr });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, currentMonth: false, dateStr: null });
  }

  const monthName = currentDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 28px)', maxWidth: '900px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0fdf4' }}>Sleep Calendar</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Click any date to add or edit an entry</p>
        </div>
        <button
          onClick={() => navigate(`/entry/${today}`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '20px', flexShrink: 0,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', color: 'white', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={14} /> Log Today
        </button>
      </div>

      {/* Calendar card */}
      <div style={{
        background: 'rgba(15,30,24,0.6)',
        border: '1px solid rgba(16,185,129,0.12)',
        borderRadius: '20px',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Month nav */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(16,185,129,0.08)',
        }}>
          <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={15} />
          </button>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#f0fdf4' }}>{monthName}</h2>
          <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Day headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          borderBottom: '1px solid rgba(16,185,129,0.08)',
          width: '100%',
        }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} style={{ padding: '8px 0', textAlign: 'center', fontSize: '11px', fontWeight: '500', color: '#4b5563' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#4b5563' }}>Loading...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            width: '100%',
          }}>
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
                    minHeight: 'clamp(52px, 12vw, 80px)',
                    padding: '5px 4px',
                    borderTop: '1px solid rgba(16,185,129,0.05)',
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid rgba(16,185,129,0.05)' : 'none',
                    cursor: cell.currentMonth && !isFuture ? 'pointer' : 'default',
                    background: isToday ? 'rgba(16,185,129,0.08)' : 'transparent',
                    transition: 'background 0.15s ease',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
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
                    width: '22px', height: '22px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: isToday ? '700' : '400',
                    color: !cell.currentMonth ? '#1f2937' : isFuture ? '#374151' : isToday ? '#10b981' : '#9ca3af',
                    background: isToday ? 'rgba(16,185,129,0.15)' : 'transparent',
                    border: isToday ? '1px solid rgba(16,185,129,0.3)' : 'none',
                    marginBottom: '3px',
                    flexShrink: 0,
                  }}>
                    {cell.day}
                  </div>

                  {/* Entry indicator */}
                  {entry && (
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '1px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: seColor, flexShrink: 0 }} />
                        <span style={{ fontSize: '9px', color: seColor, fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {entry.sleep_efficiency ? `${Math.round(entry.sleep_efficiency)}%` : ''}
                        </span>
                      </div>
                      {entry.tst_hours && (
                        <div style={{ fontSize: '9px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                          {parseFloat(entry.tst_hours).toFixed(1)}h
                        </div>
                      )}
                      {entry.is_complete && (
                        <div style={{ fontSize: '8px', color: '#10b981' }}>✓</div>
                      )}
                    </div>
                  )}

                  {/* Empty past day */}
                  {!entry && cell.currentMonth && !isFuture && (
                    <div style={{ fontSize: '14px', color: '#1f2937', textAlign: 'center', marginTop: '4px' }}>+</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
        {[
          { color: '#10b981', label: 'SE ≥ 85%' },
          { color: '#f59e0b', label: 'SE 70-84%' },
          { color: '#ef4444', label: 'SE < 70%' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#4b5563' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}