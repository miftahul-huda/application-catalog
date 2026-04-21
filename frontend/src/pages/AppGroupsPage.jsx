import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Copy, Clock, Users, Folder, Filter } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import AppGroupFormModal from '../components/AppGroupFormModal';

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
          <Plus size={16} /> Buat Group Baru
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} />
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
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">Tidak ada Application Group</div>
          <div className="empty-state-desc">Buat group pertama untuk mulai mengelola aplikasi.</div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16}/> Buat Group</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'var(--space-4)' }}>
          {filtered.map(g => (
            <div key={g.id} className="card" style={{ position:'relative' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--space-3)' }}>
                <span className="badge badge-primary">{g.id}</span>
                <div style={{ display:'flex', gap:'var(--space-1)' }}>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Duplikasi" onClick={() => handleDuplicate(g.id)}>
                    <Copy size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => { setEditGroup(g); setShowForm(true); }}>
                    ✏️
                  </button>
                </div>
              </div>

              <Link to={`/app-groups/${g.id}`} style={{ textDecoration:'none', color:'inherit' }}>
                <h3 style={{ fontWeight:700, fontSize:'1rem', marginBottom:'var(--space-2)', color:'var(--text-primary)' }}>
                  {g.name}
                </h3>
              </Link>

              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-2)', fontSize:'0.95rem', color:'var(--text-muted)' }}>
                {g.project && (
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
                    <Folder size={14} /> {g.project.name}
                  </div>
                )}
                {g.ownerName && (
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
                    <Users size={14} /> {g.ownerName}
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:'var(--space-2)' }}>
                  <Clock size={14} /> {new Date(g.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                </div>
              </div>

              {g.applications && (
                <div style={{ marginTop:'var(--space-4)', paddingTop:'var(--space-3)', borderTop:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'0.9rem', color:'var(--text-muted)' }}>{g.applications.length} Aplikasi</span>
                  <Link to={`/app-groups/${g.id}`} className="btn btn-ghost btn-sm" style={{ fontSize:'0.9rem' }}>
                    Lihat Detail →
                  </Link>
                </div>
              )}
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
    </div>
  );
}
