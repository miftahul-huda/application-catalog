import { useEffect, useState, useRef } from 'react';
import { Layers, LayoutDashboard, GitBranch, Clock, Users, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

// Animated counter hook
function useCounter(target, duration = 900, enabled = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) { setValue(target); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, enabled]);
  return value;
}

function StatCard({ label, value, icon: Icon, gradient, loading }) {
  const count = useCounter(value, 800, !loading);
  return (
    <div className="stat-card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <div
          style={{
            width: 44, height: 44,
            borderRadius: 'var(--radius-md)',
            background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          }}
        >
          <Icon size={20} color="white" />
        </div>
      </div>
      <div className="stat-value">
        {loading ? (
          <div className="skeleton" style={{ width: 60, height: 38, borderRadius: 6 }} />
        ) : count}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ groups: 0, apps: 0, backlogs: 0 });
  const [recentGroups, setRecentGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [grps, apps, blgs] = await Promise.all([
          api.get('/app-groups'),
          api.get('/apps'),
          api.get('/backlogs'),
        ]);
        setStats({
          groups: grps.data.length,
          apps: apps.data.length,
          backlogs: blgs.data.length,
        });
        setRecentGroups(grps.data.slice(0, 6));
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { label: 'Application Groups', value: stats.groups, icon: Layers,          gradient: 'linear-gradient(135deg, #667eea, #9b59fa)' },
    { label: 'Total Aplikasi',      value: stats.apps,   icon: LayoutDashboard, gradient: 'linear-gradient(135deg, #a78bfa, #ec4899)' },
    { label: 'Total Backlog',       value: stats.backlogs,icon: GitBranch,      gradient: 'linear-gradient(135deg, #34d399, #059669)' },
  ];

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Selamat datang, {firstName} 👋
          </h1>
          <p className="page-subtitle">Ringkasan portofolio aplikasi Anda</p>
        </div>
        <Link to="/app-groups" className="btn btn-primary">
          <Layers size={15} /> Lihat App Groups
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Recent Groups */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Application Groups Terbaru</h2>
          <Link to="/app-groups" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Lihat Semua <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{ height: 130 }}>
                <div className="skeleton" style={{ width: '40%', height: 18, marginBottom: 12 }} />
                <div className="skeleton" style={{ width: '70%', height: 20, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '50%', height: 14 }} />
              </div>
            ))}
          </div>
        ) : recentGroups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">Belum ada Application Group</div>
            <div className="empty-state-desc">Mulai dengan membuat Application Group pertama Anda.</div>
            <Link to="/app-groups" className="btn btn-primary">Buat Group</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {recentGroups.map((g, i) => (
              <Link
                key={g.id}
                to={`/app-groups/${g.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card shadow-hover"
                  style={{
                    cursor: 'pointer', height: '100%',
                    opacity: 0,
                    animation: `fadeIn 0.4s ease ${i * 0.05}s forwards`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <span className="badge badge-primary">#{g.id}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {new Date(g.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)', fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {g.name}
                  </h3>
                  {g.project && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Layers size={12} /> {g.project.name}
                    </div>
                  )}
                  {g.ownerName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'var(--space-3)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <Users size={12} /> {g.ownerName}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
