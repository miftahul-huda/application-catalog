import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Folder, Calendar, GitBranch, ArrowRight, Globe } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function SourceCodesPage() {
  const { toast } = useUI();
  const [sourceCodes, setSourceCodes] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [appId, setAppId] = useState('');

  // Fetch applications list to populate dropdown options
  const fetchApps = useCallback(async () => {
    try {
      const res = await api.get('/apps');
      setApps(res.data || []);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    }
  }, []);

  // Fetch source codes with filters
  const fetchSourceCodes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (appId) params.appId = appId;
      if (search.trim()) params.search = search;

      const res = await api.get('/source-codes', { params });
      setSourceCodes(res.data || []);
    } catch (err) {
      toast('Gagal memuat daftar source code', 'error');
    } finally {
      setLoading(false);
    }
  }, [appId, search, toast]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSourceCodes();
    }, 300); // Debounce search

    return () => clearTimeout(delayDebounceFn);
  }, [search, appId, fetchSourceCodes]);

  return (
    <div className="animate-fade-in" style={{ padding: '4px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Source Codes</h1>
          <p className="page-subtitle">
            Daftar seluruh tautan repository source code aplikasi (Github / Gitlab) yang terdaftar.
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
              placeholder="Cari URL repository atau deskripsi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* App Filter */}
          <div style={{ minWidth: '220px' }}>
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
        </div>

        {/* Counter */}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Menampilkan <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sourceCodes.length}</span> repository
        </div>
      </div>

      {/* Source Codes Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : sourceCodes.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
          <GitBranch size={44} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.6 }} />
          <div className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Source code tidak ditemukan</div>
          <p className="empty-state-desc" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '6px auto 0' }}>
            Tidak ada repository yang cocok dengan pencarian atau filter yang Anda gunakan.
          </p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ background: 'var(--bg-card)' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '180px' }}>ID Repo</th>
                <th>Repository URL</th>
                <th>Aplikasi</th>
                <th>Deskripsi</th>
                <th>Tanggal Ditambahkan</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sourceCodes.map(sc => (
                <tr key={sc.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600 }}>
                    {sc.id}
                  </td>
                  <td>
                    <a
                      href={sc.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent-primary)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.86rem',
                        wordBreak: 'break-all'
                      }}
                    >
                      <Globe size={13} />
                      <span style={{ textDecoration: 'underline' }}>{sc.url}</span>
                    </a>
                  </td>
                  <td>
                    {sc.Application ? (
                      <Link
                        to={`/apps/${sc.applicationId}`}
                        style={{
                          textDecoration: 'none',
                          color: 'var(--accent-primary)',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Folder size={12} /> {sc.Application.name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sc.description}>
                    {sc.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Tidak ada deskripsi</span>}
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Calendar size={11} />
                      <span>{new Date(sc.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Link
                      to={`/apps/${sc.applicationId}?tab=Source Codes`}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Buka Tab <ArrowRight size={12} />
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
