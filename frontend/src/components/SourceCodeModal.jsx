import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, GitBranch, Globe } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function SourceCodeModal({ applicationId, sourceCode, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    applicationId,
    url: '',
    description: '',
  });

  useEffect(() => {
    if (sourceCode) {
      setForm({
        applicationId: sourceCode.applicationId || applicationId,
        url: sourceCode.url || '',
        description: sourceCode.description || '',
      });
    } else {
      setForm({
        applicationId,
        url: '',
        description: '',
      });
    }
  }, [sourceCode, applicationId]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.url.trim()) {
      toast('Github Link wajib diisi', 'error');
      return;
    }

    setLoading(true);
    try {
      if (sourceCode?.id) {
        await api.put(`/source-codes/${sourceCode.id}`, form);
        toast('Source Code berhasil diperbarui', 'success');
      } else {
        await api.post('/source-codes', form);
        toast('Source Code berhasil ditambahkan', 'success');
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
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch size={18} style={{ color: 'var(--accent-primary)' }} />
            <span className="modal-title">{sourceCode ? 'Edit Source Code' : 'Tambah Source Code'}</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label form-required">Github Link / Repository URL</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  name="url"
                  type="url"
                  value={form.url}
                  onChange={handleChange}
                  placeholder="https://github.com/organization/repository-name"
                  required
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Masukkan URL repository Github, Gitlab, atau Bitbucket terkait aplikasi ini.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Deskripsi Repository (Opsional)</label>
              <textarea
                className="form-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="cth: Main frontend repository (React/Vite), Backend microservice order-service, dll."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : (sourceCode ? 'Simpan Perubahan' : 'Tambah Source Code')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
