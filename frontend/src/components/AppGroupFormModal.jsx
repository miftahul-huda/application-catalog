import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Upload, Link as LinkIcon, ExternalLink, FileText, Check } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function AppGroupFormModal({ group, projects, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    projectId: '',
    ownerName: '',
    ownerEmail: '',
    description: '',
    documents: [],
  });

  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', description: '', url: '', type: 'link' });

  useEffect(() => {
    if (group) {
      setForm({
        name: group.name || '',
        projectId: group.projectId || '',
        ownerName: group.ownerName || '',
        ownerEmail: group.ownerEmail || '',
        description: group.description || '',
        documents: Array.isArray(group.documents) ? group.documents : [],
      });
    }
  }, [group]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', 'AppGroup');
    if (group?.id) formData.append('moduleId', group.id);
    formData.append('type', 'document');

    try {
      const res = await api.post('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewDoc(prev => ({ 
        ...prev, 
        url: res.data.url, 
        type: 'file',
        fileName: file.name
      }));
      toast('File berhasil diunggah', 'success');
    } catch (err) {
      toast('Gagal mengunggah file', 'error');
    }
    setUploading(false);
  };

  const addDocument = () => {
    if (!newDoc.title || !newDoc.url) {
      toast('Judul dan URL/File wajib diisi', 'error');
      return;
    }
    setForm(prev => ({
      ...prev,
      documents: [...prev.documents, { ...newDoc, id: Date.now() }]
    }));
    setNewDoc({ title: '', description: '', url: '', type: 'link' });
  };

  const removeDocument = (id) => {
    setForm(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.id !== id)
    }));
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Nama group wajib diisi', 'error'); return; }
    setLoading(true);
    try {
      if (group) {
        await api.put(`/app-groups/${group.id}`, form);
        toast('Application Group berhasil diperbarui', 'success');
      } else {
        await api.post('/app-groups', form);
        toast('Application Group berhasil dibuat', 'success');
      }
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
    setLoading(false);
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{group ? 'Edit Application Group' : 'Buat Application Group Baru'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label form-required">Nama Application Group</label>
                <input
                  name="name"
                  className="form-input"
                  placeholder="Contoh: E-Commerce Platform"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project</label>
                <select name="projectId" className="form-select" value={form.projectId} onChange={handleChange}>
                  <option value="">— Pilih Project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Product Owner</label>
                <input
                  name="ownerName"
                  className="form-input"
                  placeholder="Nama Owner"
                  value={form.ownerName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Email Product Owner</label>
                <input
                  name="ownerEmail"
                  type="email"
                  className="form-input"
                  placeholder="email@example.com"
                  value={form.ownerEmail}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Deskripsi</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Deskripsi singkat application group ini..."
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              {/* Documents Section */}
              <div style={{ gridColumn: '1/-1', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="var(--accent-primary)" /> Documents & Resources
                  </h3>
                </div>

                <div style={{ background: 'var(--bg-hover)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.5fr auto', gap: '12px', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.85rem' }}>Judul Dokumen</label>
                      <input 
                        className="form-input" 
                        placeholder="e.g. Technical Spec" 
                        value={newDoc.title} 
                        onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.85rem' }}>Deskripsi Singkat</label>
                      <input 
                        className="form-input" 
                        placeholder="e.g. Versi 1.2" 
                        value={newDoc.description} 
                        onChange={e => setNewDoc({ ...newDoc, description: e.target.value })} 
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.85rem' }}>File atau URL</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input 
                            className="form-input" 
                            placeholder={newDoc.type === 'file' ? newDoc.fileName : "https://..."} 
                            value={newDoc.type === 'link' ? newDoc.url : ''} 
                            onChange={e => setNewDoc({ ...newDoc, url: e.target.value, type: 'link' })}
                            disabled={newDoc.type === 'file'}
                          />
                        </div>
                        <label className={`btn btn-sm ${newDoc.type === 'file' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0 10px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
                          {uploading ? <div className="spinner" style={{width:14,height:14}}/> : <Upload size={14} />}
                        </label>
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={addDocument} style={{ height: '40px', padding: '0 12px' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {form.documents.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {doc.type === 'file' ? <FileText size={18} color="var(--accent-primary)" /> : <LinkIcon size={18} color="var(--accent-info)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.description || 'Tanpa deskripsi'} — <span style={{ fontFamily: 'var(--font-mono)' }}>{doc.url.split('/').pop().substring(0, 20)}...</span></div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon btn-sm">
                          <ExternalLink size={14} />
                        </a>
                        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeDocument(doc.id)}>
                          <Trash2 size={14} color="var(--accent-danger)" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.documents.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-hover)', borderRadius: '12px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Belum ada dokumen yang ditambahkan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:14,height:14}}/> Menyimpan...</> : (group ? 'Simpan Perubahan' : 'Buat Group')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
