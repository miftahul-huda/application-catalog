import { useEffect, useState } from 'react';
import { Layers, LayoutDashboard, GitBranch, Clock, Users } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ groups: 0, apps: 0, backlogs: 0, users: 0 });
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
    { label: 'Application Groups', value: stats.groups, icon: Layers, color: '#7c8dff' },
    { label: 'Total Aplikasi', value: stats.apps, icon: LayoutDashboard, color: '#a78bfa' },
    { label: 'Total Backlog', value: stats.backlogs, icon: GitBranch, color: '#34d399' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Selamat datang, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Ringkasan portofolio aplikasi Anda</p>
        </div>
        <Link to="/app-groups" className="btn btn-primary">
          <Layers size={16} /> Lihat App Groups
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="stat-value">{loading ? '—' : value}</div>
                <div className="stat-label">{label}</div>
              </div>
              <div style={{ width:42, height:42, borderRadius:'var(--radius-md)', background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Groups */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Application Groups Terbaru</h2>
          <Link to="/app-groups" className="btn btn-ghost btn-sm">Lihat Semua</Link>
        </div>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : recentGroups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">Belum ada Application Group</div>
            <div className="empty-state-desc">Mulai dengan membuat Application Group pertama Anda.</div>
            <Link to="/app-groups" className="btn btn-primary">Buat Group</Link>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'var(--space-4)' }}>
            {recentGroups.map(g => (
              <Link key={g.id} to={`/app-groups/${g.id}`} style={{ textDecoration:'none' }}>
                <div className="card" style={{ cursor:'pointer', height:'100%' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--space-3)' }}>
                    <span className="badge badge-primary">{g.id}</span>
                    <span style={{ fontSize:'0.9rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'4px' }}>
                      <Clock size={12} /> {new Date(g.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h3 style={{ fontWeight:700, marginBottom:'var(--space-2)', fontSize:'1rem' }}>{g.name}</h3>
                  {g.project && <div style={{ fontSize:'0.9rem', color:'var(--text-muted)' }}>📁 {g.project.name}</div>}
                  {g.ownerName && (
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)', marginTop:'var(--space-3)', fontSize:'0.9rem', color:'var(--text-secondary)' }}>
                      <Users size={13} /> {g.ownerName}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
