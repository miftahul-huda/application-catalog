import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import {
  UserCircle as UserCircleIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  ShieldCheck as ShieldCheckIcon
} from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { showToast, confirm } = useUI();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      showToast('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const ok = await confirm('Approve User', 'Are you sure you want to approve this user?');
    if (!ok) return;
    try {
      await api.patch(`/users/${id}/approve`);
      showToast('success', 'User approved successfully');
      fetchUsers();
    } catch (err) {
      showToast('error', 'Failed to approve user');
    }
  };

  const handleRevoke = async (id) => {
    const ok = await confirm('Revoke Access', 'Are you sure you want to revoke this user\'s access?');
    if (!ok) return;
    try {
      await api.patch(`/users/${id}/revoke`);
      showToast('success', 'User access revoked');
      fetchUsers();
    } catch (err) {
      showToast('error', 'Failed to revoke access');
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === 'Admin' ? 'User' : 'Admin';
    const ok = await confirm('Change Role', `Change role to ${newRole}?`);
    if (!ok) return;
    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      showToast('success', 'Role updated successfully');
      fetchUsers();
    } catch (err) {
      showToast('error', 'Failed to update role');
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
            <p className="page-subtitle">Manage user access and roles</p>
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
                <UserCircleIcon style={{ width: '48px', height: '48px', color: 'var(--text-secondary)' }} />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{u.name}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`status-badge ${u.isApproved ? 'status-active' : 'status-inactive'}`}>
                  {u.isApproved ? 'Approved' : 'Pending/Revoked'}
                </span>
                <span className={`status-badge ${u.role === 'Admin' ? 'status-admin' : 'status-user'}`}
                      style={{ 
                        background: u.role === 'Admin' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                        color: u.role === 'Admin' ? 'var(--primary)' : 'var(--text-secondary)'
                      }}>
                  {u.role}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {u.id !== currentUser.id && (
                <>
                  {!u.isApproved ? (
                    <button className="btn btn-primary" style={{ flex: 1, padding: '8px' }} onClick={() => handleApprove(u.id)}>
                      <CheckCircleIcon style={{ width: '18px' }} />
                      Approve
                    </button>
                  ) : (
                    <button className="btn btn-outline" style={{ flex: 1, padding: '8px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleRevoke(u.id)}>
                      <XCircleIcon style={{ width: '18px' }} />
                      Revoke
                    </button>
                  )}
                  <button className="btn btn-outline" style={{ flex: 1, padding: '8px' }} onClick={() => handleRoleChange(u.id, u.role)}>
                    Toggle Role
                  </button>
                </>
              )}
              {u.id === currentUser.id && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', width: '100%' }}>
                  (This is you)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
