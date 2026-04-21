import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, Shield, Mail, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function DeveloperPickerModal({ onClose, onSelect, roles = [] }) {
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'manual'
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: roles[0]?.id || ''
  });
  const { toast } = useUI();

  useEffect(() => {
    if (activeTab === 'system') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      // Filter out admins if needed, or just show all approved users
      setUsers(res.data.filter(u => u.isApproved));
    } catch {
      toast('Gagal memuat daftar user', 'error');
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.roleId) {
      return toast('Nama dan Role wajib diisi', 'warning');
    }
    onSelect({
      name: formData.name,
      email: formData.email,
      roleId: formData.roleId,
      userId: null
    });
  };

  const handleSystemSelect = (user) => {
    onSelect({
      userId: user.id,
      name: user.name,
      email: user.email,
      roleId: formData.roleId || (roles[0]?.id || null)
    });
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div 
        className="modal" 
        style={{ width: 500 }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Tambah Developer</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="tabs" style={{ marginBottom: 'var(--space-4)', padding: '0 var(--space-6)' }}>
          <button 
            className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            Pilih dari User
          </button>
          <button 
            className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            Input Manual
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 'system' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: 36 }}
                  placeholder="Cari nama atau email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Role untuk Developer ini</label>
                <select 
                  className="form-select"
                  value={formData.roleId}
                  onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                >
                  <option value="">Pilih Role...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}><div className="spinner" /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {filteredUsers.length === 0 ? (
                    <div className="empty-state" style={{ padding: 'var(--space-4)' }}>User tidak ditemukan</div>
                  ) : (
                    filteredUsers.map(user => (
                      <button 
                        key={user.id} 
                        className="btn btn-ghost" 
                        style={{ justifyContent: 'flex-start', padding: 'var(--space-3)', height: 'auto', textAlign: 'left', border: '1px solid var(--border-subtle)' }}
                        onClick={() => handleSystemSelect(user)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {user.picture ? <img src={user.picture} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <User size={18} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                          </div>
                          <UserPlus size={16} color="var(--accent-primary)" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Nama Developer</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: John Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email (Opsional)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select 
                  className="form-select"
                  value={formData.roleId}
                  onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                  required
                >
                  <option value="">Pilih Role...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-2)' }}>
                <UserPlus size={18} /> Tambah Developer Manual
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>,
    document.getElementById('modal-root')
  );
}
