import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function DocFormModal({ applicationId, doc, onClose, onSuccess }) {
  const { toast } = useUI();
  const [title, setTitle] = useState(doc ? doc.title : '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Judul dokumentasi wajib diisi', 'error');
      return;
    }

    setLoading(true);
    try {
      if (doc) {
        // Edit mode
        await api.put(`/documentations/${doc.id}`, { title });
        toast('Judul dokumentasi berhasil diperbarui', 'success');
      } else {
        // Create mode
        await api.post('/documentations', {
          applicationId,
          title,
          content: '' // default empty content
        });
        toast('Dokumentasi baru berhasil ditambahkan', 'success');
      }
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyimpan dokumentasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <span className="modal-title">{doc ? 'Ubah Judul Dokumentasi' : 'Tambah Dokumentasi Baru'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label form-required">Judul Dokumen</label>
              <input
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="cth: Panduan Instalasi, Arsitektur Sistem"
                required
                autoFocus
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
