import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import {
  UserCircle as UserCircleIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  ShieldCheck as ShieldCheckIcon,
  Edit,
  X,
  Check,
  Folder
} from 'lucide-react';
import { createPortal } from 'react-dom';

function UserEditModal({ userToEdit, apps, onClose, onSave }) {
  const [role, setRole] = useState(userToEdit.role || 'User');
  const [allowedApps, setAllowedApps] = useState(
    userToEdit.allowedApplications?.map(a => a.id) || []
  );
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleApp = (id) => {
    setAllowedApps(prev =>
      prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
    );
  };

  const filteredApps = apps.filter(app =>
    app.name?.toLowerCase().includes(search.toLowerCase()) ||
    app.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        role,
        allowedApplicationIds: role === 'External' ? allowedApps : []
      });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <span className="modal-title">Edit Peran & Akses Pengguna</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* User Info card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-hover)', padding: '10px 14px', borderRadius: '8px' }}>
              {userToEdit.picture ? (
                <img src={userToEdit.picture} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>
                  {userToEdit.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{userToEdit.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{userToEdit.email}</div>
              </div>
            </div>

            {/* Role selection */}
            <div className="form-group">
              <label className="form-label form-required">Peran (Role)</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="User">User (Internal)</option>
                <option value="Admin">Admin</option>
                <option value="External">External User</option>
              </select>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {role === 'External' 
                  ? 'External User hanya bisa mengakses menu Bug/Error log untuk aplikasi yang ditentukan.' 
                  : 'User Internal / Admin memiliki akses penuh ke seluruh modul sistem.'}
              </p>
            </div>

            {/* Allowed apps (only visible if role is External) */}
            {role === 'External' && (
              <div className="form-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <label className="form-label form-required">Aplikasi yang Diizinkan ({allowedApps.length})</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cari nama aplikasi..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ marginBottom: '10px', height: '34px', fontSize: '0.85rem' }}
                />

                <div style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  background: 'var(--bg-card)'
                }}>
                  {filteredApps.length === 0 ? (
                    <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Aplikasi tidak ditemukan
                    </div>
                  ) : (
                    filteredApps.map(app => {
                      const checked = allowedApps.includes(app.id);
                      return (
                        <div
                          key={app.id}
                          onClick={() => toggleApp(app.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            background: checked ? 'var(--bg-hover)' : 'none',
                            userSelect: 'none'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}} // handled by parent onClick
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Folder size={14} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{app.name}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Akses'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { toast, confirm } = useUI();
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchApps();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      toast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApps = async () => {
    try {
      const { data } = await api.get('/apps');
      setApps(data || []);
    } catch {
      // non-critical
    }
  };

  const handleApprove = async (id) => {
    const ok = await confirm('Approve User', 'Are you sure you want to approve this user?');
    if (!ok) return;
    try {
      await api.patch(`/users/${id}/approve`);
      toast('User approved successfully', 'success');
      fetchUsers();
    } catch (err) {
      toast('Failed to approve user', 'error');
    }
  };

  const handleRevoke = async (id) => {
    const ok = await confirm('Revoke Access', 'Are you sure you want to revoke this user\'s access?');
    if (!ok) return;
    try {
      await api.patch(`/users/${id}/revoke`);
      toast('User access revoked', 'success');
      fetchUsers();
    } catch (err) {
      toast('Failed to revoke access', 'error');
    }
  };

  const handleSaveUserAccess = async (payload) => {
    try {
      await api.patch(`/users/${editingUser.id}/role`, payload);
      toast('Role and access updated successfully', 'success');
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast('Failed to update role and access', 'error');
    }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--primary-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldCheckIcon style={{ width: '28px', height: '28px', color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage user roles, approvals, and application access settings.</p>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {users.map((u) => (
          <div key={u.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {u.picture ? (
                <img src={u.picture} alt={u.name} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`status-badge ${u.isApproved ? 'status-active' : 'status-inactive'}`}>
                  {u.isApproved ? 'Approved' : 'Pending/Revoked'}
                </span>
                <span className={`status-badge`}
                      style={{
                        background: u.role === 'Admin' ? 'var(--primary-light)' : u.role === 'External' ? 'var(--accent-warning-light, #fffbe6)' : 'var(--bg-secondary)',
                        color: u.role === 'Admin' ? 'var(--primary)' : u.role === 'External' ? 'var(--accent-warning, #d46b08)' : 'var(--text-secondary)',
                        border: u.role === 'External' ? '1px solid #ffe58f' : 'none'
                      }}>
                  {u.role || 'User'}
                </span>
              </div>

              {u.role === 'External' && (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', background: 'var(--bg-hover)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Aplikasi yang Diakses ({u.allowedApplications?.length || 0}):</div>
                  {u.allowedApplications && u.allowedApplications.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {u.allowedApplications.map(app => (
                        <span key={app.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.72rem' }}>
                          <Folder size={10} /> {app.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada akses aplikasi</span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              {u.id !== currentUser.id && (
                <>
                  {!u.isApproved ? (
                    <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} onClick={() => handleApprove(u.id)}>
                      <CheckCircleIcon style={{ width: '16px' }} />
                      Approve
                    </button>
                  ) : (
                    <button className="btn btn-outline" style={{ flex: 1, padding: '8px', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)', fontSize: '0.85rem' }} onClick={() => handleRevoke(u.id)}>
                      <XCircleIcon style={{ width: '16px' }} />
                      Revoke
                    </button>
                  )}
                  <button className="btn btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} onClick={() => setEditingUser(u)}>
                    <Edit style={{ width: '15px' }} />
                    Akses / Peran
                  </button>
                </>
              )}
              {u.id === currentUser.id && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', width: '100%' }}>
                  (Ini Anda)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingUser && (
        <UserEditModal
          userToEdit={editingUser}
          apps={apps}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUserAccess}
        />
      )}
    </div>
  );
}
