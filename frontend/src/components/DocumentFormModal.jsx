import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Link2, UploadCloud, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function DocumentFormModal({ groupId, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    type: 'link',
    url: '',
    description: '',
  });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', 'AppGroup');
    if (groupId) formData.append('moduleId', groupId);
    formData.append('type', 'document');

    try {
      const res = await api.post('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const fileUrl = res.data.url;
      setUploadedFileName(file.name);
      
      setForm(prev => {
        // If title is empty, suggest file name without extension
        const suggestedTitle = prev.title.trim() 
          ? prev.title 
          : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        return {
          ...prev,
          url: fileUrl,
          title: suggestedTitle
        };
      });
      
      toast('File berhasil diunggah', 'success');
    } catch {
      toast('Gagal mengunggah file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Judul dokumen wajib diisi', 'error');
      return;
    }
    if (!form.url.trim()) {
      toast(form.type === 'file' ? 'Silakan unggah file terlebih dahulu' : 'URL / Link dokumen wajib diisi', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/app-groups/${groupId}/documents`, form);
      toast('Dokumen berhasil ditambahkan', 'success');
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menambahkan dokumen', 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <span className="modal-title">Tambah Dokumen / Resource</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Tipe Resource */}
            <div className="form-group">
              <label className="form-label form-required">Tipe Resource</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn ${form.type === 'link' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => {
                    setForm(f => ({ ...f, type: 'link' }));
                  }}
                >
                  <Link2 size={16} /> Link / External URL
                </button>
                <button
                  type="button"
                  className={`btn ${form.type === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => {
                    setForm(f => ({ ...f, type: 'file' }));
                  }}
                >
                  <FileText size={16} /> File / Dokumen
                </button>
              </div>
            </div>

            {/* Input file vs input link */}
            {form.type === 'file' ? (
              <div className="form-group">
                <label className="form-label form-required">Upload Dokumen / File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg,.svg"
                />

                {uploading ? (
                  <div style={{
                    padding: '24px',
                    borderRadius: '10px',
                    border: '2px dashed var(--accent-primary)',
                    background: 'rgba(59, 130, 246, 0.05)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div className="spinner" style={{ width: '28px', height: '28px' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mengunggah file ke server...</span>
                  </div>
                ) : form.url ? (
                  <div style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid var(--accent-success)',
                    background: 'rgba(34, 197, 94, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <CheckCircle2 size={24} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {uploadedFileName || 'File Dokumen'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>
                          File siap disimpan
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <RefreshCw size={13} /> Ganti File
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '28px 16px',
                      borderRadius: '10px',
                      border: '2px dashed var(--border-subtle)',
                      background: 'var(--bg-hover)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UploadCloud size={24} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.9rem' }}>Klik untuk pilih file</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}> dari komputer</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Mendukung PDF, Word, Excel, PPT, Zip, Gambar
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label form-required">URL / Link Dokumen</label>
                <input
                  className="form-input"
                  name="url"
                  type="url"
                  value={form.url}
                  onChange={handleChange}
                  placeholder="https://docs.google.com/... atau https://figma.com/..."
                  required
                />
              </div>
            )}

            {/* Judul Dokumen */}
            <div className="form-group">
              <label className="form-label form-required">Judul Dokumen</label>
              <input
                className="form-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="cth: PRD Dokumentasi, Figma Design, SOP System"
                required
              />
            </div>

            {/* Deskripsi */}
            <div className="form-group">
              <label className="form-label">Deskripsi (Opsional)</label>
              <textarea
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Keterangan singkat tentang dokumen atau tautan ini..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading || uploading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploading || (form.type === 'file' && !form.url)}>
              {loading ? 'Menyimpan...' : 'Simpan Dokumen'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
