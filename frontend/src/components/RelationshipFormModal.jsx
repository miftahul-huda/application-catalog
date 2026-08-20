import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Network } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

const SYSTEM_TYPES = [
  'Relational Database',
  'Non Relational Database',
  'InMem Data Store',
  'Messaging',
  'Email System',
  'Job',
  'Application',
  'Object Storage',
];

const PRODUCT_OPTIONS = {
  'Relational Database': ['PostgreSQL', 'MySQL', 'SQL Server', 'Oracle', 'MariaDB'],
  'Non Relational Database': ['MongoDB', 'Cassandra', 'DynamoDB', 'Firestore', 'CouchDB'],
  'InMem Data Store': ['Redis', 'Memcache'],
  'Messaging': ['Kafka', 'RabbitMQ', 'ActiveMQ', 'Google Pub/Sub', 'Amazon SQS/SNS'],
  'Email System': ['SMTP', 'SendGrid', 'Amazon SES', 'Gmail API'],
  'Object Storage': ['Google Cloud Storage', 'Google Drive', 'Amazon S3', 'Azure Blob Storage'],
};

const PROTOCOL_OPTIONS = ['REST API', 'SOAP', 'Socket', 'WebSocket', 'gRPC', 'GraphQL', 'JDBC/ODBC', 'SFTP'];

const OTHER = '__other__';
const isAppLikeType = (type) => type === 'Application' || type === 'Job';

export default function RelationshipFormModal({ applicationId, deploymentId, relationship, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [allApps, setAllApps] = useState([]);
  const [relatedDeployments, setRelatedDeployments] = useState([]);
  const [entryMode, setEntryMode] = useState(() => { // 'registered' | 'manual'
    if (relationship && isAppLikeType(relationship.externalSystemType)) {
      return relationship.relatedApplicationId ? 'registered' : 'manual';
    }
    return 'manual';
  });

  const [form, setForm] = useState({
    externalSystemType: relationship?.externalSystemType || '',
    relatedApplicationId: relationship?.relatedApplicationId || '',
    relatedDeploymentId: relationship?.relatedDeploymentId || '',
    manualSystemName: relationship?.manualSystemName || relationship?.externalSystemProduct || '',
    url: relationship?.url || '',
    communicationProtocol: relationship?.communicationProtocol || '',
    dataDescription: relationship?.dataDescription || '',
  });

  const [productSelect, setProductSelect] = useState(() => {
    if (!relationship) return '';
    const opts = PRODUCT_OPTIONS[relationship.externalSystemType] || [];
    if (isAppLikeType(relationship.externalSystemType)) return '';
    return opts.includes(relationship.externalSystemProduct) ? relationship.externalSystemProduct : OTHER;
  });
  const [customProduct, setCustomProduct] = useState(() => {
    if (!relationship) return '';
    const opts = PRODUCT_OPTIONS[relationship.externalSystemType] || [];
    if (isAppLikeType(relationship.externalSystemType)) return '';
    return opts.includes(relationship.externalSystemProduct) ? '' : relationship.externalSystemProduct;
  });

  const [protocolSelect, setProtocolSelect] = useState(() => {
    if (!relationship?.communicationProtocol) return '';
    return PROTOCOL_OPTIONS.includes(relationship.communicationProtocol) ? relationship.communicationProtocol : OTHER;
  });
  const [customProtocol, setCustomProtocol] = useState(() => {
    if (!relationship?.communicationProtocol) return '';
    return PROTOCOL_OPTIONS.includes(relationship.communicationProtocol) ? '' : relationship.communicationProtocol;
  });

  useEffect(() => {
    api.get('/apps').then(res => setAllApps(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const shouldFetch = isAppLikeType(form.externalSystemType) && entryMode === 'registered' && !!form.relatedApplicationId;
    (async () => {
      if (!shouldFetch) {
        setRelatedDeployments([]);
        return;
      }
      try {
        const res = await api.get('/deployments', { params: { appId: form.relatedApplicationId } });
        setRelatedDeployments(res.data || []);
      } catch {
        setRelatedDeployments([]);
      }
    })();
  }, [form.externalSystemType, form.relatedApplicationId, entryMode]);

  const productOptions = useMemo(() => PRODUCT_OPTIONS[form.externalSystemType] || [], [form.externalSystemType]);

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setForm(f => ({ ...f, externalSystemType: type, relatedApplicationId: '', relatedDeploymentId: '', manualSystemName: '', url: isAppLikeType(type) ? '' : f.url }));
    setProductSelect('');
    setCustomProduct('');
    setEntryMode('manual');
  };

  const handleRelatedAppChange = (e) => {
    const appId = e.target.value;
    const app = allApps.find(a => a.id === appId);
    setForm(f => ({ ...f, relatedApplicationId: appId, relatedDeploymentId: '', manualSystemName: app?.name || '', url: '' }));
  };

  const handleRelatedDeploymentChange = (e) => {
    const deplId = e.target.value;
    const depl = relatedDeployments.find(d => d.id === deplId);
    setForm(f => ({ ...f, relatedDeploymentId: deplId, url: depl?.url || '' }));
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.externalSystemType) {
      toast('External System Type wajib dipilih', 'error');
      return;
    }

    let externalSystemProduct;
    let payload = {
      applicationId,
      deploymentId: deploymentId || null,
      externalSystemType: form.externalSystemType,
      communicationProtocol: protocolSelect === OTHER ? customProtocol.trim() : protocolSelect,
      dataDescription: form.dataDescription,
      url: form.url,
    };

    if (isAppLikeType(form.externalSystemType)) {
      if (entryMode === 'registered') {
        if (!form.relatedApplicationId) {
          toast('Pilih aplikasi yang terdaftar', 'error');
          return;
        }
        const app = allApps.find(a => a.id === form.relatedApplicationId);
        externalSystemProduct = app?.name || form.manualSystemName;
        payload = {
          ...payload,
          relatedApplicationId: form.relatedApplicationId,
          relatedDeploymentId: form.relatedDeploymentId || null,
          manualSystemName: null,
        };
      } else {
        if (!form.manualSystemName.trim()) {
          toast('Nama sistem wajib diisi', 'error');
          return;
        }
        externalSystemProduct = form.manualSystemName.trim();
        payload = {
          ...payload,
          relatedApplicationId: null,
          relatedDeploymentId: null,
          manualSystemName: externalSystemProduct,
        };
      }
    } else {
      externalSystemProduct = productSelect === OTHER ? customProduct.trim() : productSelect;
      if (!externalSystemProduct) {
        toast('External System Product wajib dipilih/diisi', 'error');
        return;
      }
      payload = {
        ...payload,
        relatedApplicationId: null,
        relatedDeploymentId: null,
        manualSystemName: null,
      };
    }

    payload.externalSystemProduct = externalSystemProduct;

    setLoading(true);
    try {
      if (relationship) {
        await api.put(`/relationships/${relationship.id}`, payload);
        toast('Relationship berhasil diperbarui', 'success');
      } else {
        await api.post('/relationships', payload);
        toast('Relationship berhasil ditambahkan', 'success');
      }
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
    setLoading(false);
  };

  const urlReadOnly = isAppLikeType(form.externalSystemType) && entryMode === 'registered' && !!form.relatedDeploymentId;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={18} style={{ color: 'var(--accent-primary)' }} />
            <span className="modal-title">{relationship ? 'Edit Relationship' : 'Tambah Relationship'}</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* External System Type */}
            <div className="form-group">
              <label className="form-label form-required">External System Type</label>
              <select className="form-select" value={form.externalSystemType} onChange={handleTypeChange} required>
                <option value="">— Pilih tipe —</option>
                {SYSTEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* External System Product */}
            {form.externalSystemType && !isAppLikeType(form.externalSystemType) && (
              <div className="form-group">
                <label className="form-label form-required">External System Product</label>
                <select
                  className="form-select"
                  value={productSelect}
                  onChange={e => setProductSelect(e.target.value)}
                  required
                >
                  <option value="">— Pilih product —</option>
                  {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value={OTHER}>Other (specify)</option>
                </select>
                {productSelect === OTHER && (
                  <input
                    className="form-input"
                    style={{ marginTop: '8px' }}
                    placeholder="Nama product lainnya..."
                    value={customProduct}
                    onChange={e => setCustomProduct(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Application / Job picker */}
            {isAppLikeType(form.externalSystemType) && (
              <div className="form-group">
                <label className="form-label form-required">
                  {form.externalSystemType === 'Job' ? 'Job / Aplikasi' : 'Aplikasi'}
                </label>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={entryMode === 'registered'}
                      onChange={() => setEntryMode('registered')}
                    /> Aplikasi Terdaftar
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      checked={entryMode === 'manual'}
                      onChange={() => setEntryMode('manual')}
                    /> Isian Manual
                  </label>
                </div>

                {entryMode === 'registered' ? (
                  <>
                    <select className="form-select" value={form.relatedApplicationId} onChange={handleRelatedAppChange}>
                      <option value="">— Pilih aplikasi —</option>
                      {allApps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {form.relatedApplicationId && (
                      <select
                        className="form-select"
                        style={{ marginTop: '8px' }}
                        value={form.relatedDeploymentId}
                        onChange={handleRelatedDeploymentChange}
                      >
                        <option value="">— Tidak spesifik / tidak ada deployment —</option>
                        {relatedDeployments.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.title || d.id} {d.environmentData?.name ? `(${d.environmentData.name})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </>
                ) : (
                  <input
                    className="form-input"
                    placeholder="Nama aplikasi/job (belum terdaftar di sistem)..."
                    value={form.manualSystemName}
                    onChange={e => setForm(f => ({ ...f, manualSystemName: e.target.value }))}
                  />
                )}
              </div>
            )}

            {/* URL */}
            <div className="form-group">
              <label className="form-label">URL External System</label>
              <input
                className="form-input"
                name="url"
                value={form.url}
                onChange={handleChange}
                readOnly={urlReadOnly}
                style={urlReadOnly ? { background: 'var(--bg-hover)', cursor: 'not-allowed' } : undefined}
                placeholder="https://..."
              />
              {urlReadOnly && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  URL otomatis diambil dari deployment aplikasi terdaftar.
                </span>
              )}
            </div>

            {/* Communication Protocol */}
            <div className="form-group">
              <label className="form-label">Communication Protocol</label>
              <select className="form-select" value={protocolSelect} onChange={e => setProtocolSelect(e.target.value)}>
                <option value="">— Pilih protokol —</option>
                {PROTOCOL_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                <option value={OTHER}>Other (specify)</option>
              </select>
              {protocolSelect === OTHER && (
                <input
                  className="form-input"
                  style={{ marginTop: '8px' }}
                  placeholder="Protokol lainnya..."
                  value={customProtocol}
                  onChange={e => setCustomProtocol(e.target.value)}
                />
              )}
            </div>

            {/* Data Sent/Received */}
            <div className="form-group">
              <label className="form-label">Data Sent / Received</label>
              <textarea
                className="form-input"
                name="dataDescription"
                rows={3}
                style={{ resize: 'vertical' }}
                placeholder="Jelaskan data yang dikirim atau diterima..."
                value={form.dataDescription}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : (relationship ? 'Simpan Perubahan' : 'Tambah Relationship')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
