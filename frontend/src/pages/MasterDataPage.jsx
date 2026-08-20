import { useState, useEffect } from 'react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import {
  Folder as FolderIcon,
  Tag as TagIcon,
  List as ListBulletIcon,
  Users as UserGroupIcon,
  BadgeCheck as CheckBadgeIcon,
  Server as ServerIcon,
  Globe as GlobeIcon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash as TrashIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'projects', label: 'Projects', icon: FolderIcon, endpoint: '/master/projects' },
  { id: 'categories', label: 'Categories', icon: TagIcon, endpoint: '/master/categories' },
  { id: 'functions', label: 'Functions', icon: ListBulletIcon, endpoint: '/master/functions' },
  { id: 'roles', label: 'Developer Roles', icon: UserGroupIcon, endpoint: '/master/roles' },
  { id: 'statuses', label: 'Backlog Statuses', icon: CheckBadgeIcon, endpoint: '/master/statuses' },
  { id: 'platforms', label: 'Deployment Platforms', icon: ServerIcon, endpoint: '/master/platforms' },
  { id: 'environments', label: 'Environments', icon: GlobeIcon, endpoint: '/master/environments' },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast, confirm } = useUI();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const activeTabConfig = TABS.find(t => t.id === activeTab);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(activeTabConfig.endpoint);
      setData(res.data);
    } catch (err) {
      showToast('error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, description: item.description || '' });
    } else {
      setEditingItem(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`${activeTabConfig.endpoint}/${editingItem.id}`, formData);
        showToast('success', 'Item updated successfully');
      } else {
        await api.post(activeTabConfig.endpoint, formData);
        showToast('success', 'Item created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Delete Item', 'Are you sure you want to delete this item? This action is irreversible.');
    if (!ok) return;
    try {
      await api.delete(`${activeTabConfig.endpoint}/${id}`);
      showToast('success', 'Item deleted successfully');
      fetchData();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to delete item');
    }
  };

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Master Data Management</h1>
        <p className="page-subtitle">Configure dropdown options and system classifications</p>
      </div>

      <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px', border: 'none', borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseOut={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Icon style={{ width: '18px', height: '18px' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {activeTabConfig && <activeTabConfig.icon style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />}
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{activeTabConfig?.label}</h2>
            </div>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <PlusIcon style={{ width: '20px' }} />
              Add Item
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : data.length === 0 ? (
              <div className="empty-state">
                <p>No items found in this category.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600, width: '120px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px' }}>{item.name}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{item.description || '-'}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button className="icon-btn" onClick={() => handleOpenModal(item)}>
                            <PencilIcon style={{ width: '16px' }} />
                          </button>
                          <button className="icon-btn" onClick={() => handleDelete(item.id)} style={{ color: 'var(--accent-danger)' }}>
                            <TrashIcon style={{ width: '16px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>


      <AnimatePresence>
      {isModalOpen && (
        <motion.div 
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <motion.div 
            className="modal" 
            style={{ maxWidth: '400px', background: 'var(--bg-surface)' }}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Item' : 'New Item'}</h3>
              <button className="icon-btn" onClick={handleCloseModal}><PlusIcon style={{ transform: 'rotate(45deg)', width: '20px' }} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Finance"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
