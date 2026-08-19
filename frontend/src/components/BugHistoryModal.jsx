import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Bug, UploadCloud, Image, Trash2, CheckCircle2, User, Wrench, FileText } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function BugHistoryModal({ applicationId, bug, onClose, onSuccess }) {
  const { toast } = useUI();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apps, setApps] = useState([]);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    applicationId: applicationId || '',
    description: '',
    reportedBy: user?.name || '',
    causesAndTroubleshoot: '',
    status: 'Open',
    screenshots: []
  });

  useEffect(() => {
    if (!applicationId) {
      const fetchApps = async () => {
        try {
          const res = await api.get('/apps');
          setApps(res.data || []);
          if (!bug && res.data?.length > 0) {
            setForm(f => ({ ...f, applicationId: res.data[0].id }));
          }
        } catch {
          // fail silently
        }
      };
      fetchApps();
    }
  }, [applicationId, bug]);

  useEffect(() => {
    if (bug) {
      setForm({
        applicationId: bug.applicationId || applicationId || '',
        description: bug.description || '',
        reportedBy: bug.reportedBy || user?.name || '',
        causesAndTroubleshoot: bug.causesAndTroubleshoot || '',
        status: bug.status || 'Open',
        screenshots: Array.isArray(bug.screenshots) ? bug.screenshots : []
      });
    } else {
      setForm({
        applicationId: applicationId || (apps[0]?.id || ''),
        description: '',
        reportedBy: user?.name || '',
        causesAndTroubleshoot: '',
        status: 'Open',
        screenshots: []
      });
    }
  }, [bug, applicationId, user, apps]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleDescChange = (content) => setForm(f => ({ ...f, description: content }));
  const handleTroubleshootChange = (content) => setForm(f => ({ ...f, causesAndTroubleshoot: content }));

  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newUploaded = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', 'BugHistory');
      if (applicationId) formData.append('moduleId', applicationId);
      formData.append('type', 'image');

      try {
        const res = await api.post('/assets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newUploaded.push({
          url: res.data.url,
          fileName: file.name
        });
      } catch (err) {
        console.error('Failed to upload screenshot:', file.name, err);
        toast(`Gagal mengunggah ${file.name}`, 'error');
      }
    }

    if (newUploaded.length > 0) {
      setForm(prev => ({
        ...prev,
        screenshots: [...prev.screenshots, ...newUploaded]
      }));
      toast(`${newUploaded.length} screenshot berhasil diunggah`, 'success');
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeScreenshot = (index) => {
    setForm(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim() || form.description === '<p><br></p>') {
      toast('Deskripsi Error / Bug wajib diisi', 'error');
      return;
    }
    if (!form.reportedBy.trim()) {
      toast('Pelapor (Reported By) wajib diisi', 'error');
      return;
    }

    setLoading(true);
    try {
      if (bug?.id) {
        await api.put(`/bug-histories/${bug.id}`, form);
        toast('Riwayat error berhasil diperbarui', 'success');
      } else {
        await api.post('/bug-histories', form);
        toast('Laporan error baru berhasil dicatat', 'success');
      }
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.message || 'Operasi gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '90vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bug size={18} style={{ color: 'var(--accent-danger)' }} />
            <span className="modal-title">{bug ? `Edit Error / Bug (${bug.id})` : 'Catat Error / Bug Baru'}</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* App selection (only visible if applicationId is not fixed) */}
            {!applicationId && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label form-required">Aplikasi</label>
                <select
                  className="form-select"
                  name="applicationId"
                  value={form.applicationId}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>-- Pilih Aplikasi --</option>
                  {apps.map(app => (
                    <option key={app.id} value={app.id}>{app.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Top Row: Reported By & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label form-required">
                  <User size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Reported By
                </label>
                <input
                  className="form-input"
                  name="reportedBy"
                  value={form.reportedBy}
                  onChange={handleChange}
                  placeholder="Nama pelapor / engineer"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label form-required">Status Error</label>
                <select
                  className="form-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Open">🔴 Open</option>
                  <option value="Investigating">🟡 Investigating</option>
                  <option value="Resolved">🟢 Resolved</option>
                  <option value="Closed">⚪ Closed</option>
                </select>
              </div>
            </div>

            {/* Bug Description (Rich text) */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label form-required">
                <FileText size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Bug / Error Description
              </label>
              <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <ReactQuill
                  theme="snow"
                  value={form.description}
                  onChange={handleDescChange}
                  style={{ height: '140px' }}
                  placeholder="Deskripsikan error, kronologi kejadian, request endpoint / url yang gagal, atau response error..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline', 'code-block'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                />
              </div>
              <div style={{ height: '40px' }} /> {/* Spacing for Quill toolbar overflow */}
            </div>

            {/* Screenshots (Multiple Upload) */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  <Image size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Screenshots ({form.screenshots.length})
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UploadCloud size={14} /> {uploading ? 'Mengunggah...' : '+ Upload Screenshot'}
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleScreenshotUpload}
                multiple
                accept="image/*"
                style={{ display: 'none' }}
              />

              {form.screenshots.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '10px',
                  padding: '12px',
                  background: 'var(--bg-hover)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {form.screenshots.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        height: '90px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-card)'
                      }}
                    >
                      <img
                        src={s.url}
                        alt={s.fileName || `Screenshot ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#ff4d4f',
                          border: 'none',
                          borderRadius: '4px',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Hapus gambar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    border: '2px dashed var(--border-subtle)',
                    background: 'var(--bg-hover)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <UploadCloud size={24} style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
                  <div>Klik untuk mengunggah satu atau beberapa gambar screenshot error</div>
                </div>
              )}
            </div>

            {/* Error Causes & Troubleshoot */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                <Wrench size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Error Causes & Troubleshoot / Solusi
              </label>
              <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <ReactQuill
                  theme="snow"
                  value={form.causesAndTroubleshoot}
                  onChange={handleTroubleshootChange}
                  style={{ height: '140px' }}
                  placeholder="Catat penyebab error (root cause), langkah troubleshooting yang dilakukan, atau instruksi perbaikan..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline', 'code-block'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                />
              </div>
              <div style={{ height: '40px' }} /> {/* Spacing for Quill toolbar overflow */}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading || uploading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
              {loading ? 'Menyimpan...' : (bug ? 'Simpan Perubahan' : 'Catat Error / Bug')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
