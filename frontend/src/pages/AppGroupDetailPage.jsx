import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Copy, Search, Filter, ExternalLink, Clock, Tag, FileText, Link2, LayoutGrid, FileSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import AppFormModal from '../components/AppFormModal';
import AppGroupFormModal from '../components/AppGroupFormModal';

const CATEGORY_COLORS = {
  'Web Application': 'badge-info',
  'Mobile Application': 'badge-success',
  'PWA': 'badge-warning',
  'Desktop': 'badge-neutral',
};

const FUNCTION_COLORS = {
  'Frontend': 'badge-primary',
  'Backend': 'badge-info',
  'Jobs': 'badge-warning',
  'Shell Script': 'badge-neutral',
  'Others': 'badge-neutral',
};

export default function AppGroupDetailPage() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [apps, setApps] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Applications');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [funcFilter, setFuncFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [projects, setProjects] = useState([]);
  const { confirm, toast } = useUI();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [grpRes, appRes, catRes, fnRes, prjRes] = await Promise.all([
        api.get(`/app-groups/${id}`),
        api.get(`/apps?groupId=${id}`),
        api.get('/master/categories'),
        api.get('/master/functions'),
        api.get('/master/projects'),
      ]);
      setGroup(grpRes.data);
      setApps(appRes.data);
      setCategories(catRes.data);
      setFunctions(fnRes.data);
      setProjects(prjRes.data);
    } catch { toast('Gagal memuat data', 'error'); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = apps;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
    }
    if (catFilter) result = result.filter(a => a.categoryId == catFilter);
    if (funcFilter) result = result.filter(a => a.functionId == funcFilter);
    setFiltered(result);
  }, [apps, search, catFilter, funcFilter]);

  const handleDuplicate = (appId) => {
    confirm('Duplikasi Aplikasi', 'Duplikasi aplikasi ini?', async () => {
      try {
        await api.post(`/apps/${appId}/duplicate`);
        toast('Aplikasi berhasil diduplikasi', 'success');
        load();
      } catch { toast('Duplikasi gagal', 'error'); }
    }, 'primary');
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!group) return <div className="empty-state"><div className="empty-state-title">Group tidak ditemukan</div></div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom:'var(--space-6)' }}>
        <Link to="/app-groups" className="btn btn-ghost btn-sm" style={{ marginBottom:'var(--space-4)', display:'inline-flex' }}>
          <ArrowLeft size={16} /> Kembali ke Daftar
        </Link>

        <div className="page-header">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--space-3)', marginBottom:'var(--space-2)' }}>
              <span className="badge badge-primary">{group.id}</span>
              {group.project && <span className="badge badge-neutral">{group.project.name}</span>}
            </div>
            <h1 className="page-title">{group.name}</h1>
            {group.ownerName && (
              <p className="page-subtitle">Product Owner: {group.ownerName} {group.ownerEmail && `<${group.ownerEmail}>`}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setShowGroupForm(true)}>Edit Group</button>
            <button className="btn btn-primary" onClick={() => { setEditApp(null); setShowForm(true); }}>
              <Plus size={16} /> Tambah Aplikasi
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        {[
          { id: 'Applications', icon: LayoutGrid },
          { id: 'Documents', icon: FileSearch }
        ].map(tab => (
          <button 
            key={tab.id} 
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <tab.icon size={14} /> {tab.id}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'Applications' && (
            <>
              {/* Filters */}
              <div className="filter-bar">
                <div className="search-bar" style={{ flex:1, minWidth:200 }}>
                  <Search size={16} />
                  <input
                    className="search-input"
                    placeholder="Cari nama atau ID aplikasi..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select className="form-select" style={{ width:180 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                  <option value="">Semua Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="form-select" style={{ width:180 }} value={funcFilter} onChange={e => setFuncFilter(e.target.value)}>
                  <option value="">Semua Fungsi</option>
                  {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {(search || catFilter || funcFilter) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCatFilter(''); setFuncFilter(''); }}>Reset</button>
                )}
              </div>

              {/* App Cards */}
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🖥️</div>
                  <div className="empty-state-title">Belum ada aplikasi</div>
                  <div className="empty-state-desc">Tambahkan aplikasi ke group ini.</div>
                  <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16}/> Tambah Aplikasi</button>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'var(--space-4)' }}>
                  {filtered.map(app => (
                    <div key={app.id} className="card">
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'var(--space-3)' }}>
                        <span className="badge badge-neutral" style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem' }}>{app.id}</span>
                        <div style={{ display:'flex', gap:'var(--space-1)' }}>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Duplikasi" onClick={() => handleDuplicate(app.id)}><Copy size={13}/></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => { setEditApp(app); setShowForm(true); }}>✏️</button>
                        </div>
                      </div>

                      <Link to={`/apps/${app.id}`} style={{ textDecoration:'none', color:'inherit', display: 'flex', alignItems: 'center', gap: '12px', marginBottom:'var(--space-3)' }}>
                        <div style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: '10px', 
                          background: 'var(--bg-card)', 
                          border: '1px solid var(--border-subtle)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          flexShrink: 0,
                          overflow: 'hidden'
                        }}>
                          {app.icon?.startsWith('http') ? (
                            <img src={app.icon} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="icon" />
                          ) : (
                            app.icon || app.name[0].toUpperCase()
                          )}
                        </div>
                        <h3 style={{ fontWeight:700, margin: 0, fontSize:'1rem' }}>{app.name}</h3>
                      </Link>

                      <div className="tag-list" style={{ marginBottom:'var(--space-3)' }}>
                        {app.category && <span className={`badge ${CATEGORY_COLORS[app.category.name] || 'badge-neutral'}`}>{app.category.name}</span>}
                        {app.function && <span className={`badge ${FUNCTION_COLORS[app.function.name] || 'badge-neutral'}`}>{app.function.name}</span>}
                      </div>

                      {app.description && (
                        <p style={{ fontSize:'0.95rem', color:'var(--text-muted)', lineHeight:1.6, marginBottom:'var(--space-3)', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {app.description}
                        </p>
                      )}

                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'var(--space-3)', borderTop:'1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize:'0.9rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                          <Clock size={12}/> {new Date(app.createdAt).toLocaleDateString('id-ID')}
                        </span>
                        <Link to={`/apps/${app.id}`} className="btn btn-ghost btn-sm" style={{ fontSize:'0.9rem' }}>
                          Detail <ExternalLink size={12}/>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'Documents' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1rem' }}>
              {(group.documents || []).length === 0 ? (
                <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                  <FileSearch size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  <div className="empty-state-title">No documents yet</div>
                  <div className="empty-state-desc">Belum ada dokumen yang diunggah untuk group ini.</div>
                </div>
              ) : (
                group.documents.map((doc, i) => (
                  <div key={i} className="card shadow-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {doc.type === 'file' ? <FileText size={22} color="var(--accent-primary)" /> : <Link2 size={22} color="var(--accent-info)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{doc.title}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {doc.type === 'file' ? 'Uploaded File' : 'External Resource'}
                        </div>
                      </div>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon btn-sm">
                        <ExternalLink size={16} />
                      </a>
                    </div>
                    {doc.description && (
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>
                        {doc.description}
                      </p>
                    )}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} /> Link aktif
                      </span>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px' }}>
                        Open {doc.type === 'file' ? 'Document' : 'Link'}
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>


      {showForm && (
        <AppFormModal
          app={editApp}
          groupId={id}
          categories={categories}
          functions={functions}
          onClose={() => { setShowForm(false); setEditApp(null); }}
          onSuccess={() => { setShowForm(false); setEditApp(null); load(); }}
        />
      )}

      {showGroupForm && (
        <AppGroupFormModal
          group={group}
          projects={projects}
          onClose={() => setShowGroupForm(false)}
          onSuccess={() => { setShowGroupForm(false); load(); }}
        />
      )}
    </div>
  );
}
