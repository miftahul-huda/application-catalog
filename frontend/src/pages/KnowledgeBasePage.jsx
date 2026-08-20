import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Library, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import KnowledgeBaseFormModal from '../components/KnowledgeBaseFormModal';

export default function KnowledgeBasePage() {
  const { toast, confirm } = useUI();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search;
      const res = await api.get('/knowledge-base', { params });
      setItems(res.data || []);
    } catch {
      toast('Gagal memuat daftar knowledge base', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, fetchItems]);

  const handleDelete = (id) => {
    confirm('Hapus Knowledge Base', 'Apakah Anda yakin ingin menghapus artikel ini?', async () => {
      try {
        await api.delete(`/knowledge-base/${id}`);
        toast('Knowledge base berhasil dihapus', 'success');
        fetchItems();
      } catch {
        toast('Gagal menghapus knowledge base', 'error');
      }
    }, 'danger');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '4px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Knowledge Base</h1>
          <p className="page-subtitle">
            Kumpulan artikel pengetahuan dan referensi internal.
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={() => { setActiveItem(null); setShowForm(true); }}
        >
          <Plus size={16} /> Tambah Knowledge Base
        </button>
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
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
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
            placeholder="Cari judul, deskripsi, isi, atau tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Menampilkan <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{items.length}</span> artikel
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '12px' }}>
            <div className="spinner" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Memuat data knowledge base...</span>
          </div>
        ) : items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <Library size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Belum ada artikel</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
              Tidak ditemukan artikel knowledge base yang cocok dengan pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Short Description</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tags</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Created By</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Updated</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="table-row-hover" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 600, maxWidth: '260px' }}>
                      <Link
                        to={`/knowledge-base/${item.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                      >
                        <Library size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        {item.title}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '320px' }}>
                      {item.shortDescription || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '220px' }}>
                        {item.tags && item.tags.length > 0 ? item.tags.map((tag, i) => (
                          <span key={i} className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>{tag}</span>
                        )) : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {item.creator ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: 'var(--gradient-brand)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', color: 'white', fontWeight: 700, overflow: 'hidden'
                          }}>
                            {item.creator.picture ? (
                              <img src={item.creator.picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            ) : (
                              item.creator.name[0].toUpperCase()
                            )}
                          </div>
                          <span style={{ fontSize: '0.82rem' }}>{item.creator.name}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} />
                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '0.8rem' }}
                          onClick={() => { setActiveItem(item); setShowForm(true); }}
                          title="Edit"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ width: '30px', height: '30px', padding: 0 }}
                          onClick={() => handleDelete(item.id)}
                          title="Hapus"
                        >
                          <Trash2 size={14} color="var(--accent-danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <KnowledgeBaseFormModal
          item={activeItem}
          onClose={() => { setShowForm(false); setActiveItem(null); }}
          onSuccess={() => { setShowForm(false); setActiveItem(null); fetchItems(); }}
        />
      )}
    </div>
  );
}
