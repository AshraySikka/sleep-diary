import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Calendar, BookOpen,
  History, Download, Settings, LogOut, Moon,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/instructions', icon: BookOpen, label: 'Instructions' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/export', icon: Download, label: 'Export' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isMobile) {
    return (
      <nav style={{
        position: 'fixed', bottom: 0, left: 'env(safe-area-inset-left)', right: 'env(safe-area-inset-right)', zIndex: 40,
        background: 'rgba(5, 20, 14, 0.97)',
        borderTop: '1px solid rgba(16,185,129,0.1)',
        backdropFilter: 'blur(20px)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: 'calc(8px + env(safe-area-inset-bottom)) 0 calc(16px + env(safe-area-inset-bottom))',
      }}>
        {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '6px 12px', borderRadius: '10px',
              fontSize: '10px', fontWeight: '500', textDecoration: 'none',
              color: isActive ? '#10b981' : '#4b5563',
              transition: 'color 0.15s ease',
            })}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: '240px',
      background: 'rgba(5, 20, 14, 0.97)',
      borderRight: '1px solid rgba(16,185,129,0.1)',
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 8px', marginBottom: '32px',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Moon size={16} color="white" />
        </div>
        <span style={{
          fontSize: '16px', fontWeight: '700',
          color: '#f0fdf4', letterSpacing: '-0.3px',
        }}>
          Sleep Diary
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '12px',
              fontSize: '14px', fontWeight: '500',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              background: isActive ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: isActive ? '#10b981' : '#6b7280',
              border: isActive ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
            })}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ borderTop: '1px solid rgba(16,185,129,0.1)', paddingTop: '16px' }}>
        <div style={{ padding: '8px 12px', marginBottom: '4px' }}>
          <p style={{
            fontSize: '13px', fontWeight: '600',
            color: '#d1fae5', marginBottom: '2px',
          }}>
            {user?.full_name || user?.first_name}
          </p>
          <p style={{
            fontSize: '12px', color: '#4b5563',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '12px', width: '100%',
            background: 'transparent', border: '1px solid transparent',
            fontSize: '14px', fontWeight: '500', color: '#6b7280',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f87171';
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}