import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Layers, LayoutGrid, BookOpen, GitBranch, Clock, Users, Database,
  LogOut, ChevronRight, Palette, Check, X
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/app-groups', icon: Layers, label: 'Application Groups' },
  { to: '/applications', icon: LayoutGrid, label: 'Applications' },
  { to: '/documentations', icon: BookOpen, label: 'Documentations' },
  { to: '/source-codes', icon: GitBranch, label: 'Source Codes' },
  { to: '/backlogs', icon: Clock, label: 'Backlogs' },
];
const adminItems = [
  { to: '/admin', icon: Users, label: 'User Management' },
  { to: '/master', icon: Database, label: 'Master Data' },
];

const THEMES = [
  {
    id: 'dark',
    name: 'Midnight',
    description: 'Deep dark blue',
    preview: ['#080b12', '#7c8dff', '#141826'],
  },
  {
    id: 'white',
    name: 'White',
    description: 'Pure clean white',
    preview: ['#f7f8fc', '#3b5bdb', '#ffffff'],
  },
  {
    id: 'silver',
    name: 'Silver',
    description: 'Neutral grey',
    preview: ['#e4e8ed', '#4a5568', '#f2f4f7'],
  },
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Deep red drama',
    preview: ['#0f0609', '#ff3a5e', '#1c0910'],
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft white & red',
    preview: ['#fdf7f8', '#e03131', '#ffffff'],
  },
  {
    id: 'light',
    name: 'Indigo',
    description: 'Light with indigo',
    preview: ['#eef1f8', '#4f62ff', '#ffffff'],
  },
];

export default function Layout() {
  const { user, logout, updateTheme } = useAuth();
  const { confirm } = useUI();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const themePickerRef = useRef(null);
  const location = useLocation();

  const currentTheme = user?.theme || 'dark';

  useEffect(() => {
    const handler = (e) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target)) {
        setThemePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    const confirmed = await confirm('Logout', 'Apakah Anda yakin ingin keluar?', 'danger');
    if (confirmed) logout();
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const activeThemeDef = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  // Breadcrumb label
  const crumbLabel = location.pathname === '/'
    ? 'Dashboard'
    : location.pathname.split('/').filter(Boolean).map(s =>
        s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      ).join(' › ');

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(6px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Layers size={18} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">AppCatalog</div>
            <div className="sidebar-logo-sub">Application Registry</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'Admin' && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 'var(--space-4)' }}>Admin</div>
              {adminItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={17} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.picture ? <img src={user.picture} alt={user?.name} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button
            className="icon-btn"
            style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}
            title="Logout"
            onClick={handleLogout}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>AppCatalog</span>
            {location.pathname !== '/' && (
              <>
                <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {crumbLabel}
                </span>
              </>
            )}
          </div>

          {/* Theme picker */}
          <div ref={themePickerRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setThemePickerOpen(!themePickerOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-medium)',
                backdropFilter: 'blur(12px)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                fontSize: '0.8125rem', fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                {activeThemeDef.preview.map((c, i) => (
                  <div key={i} style={{
                    width: 9, height: 9, borderRadius: '50%', background: c,
                    border: '1px solid rgba(128,128,128,0.3)',
                    flexShrink: 0,
                  }} />
                ))}
              </div>
              <Palette size={13} />
              <span>{activeThemeDef.name}</span>
            </button>

            <AnimatePresence>
              {themePickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '14px',
                    zIndex: 1000,
                    minWidth: '240px',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div style={{
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                    padding: '0 6px 10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)', marginBottom: '10px',
                  }}>
                    <span>Choose Theme</span>
                    <button
                      onClick={() => setThemePickerOpen(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '2px' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {THEMES.map(theme => {
                      const isActive = currentTheme === theme.id;
                      return (
                        <motion.button
                          key={theme.id}
                          onClick={() => { updateTheme(theme.id); setThemePickerOpen(false); }}
                          whileHover={{ scale: 1.03, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
                            padding: '10px 11px', borderRadius: '8px', cursor: 'pointer',
                            border: isActive ? '1.5px solid var(--border-active)' : '1.5px solid transparent',
                            background: isActive ? 'var(--bg-glass)' : 'var(--bg-hover)',
                            transition: 'all 0.15s',
                            position: 'relative',
                            textAlign: 'left',
                          }}
                        >
                          {/* Color swatches */}
                          <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                            {theme.preview.map((c, i) => (
                              <div key={i} style={{
                                flex: 1, height: 24, borderRadius: 'var(--radius-sm)', background: c,
                                border: '1px solid rgba(128,128,128,0.2)',
                              }} />
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{theme.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{theme.description}</div>
                          </div>
                          {isActive && (
                            <div style={{
                              position: 'absolute', top: 7, right: 7,
                              background: 'var(--gradient-brand)',
                              borderRadius: '50%', width: 17, height: 17,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 6px var(--accent-glow)',
                            }}>
                              <Check size={10} color="white" strokeWidth={3} />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
