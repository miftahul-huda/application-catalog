import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const PLATFORMS = ['VM', 'Managed VM Group', 'Kubernetes', 'Docker Swarm', 'Cloud Run', 'App Engine', 'Other'];

export default function DeploymentFormModal({ applicationId, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    applicationId,
    url: '',
    platform: '',
    instructions: '',
    testingInstructions: '',
  });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditorChange = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.url) { toast('URL Deployment wajib diisi', 'error'); return; }
    setLoading(true);
    try {
      await api.post('/deployments', form);
      toast('Deployment berhasil ditambahkan', 'success');
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
    setLoading(false);
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'code-block'],
      ['clean']
    ],
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ width: 800 }}>
        <div className="modal-header">
          <span className="modal-title">Tambah Deployment</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
              
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label form-required">URL Deployment</label>
                <input type="url" name="url" className="form-input" placeholder="https://myapp.staging.com" value={form.url} onChange={handleChange} required />
              </div>

              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Platform</label>
                <select name="platform" className="form-select" value={form.platform} onChange={handleChange}>
                  <option value="">— Pilih Platform —</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Cara Deployment</label>
                <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <ReactQuill 
                    theme="snow" 
                    value={form.instructions} 
                    onChange={(val) => handleEditorChange('instructions', val)}
                    style={{ height: '200px' }}
                    modules={quillModules}
                  />
                </div>
                <div style={{ height: '45px' }} />
              </div>

              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Cara Testing Deployment</label>
                <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <ReactQuill 
                    theme="snow" 
                    value={form.testingInstructions} 
                    onChange={(val) => handleEditorChange('testingInstructions', val)}
                    style={{ height: '150px' }}
                    modules={quillModules}
                  />
                </div>
                <div style={{ height: '45px' }} />
              </div>

            </div>
          </div>
          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:14,height:14}}/> Menyimpan...</> : 'Tambah Deployment'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
