/**
 * BacklogList — Reusable self-contained backlog list component
 * Fetches its own data and handles all filters internally.
 *
 * Props:
 *   applicationId  - restrict to single app (used in AppDetailPage); omit for global view
 *   showAppLink    - show application name link badge on each card (default false)
 *   showAppFilter  - show "Aplikasi" filter dropdown (default false)
 *   apps           - array of {id, name} for app filter dropdown (required when showAppFilter=true)
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Folder, User, Calendar, ChevronDown, ChevronUp, Edit, Trash2, History, Plus, Search } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import BacklogFormModal from './BacklogFormModal';

const STATUS_COLORS = {
  'Requested':  'badge-warning',
  'In Progress':'badge-info',
  'Canceled':   'badge-danger',
  'Done':       'badge-success',
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

function Avatar({ user, size = 22 }) {
  if (!user) return null;
  return (
    <div title={`${user.name} (${user.email || ''})`} style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', flexShrink: 0,
      border: '2px solid var(--bg-card)',
      background: 'var(--gradient-brand)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: `${size * 0.4}px`, color: '#fff', fontWeight: 700
    }}>
      {user.picture
        ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : user.name?.[0]?.toUpperCase()}
    </div>
  );
}

export default function BacklogList({
  applicationId,
  showAppLink = false,
  showAppFilter = false,
  apps = [],
}) {
  const { confirm, toast } = useUI();

  // Data
  const [backlogs, setBacklogs] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterAppId, setFilterAppId] = useState('');
  const [filterStatusId, setFilterStatusId] = useState('');
  const [filterAssigneeId, setFilterAssigneeId] = useState('');

  // UI states
  const [expandedBacklogs, setExpandedBacklogs] = useState(new Set());
  const [editBacklog, setEditBacklog] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch statuses and users once
  const fetchOptions = useCallback(async () => {
    try {
      const [statusesRes, usersRes] = await Promise.all([
        api.get('/master/statuses'),
        api.get('/users/approved')
      ]);
      setStatuses(statusesRes.data || []);
      setAllUsers(usersRes.data || []);
    } catch {
      // non-critical
    }
  }, []);

  // Fetch backlog data based on active filters
  const fetchBacklogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (applicationId) params.appId = applicationId;
      else if (filterAppId) params.appId = filterAppId;
      if (filterStatusId) params.statusId = filterStatusId;
      if (filterAssigneeId) params.assigneeId = filterAssigneeId;
      if (search.trim()) params.search = search;

      const res = await api.get('/backlogs', { params });
      setBacklogs(res.data || []);
    } catch {
      toast('Gagal memuat daftar backlog', 'error');
    } finally {
      setLoading(false);
    }
  }, [applicationId, filterAppId, filterStatusId, filterAssigneeId, search, toast]);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  useEffect(() => {
    const t = setTimeout(() => fetchBacklogs(), 300);
    return () => clearTimeout(t);
  }, [search, filterAppId, filterStatusId, filterAssigneeId, fetchBacklogs]);

  const toggleBacklog = (id) => {
    setExpandedBacklogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (id, newStatusId) => {
    try {
      await api.patch(`/backlogs/${id}`, { statusId: newStatusId });
      toast('Status berhasil diperbarui', 'success');
      fetchBacklogs();
    } catch {
      toast('Gagal memperbarui status', 'error');
    }
  };

  const handleDelete = (id) => {
    confirm('Hapus Backlog', 'Yakin ingin menghapus backlog ini? Tindakan ini tidak dapat dibatalkan.', async () => {
      try {
        await api.delete(`/backlogs/${id}`);
        toast('Backlog berhasil dihapus', 'success');
        fetchBacklogs();
      } catch {
        toast('Gagal menghapus backlog', 'error');
      }
    }, 'danger');
  };

  const activeFilterCount = [filterAppId, filterStatusId, filterAssigneeId, search].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Filters toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 30, height: 34, fontSize: '0.85rem' }}
            placeholder="Cari konten backlog..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* App filter — only shown in global mode */}
        {showAppFilter && apps.length > 0 && (
          <select
            className="form-select"
            style={{ height: 34, fontSize: '0.85rem', minWidth: 180 }}
            value={filterAppId}
            onChange={e => setFilterAppId(e.target.value)}
          >
            <option value="">Semua Aplikasi</option>
            {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}

        {/* Status filter */}
        <select
          className="form-select"
          style={{ height: 34, fontSize: '0.85rem', minWidth: 140 }}
          value={filterStatusId}
          onChange={e => setFilterStatusId(e.target.value)}
        >
          <option value="">Semua Status</option>
          {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {/* Assigned To filter */}
        <select
          className="form-select"
          style={{ height: 34, fontSize: '0.85rem', minWidth: 180 }}
          value={filterAssigneeId}
          onChange={e => setFilterAssigneeId(e.target.value)}
        >
          <option value="">Semua Assignee</option>
          {allUsers.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>

        {/* Counter + clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{backlogs.length}</span> backlog
          </span>
          {activeFilterCount > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.75rem', padding: '2px 8px', height: 28 }}
              onClick={() => { setSearch(''); setFilterAppId(''); setFilterStatusId(''); setFilterAssigneeId(''); }}
            >
              Reset filter
            </button>
          )}
          <button className="btn btn-primary btn-sm" style={{ height: 34 }} onClick={() => setShowAddForm(true)}>
            <Plus size={13} /> Add Backlog
          </button>
        </div>
      </div>

      {/* List body */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <div className="spinner" />
        </div>
      ) : backlogs.length === 0 ? (
        <div className="empty-state" style={{ padding: '48px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
          <Clock size={40} style={{ color: 'var(--text-muted)', marginBottom: 10, opacity: 0.6 }} />
          <div className="empty-state-title" style={{ fontSize: '1rem', fontWeight: 600 }}>Belum ada backlog</div>
          {activeFilterCount > 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 12px' }}>Coba hapus filter atau ubah kata kunci pencarian.</p>
          )}
          <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowAddForm(true)}>
            <Plus size={14} /> Tambah Backlog
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {backlogs.map(b => {
            const isExpanded = expandedBacklogs.has(b.id);
            return (
              <div key={b.id} className="card" style={{ padding: 0, width: '100%', borderColor: isExpanded ? 'var(--accent-primary)' : 'var(--border-subtle)', transition: 'border-color 0.2s ease', overflow: 'hidden' }}>

                {/* Top action bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 14px 0', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '2px 6px' }}>{b.id}</span>
                    <span className={`badge ${STATUS_COLORS[b.status?.name] || 'badge-neutral'}`} style={{ fontSize: '0.72rem', padding: '2px 8px' }}>{b.status?.name}</span>
                    {showAppLink && b.Application && (
                      <Link to={`/apps/${b.applicationId}`} style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Folder size={11} /> {b.Application.name}
                      </Link>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {b.creator && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} /> {b.creator.name}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} /> {new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      {b.hoursSpent > 0 && <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>⏱️ {b.hoursSpent}h</span>}
                    </div>
                    {b.assignees && b.assignees.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {b.assignees.slice(0, 4).map((a, i) => (
                          <div key={a.id} style={{ marginLeft: i === 0 ? 0 : -6 }}><Avatar user={a} size={20} /></div>
                        ))}
                        {b.assignees.length > 4 && (
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: -6 }}>
                            +{b.assignees.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <select
                      className="form-select"
                      style={{ width: 110, fontSize: '0.72rem', padding: '2px 4px', height: 26 }}
                      value={b.statusId}
                      onChange={e => { e.stopPropagation(); handleStatusChange(b.id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                    >
                      {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={e => { e.stopPropagation(); setEditBacklog(b); }} style={{ width: 26, height: 26, padding: 0 }}>
                      <Edit size={13} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Hapus" onClick={e => { e.stopPropagation(); handleDelete(b.id); }} style={{ color: 'var(--accent-danger)', width: 26, height: 26, padding: 0 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Clickable expand row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 10px', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleBacklog(b.id)}>
                  <div style={{ flex: 1, fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                    {(() => { const t = stripHtml(b.content); return t.length > 100 ? t.slice(0, 100) + '…' : (t || '—'); })()}
                  </div>
                  <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div onClick={e => e.stopPropagation()}>
                    <div className="ql-editor" style={{ padding: '14px 18px', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-hover)', borderTop: '1px solid var(--border-subtle)', maxHeight: 380, overflowY: 'auto', lineHeight: 1.65 }}
                      dangerouslySetInnerHTML={{ __html: b.content }}
                    />
                    {b.assignees && b.assignees.length > 0 && (
                      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={12} /> Assigned to:
                        </span>
                        {b.assignees.map(a => (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-hover)', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border-subtle)' }}>
                            <Avatar user={a} size={16} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{a.name} ({a.email})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {b.statusHistory && b.statusHistory.length > 0 && (
                      <div style={{ padding: '10px 18px 14px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          <History size={12} /> Riwayat Status
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {b.statusHistory.map(h => (
                            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', flexWrap: 'wrap' }}>
                              <Avatar user={h.changedByUser} size={18} />
                              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{h.changedByUser?.name}</span>
                              <span style={{ color: 'var(--text-muted)' }}>mengubah status</span>
                              {h.fromStatus && (
                                <>
                                  <span className={`badge ${STATUS_COLORS[h.fromStatus.name] || 'badge-neutral'}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>{h.fromStatus.name}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                                </>
                              )}
                              <span className={`badge ${STATUS_COLORS[h.toStatus?.name] || 'badge-neutral'}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>{h.toStatus?.name}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Calendar size={10} />
                                {new Date(h.changedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {editBacklog && (
        <BacklogFormModal statuses={statuses} backlog={editBacklog} onClose={() => setEditBacklog(null)} onSuccess={() => { setEditBacklog(null); fetchBacklogs(); }} />
      )}
      {showAddForm && (
        <BacklogFormModal applicationId={applicationId} statuses={statuses} onClose={() => setShowAddForm(false)} onSuccess={() => { setShowAddForm(false); fetchBacklogs(); }} />
      )}
    </div>
  );
}
