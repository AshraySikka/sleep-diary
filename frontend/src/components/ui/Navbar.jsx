import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
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
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'var(--sd-nav)',
        borderTop: '1px solid var(--sd-em-10)',
        backdropFilter: 'blur(20px)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '8px 0 16px',
      }}>
        {[
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/calendar', icon: Calendar, label: 'Calendar' },
        { to: '/history', icon: History, label: 'History' },
        { to: '/export', icon: Download, label: 'Export' },
        { to: '/settings', icon: Settings, label: 'Settings' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '6px 12px', borderRadius: '10px',
              fontSize: '10px', fontWeight: '500', textDecoration: 'none',
              color: isActive ? 'var(--sd-accent)' : 'var(--sd-text-subtle)',
              transition: 'color 0.15s ease',
            })}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <ThemeToggle variant="nav" />
      </nav>
    );
  }

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: '240px',
      background: 'var(--sd-nav)',
      borderRight: '1px solid var(--sd-em-10)',
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
          color: 'var(--sd-text-strong)', letterSpacing: '-0.3px',
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
              background: isActive ? 'var(--sd-em-15)' : 'transparent',
              color: isActive ? 'var(--sd-accent)' : 'var(--sd-text-muted)',
              border: isActive ? '1px solid var(--sd-em-20)' : '1px solid transparent',
            })}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ borderTop: '1px solid var(--sd-em-10)', paddingTop: '16px' }}>
        <div style={{ padding: '8px 12px', marginBottom: '4px' }}>
          <p style={{
            fontSize: '13px', fontWeight: '600',
            color: 'var(--sd-text-heading)', marginBottom: '2px',
          }}>
            {user?.full_name || user?.first_name}
          </p>
          <p style={{
            fontSize: '12px', color: 'var(--sd-text-subtle)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.email}
          </p>
        </div>
        <ThemeToggle variant="row" />
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '12px', width: '100%',
            background: 'transparent', border: '1px solid transparent',
            fontSize: '14px', fontWeight: '500', color: 'var(--sd-text-muted)',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--sd-danger)';
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--sd-text-muted)';
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