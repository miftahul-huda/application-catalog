import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function BacklogFormModal({ applicationId, statuses, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    applicationId,
    content: '',
    statusId: statuses.find(s => s.name === 'Requested')?.id || statuses[0]?.id || '',
    hoursSpent: 0,
  });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditorChange = (content) => setForm(f => ({ ...f, content }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim() || form.content === '<p><br></p>') { 
      toast('Isi backlog wajib diisi', 'error'); 
      return; 
    }
    setLoading(true);
    try {
      await api.post('/backlogs', form);
      toast('Backlog berhasil ditambahkan', 'success');
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
          <span className="modal-title">Tambah Backlog Baru</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label form-required">Isi Backlog</label>
              <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <ReactQuill 
                  theme="snow" 
                  value={form.content} 
                  onChange={handleEditorChange}
                  style={{ height: '300px' }}
                  placeholder="Deskripsikan request perubahan atau penambahan fitur. Anda bisa memasukkan gambar, link, atau memformat teks..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{'list': 'ordered'}, {'list': 'bullet'}],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                />
              </div>
              <div style={{ height: '40px' }} /> {/* Spacer for Quill fixed height */}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)', marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="statusId" className="form-select" value={form.statusId} onChange={handleChange}>
                  {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hours Spent</label>
                <input type="number" min="0" step="0.5" name="hoursSpent" className="form-input" value={form.hoursSpent} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:14,height:14}}/> Menyimpan...</> : 'Tambah Backlog'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
