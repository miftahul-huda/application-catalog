import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Copy, Search, ExternalLink, Clock, Tag, FileText, Link2, LayoutGrid, FileSearch, BookOpen, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import AppFormModal from '../components/AppFormModal';
import AppGroupFormModal from '../components/AppGroupFormModal';
import DocumentFormModal from '../components/DocumentFormModal';
import GroupDocumentationFormModal from '../components/GroupDocumentationFormModal';

const DOC_TYPE_COLORS = {
  'SRS': 'badge-primary',
  'Architecture & Topology': 'badge-info',
  'ERD': 'badge-info',
  'Setup & Onboarding': 'badge-success',
  'Code Standard & Convention': 'badge-neutral',
  'Testing': 'badge-warning',
  'CI/CD': 'badge-warning',
  'Runbook & Incident Management': 'badge-danger',
  'Disaster Recovery Plan': 'badge-danger',
  'User Manual/FAQ': 'badge-success',
  'Other': 'badge-neutral',
};

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
  const navigate = useNavigate();
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
  const [showDocModal, setShowDocModal] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [projects, setProjects] = useState([]);
  const [groupDocs, setGroupDocs] = useState([]);
  const [showGroupDocForm, setShowGroupDocForm] = useState(false);
  const [editGroupDoc, setEditGroupDoc] = useState(null);
  const { confirm, toast } = useUI();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [grpRes, appRes, catRes, fnRes, prjRes, docRes] = await Promise.all([
        api.get(`/app-groups/${id}`),
        api.get(`/apps?groupId=${id}`),
        api.get('/master/categories'),
        api.get('/master/functions'),
        api.get('/master/projects'),
        api.get('/group-documentations', { params: { groupId: id } }),
      ]);
      setGroup(grpRes.data);
      setApps(appRes.data);
      setCategories(catRes.data);
      setFunctions(fnRes.data);
      setProjects(prjRes.data);
      setGroupDocs(docRes.data || []);
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

  const handleDeleteGroup = () => {
    confirm('Hapus Application Group', `Yakin ingin menghapus group "${group?.name || 'ini'}"? Semua aplikasi dan data turunannya akan ikut terhapus.`, async () => {
      try {
        await api.delete(`/app-groups/${id}`);
        toast('Application group berhasil dihapus', 'success');
        navigate('/app-groups');
      } catch {
        toast('Gagal menghapus application group', 'error');
      }
    }, 'danger');
  };

  const handleDeleteDocument = (index, docTitle) => {
    confirm('Hapus Dokumen', `Yakin ingin menghapus dokumen "${docTitle || 'ini'}"?`, async () => {
      try {
        await api.delete(`/app-groups/${id}/documents/${index}`);
        toast('Dokumen berhasil dihapus', 'success');
        load();
      } catch {
        toast('Gagal menghapus dokumen', 'error');
      }
    }, 'danger');
  };

  const handleDeleteGroupDoc = (docId, docTitle) => {
    confirm('Hapus Documentation', `Yakin ingin menghapus dokumen "${docTitle || 'ini'}"?`, async () => {
      try {
        await api.delete(`/group-documentations/${docId}`);
        toast('Documentation berhasil dihapus', 'success');
        load();
      } catch {
        toast('Gagal menghapus documentation', 'error');
      }
    }, 'danger');
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
            <button className="btn btn-danger" onClick={handleDeleteGroup}>Delete Group</button>
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
          { id: 'Documentation', icon: BookOpen },
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
                <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                  <Search size={16} />
                  <input
                    className="search-input"
                    placeholder="Cari nama atau ID aplikasi..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select className="form-select" style={{ width: 180 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                  <option value="">Semua Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="form-select" style={{ width: 180 }} value={funcFilter} onChange={e => setFuncFilter(e.target.value)}>
                  <option value="">Semua Fungsi</option>
                  {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {(search || catFilter || funcFilter) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCatFilter(''); setFuncFilter(''); }}>Reset</button>
                )}
              </div>

              {/* App Table */}
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🖥️</div>
                  <div className="empty-state-title">Belum ada aplikasi</div>
                  <div className="empty-state-desc">Tambahkan aplikasi ke group ini.</div>
                  <button className="btn btn-primary" onClick={() => { setEditApp(null); setShowForm(true); }}>
                    <Plus size={16} /> Tambah Aplikasi
                  </button>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Aplikasi</th>
                        <th>Kategori</th>
                        <th>Fungsi</th>
                        <th>Deskripsi</th>
                        <th>URL</th>
                        <th>Created</th>
                        <th style={{ textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(app => (
                        <tr key={app.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            {app.id}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <Link
                              to={`/apps/${app.id}`}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit', fontWeight: 600 }}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: '6px',
                                background: 'var(--bg-hover)',
                                border: '1px solid var(--border-subtle)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden',
                                flexShrink: 0,
                              }}>
                                {app.icon?.startsWith('http') ? (
                                  <img src={app.icon} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                ) : (
                                  app.icon || app.name[0].toUpperCase()
                                )}
                              </div>
                              <span
                                style={{ color: 'var(--text-primary)', transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                              >
                                {app.name}
                              </span>
                            </Link>
                          </td>
                          <td>
                            {app.category && (
                              <span className={`badge ${CATEGORY_COLORS[app.category.name] || 'badge-neutral'}`}>
                                {app.category.name}
                              </span>
                            )}
                          </td>
                          <td>
                            {app.function && (
                              <span className={`badge ${FUNCTION_COLORS[app.function.name] || 'badge-neutral'}`}>
                                {app.function.name}
                              </span>
                            )}
                          </td>
                          <td
                            style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={app.description}
                          >
                            {app.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.url ? (
                              <a
                                href={app.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', textDecoration: 'none' }}
                              >
                                Link <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                            {new Date(app.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button className="icon-btn" title="Duplikasi" onClick={() => handleDuplicate(app.id)}>
                                <Copy size={13} />
                              </button>
                              <button className="icon-btn" title="Edit" onClick={() => { setEditApp(app); setShowForm(true); }}>
                                <Edit2 size={13} />
                              </button>
                              <Link
                                to={`/apps/${app.id}`}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                Detail
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'Documentation' && (
            <div>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>Documentation</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    SRS, arsitektur, ERD, runbook, dan dokumentasi teknis lain untuk group ini.
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setEditGroupDoc(null); setShowGroupDocForm(true); }}
                >
                  <Plus size={14} /> Tambah Documentation
                </button>
              </div>

              {groupDocs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  <div className="empty-state-title">Belum ada documentation</div>
                  <div className="empty-state-desc" style={{ marginBottom: '1.5rem' }}>Belum ada dokumentasi yang ditambahkan untuk group ini.</div>
                  <button className="btn btn-primary" onClick={() => { setEditGroupDoc(null); setShowGroupDocForm(true); }}>
                    <Plus size={16} /> Tambah Documentation Pertama
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
                  {groupDocs.map(doc => (
                    <div key={doc.id} className="card shadow-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                          <span className={`badge ${DOC_TYPE_COLORS[doc.type] || 'badge-neutral'}`} style={{ width: 'fit-content' }}>
                            {doc.type}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.title}
                          </h4>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Edit"
                            onClick={() => { setEditGroupDoc(doc); setShowGroupDocForm(true); }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Hapus"
                            onClick={() => handleDeleteGroupDoc(doc.id, doc.title)}
                            style={{ color: 'var(--accent-danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {doc.shortDescription ? (
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                          {doc.shortDescription}
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, flex: 1 }}>
                          Tidak ada deskripsi singkat.
                        </p>
                      )}

                      <div style={{
                        marginTop: 'auto',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                      }}>
                        <span>{doc.creator?.name || '—'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Documents' && (
            <div>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>Dokumen & Resources</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Daftar dokumen arsitektur, PRD, desain, atau tautan penting terkait group ini.
                  </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowDocModal(true)}>
                  <Plus size={14} /> Tambah Dokumen
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1rem' }}>
                {(group.documents || []).length === 0 ? (
                  <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                    <FileSearch size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <div className="empty-state-title">Belum ada dokumen</div>
                    <div className="empty-state-desc" style={{ marginBottom: '1.5rem' }}>Belum ada dokumen yang ditambahkan untuk group ini.</div>
                    <button className="btn btn-primary" onClick={() => setShowDocModal(true)}>
                      <Plus size={16} /> Tambah Dokumen Pertama
                    </button>
                  </div>
                ) : (
                  group.documents.map((doc, i) => (
                    <div key={i} className="card shadow-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {doc.type === 'file' ? <FileText size={22} color="var(--accent-primary)" /> : <Link2 size={22} color="var(--accent-info)" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {doc.type === 'file' ? 'Uploaded File' : 'External Resource'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon btn-sm" title="Buka tautan">
                            <ExternalLink size={16} />
                          </a>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Hapus Dokumen"
                            onClick={() => handleDeleteDocument(i, doc.title)}
                            style={{ color: 'var(--accent-danger)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--accent-danger)' }}
                            onClick={() => handleDeleteDocument(i, doc.title)}
                          >
                            Hapus
                          </button>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px' }}>
                            Buka {doc.type === 'file' ? 'Dokumen' : 'Tautan'}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>


      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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

      {showGroupDocForm && (
        <GroupDocumentationFormModal
          groupId={id}
          doc={editGroupDoc}
          onClose={() => { setShowGroupDocForm(false); setEditGroupDoc(null); }}
          onSuccess={() => { setShowGroupDocForm(false); setEditGroupDoc(null); load(); }}
        />
      )}

      {showDocModal && (
        <DocumentFormModal
          groupId={id}
          onClose={() => setShowDocModal(false)}
          onSuccess={() => { setShowDocModal(false); load(); }}
        />
      )}
    </div>
  );
}
