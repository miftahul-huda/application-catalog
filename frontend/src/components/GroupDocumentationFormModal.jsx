import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, GitFork } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import MermaidDesignerModal from './MermaidDesignerModal';

const DOC_TYPES = [
  'SRS',
  'Architecture & Topology',
  'ERD',
  'Setup & Onboarding',
  'Code Standard & Convention',
  'Testing',
  'CI/CD',
  'Runbook & Incident Management',
  'Disaster Recovery Plan',
  'User Manual/FAQ',
  'Other',
];

export default function GroupDocumentationFormModal({ groupId, doc, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [showDiagramDesigner, setShowDiagramDesigner] = useState(false);
  const quillRef = useRef(null);

  const [form, setForm] = useState({
    type: doc?.type || DOC_TYPES[0],
    title: doc?.title || '',
    shortDescription: doc?.shortDescription || '',
    content: doc?.content || '',
  });

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditorChange = (content) => setForm(f => ({ ...f, content }));

  const handleInsertDiagram = (pngDataUrl) => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const range = quillRef.current.getEditorSelection() || { index: editor.getLength(), length: 0 };
      editor.insertEmbed(range.index, 'image', pngDataUrl, 'user');
      editor.setSelection(range.index + 1, 0, 'user');
      setForm(f => ({ ...f, content: editor.root.innerHTML }));
    }
    setShowDiagramDesigner(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Title wajib diisi', 'error');
      return;
    }
    setLoading(true);
    try {
      if (doc) {
        await api.put(`/group-documentations/${doc.id}`, form);
        toast('Documentation berhasil diperbarui', 'success');
      } else {
        await api.post('/group-documentations', { ...form, groupId });
        toast('Documentation berhasil ditambahkan', 'success');
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
          <span className="modal-title">{doc ? 'Edit Documentation' : 'Tambah Documentation'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label form-required">Jenis Documentation</label>
              <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-required">Title</label>
              <input
                type="text"
                name="title"
                className="form-input"
                placeholder="Judul dokumen..."
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
                placeholder="Ringkasan singkat isi dokumen..."
                value={form.shortDescription}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Content</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}
                  onClick={() => setShowDiagramDesigner(true)}
                >
                  <GitFork size={13} /> Add Diagram
                </button>
              </div>
              <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={form.content}
                  onChange={handleEditorChange}
                  style={{ height: '260px' }}
                  placeholder="Tulis isi dokumentasi di sini..."
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
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : (doc ? 'Simpan Perubahan' : 'Tambah Documentation')}
            </button>
          </div>
        </form>
      </div>

      {showDiagramDesigner && (
        <MermaidDesignerModal
          onClose={() => setShowDiagramDesigner(false)}
          onInsert={handleInsertDiagram}
        />
      )}
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
