import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Upload, Download, Eye, EyeOff, Copy, Check } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';



function parseDotEnv(text) {
  const lines = text.split('\n');
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) result.push({ key, value });
  }
  return result;
}

function serializeDotEnv(vars) {
  return vars
    .filter(v => v.key.trim())
    .map(v => {
      const val = v.value.includes(' ') || v.value.includes('#') ? `"${v.value}"` : v.value;
      return `${v.key}=${val}`;
    })
    .join('\n');
}

export default function DeploymentFormModal({ applicationId, appName, deployment, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    applicationId,
    title: deployment ? (deployment.title || '') : (appName || ''),
    url: deployment ? (deployment.url || '') : '',
    platformId: deployment ? (deployment.platformId || '') : '',
    environmentId: deployment ? (deployment.environmentId || '') : '',
    instructions: deployment ? (deployment.instructions || '') : '',
    testingInstructions: deployment ? (deployment.testingInstructions || '') : '',
  });

  const [platforms, setPlatforms] = useState([]);
  const [environments, setEnvironments] = useState([]);

  useEffect(() => {
    api.get('/master/platforms').then(res => setPlatforms(res.data)).catch(() => {});
    api.get('/master/environments').then(res => setEnvironments(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (appName && !form.title && !deployment) {
      setForm(f => ({ ...f, title: appName }));
    }
  }, [appName, deployment]);

  // Env Vars state
  const [envVars, setEnvVars] = useState(
    deployment && Array.isArray(deployment.envVars) && deployment.envVars.length > 0
      ? deployment.envVars
      : [{ key: '', value: '' }]
  );
  const [showValues, setShowValues] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditorChange = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const handleEnvironmentChange = (e) => {
    const envId = e.target.value;
    const selectedEnv = environments.find(env => String(env.id) === String(envId));
    const envName = selectedEnv ? selectedEnv.name : '';
    const newTitle = envName ? `${appName || ''} - ${envName}` : appName || '';
    
    setForm(f => ({
      ...f,
      environmentId: envId,
      title: newTitle
    }));
  };

  // Env var row handlers
  const addEnvRow = () => setEnvVars(prev => [...prev, { key: '', value: '' }]);
  const updateEnvRow = (idx, field, val) => setEnvVars(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  const removeEnvRow = (idx) => setEnvVars(prev => prev.length === 1 ? [{ key: '', value: '' }] : prev.filter((_, i) => i !== idx));

  const handlePasteImport = () => {
    const parsed = parseDotEnv(pasteText);
    if (parsed.length === 0) { toast('Tidak ada variabel yang valid', 'error'); return; }
    const existing = envVars.filter(v => v.key.trim());
    const merged = [...existing];
    for (const p of parsed) {
      const idx = merged.findIndex(v => v.key === p.key);
      if (idx >= 0) merged[idx] = p; else merged.push(p);
    }
    setEnvVars(merged.length > 0 ? merged : [{ key: '', value: '' }]);
    setPasteMode(false);
    setPasteText('');
    toast(`${parsed.length} variabel diimport`, 'success');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(serializeDotEnv(envVars));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Disalin ke clipboard', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.url) { toast('URL Deployment wajib diisi', 'error'); return; }
    setLoading(true);
    try {
      const filtered = envVars.filter(v => v.key.trim());
      if (deployment) {
        await api.put(`/deployments/${deployment.id}`, { ...form, envVars: filtered });
        toast('Deployment berhasil diperbarui', 'success');
      } else {
        await api.post('/deployments', { ...form, envVars: filtered });
        toast('Deployment berhasil ditambahkan', 'success');
      }
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.message || 'Operasi gagal', 'error');
    }
    setLoading(false);
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'code-block'],
      ['clean']
    ],
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ width: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <span className="modal-title">{deployment ? 'Edit Deployment' : 'Tambah Deployment'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Environment</label>
                <select name="environmentId" className="form-select" value={form.environmentId} onChange={handleEnvironmentChange}>
                  <option value="">— Pilih Environment —</option>
                  {environments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Title / Nama Deployment</label>
                <input type="text" name="title" className="form-input" placeholder="Contoh: Production, Staging, QA" value={form.title} onChange={handleChange} />
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label form-required">URL Deployment</label>
                <input type="url" name="url" className="form-input" placeholder="https://myapp.staging.com" value={form.url} onChange={handleChange} required />
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Platform</label>
                <select name="platformId" className="form-select" value={form.platformId} onChange={handleChange}>
                  <option value="">— Pilih Platform —</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Cara Deployment</label>
                <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <ReactQuill theme="snow" value={form.instructions} onChange={(val) => handleEditorChange('instructions', val)} style={{ height: '160px' }} modules={quillModules} />
                </div>
                <div style={{ height: '45px' }} />
              </div>

              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Cara Testing Deployment</label>
                <div style={{ background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <ReactQuill theme="snow" value={form.testingInstructions} onChange={(val) => handleEditorChange('testingInstructions', val)} style={{ height: '130px' }} modules={quillModules} />
                </div>
                <div style={{ height: '45px' }} />
              </div>

              {/* Environment Variables Section */}
              <div style={{ gridColumn: '1/-1', border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
                {/* Env vars header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'var(--bg-hover)',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)' }}>.env</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Environment Variables</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                      {envVars.filter(v => v.key.trim()).length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setPasteMode(v => !v)}>
                      <Upload size={12} /> Import teks
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleCopy}>
                      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Disalin!' : 'Salin .env'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowValues(v => !v)}>
                      {showValues ? <EyeOff size={12} /> : <Eye size={12} />} {showValues ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>
                </div>

                {/* Paste Import Panel */}
                {pasteMode && (
                  <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Tempel teks .env (KEY=VALUE per baris):</div>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      value={pasteText}
                      onChange={e => setPasteText(e.target.value)}
                      placeholder={'DATABASE_URL=postgres://...\nAPI_KEY=sk-xxxx\n# komentar diabaikan'}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', width: '100%', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={handlePasteImport}><Upload size={12} /> Import</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPasteMode(false); setPasteText(''); }}>Batal</button>
                    </div>
                  </div>
                )}

                {/* Column headers */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1.5fr 28px', gap: '0',
                  padding: '6px 14px', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>KEY</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>VALUE</span>
                  <span />
                </div>

                {/* Rows */}
                <div style={{ padding: '6px 14px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
                  {envVars.map((v, idx) => (
                    <div key={idx} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1.5fr 28px', gap: '6px', alignItems: 'center',
                      paddingBottom: '4px', borderBottom: idx < envVars.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                    }}>
                      <input
                        className="form-input"
                        value={v.key}
                        onChange={e => updateEnvRow(idx, 'key', e.target.value)}
                        placeholder="VARIABLE_NAME"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '4px 8px', color: 'var(--accent-primary)', fontWeight: 600 }}
                      />
                      <input
                        className="form-input"
                        type={showValues ? 'text' : 'password'}
                        value={v.value}
                        onChange={e => updateEnvRow(idx, 'value', e.target.value)}
                        placeholder="nilai..."
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '4px 8px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => removeEnvRow(idx)}
                        style={{ color: 'var(--text-muted)', width: '26px', height: '26px', padding: 0 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add row */}
                <div style={{ padding: '6px 14px 10px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={addEnvRow}
                    style={{
                      width: '100%', justifyContent: 'center', fontSize: '0.78rem',
                      border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', gap: '5px', padding: '5px'
                    }}
                  >
                    <Plus size={12} /> Tambah Variabel
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : (deployment ? 'Ubah Deployment' : 'Tambah Deployment')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
