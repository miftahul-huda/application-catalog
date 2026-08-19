import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Folder, Calendar, User, FileText, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function DocumentationsPage() {
  const { toast } = useUI();
  const [docs, setDocs] = useState([]);
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

  // Fetch documentations with filters
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (appId) params.appId = appId;
      if (search.trim()) params.search = search;

      const res = await api.get('/documentations', { params });
      setDocs(res.data || []);
    } catch (err) {
      toast('Gagal memuat daftar dokumentasi', 'error');
    } finally {
      setLoading(false);
    }
  }, [appId, search, toast]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDocs();
    }, 300); // Debounce search

    return () => clearTimeout(delayDebounceFn);
  }, [search, appId, fetchDocs]);

  return (
    <div className="animate-fade-in" style={{ padding: '4px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Documentations</h1>
          <p className="page-subtitle">
            Daftar seluruh halaman dokumentasi aplikasi sistem yang terdaftar di repositori.
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
              placeholder="Cari judul atau isi dokumentasi..."
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
          Menampilkan <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{docs.length}</span> dokumen
        </div>
      </div>

      {/* Documentations Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : docs.length === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
          <FileText size={44} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.6 }} />
          <div className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Dokumentasi tidak ditemukan</div>
          <p className="empty-state-desc" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px', margin: '6px auto 0' }}>
            Tidak ada dokumen yang cocok dengan pencarian atau filter yang Anda gunakan.
          </p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ background: 'var(--bg-card)' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '180px' }}>ID Dokumen</th>
                <th>Judul Dokumentasi</th>
                <th>Aplikasi</th>
                <th>Pembuat</th>
                <th>Terakhir Diupdate</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600 }}>
                    {doc.id}
                  </td>
                  <td>
                    <Link
                      to={`/apps/${doc.applicationId}?tab=Documentation&docId=${doc.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        fontWeight: 600
                      }}
                    >
                      <FileText size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      <span style={{ textDecoration: 'underline' }}>{doc.title}</span>
                    </Link>
                  </td>
                  <td>
                    {doc.Application ? (
                      <Link
                        to={`/apps/${doc.applicationId}`}
                        style={{
                          textDecoration: 'none',
                          color: 'var(--accent-primary)',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Folder size={12} /> {doc.Application.name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td>
                    {doc.creator ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'var(--gradient-brand)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          color: 'white',
                          fontWeight: 700,
                          overflow: 'hidden'
                        }}>
                          {doc.creator.picture ? (
                            <img src={doc.creator.picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          ) : (
                            doc.creator.name[0].toUpperCase()
                          )}
                        </div>
                        <span style={{ fontSize: '0.82rem' }}>{doc.creator.name}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Calendar size={11} />
                      <span>{new Date(doc.updatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Link
                      to={`/apps/${doc.applicationId}?tab=Documentation&docId=${doc.id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Buka <ArrowRight size={12} />
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
