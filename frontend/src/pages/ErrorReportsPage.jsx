import { useEffect, useState, useCallback } from 'react';
import { Search, Bug, Plus, Edit, Trash2, Calendar, User, Eye, Folder } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import BugHistoryModal from '../components/BugHistoryModal';

const STATUS_BADGES = {
  'Open': 'badge-warning',
  'Investigating': 'badge-info',
  'Resolved': 'badge-success',
  'Closed': 'badge-neutral',
};

const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export default function ErrorReportsPage() {
  const { toast, confirm } = useUI();
  const [bugs, setBugs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [appId, setAppId] = useState('');
  const [status, setStatus] = useState('');

  // Modals state
  const [activeBug, setActiveBug] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch apps available to the user
  const fetchApps = useCallback(async () => {
    try {
      const res = await api.get('/apps');
      setApps(res.data || []);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    }
  }, []);

  // Fetch bug reports
  const fetchBugs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (appId) params.appId = appId;
      if (search.trim()) params.search = search;
      const res = await api.get('/bug-histories', { params });
      let filtered = res.data || [];
      if (status) {
        filtered = filtered.filter(b => b.status === status);
      }
      setBugs(filtered);
    } catch (err) {
      toast('Gagal memuat laporan error', 'error');
    } finally {
      setLoading(false);
    }
  }, [appId, search, status, toast]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBugs();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, appId, status, fetchBugs]);

  const handleDelete = (id) => {
    confirm('Hapus Laporan Error', 'Apakah Anda yakin ingin menghapus laporan error ini?', async () => {
      try {
        await api.delete(`/bug-histories/${id}`);
        toast('Laporan error berhasil dihapus', 'success');
        fetchBugs();
      } catch {
        toast('Gagal menghapus laporan error', 'error');
      }
    }, 'danger');
  };

  const activeFilters = [search, appId, status].filter(Boolean).length;

  return (
    <div className="animate-fade-in" style={{ padding: '4px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Error Reports</h1>
          <p className="page-subtitle">
            Daftar kendala teknis dan error aplikasi yang dilaporkan.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={16} /> Catat Error Baru
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{
        padding: '16px 20px',
        marginBottom: '1.5rem',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flex: 1, minWidth: '280px', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.875rem' }}
              placeholder="Cari deskripsi error..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* App Filter */}
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.875rem' }}
              value={appId}
              onChange={e => setAppId(e.target.value)}
            >
              <option value="">Semua Aplikasi</option>
              {apps.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.875rem' }}
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="Open">🔴 Open</option>
              <option value="Investigating">🟡 Investigating</option>
              <option value="Resolved">🟢 Resolved</option>
              <option value="Closed">⚪ Closed</option>
            </select>
          </div>
        </div>

        {/* Counter & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
            Total <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{bugs.length}</span> laporan
          </div>
          {activeFilters > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.78rem', height: '28px', padding: '2px 8px' }}
              onClick={() => { setSearch(''); setAppId(''); setStatus(''); }}
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Bugs Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : bugs.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
          <Bug size={44} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.6 }} />
          <div className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Laporan error tidak ditemukan</div>
          <p className="empty-state-desc" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '6px auto 0' }}>
            Tidak ada laporan error yang cocok dengan filter atau belum ada laporan yang masuk.
          </p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '160px' }}>ID Error</th>
                <th style={{ width: '180px' }}>Aplikasi</th>
                <th>Deskripsi Error</th>
                <th style={{ width: '160px' }}>Pelapor</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '150px' }}>Tanggal Dilaporkan</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600 }}>{b.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                      <Folder size={13} style={{ color: 'var(--text-muted)' }} />
                      {apps.find(a => a.id === b.applicationId)?.name || 'Unknown Application'}
                    </div>
                  </td>
                  <td>
                    <div 
                      style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-secondary)',
                        maxWidth: '380px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={stripHtml(b.description)}
                    >
                      {stripHtml(b.description) || '—'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                      <User size={13} style={{ color: 'var(--text-muted)' }} />
                      {b.reportedBy || 'System'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGES[b.status] || 'badge-neutral'}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <Calendar size={13} />
                      {new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Edit Laporan"
                        onClick={() => setActiveBug(b)}
                        style={{ width: '28px', height: '28px', padding: 0 }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Hapus Laporan"
                        onClick={() => handleDelete(b.id)}
                        style={{ color: 'var(--accent-danger)', width: '28px', height: '28px', padding: 0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showAddForm && (
        <BugHistoryModal
          onClose={() => setShowAddForm(false)}
          onSuccess={() => { setShowAddForm(false); fetchBugs(); }}
        />
      )}

      {activeBug && (
        <BugHistoryModal
          bug={activeBug}
          onClose={() => setActiveBug(null)}
          onSuccess={() => { setActiveBug(null); fetchBugs(); }}
        />
      )}
    </div>
  );
}
