import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Info, User, Calendar, Hash, Upload, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';

export default function AppFormModal({ app, groupId, categories, functions, onClose, onSuccess }) {
  const { toast } = useUI();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [form, setForm] = useState({
    name: '', 
    groupId: groupId || '',
    categoryId: '', 
    functionId: '',
    icon: '',
  });

  useEffect(() => {
    if (app) {
      setForm({
        name: app.name || '',
        groupId: app.groupId || groupId || '',
        categoryId: app.categoryId || '',
        functionId: app.functionId || '',
        icon: app.icon || '',
      });
    }
  }, [app, groupId]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Nama aplikasi wajib diisi', 'error'); return; }
    if (!form.categoryId) { toast('Kategori wajib dipilih', 'error'); return; }
    if (!form.functionId) { toast('Fungsi wajib dipilih', 'error'); return; }
    
    setLoading(true);
    try {
      if (app) {
        await api.put(`/apps/${app.id}`, form);
        toast('Aplikasi berhasil diperbarui', 'success');
      } else {
        await api.post('/apps', form);
        toast('Aplikasi berhasil ditambahkan', 'success');
      }
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
    setLoading(false);
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast('File terlalu besar (max 5MB)', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', 'apps');
    formData.append('moduleId', app?.id || 'TEMP_ICON');
    formData.append('type', 'image');

    setUploadingIcon(true);
    try {
      const res = await api.post('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({ ...f, icon: res.data.url }));
      toast('Icon berhasil diunggah', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal mengunggah icon', 'error');
    }
    setUploadingIcon(false);
  };


  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <span className="modal-title">{app ? 'Edit Info Aplikasi' : 'Tambah Aplikasi Baru'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            {/* Auto Info Section (Read-only) */}
            <div style={{ background: 'var(--bg-hover)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Hash size={16} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application ID</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {app ? app.id : `APPI-${groupId}-XXX (Auto)`}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <User size={16} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created By</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {app ? (app.creator?.name || 'Unknown') : currentUser?.name}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Calendar size={16} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created At</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {app ? new Date(app.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : today}
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="form-group">
              <label className="form-label form-required">Application Name</label>
              <input 
                name="name" 
                className="form-input" 
                placeholder="Contoh: Internal CRM Mobile" 
                value={form.name} 
                onChange={handleChange} 
                required 
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label form-required">Application Category</label>
              <select name="categoryId" className="form-select" value={form.categoryId} onChange={handleChange} required>
                <option value="">— Pilih Kategori —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-required">Application Function</label>
              <select name="functionId" className="form-select" value={form.functionId} onChange={handleChange} required>
                <option value="">— Pilih Fungsi —</option>
                {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Application Icon (URL or Emoji)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '12px', 
                  background: 'var(--bg-hover)', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {form.icon?.startsWith('http') ? (
                    <img src={form.icon} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="icon" />
                  ) : (
                    form.icon || (form.name ? form.name[0].toUpperCase() : '?')
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    name="icon" 
                    className="form-input" 
                    placeholder="URL gambar atau ketik emoji..." 
                    value={form.icon} 
                    onChange={handleChange} 
                  />
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                      onChange={handleIconUpload} 
                    />
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingIcon}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '4px 10px', border: '1px solid var(--border-subtle)' }}
                    >
                      {uploadingIcon ? <div className="spinner" style={{width:12,height:12}}/> : <Upload size={14} />}
                      Upload Image
                    </button>
                    <div style={{ width: '1px', background: 'var(--border-subtle)', margin: '0 4px' }} />
                    {['🚀', '💻', '📱', '🔒', '📦', '⚙️', '📊', '🌐', '🛡️'].map(emoji => (
                      <button 
                        key={emoji}
                        type="button" 
                        onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:14,height:14}}/> Menyimpan...</> : (app ? 'Simpan Perubahan' : 'Tambah Aplikasi')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
