import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Layers, Users, Database,
  LogOut, ChevronRight, Palette, Check, X
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/app-groups', icon: Layers, label: 'Application Groups' },
];
const adminItems = [
  { to: '/admin', icon: Users, label: 'User Management' },
  { to: '/master', icon: Database, label: 'Master Data' },
];

const THEMES = [
  {
    id: 'dark',
    name: 'Midnight',
    description: 'Dark blue-grey',
    preview: ['#0d0f14', '#7c8dff', '#13161e'],
  },
  {
    id: 'white',
    name: 'White',
    description: 'Pure white',
    preview: ['#ffffff', '#3b5bdb', '#fafafa'],
  },
  {
    id: 'silver',
    name: 'Light Grey',
    description: 'Neutral silver',
    preview: ['#e8ecef', '#4a5568', '#f3f5f7'],
  },
  {
    id: 'crimson',
    name: 'Red',
    description: 'Deep crimson',
    preview: ['#180b10', '#ff3a5e', '#240d16'],
  },
  {
    id: 'rose',
    name: 'Rose White',
    description: 'Clean white with red accents',
    preview: ['#ffffff', '#e03131', '#fffafd'],
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

  // Close theme picker on outside click
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

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Layers size={18} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">AppCatalog</div>
            <div className="sidebar-logo-sub">Application Registry</div>
          </div>
        </div>

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
              <item.icon size={18} />
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
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.picture ? <img src={user.picture} alt={user?.name} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            title="Logout"
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            <span>AppCatalog</span>
            {location.pathname !== '/' && (
              <>
                <ChevronRight size={14} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {location.pathname.replace('/', '').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Dashboard'}
                </span>
              </>
            )}
          </div>

          {/* Theme picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div ref={themePickerRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setThemePickerOpen(!themePickerOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 14px', borderRadius: '10px',
                  background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  fontSize: '1rem', fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                {/* Mini theme preview dots */}
                <div style={{ display: 'flex', gap: '3px' }}>
                  {activeThemeDef.preview.map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.2)' }} />
                  ))}
                </div>
                <Palette size={14} />
                <span>{activeThemeDef.name}</span>
              </button>

              <AnimatePresence>
                {themePickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
                      padding: '12px',
                      zIndex: 1000,
                      minWidth: '220px'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Choose Theme</span>
                      <button onClick={() => setThemePickerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={14}/></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {THEMES.map(theme => {
                        const isActive = currentTheme === theme.id;
                        return (
                          <motion.button
                            key={theme.id}
                            onClick={() => { updateTheme(theme.id); setThemePickerOpen(false); }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
                              padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                              border: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                              background: isActive ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'var(--bg-hover)',
                              transition: 'border-color 0.2s, background 0.2s',
                              position: 'relative'
                            }}
                          >
                            {/* Color preview row */}
                            <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                              {theme.preview.map((c, i) => (
                                <div key={i} style={{ flex: 1, height: 30, borderRadius: '6px', background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                              ))}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{theme.name}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{theme.description}</div>
                            </div>
                            {isActive && (
                              <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent-primary)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={11} color="white" strokeWidth={3}/>
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
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
