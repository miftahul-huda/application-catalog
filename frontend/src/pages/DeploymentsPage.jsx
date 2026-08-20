import { useEffect, useState, useCallback } from 'react';
import { Search, Server, ExternalLink, Calendar, AppWindow, Globe, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

export default function DeploymentsPage() {
  const { toast } = useUI();
  const [deployments, setDeployments] = useState([]);
  const [apps, setApps] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [appId, setAppId] = useState('');
  const [environmentId, setEnvironmentId] = useState('');

  // Fetch apps for dropdown
  const fetchApps = useCallback(async () => {
    try {
      const res = await api.get('/apps');
      setApps(res.data || []);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    }
  }, []);

  // Fetch environments for dropdown
  const fetchEnvironments = useCallback(async () => {
    try {
      const res = await api.get('/master/environments');
      setEnvironments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch environments', err);
    }
  }, []);

  // Fetch deployment records
  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (appId) params.appId = appId;
      if (environmentId) params.environmentId = environmentId;
      if (search.trim()) params.search = search;
      
      const res = await api.get('/deployments', { params });
      setDeployments(res.data || []);
    } catch (err) {
      toast('Gagal memuat data deployment', 'error');
    } finally {
      setLoading(false);
    }
  }, [appId, environmentId, search, toast]);

  useEffect(() => {
    fetchApps();
    fetchEnvironments();
  }, [fetchApps, fetchEnvironments]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDeployments();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, appId, environmentId, fetchDeployments]);

  const activeFilters = [search, appId, environmentId].filter(Boolean).length;

  return (
    <div className="animate-fade-in" style={{ padding: '4px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Deployments</h1>
          <p className="page-subtitle">
            Daftar riwayat dan informasi server penyebaran (deployment) aplikasi.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{
        padding: '16px 20px',
        marginBottom: '1.5rem',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'center'
        }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Cari ID, Judul, atau URL..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%' }}
            />
          </div>

          {/* App Filter */}
          <div>
            <select
              className="form-select"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Semua Aplikasi</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>

          {/* Environment Filter */}
          <div>
            <select
              className="form-select"
              value={environmentId}
              onChange={(e) => setEnvironmentId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Semua Environment</option>
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
          </div>

          {/* Active Filters / Reset */}
          {activeFilters > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch('');
                  setAppId('');
                  setEnvironmentId('');
                }}
                style={{ color: 'var(--accent-primary)', fontSize: '0.82rem' }}
              >
                Reset Filter ({activeFilters})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main List Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '12px' }}>
            <div className="spinner" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Memuat data deployment...</span>
          </div>
        ) : deployments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <Server size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Tidak ada data</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
              Tidak ditemukan data deployment yang cocok dengan filter pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>ID Deployment</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Judul / Nama</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Aplikasi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Environment</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Platform</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>URL</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tanggal</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map(d => (
                  <tr key={d.id} className="table-row-hover" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{d.id}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 600 }}>
                      {d.title || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Tidak ada nama</span>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AppWindow size={14} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontWeight: 500 }}>{d.Application?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {d.environmentData?.name ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={10} />
                          {d.environmentData.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {d.platformData?.name ? (
                        <span className="badge badge-info">{d.platformData.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      {d.url ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--accent-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 500,
                            textDecoration: 'none'
                          }}
                        >
                          Link <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} />
                        {new Date(d.updatedAt || d.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Link
                        to={`/apps/${d.applicationId}`}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '0.8rem' }}
                      >
                        <Eye size={13} /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
