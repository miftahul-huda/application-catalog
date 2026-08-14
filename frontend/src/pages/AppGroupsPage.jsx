import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Copy, Clock, Users, Folder, ArrowRight, Edit2 } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import AppGroupFormModal from '../components/AppGroupFormModal';

// Deterministic gradient per group ID
const GROUP_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #9b59fa 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fda085 0%, #f6d365 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #667eea 100%)',
];

function getGradient(id) {
  const idx = id ? id.charCodeAt(id.length - 1) % GROUP_GRADIENTS.length : 0;
  return GROUP_GRADIENTS[idx];
}

function GroupCard({ g, onDuplicate, onEdit }) {
  const gradient = getGradient(g.id);
  const initial = g.name?.[0]?.toUpperCase() || 'G';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      e.currentTarget.style.borderColor = 'var(--border-active)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = '';
      e.currentTarget.style.borderColor = 'var(--border-subtle)';
    }}
    >
      {/* Gradient banner */}
      <div style={{
        height: 6,
        background: gradient,
        flexShrink: 0,
      }} />

      <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44,
            borderRadius: 'var(--radius-md)',
            background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', fontWeight: 800, color: 'white',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            letterSpacing: '-0.02em',
          }}>
            {initial}
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="icon-btn"
              title="Duplikasi"
              onClick={e => { e.preventDefault(); onDuplicate(g.id); }}
              style={{ opacity: 0.7 }}
            >
              <Copy size={14} />
            </button>
            <button
              className="icon-btn"
              title="Edit"
              onClick={e => { e.preventDefault(); onEdit(g); }}
              style={{ opacity: 0.7 }}
            >
              <Edit2 size={14} />
            </button>
          </div>
        </div>

        {/* ID badge */}
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <span className="badge badge-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            {g.id}
          </span>
        </div>

        {/* Name */}
        <Link to={`/app-groups/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{
            fontWeight: 700, fontSize: '1rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            lineHeight: 1.35,
            marginBottom: 'var(--space-3)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
          >
            {g.name}
          </h3>
        </Link>

        {/* Meta info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {g.project && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <Folder size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0, opacity: 0.8 }} />
              <span>{g.project.name}</span>
            </div>
          )}
          {g.ownerName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <Users size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0, opacity: 0.8 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.ownerName}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Clock size={12} style={{ flexShrink: 0 }} />
            <span>{new Date(g.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 'var(--space-4)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {g.applications ? `${g.applications.length} Aplikasi` : '—'}
          </span>
          <Link
            to={`/app-groups/${g.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.8rem', fontWeight: 600,
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              transition: 'gap 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.gap = '8px'}
            onMouseLeave={e => e.currentTarget.style.gap = '4px'}
          >
            Lihat Detail <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AppGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const { confirm, toast } = useUI();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [grpRes, projRes] = await Promise.all([
        api.get('/app-groups'),
        api.get('/master/projects'),
      ]);
      setGroups(grpRes.data);
      setProjects(projRes.data);
    } catch { toast('Gagal memuat data', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = groups;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q));
    }
    if (projectFilter) {
      result = result.filter(g => g.projectId == projectFilter);
    }
    setFiltered(result);
  }, [groups, search, projectFilter]);

  const handleDuplicate = async (id) => {
    confirm('Duplikasi Group', 'Apakah Anda ingin menduplikasi application group ini?', async () => {
      try {
        await api.post(`/app-groups/${id}/duplicate`);
        toast('Berhasil diduplikasi', 'success');
        load();
      } catch { toast('Duplikasi gagal', 'error'); }
    }, 'primary');
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditGroup(null);
    load();
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Application Groups</h1>
          <p className="page-subtitle">Kelola seluruh Application Group dalam portofolio</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditGroup(null); setShowForm(true); }}>
          <Plus size={15} /> Buat Group Baru
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} />
          <input
            className="search-input"
            placeholder="Cari nama atau ID group..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 200 }}
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
        >
          <option value="">Semua Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(search || projectFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setProjectFilter(''); }}>
            Reset Filter
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 6 }} />
              <div style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 18, width: '80%' }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">Tidak ada Application Group</div>
          <div className="empty-state-desc">Buat group pertama untuk mulai mengelola aplikasi.</div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Buat Group
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((g, i) => (
            <div key={g.id} style={{
              opacity: 0,
              animation: `fadeIn 0.35s ease ${i * 0.04}s forwards`,
            }}>
              <GroupCard
                g={g}
                onDuplicate={handleDuplicate}
                onEdit={g => { setEditGroup(g); setShowForm(true); }}
              />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AppGroupFormModal
          group={editGroup}
          projects={projects}
          onClose={() => { setShowForm(false); setEditGroup(null); }}
          onSuccess={handleFormSuccess}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
