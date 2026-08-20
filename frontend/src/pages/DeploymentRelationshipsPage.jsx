import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Network, Server, Globe, Clock } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import RelationshipFormModal from '../components/RelationshipFormModal';

const RELATIONSHIP_TYPE_COLORS = {
  'Relational Database': 'badge-info',
  'Non Relational Database': 'badge-info',
  'InMem Data Store': 'badge-warning',
  'Messaging': 'badge-primary',
  'Email System': 'badge-success',
  'Job': 'badge-neutral',
  'Application': 'badge-primary',
  'Object Storage': 'badge-warning',
};

export default function DeploymentRelationshipsPage() {
  const { id, deploymentId } = useParams();
  const { toast, confirm } = useUI();

  const [app, setApp] = useState(null);
  const [deployment, setDeployment] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editRelationship, setEditRelationship] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, deplRes, relRes] = await Promise.all([
        api.get(`/apps/${id}`),
        api.get('/deployments', { params: { appId: id } }),
        api.get('/relationships', { params: { deploymentId } }),
      ]);
      setApp(appRes.data);
      setDeployment((deplRes.data || []).find(d => d.id === deploymentId) || null);
      setRelationships(relRes.data || []);
    } catch {
      toast('Gagal memuat data relationship', 'error');
    }
    setLoading(false);
  }, [id, deploymentId, toast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (relId) => {
    confirm('Hapus Relationship', 'Yakin ingin menghapus relationship ini?', async () => {
      try {
        await api.delete(`/relationships/${relId}`);
        toast('Relationship berhasil dihapus', 'success');
        load();
      } catch {
        toast('Gagal menghapus relationship', 'error');
      }
    }, 'danger');
  };

  if (loading && !deployment) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '4px' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{deploymentId}</span>
            {deployment?.platformData?.name && <span className="badge badge-info">{deployment.platformData.name}</span>}
            {deployment?.environmentData?.name && <span className="badge badge-success">{deployment.environmentData.name}</span>}
          </div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>
            Relationship with External System
          </h1>
          <p className="page-subtitle">
            {app?.name}{deployment?.title ? ` — ${deployment.title}` : ''}
          </p>
        </div>
        <Link to={`/apps/${id}?tab=Deployment`} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Kembali ke Deployment
        </Link>
      </div>

      <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Daftar Relationship</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Relasi deployment ini dengan aplikasi lain atau sistem eksternal (database, messaging, storage, dll).
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEditRelationship(null); setShowForm(true); }}
        >
          <Plus size={14} /> Add Relationship
        </button>
      </div>

      {relationships.length === 0 ? (
        <div className="empty-state">
          <Network size={40} color="var(--text-muted)" />
          <div className="empty-state-title">Belum ada relationship</div>
          <p className="empty-state-desc" style={{ marginBottom: '1.25rem' }}>
            Tambahkan relasi deployment ini dengan aplikasi lain atau sistem eksternal seperti database, messaging, atau storage.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { setEditRelationship(null); setShowForm(true); }}
          >
            <Plus size={14} /> Tambah Relationship Pertama
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
          {relationships.map(rel => (
            <div key={rel.id} className="card shadow-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className={`badge ${RELATIONSHIP_TYPE_COLORS[rel.externalSystemType] || 'badge-neutral'}`} style={{ width: 'fit-content' }}>
                    {rel.externalSystemType}
                  </span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {rel.relatedApplication ? (
                      <Link to={`/apps/${rel.relatedApplication.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                        {rel.relatedApplication.name}
                      </Link>
                    ) : (
                      rel.externalSystemProduct
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Edit"
                    onClick={() => { setEditRelationship(rel); setShowForm(true); }}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Hapus"
                    onClick={() => handleDelete(rel.id)}
                    style={{ color: 'var(--accent-danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {rel.relatedDeployment && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Server size={12} />
                  Target deployment: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{rel.relatedDeployment.title || rel.relatedDeployment.id}</span>
                </div>
              )}

              {rel.url && (
                <a
                  href={rel.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    wordBreak: 'break-all',
                    background: 'var(--bg-hover)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <Globe size={13} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{rel.url}</span>
                </a>
              )}

              {rel.communicationProtocol && (
                <div>
                  <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>{rel.communicationProtocol}</span>
                </div>
              )}

              {rel.dataDescription ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                  {rel.dataDescription}
                </p>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, flex: 1 }}>
                  Tidak ada deskripsi data.
                </p>
              )}

              <div style={{
                marginTop: 'auto',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <span>{rel.creator?.name || '—'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {new Date(rel.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RelationshipFormModal
          applicationId={id}
          deploymentId={deploymentId}
          relationship={editRelationship}
          onClose={() => { setShowForm(false); setEditRelationship(null); }}
          onSuccess={() => { setShowForm(false); setEditRelationship(null); load(); }}
        />
      )}
    </div>
  );
}
