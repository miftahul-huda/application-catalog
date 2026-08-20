import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function KnowledgeBaseFormModal({ item, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({
    title: item?.title || '',
    shortDescription: item?.shortDescription || '',
    content: item?.content || '',
    tags: item?.tags || []
  });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditorChange = (content) => setForm(f => ({ ...f, content }));

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (form.tags.includes(value)) {
      toast(`Tag "${value}" sudah ada`, 'info');
      setTagInput('');
      return;
    }
    setForm(f => ({ ...f, tags: [...f.tags, value] }));
    setTagInput('');
  };

  const removeTag = (index) => {
    setForm(f => ({ ...f, tags: f.tags.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Judul wajib diisi', 'error');
      return;
    }
    setLoading(true);
    try {
      if (item) {
        await api.put(`/knowledge-base/${item.id}`, form);
        toast('Knowledge base berhasil diperbarui', 'success');
      } else {
        await api.post('/knowledge-base', form);
        toast('Knowledge base berhasil ditambahkan', 'success');
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
          <span className="modal-title">{item ? 'Edit Knowledge Base' : 'Tambah Knowledge Base'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label form-required">Title</label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="Judul artikel knowledge base..."
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Short Description</label>
              <textarea
                name="shortDescription"
                className="form-input"
                rows={2}
                style={{ resize: 'vertical' }}
                placeholder="Ringkasan singkat isi artikel..."
                value={form.shortDescription}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Content</label>
              <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <ReactQuill
                  theme="snow"
                  value={form.content}
                  onChange={handleEditorChange}
                  style={{ height: '220px' }}
                  placeholder="Tulis isi knowledge base di sini..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                />
              </div>
              <div style={{ height: '40px' }} />
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
              <label className="form-label">Tags</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <input
                  className="form-input"
                  placeholder="Ketik tag lalu tekan Enter..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={addTag} style={{ padding: '0 12px' }}>
                  <Plus size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '34px', padding: '10px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                {form.tags.length > 0 ? form.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="badge badge-primary"
                    style={{ padding: '4px 8px 4px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(i)}
                      style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', display: 'flex' }}
                    >
                      <X size={13} />
                    </button>
                  </span>
                )) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Belum ada tag...</span>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : (item ? 'Simpan Perubahan' : 'Tambah Knowledge Base')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
