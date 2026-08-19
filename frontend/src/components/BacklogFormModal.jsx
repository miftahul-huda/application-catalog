import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

function AssigneeCombo({ allUsers, assigneeIds, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedUsers = allUsers.filter(u => assigneeIds.includes(u.id));
  const filteredOptions = allUsers.filter(u => {
    if (assigneeIds.includes(u.id)) return false; // already added
    const q = query.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const addUser = (user) => {
    onChange([...assigneeIds, user.id]);
    setQuery('');
    setOpen(false);
  };

  const removeUser = (userId) => {
    onChange(assigneeIds.filter(id => id !== userId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Search input */}
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 32, fontSize: '0.875rem', height: 36 }}
            placeholder="Cari nama atau email developer..."
            value={query}
            onFocus={() => setOpen(true)}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
          />
        </div>

        {/* Dropdown list */}
        {open && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: 200,
            overflowY: 'auto',
            marginTop: 4
          }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {query ? 'Pengguna tidak ditemukan' : 'Semua pengguna sudah dipilih'}
              </div>
            ) : (
              filteredOptions.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); addUser(u); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s ease',
                    borderRadius: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--gradient-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: '#fff', fontWeight: 700,
                    overflow: 'hidden', flexShrink: 0
                  }}>
                    {u.picture
                      ? <img src={u.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : u.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <UserPlus size={14} style={{ marginLeft: 'auto', color: 'var(--accent-primary)', flexShrink: 0 }} />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected assignees list */}
      {selectedUsers.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '8px 10px',
          background: 'var(--bg-hover)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          {selectedUsers.map(u => (
            <div key={u.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 6px',
              background: 'var(--bg-card)',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', color: '#fff', fontWeight: 700,
                overflow: 'hidden', flexShrink: 0
              }}>
                {u.picture
                  ? <img src={u.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : u.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <button
                type="button"
                onClick={() => removeUser(u.id)}
                style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                  color: 'var(--accent-danger)',
                  transition: 'all 0.15s ease'
                }}
                title={`Hapus ${u.name}`}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-danger)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent-danger)'; }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedUsers.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          Belum ada developer yang dipilih.
        </p>
      )}
    </div>
  );
}

export default function BacklogFormModal({ applicationId, statuses, backlog, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [form, setForm] = useState({
    applicationId: backlog ? backlog.applicationId : (applicationId || ''),
    content: backlog ? backlog.content : '',
    statusId: backlog ? backlog.statusId : (statuses.find(s => s.name === 'Requested')?.id || statuses[0]?.id || ''),
    hoursSpent: backlog ? (backlog.hoursSpent ?? 0) : 0,
    assigneeIds: backlog ? (backlog.assignees?.map(a => a.id) || []) : []
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users/approved');
      setAllUsers(res.data || []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      if (backlog) {
        await api.patch(`/backlogs/${backlog.id}`, form);
        toast('Backlog berhasil diperbarui', 'success');
      } else {
        await api.post('/backlogs', form);
        toast('Backlog berhasil ditambahkan', 'success');
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
          <span className="modal-title">{backlog ? 'Edit Backlog' : 'Tambah Backlog Baru'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Content Editor */}
            <div className="form-group">
              <label className="form-label form-required">Isi Backlog</label>
              <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <ReactQuill
                  theme="snow"
                  value={form.content}
                  onChange={handleEditorChange}
                  style={{ height: '220px' }}
                  placeholder="Deskripsikan request perubahan atau penambahan fitur..."
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
              <div style={{ height: '40px' }} />
            </div>

            {/* Status & Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: '4px' }}>
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

            {/* Assignees */}
            <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
              <label className="form-label">Assigned To</label>
              <AssigneeCombo
                allUsers={allUsers}
                assigneeIds={form.assigneeIds}
                onChange={(ids) => setForm(f => ({ ...f, assigneeIds: ids }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{width:14,height:14}}/> Menyimpan...</> : (backlog ? 'Simpan Perubahan' : 'Tambah Backlog')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
