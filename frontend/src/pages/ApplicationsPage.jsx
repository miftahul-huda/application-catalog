import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Folder, Calendar, Tag, ArrowRight, Server, Code } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function ApplicationsPage() {
  const { toast } = useUI();
  const [apps, setApps] = useState([]);
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [functionId, setFunctionId] = useState('');

  // Fetch all filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [groupsRes, catsRes, funcsRes] = await Promise.all([
        api.get('/app-groups'),
        api.get('/master/categories'),
        api.get('/master/functions')
      ]);
      setGroups(groupsRes.data || []);
      setCategories(catsRes.data || []);
      setFunctions(funcsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch filter options', err);
    }
  }, []);

  // Fetch applications with filters
  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (groupId) params.groupId = groupId;
      if (categoryId) params.categoryId = categoryId;
      if (functionId) params.functionId = functionId;
      if (search.trim()) params.search = search;
      
      const res = await api.get('/apps', { params });
      setApps(res.data || []);
    } catch (err) {
      toast('Gagal memuat daftar aplikasi', 'error');
    } finally {
      setLoading(false);
    }
  }, [groupId, categoryId, functionId, search, toast]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchApps();
    }, 300); // Debounce search to prevent excessive API calls

    return () => clearTimeout(delayDebounceFn);
  }, [search, groupId, categoryId, functionId, fetchApps]);

  return (
    <div className="animate-fade-in" style={{ padding: '4px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Applications</h1>
          <p className="page-subtitle">
            Daftar seluruh aplikasi sistem yang terdaftar di dalam repositori katalog.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
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
              placeholder="Cari nama atau deskripsi aplikasi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Group Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.875rem' }}
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
            >
              <option value="">Semua Group</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.875rem' }}
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Function Filter */}
          <div style={{ minWidth: '150px' }}>
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.875rem' }}
              value={functionId}
              onChange={e => setFunctionId(e.target.value)}
            >
              <option value="">Semua Fungsi</option>
              {functions.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter */}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Menampilkan <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{apps.length}</span> aplikasi
        </div>
      </div>

      {/* Applications Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : apps.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
          <Server size={44} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.6 }} />
          <div className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Aplikasi tidak ditemukan</div>
          <p className="empty-state-desc" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '6px auto 0' }}>
            Tidak ada aplikasi yang cocok dengan pencarian atau filter yang Anda gunakan.
          </p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ background: 'var(--bg-card)' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '140px' }}>ID</th>
                <th>Aplikasi</th>
                <th>Application Group</th>
                <th>Kategori</th>
                <th>Fungsi</th>
                <th>Status</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(app => (
                <tr key={app.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                    {app.id}
                  </td>
                  <td>
                    <Link
                      to={`/apps/${app.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        fontWeight: 600
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'var(--bg-hover)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {app.icon?.startsWith('http') ? (
                          <img src={app.icon} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="icon" />
                        ) : (
                          app.icon || app.name[0].toUpperCase()
                        )}
                      </div>
                      <span style={{ textDecoration: 'underline' }}>{app.name}</span>
                    </Link>
                  </td>
                  <td>
                    {app.group ? (
                      <Link
                        to={`/app-groups/${app.groupId}`}
                        style={{
                          textDecoration: 'none',
                          color: 'var(--accent-primary)',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Folder size={12} /> {app.group.name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td>
                    {app.category ? (
                      <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                        {app.category.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {app.function ? (
                      <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                        {app.function.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${app.status === 'Inactive' ? 'badge-neutral' : 'badge-success'}`} style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                      {app.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Link
                      to={`/apps/${app.id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Detail <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
