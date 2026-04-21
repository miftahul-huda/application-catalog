import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Copy, Trash2, GitBranch, Server, Clock, User, Tag, 
  FileText, Users, Code, Globe, Download, Save, Eye, EyeOff, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import AppFormModal from '../components/AppFormModal';
import BacklogFormModal from '../components/BacklogFormModal';
import DeploymentFormModal from '../components/DeploymentFormModal';
import DeveloperPickerModal from '../components/DeveloperPickerModal';
import TechStackModal from '../components/TechStackModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const TABS = [
  { id: 'General', icon: FileText },
  { id: 'Documentation', icon: Globe },
  { id: 'Backlog', icon: Clock },
  { id: 'Deployment', icon: Server },
  { id: 'Developers', icon: Users },
  { id: 'Tech Stack', icon: Code },
];

const STATUS_COLORS = {
  'Requested': 'badge-warning',
  'In Progress': 'badge-info',
  'Canceled': 'badge-danger',
  'Done': 'badge-success',
};

export default function AppDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [backlogs, setBacklogs] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('General');
  
  // Modals
  const [showEditApp, setShowEditApp] = useState(false);
  const [showBacklogForm, setShowBacklogForm] = useState(false);
  const [showDeployForm, setShowDeployForm] = useState(false);
  const [showDevPicker, setShowDevPicker] = useState(false);
  const [showTechStackForm, setShowTechStackForm] = useState(false);
  
  // Doc Editor
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [docContent, setDocContent] = useState('');
  const docRef = useRef(null);
  
  // General Info Edit States
  const [isEditingDevDetails, setIsEditingDevDetails] = useState(false);
  const [devDetailsForm, setDevDetailsForm] = useState({
    githubLink: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const { confirm, toast } = useUI();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, blgRes, deplRes, statRes, catRes, fnRes, roleRes] = await Promise.all([
        api.get(`/apps/${id}`),
        api.get(`/backlogs?appId=${id}`),
        api.get(`/deployments?appId=${id}`),
        api.get('/master/statuses'),
        api.get('/master/categories'),
        api.get('/master/functions'),
        api.get('/master/roles'),
      ]);
      setApp(appRes.data);
      setDocContent(appRes.data.documentation || '');
      setBacklogs(blgRes.data);
      setDeployments(deplRes.data);
      setStatuses(statRes.data);
      setCategories(catRes.data);
      setFunctions(fnRes.data);
      setRoles(roleRes.data);
      setDevDetailsForm({
        githubLink: appRes.data.githubLink || '',
        startDate: appRes.data.startDate || '',
        endDate: appRes.data.endDate || '',
        description: appRes.data.description || ''
      });
    } catch { 
      toast('Gagal memuat data', 'error'); 
    }
    setLoading(false);
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  const handleSaveDevDetails = async () => {
    try {
      await api.put(`/apps/${id}`, devDetailsForm);
      toast('Detail pengembangan diperbarui', 'success');
      setIsEditingDevDetails(false);
      setApp(prev => ({ ...prev, ...devDetailsForm }));
    } catch {
      toast('Gagal menyimpan perubahan', 'error');
    }
  };

  const handleSaveDoc = async () => {
    try {
      await api.put(`/apps/${id}`, { documentation: docContent });
      toast('Dokumentasi disimpan', 'success');
      setIsEditingDoc(false);
      setApp(prev => ({ ...prev, documentation: docContent }));
    } catch {
      toast('Gagal menyimpan dokumentasi', 'error');
    }
  };

  const downloadPDF = async () => {
    if (!docRef.current) return;
    try {
      toast('Menghasilkan PDF...', 'info');
      const canvas = await html2canvas(docRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${app.name}-Documentation.pdf`);
    } catch {
      toast('Gagal membuat PDF', 'error');
    }
  };

  const handleAddDeveloper = async (devData) => {
    try {
      await api.post(`/apps/${id}/developers`, devData);
      toast('Developer ditambahkan', 'success');
      setShowDevPicker(false);
      load();
    } catch {
      toast('Gagal menambah developer', 'error');
    }
  };

  const handleRemoveDeveloper = async (devId) => {
    confirm('Hapus Developer', 'Yakin ingin menghapus developer ini dari tim?', async () => {
      try {
        await api.delete(`/apps/${id}/developers/${devId}`);
        toast('Developer dihapus', 'success');
        load();
      } catch {
        toast('Gagal menghapus', 'error');
      }
    });
  };

  const handleDeleteDeployment = (deplId) => {
    confirm('Hapus Deployment', 'Yakin ingin menghapus deployment ini?', async () => {
      try {
        await api.delete(`/deployments/${deplId}`);
        toast('Deployment dihapus', 'success');
        load();
      } catch { toast('Hapus gagal', 'error'); }
    });
  };

  const handleStatusChange = async (backlogId, statusId) => {
    try {
      await api.patch(`/backlogs/${backlogId}`, { statusId });
      toast('Status diperbarui', 'success');
      load();
    } catch { toast('Gagal memperbarui status', 'error'); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!app) return <div className="empty-state">Aplikasi tidak ditemukan</div>;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      {/* Group Identity Banner */}
      <div 
        className="card shadow-hover" 
        style={{ 
          marginBottom: '1.5rem', 
          padding: '12px 20px', 
          background: 'var(--bg-glass)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '2px' }}>
              Application Group
            </div>
            <Link 
              to={`/app-groups/${app.groupId}`} 
              style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {app.group?.name} <span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.7, padding: '2px 6px', background: 'var(--bg-hover)', borderRadius: '4px' }}>{app.groupId}</span>
            </Link>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '2px' }}>Project</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>{app.group?.project?.name || '—'}</div>
            </div>
            {app.group?.ownerName && (
              <div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '2px' }}>Product Owner</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>{app.group.ownerName}</div>
              </div>
            )}
          </div>
        </div>

        <Link to={`/app-groups/${app.groupId}`} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Kembali ke Group
        </Link>
      </div>

        <div className="page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{app.id}</span>
              {app.category && <span className="badge badge-info">{app.category.name}</span>}
              {app.function && <span className="badge badge-primary">{app.function.name}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: 60, 
                height: 60, 
                borderRadius: '16px', 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border-subtle)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: 'var(--shadow-md)',
                flexShrink: 0
              }}>
                {app.icon?.startsWith('http') ? (
                  <img src={app.icon} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="icon" />
                ) : (
                  app.icon || app.name[0].toUpperCase()
                )}
              </div>
              <div>
                <h1 className="page-title" style={{ marginBottom: '4px' }}>{app.name}</h1>
                <p className="page-subtitle">
                  {app.group?.name} • Terakhir diupdate {new Date(app.updatedAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setShowEditApp(true)}>
              <Edit size={16} /> Edit App
            </button>
            <button className="btn btn-primary" onClick={() => { setActiveTab('Documentation'); setIsEditingDoc(true); }}>
              <FileText size={16} /> Documentation
            </button>
          </div>
        </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        {TABS.map(tab => (
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
          {/* General Tab */}
          {activeTab === 'General' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
              <div className="card">
                <h3 className="section-title" style={{ marginBottom: '1rem' }}>Informasi Utama</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Application ID', value: app.id, mono: true },
                    { label: 'Nama Aplikasi', value: app.name },
                    { label: 'Kategori', value: app.category?.name },
                    { label: 'Fungsi', value: app.function?.name },
                    { label: 'Daftar di', value: new Date(app.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { label: 'Daftar oleh', value: app.creator?.name || '—' },
                  ].map(({ label, value, mono }) => (
                    <div key={label} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                      <span style={{ width: 140, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: '1rem', fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : 'inherit' }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="section-title">Development Details</h3>
                  {!isEditingDevDetails ? (
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setIsEditingDevDetails(true)}><Edit size={14}/></button>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setIsEditingDevDetails(false)}><X size={14}/></button>
                      <button className="btn btn-primary btn-icon btn-sm" onClick={handleSaveDevDetails}><Save size={14}/></button>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {isEditingDevDetails ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">GitHub Link</label>
                        <input className="form-input" value={devDetailsForm.githubLink} onChange={e => setDevDetailsForm({ ...devDetailsForm, githubLink: e.target.value })} placeholder="https://github.com/..." />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Start Date</label>
                          <input type="date" className="form-input" value={devDetailsForm.startDate} onChange={e => setDevDetailsForm({ ...devDetailsForm, startDate: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">End Date</label>
                          <input type="date" className="form-input" value={devDetailsForm.endDate} onChange={e => setDevDetailsForm({ ...devDetailsForm, endDate: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Deskripsi Singkat</label>
                        <textarea className="form-textarea" rows={3} value={devDetailsForm.description} onChange={e => setDevDetailsForm({ ...devDetailsForm, description: e.target.value })} placeholder="Deskripsi mengenai aplikasi ini..." />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                        <span style={{ width: 140, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>GitHub Link</span>
                        {app.githubLink ? (
                          <a href={app.githubLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '1rem' }}>{app.githubLink}</a>
                        ) : (
                          <span style={{ fontSize: '1rem', fontWeight: 500 }}>—</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                        <span style={{ width: 140, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Start Date</span>
                        <span style={{ fontSize: '1rem', fontWeight: 500 }}>{app.startDate ? new Date(app.startDate).toLocaleDateString('id-ID') : '—'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                        <span style={{ width: 140, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>End Date</span>
                        <span style={{ fontSize: '1rem', fontWeight: 500 }}>{app.endDate ? new Date(app.endDate).toLocaleDateString('id-ID') : '—'}</span>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>Deskripsi Singkat:</div>
                        <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{app.description || 'Tidak ada deskripsi.'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documentation Tab */}
          {activeTab === 'Documentation' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-hover)' }}>
                <div style={{ fontWeight: 600 }}>Google-style Documentation</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={downloadPDF}><Download size={14}/> PDF</button>
                  {isEditingDoc ? (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingDoc(false)}><X size={14}/> Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveDoc}><Save size={14}/> Save Changes</button>
                    </>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => setIsEditingDoc(true)}><Edit size={14}/> Edit Mode</button>
                  )}
                </div>
              </div>
              <div style={{ padding: '24px', minHeight: '600px', background: 'var(--bg-card)' }}>
                {isEditingDoc ? (
                  <ReactQuill 
                    theme="snow" 
                    value={docContent} 
                    onChange={setDocContent}
                    style={{ height: '500px', marginBottom: '50px' }}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                        ['link', 'image', 'code-block'],
                        ['clean']
                      ],
                    }}
                  />
                ) : (
                  <div 
                    ref={docRef}
                    className="doc-viewer ql-editor" 
                    style={{ minHeight: '500px', padding: 0 }}
                    dangerouslySetInnerHTML={{ __html: docContent || '<div style="color:var(--text-muted); text-align:center; padding-top:100px;">Documentation is empty. Click edit to start writing.</div>' }} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Backlog Tab */}
          {activeTab === 'Backlog' && (
            <div>
              <div className="section-header" style={{ marginBottom: '1rem' }}>
                <h2 className="section-title">Backlog Requests</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowBacklogForm(true)}><Plus size={14} /> Add Backlog</button>
              </div>
              {backlogs.length === 0 ? (
                <div className="empty-state">
                  <Clock size={40} color="var(--text-muted)" />
                  <div className="empty-state-title">No backlogs found</div>
                  <button className="btn btn-primary" onClick={() => setShowBacklogForm(true)}>Create First Backlog</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
                  {backlogs.map(b => (
                    <div key={b.id} className="card shadow-hover">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{b.id}</span>
                          <span className={`badge ${STATUS_COLORS[b.status?.name] || 'badge-neutral'}`}>{b.status?.name}</span>
                        </div>
                        <select 
                          className="form-select" 
                          style={{ width: 140, fontSize: '0.9rem', padding: '4px 8px' }}
                          value={b.statusId}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        >
                          {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div 
                        className="ql-editor" 
                        style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px', padding: 0, maxHeight: '150px', overflow: 'hidden' }}
                        dangerouslySetInnerHTML={{ __html: b.content }} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12}/> {b.creator?.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                        {b.hoursSpent > 0 && <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>⏱️ {b.hoursSpent}h</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Deployment Tab */}
          {activeTab === 'Deployment' && (
            <div>
              <div className="section-header" style={{ marginBottom: '1rem' }}>
                <h2 className="section-title">Deployment Environments</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowDeployForm(true)}><Plus size={14} /> Add Environment</button>
              </div>
              {deployments.length === 0 ? (
                <div className="empty-state">
                  <Server size={40} color="var(--text-muted)" />
                  <div className="empty-state-title">No deployments found</div>
                  <button className="btn btn-primary" onClick={() => setShowDeployForm(true)}>Deploy Now</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {deployments.map(d => (
                    <div key={d.id} className="card shadow-hover">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{d.id}</span>
                            <span className="badge badge-info">{d.platform}</span>
                          </div>
                          <a href={d.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '1rem' }}>{d.url}</a>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteDeployment(d.id)}><Trash2 size={16} color="var(--accent-danger)"/></button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Instructions</label>
                          <div className="ql-editor" style={{ fontSize: '1rem', padding: 0 }} dangerouslySetInnerHTML={{ __html: d.instructions }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Testing Procedure</label>
                          <div className="ql-editor" style={{ fontSize: '1rem', padding: 0 }} dangerouslySetInnerHTML={{ __html: d.testingInstructions }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Developers Tab */}
          {activeTab === 'Developers' && (
            <div>
              <div className="section-header" style={{ marginBottom: '1rem' }}>
                <h2 className="section-title">Project Contributors</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowDevPicker(true)}><Plus size={14}/> Add Developer</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {app.developers?.map(dev => (
                  <div key={dev.id} className="card shadow-hover" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>
                      {dev.user?.picture ? <img src={dev.user.picture} style={{ width: '100%', height: '100%', borderRadius: '12px' }} /> : (dev.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{dev.name || dev.user?.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{dev.email || dev.user?.email}</div>
                      <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>{dev.role?.name}</span>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', top: '10px', right: '10px' }} onClick={() => handleRemoveDeveloper(dev.id)}>
                      <Trash2 size={14} color="var(--text-muted)"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack Tab */}
          {activeTab === 'Tech Stack' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {[
                { title: 'Programming Languages', key: 'languages', color: 'badge-primary' },
                { title: 'Frameworks', key: 'frameworks', color: 'badge-info' },
                { title: 'Libraries', key: 'libraries', color: 'badge-success' },
                { title: 'Tools', key: 'tools', color: 'badge-warning' },
              ].map(stack => (
                <div key={stack.key} className="card">
                  <h3 className="section-title" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{stack.title}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {app.techStack?.[stack.key]?.length > 0 ? (
                      app.techStack[stack.key].map((item, i) => (
                        <span key={i} className={`badge ${stack.color}`} style={{ padding: '6px 12px', fontSize: '0.95rem' }}>{item}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No data listed.</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', background: 'var(--bg-hover)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Update tech stack in App Settings (General Info Edit)</p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }} onClick={() => setShowTechStackForm(true)}>Edit Tech Stack</button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      {showEditApp && app && (
        <AppFormModal
          app={app}
          groupId={app.groupId}
          categories={categories}
          functions={functions}
          onClose={() => setShowEditApp(false)}
          onSuccess={() => { setShowEditApp(false); load(); }}
        />
      )}
      {showBacklogForm && (
        <BacklogFormModal
          applicationId={id}
          statuses={statuses}
          onClose={() => setShowBacklogForm(false)}
          onSuccess={() => { setShowBacklogForm(false); load(); }}
        />
      )}
      {showDeployForm && (
        <DeploymentFormModal
          applicationId={id}
          onClose={() => setShowDeployForm(false)}
          onSuccess={() => { setShowDeployForm(false); load(); }}
        />
      )}
      {showDevPicker && (
        <DeveloperPickerModal
          onClose={() => setShowDevPicker(false)}
          roles={roles}
          onSelect={handleAddDeveloper}
        />
      )}
      {showTechStackForm && (
        <TechStackModal
          app={app}
          onClose={() => setShowTechStackForm(false)}
          onSuccess={() => { setShowTechStackForm(false); load(); }}
        />
      )}
    </div>
  );
}
