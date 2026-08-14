import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit, Copy, Trash2, GitBranch, Server, Clock, User, Tag,
  FileText, Users, Code, Globe, Download, Save, Eye, EyeOff, X, ChevronDown, ChevronUp,
  Bug, Wrench, Image as ImageIcon, ExternalLink, ZoomIn
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
import SourceCodeModal from '../components/SourceCodeModal';
import BugHistoryModal from '../components/BugHistoryModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import EnvVarsModal from '../components/EnvVarsModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const TABS = [
  { id: 'General', icon: FileText },
  { id: 'Documentation', icon: Globe },
  { id: 'Source Codes', icon: GitBranch },
  { id: 'Backlog', icon: Clock },
  { id: 'Bug History', icon: Bug },
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

const BUG_STATUS_COLORS = {
  'Open': 'badge-danger',
  'Investigating': 'badge-warning',
  'Resolved': 'badge-success',
  'Closed': 'badge-neutral',
};

const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
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

  const [expandedBacklogs, setExpandedBacklogs] = useState(new Set());

  const [sourceCodes, setSourceCodes] = useState([]);
  const [showSourceCodeModal, setShowSourceCodeModal] = useState(false);
  const [editSourceCode, setEditSourceCode] = useState(null);

  const [bugHistories, setBugHistories] = useState([]);
  const [showBugModal, setShowBugModal] = useState(false);
  const [editBug, setEditBug] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [bugStatusFilter, setBugStatusFilter] = useState('ALL');
  const [expandedBugs, setExpandedBugs] = useState(new Set());

  const [envVarsTarget, setEnvVarsTarget] = useState(null); // { deploymentId, vars[] }

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
    status: 'Active',
    startDate: '',
    endDate: '',
    description: ''
  });

  const { confirm, toast } = useUI();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, blgRes, deplRes, statRes, catRes, fnRes, roleRes, scRes, bugRes] = await Promise.all([
        api.get(`/apps/${id}`),
        api.get(`/backlogs?appId=${id}`),
        api.get(`/deployments?appId=${id}`),
        api.get('/master/statuses'),
        api.get('/master/categories'),
        api.get('/master/functions'),
        api.get('/master/roles'),
        api.get(`/source-codes?appId=${id}`),
        api.get(`/bug-histories?appId=${id}`),
      ]);
      setApp(appRes.data);
      setDocContent(appRes.data.documentation || '');
      setBacklogs(blgRes.data);
      setDeployments(deplRes.data);
      setStatuses(statRes.data);
      setCategories(catRes.data);
      setFunctions(fnRes.data);
      setRoles(roleRes.data);
      setSourceCodes(scRes.data || []);
      setBugHistories(bugRes.data || []);
      setDevDetailsForm({
        status: appRes.data.status || 'Active',
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

  const handleDeleteBacklog = (backlogId) => {
    confirm('Hapus Backlog', 'Yakin ingin menghapus backlog ini? Tindakan ini tidak dapat dibatalkan.', async () => {
      try {
        await api.delete(`/backlogs/${backlogId}`);
        toast('Backlog berhasil dihapus', 'success');
        load();
      } catch { toast('Gagal menghapus backlog', 'error'); }
    }, 'danger');
  };

  const toggleBacklog = (backlogId) => {
    setExpandedBacklogs(prev => {
      const next = new Set(prev);
      if (next.has(backlogId)) next.delete(backlogId);
      else next.add(backlogId);
      return next;
    });
  };

  const handleDeleteSourceCode = (sourceCodeId) => {
    confirm('Hapus Source Code', 'Yakin ingin menghapus source code repository ini?', async () => {
      try {
        await api.delete(`/source-codes/${sourceCodeId}`);
        toast('Source Code berhasil dihapus', 'success');
        load();
      } catch {
        toast('Gagal menghapus source code', 'error');
      }
    }, 'danger');
  };

  const handleDeleteBug = (bugId) => {
    confirm('Hapus Riwayat Bug', 'Yakin ingin menghapus catatan error/bug ini?', async () => {
      try {
        await api.delete(`/bug-histories/${bugId}`);
        toast('Riwayat error berhasil dihapus', 'success');
        load();
      } catch {
        toast('Gagal menghapus riwayat error', 'error');
      }
    }, 'danger');
  };

  const toggleBugExpand = (bugId) => {
    setExpandedBugs(prev => {
      const next = new Set(prev);
      if (next.has(bugId)) next.delete(bugId);
      else next.add(bugId);
      return next;
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
            <span className={`badge ${app.status === 'Inactive' ? 'badge-neutral' : 'badge-success'}`}>
              {app.status || 'Active'}
            </span>
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
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setIsEditingDevDetails(true)}><Edit size={14} /></button>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setIsEditingDevDetails(false)}><X size={14} /></button>
                      <button className="btn btn-primary btn-icon btn-sm" onClick={handleSaveDevDetails}><Save size={14} /></button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {isEditingDevDetails ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Status Aplikasi</label>
                        <select 
                          className="form-select" 
                          value={devDetailsForm.status} 
                          onChange={e => setDevDetailsForm({ ...devDetailsForm, status: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
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
                      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', alignItems: 'center' }}>
                        <span style={{ width: 140, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Status</span>
                        <span className={`badge ${app.status === 'Inactive' ? 'badge-neutral' : 'badge-success'}`} style={{ fontSize: '0.85rem' }}>
                          {app.status || 'Active'}
                        </span>
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
                  <button className="btn btn-secondary btn-sm" onClick={downloadPDF}><Download size={14} /> PDF</button>
                  {isEditingDoc ? (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingDoc(false)}><X size={14} /> Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveDoc}><Save size={14} /> Save Changes</button>
                    </>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => setIsEditingDoc(true)}><Edit size={14} /> Edit Mode</button>
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
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
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

          {/* Source Codes Tab */}
          {activeTab === 'Source Codes' && (
            <div>
              <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>Source Code Repositories</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Daftar repository source code (Github / Gitlab) untuk aplikasi ini.
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setEditSourceCode(null); setShowSourceCodeModal(true); }}
                >
                  <Plus size={14} /> Add Source Code
                </button>
              </div>

              {sourceCodes.length === 0 ? (
                <div className="empty-state">
                  <GitBranch size={40} color="var(--text-muted)" />
                  <div className="empty-state-title">Belum ada source code repository</div>
                  <p className="empty-state-desc" style={{ marginBottom: '1.25rem' }}>
                    Tambahkan tautan repository Github untuk frontend, backend, atau services aplikasi ini.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setEditSourceCode(null); setShowSourceCodeModal(true); }}
                  >
                    <Plus size={14} /> Tambah Source Code Pertama
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                  {sourceCodes.map(sc => (
                    <div key={sc.id} className="card shadow-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '10px',
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <GitBranch size={20} style={{ color: 'var(--accent-primary)' }} />
                          </div>
                          <div>
                            <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                              {sc.id}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Edit"
                            onClick={() => { setEditSourceCode(sc); setShowSourceCodeModal(true); }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Hapus"
                            onClick={() => handleDeleteSourceCode(sc.id)}
                            style={{ color: 'var(--accent-danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Github Link */}
                      <div style={{ background: 'var(--bg-hover)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                          Repository URL
                        </div>
                        <a
                          href={sc.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--accent-primary)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            wordBreak: 'break-all'
                          }}
                        >
                          <Globe size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sc.url}</span>
                        </a>
                      </div>

                      {/* Description */}
                      {sc.description ? (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                          {sc.description}
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, flex: 1 }}>
                          Tidak ada deskripsi.
                        </p>
                      )}

                      {/* Footer */}
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(sc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <a
                          href={sc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Open Repo ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  {backlogs.map(b => {
                    const isExpanded = expandedBacklogs.has(b.id);
                    return (
                      <div
                        key={b.id}
                        className="card shadow-hover"
                        style={{
                          padding: '10px 14px',
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: isExpanded ? '10px' : '0',
                          minHeight: 'auto',
                          cursor: 'pointer',
                          borderColor: isExpanded ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onClick={() => toggleBacklog(b.id)}
                      >
                        {/* Main Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
                          {/* Left: ID & Status Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '2px 6px' }}>
                              {b.id}
                            </span>
                            <span className={`badge ${STATUS_COLORS[b.status?.name] || 'badge-neutral'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                              {b.status?.name}
                            </span>
                          </div>

                          {/* Middle: 1-Line Text Preview (shown when collapsed) */}
                          <div 
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: '0.85rem',
                              color: isExpanded ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontWeight: isExpanded ? 600 : 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.3
                            }}
                            title={stripHtml(b.content)}
                          >
                            {stripHtml(b.content) || '—'}
                          </div>

                          {/* Right: Meta & Actions */}
                          <div 
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={11} /> {b.creator?.name}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={11} /> {new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                              {b.hoursSpent > 0 && (
                                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                                  ⏱️ {b.hoursSpent}h
                                </span>
                              )}
                            </div>

                            <select
                              className="form-select form-select-sm"
                              style={{ width: 115, fontSize: '0.75rem', padding: '2px 6px', height: '26px' }}
                              value={b.statusId}
                              onChange={(e) => { e.stopPropagation(); handleStatusChange(b.id, e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>

                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Hapus Backlog"
                              onClick={(e) => { e.stopPropagation(); handleDeleteBacklog(b.id); }}
                              style={{ color: 'var(--accent-danger)', width: '24px', height: '24px', padding: 0 }}
                            >
                              <Trash2 size={13} />
                            </button>

                            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: '2px', pointerEvents: 'none' }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Full Rich Content */}
                        {isExpanded && (
                          <div 
                            style={{
                              padding: '14px 16px',
                              background: 'var(--bg-hover)',
                              borderRadius: '8px',
                              border: '1px solid var(--border-subtle)',
                              marginTop: '4px',
                              animation: 'fadeIn 0.2s ease-out'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div 
                              className="ql-editor" 
                              style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                padding: 0,
                                maxHeight: '400px',
                                overflowY: 'auto',
                                lineHeight: 1.6
                              }}
                              dangerouslySetInnerHTML={{ __html: b.content }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Error / Bug History Tab */}
          {activeTab === 'Bug History' && (
            <div>
              <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Error & Bug History</h2>
                    <span className="badge badge-neutral" style={{ fontSize: '0.8rem' }}>
                      {bugHistories.length}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Riwayat error, laporan bug, screenshot kendala, dan dokumentasi troubleshoot aplikasi.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Status Filter */}
                  <div style={{ display: 'flex', background: 'var(--bg-hover)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    {['ALL', 'Open', 'Investigating', 'Resolved', 'Closed'].map(st => (
                      <button
                        key={st}
                        className="btn btn-ghost btn-sm"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          background: bugStatusFilter === st ? 'var(--bg-card)' : 'transparent',
                          color: bugStatusFilter === st ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontWeight: bugStatusFilter === st ? 600 : 400,
                          boxShadow: bugStatusFilter === st ? 'var(--shadow-sm)' : 'none'
                        }}
                        onClick={() => setBugStatusFilter(st)}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setEditBug(null); setShowBugModal(true); }}
                  >
                    <Plus size={14} /> Catat Error / Bug
                  </button>
                </div>
              </div>

              {/* Bug List */}
              {(() => {
                const filteredBugs = bugStatusFilter === 'ALL'
                  ? bugHistories
                  : bugHistories.filter(b => b.status === bugStatusFilter);

                if (filteredBugs.length === 0) {
                  return (
                    <div className="empty-state">
                      <Bug size={40} color="var(--text-muted)" />
                      <div className="empty-state-title">
                        {bugStatusFilter === 'ALL' ? 'Belum ada riwayat error / bug' : `Tidak ada bug dengan status "${bugStatusFilter}"`}
                      </div>
                      <p className="empty-state-desc" style={{ marginBottom: '1.25rem' }}>
                        Catat kendala, screenshot error, dan solusi troubleshooting untuk mempermudah pemeliharaan sistem.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => { setEditBug(null); setShowBugModal(true); }}
                      >
                        <Plus size={14} /> Catat Error / Bug Pertama
                      </button>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    {filteredBugs.map(bugItem => {
                      const isExpanded = expandedBugs.has(bugItem.id);
                      return (
                        <div
                          key={bugItem.id}
                          className="card shadow-hover"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: isExpanded ? '12px' : '0',
                            padding: '10px 14px',
                            width: '100%',
                            minHeight: 'auto',
                            cursor: 'pointer',
                            borderLeft: bugItem.status === 'Open' 
                              ? '4px solid var(--accent-danger)' 
                              : bugItem.status === 'Investigating'
                              ? '4px solid var(--accent-warning)'
                              : bugItem.status === 'Resolved'
                              ? '4px solid var(--accent-success)'
                              : '4px solid var(--border-subtle)',
                            borderColor: isExpanded ? 'var(--accent-primary)' : undefined,
                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                          }}
                          onClick={() => toggleBugExpand(bugItem.id)}
                        >
                          {/* Main Row / Header Bar */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
                            {/* Left: ID & Status Badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '2px 6px' }}>
                                {bugItem.id}
                              </span>
                              <span className={`badge ${BUG_STATUS_COLORS[bugItem.status] || 'badge-neutral'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                {bugItem.status}
                              </span>
                            </div>

                            {/* Middle: 1-Line Preview Text */}
                            <div 
                              style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: '0.85rem',
                                color: isExpanded ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: isExpanded ? 600 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.3
                              }}
                              title={stripHtml(bugItem.description)}
                            >
                              {stripHtml(bugItem.description) || '—'}
                            </div>

                            {/* Right: Meta & Actions */}
                            <div 
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}
                            >
                              {Array.isArray(bugItem.screenshots) && bugItem.screenshots.length > 0 && (
                                <span
                                  className="badge badge-neutral"
                                  style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px' }}
                                  title={`${bugItem.screenshots.length} screenshot dilampirkan`}
                                >
                                  <ImageIcon size={11} /> {bugItem.screenshots.length}
                                </span>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <User size={11} /> {bugItem.reportedBy || bugItem.creator?.name || '—'}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={11} /> {new Date(bugItem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <button
                                  className="btn btn-ghost btn-icon btn-sm"
                                  title="Edit Bug"
                                  onClick={(e) => { e.stopPropagation(); setEditBug(bugItem); setShowBugModal(true); }}
                                  style={{ width: '26px', height: '26px', padding: 0 }}
                                >
                                  <Edit size={13} />
                                </button>
                                <button
                                  className="btn btn-ghost btn-icon btn-sm"
                                  title="Hapus Bug"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteBug(bugItem.id); }}
                                  style={{ color: 'var(--accent-danger)', width: '26px', height: '26px', padding: 0 }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: '2px', pointerEvents: 'none' }}>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Section */}
                          {isExpanded && (
                            <div 
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                paddingTop: '8px',
                                borderTop: '1px solid var(--border-subtle)',
                                marginTop: '4px',
                                animation: 'fadeIn 0.2s ease-out'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Full Description */}
                              <div>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                                  Deskripsi Error Lengkap
                                </div>
                                <div
                                  className="ql-editor"
                                  style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-primary)',
                                    padding: '12px 16px',
                                    background: 'var(--bg-hover)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-subtle)',
                                    lineHeight: 1.6,
                                    maxHeight: '350px',
                                    overflowY: 'auto'
                                  }}
                                  dangerouslySetInnerHTML={{ __html: bugItem.description }}
                                />
                              </div>

                              {/* Screenshots Gallery */}
                              {Array.isArray(bugItem.screenshots) && bugItem.screenshots.length > 0 && (
                                <div>
                                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ImageIcon size={12} /> Screenshots ({bugItem.screenshots.length})
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                  }}>
                                    {bugItem.screenshots.map((img, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => setPreviewImage({ src: img.url, title: img.fileName || `${bugItem.id} - Screenshot ${idx + 1}` })}
                                        style={{
                                          width: '130px',
                                          height: '85px',
                                          borderRadius: '8px',
                                          overflow: 'hidden',
                                          border: '1px solid var(--border-subtle)',
                                          cursor: 'pointer',
                                          position: 'relative',
                                          background: 'var(--bg-card)',
                                          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                        }}
                                        onMouseOver={e => {
                                          e.currentTarget.style.transform = 'scale(1.03)';
                                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                        }}
                                        onMouseOut={e => {
                                          e.currentTarget.style.transform = 'scale(1)';
                                          e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        title="Klik untuk memperbesar gambar"
                                      >
                                        <img
                                          src={img.url}
                                          alt={img.fileName || `Screenshot ${idx + 1}`}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{
                                          position: 'absolute',
                                          bottom: 0,
                                          left: 0,
                                          right: 0,
                                          background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                                          padding: '4px 6px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          color: '#fff'
                                        }}>
                                          <span style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {img.fileName || `Img ${idx + 1}`}
                                          </span>
                                          <ZoomIn size={11} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Causes & Troubleshooting */}
                              {bugItem.causesAndTroubleshoot && bugItem.causesAndTroubleshoot !== '<p><br></p>' && (
                                <div style={{
                                  padding: '12px 16px',
                                  background: 'rgba(34, 197, 94, 0.05)',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(34, 197, 94, 0.2)'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: 'var(--accent-success)',
                                    marginBottom: '6px'
                                  }}>
                                    <Wrench size={13} />
                                    Error Causes & Troubleshooting / Solusi
                                  </div>
                                  <div
                                    className="ql-editor"
                                    style={{
                                      fontSize: '0.875rem',
                                      color: 'var(--text-primary)',
                                      padding: 0,
                                      lineHeight: 1.6
                                    }}
                                    dangerouslySetInnerHTML={{ __html: bugItem.causesAndTroubleshoot }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{d.id}</span>
                            <span className="badge badge-info">{d.platform}</span>
                            {Array.isArray(d.envVars) && d.envVars.length > 0 && (
                              <span
                                className="badge badge-success"
                                style={{ fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Lihat / Edit Environment Variables"
                                onClick={() => setEnvVarsTarget({ deploymentId: d.id, vars: d.envVars })}
                              >
                                .env · {d.envVars.length} var
                              </span>
                            )}
                          </div>
                          <a href={d.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '1rem' }}>{d.url}</a>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                            onClick={() => setEnvVarsTarget({ deploymentId: d.id, vars: Array.isArray(d.envVars) ? d.envVars : [] })}
                            title="Edit Environment Variables"
                          >
                            .env vars
                          </button>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteDeployment(d.id)}><Trash2 size={16} color="var(--accent-danger)" /></button>
                        </div>
                      </div>

                      {/* Instructions & Testing */}
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

                      {/* Env Vars Preview (collapsed table) */}
                      {Array.isArray(d.envVars) && d.envVars.length > 0 && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
                              Environment Variables ({d.envVars.length})
                            </span>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                              onClick={() => setEnvVarsTarget({ deploymentId: d.id, vars: d.envVars })}
                            >
                              Edit
                            </button>
                          </div>
                          <div style={{
                            background: 'var(--bg-hover)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-subtle)',
                            overflow: 'hidden'
                          }}>
                            {d.envVars.slice(0, 5).map((ev, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '180px 1fr',
                                  borderBottom: i < Math.min(d.envVars.length, 5) - 1 ? '1px solid var(--border-subtle)' : 'none',
                                  fontSize: '0.8rem',
                                  fontFamily: 'var(--font-mono)'
                                }}
                              >
                                <span style={{ padding: '5px 10px', fontWeight: 700, color: 'var(--accent-primary)', borderRight: '1px solid var(--border-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ev.key}
                                </span>
                                <span style={{ padding: '5px 10px', color: 'var(--text-muted)', letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  ••••••••
                                </span>
                              </div>
                            ))}
                            {d.envVars.length > 5 && (
                              <div style={{ padding: '5px 10px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                + {d.envVars.length - 5} variabel lainnya...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                <button className="btn btn-primary btn-sm" onClick={() => setShowDevPicker(true)}><Plus size={14} /> Add Developer</button>
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
                      <Trash2 size={14} color="var(--text-muted)" />
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
      {showSourceCodeModal && (
        <SourceCodeModal
          applicationId={id}
          sourceCode={editSourceCode}
          onClose={() => { setShowSourceCodeModal(false); setEditSourceCode(null); }}
          onSuccess={() => { setShowSourceCodeModal(false); setEditSourceCode(null); load(); }}
        />
      )}

      {showBugModal && (
        <BugHistoryModal
          applicationId={id}
          bug={editBug}
          onClose={() => { setShowBugModal(false); setEditBug(null); }}
          onSuccess={() => { setShowBugModal(false); setEditBug(null); load(); }}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {envVarsTarget && (
        <EnvVarsModal
          deploymentId={envVarsTarget.deploymentId}
          initialVars={envVarsTarget.vars}
          onClose={() => setEnvVarsTarget(null)}
          onSave={(updatedVars) => {
            setDeployments(prev =>
              prev.map(d =>
                d.id === envVarsTarget.deploymentId
                  ? { ...d, envVars: updatedVars }
                  : d
              )
            );
            setEnvVarsTarget(null);
          }}
        />
      )}
    </div>
  );
}
