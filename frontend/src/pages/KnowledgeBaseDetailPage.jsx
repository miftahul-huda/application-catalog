import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Library, Tag, User, Eye, Edit, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import KnowledgeBaseFormModal from '../components/KnowledgeBaseFormModal';

export default function KnowledgeBaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, confirm } = useUI();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/knowledge-base/${id}`);
      setItem(res.data);
    } catch {
      toast('Gagal memuat detail knowledge base', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const handleDelete = () => {
    confirm('Hapus Knowledge Base', 'Apakah Anda yakin ingin menghapus artikel ini?', async () => {
      try {
        await api.delete(`/knowledge-base/${id}`);
        toast('Knowledge base berhasil dihapus', 'success');
        navigate('/knowledge-base');
      } catch {
        toast('Gagal menghapus knowledge base', 'error');
      }
    }, 'danger');
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="animate-fade-in" style={{ padding: '8px' }}>
        <Link to="/knowledge-base" className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div className="empty-state">
          <div className="empty-state-icon">📘</div>
          <div className="empty-state-title">Knowledge Base tidak ditemukan</div>
          <div className="empty-state-desc">Artikel yang Anda buka mungkin sudah dihapus atau belum tersedia.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '8px' }}>
      <Link to="/knowledge-base" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <ArrowLeft size={16} /> Kembali ke daftar
      </Link>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Library size={12} /> Knowledge Base
            </span>
            {item.tags?.length > 0 && item.tags.map((tag, idx) => (
              <span key={idx} className="badge badge-neutral">{tag}</span>
            ))}
          </div>
          <h1 className="page-title" style={{ marginBottom: '8px' }}>{item.title}</h1>
          {item.shortDescription && (
            <p className="page-subtitle" style={{ maxWidth: '760px' }}>{item.shortDescription}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Edit size={15} /> Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '1.5rem', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <User size={15} />
            {item.creator ? item.creator.name : 'Unknown'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Calendar size={15} />
            {new Date(item.updatedAt || item.createdAt).toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>

        {item.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.25rem' }}>
            <Tag size={14} style={{ color: 'var(--text-muted)', marginRight: '4px' }} />
            {item.tags.map((tag, idx) => (
              <span key={idx} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{tag}</span>
            ))}
          </div>
        )}

        <div
          className="rich-content"
          style={{
            color: 'var(--text-primary)',
            lineHeight: 1.7,
            fontSize: '0.96rem'
          }}
          dangerouslySetInnerHTML={{ __html: item.content || '<p>Belum ada konten.</p>' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link to="/knowledge-base" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={15} /> Lihat Daftar
        </Link>
      </div>

      {showForm && (
        <KnowledgeBaseFormModal
          item={item}
          onClose={() => setShowForm(false)}
          onSuccess={async () => {
            setShowForm(false);
            await load();
          }}
        />
      )}
    </div>
  );
}
