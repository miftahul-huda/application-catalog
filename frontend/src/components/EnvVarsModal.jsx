import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Download, Upload, Eye, EyeOff, Copy, Check } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

/**
 * Parse plain text (.env format) into [{key, value}] array
 * Supports KEY=VALUE, KEY="VALUE", and #comments
 */
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
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) result.push({ key, value });
  }
  return result;
}

/**
 * Serialize [{key, value}] to .env plain text
 */
function serializeDotEnv(vars) {
  return vars
    .filter(v => v.key.trim())
    .map(v => {
      const val = v.value.includes(' ') || v.value.includes('#') ? `"${v.value}"` : v.value;
      return `${v.key}=${val}`;
    })
    .join('\n');
}

export default function EnvVarsModal({ deploymentId, initialVars = [], onClose, onSave }) {
  const { toast } = useUI();
  const [vars, setVars] = useState(
    initialVars.length > 0 ? initialVars.map(v => ({ ...v })) : [{ key: '', value: '' }]
  );
  const [showValues, setShowValues] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const addRow = () => setVars(prev => [...prev, { key: '', value: '' }]);

  const updateRow = (idx, field, val) => {
    setVars(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  };

  const removeRow = (idx) => {
    setVars(prev => prev.length === 1 ? [{ key: '', value: '' }] : prev.filter((_, i) => i !== idx));
  };

  const handlePasteImport = () => {
    const parsed = parseDotEnv(pasteText);
    if (parsed.length === 0) {
      toast('Tidak ada variabel yang valid ditemukan', 'error');
      return;
    }
    // Merge: keep existing vars not in parsed, add/update from parsed
    const existing = vars.filter(v => v.key.trim());
    const merged = [...existing];
    for (const p of parsed) {
      const idx = merged.findIndex(v => v.key === p.key);
      if (idx >= 0) merged[idx] = p;
      else merged.push(p);
    }
    setVars(merged.length > 0 ? merged : [{ key: '', value: '' }]);
    setPasteMode(false);
    setPasteText('');
    toast(`${parsed.length} variabel berhasil diimport`, 'success');
  };

  const handleExport = () => {
    const text = serializeDotEnv(vars);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deploymentId}.env`;
    a.click();
    URL.revokeObjectURL(url);
    toast('File .env berhasil didownload', 'success');
  };

  const handleCopyToClipboard = async () => {
    const text = serializeDotEnv(vars);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Disalin ke clipboard', 'success');
  };

  const handleSave = async () => {
    const filtered = vars.filter(v => v.key.trim());
    setLoading(true);
    try {
      await api.put(`/deployments/${deploymentId}`, { envVars: filtered });
      toast('Environment variables disimpan', 'success');
      onSave(filtered);
    } catch {
      toast('Gagal menyimpan environment variables', 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-lg"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '760px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>.env</span>
            <span className="modal-title">Environment Variables</span>
            <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{deploymentId}</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '10px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-hover)'
        }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
              onClick={() => setPasteMode(true)}
              title="Import dari plain text .env"
            >
              <Upload size={13} /> Import dari Teks
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
              onClick={handleCopyToClipboard}
              title="Salin ke clipboard sebagai .env"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Disalin!' : 'Salin sebagai .env'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
              onClick={handleExport}
              title="Download file .env"
            >
              <Download size={13} /> Export .env
            </button>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-muted)' }}
            onClick={() => setShowValues(v => !v)}
          >
            {showValues ? <EyeOff size={13} /> : <Eye size={13} />}
            {showValues ? 'Sembunyikan nilai' : 'Tampilkan nilai'}
          </button>
        </div>

        {/* Paste Import Panel */}
        {pasteMode && (
          <div style={{
            padding: '14px 20px',
            background: 'rgba(99, 102, 241, 0.06)',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Tempel teks .env di bawah (format: KEY=VALUE per baris)
            </div>
            <textarea
              className="form-textarea"
              rows={5}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder={'DATABASE_URL=postgres://...\nAPI_KEY=sk-xxxx\n# komentar akan diabaikan\nSECRET_KEY="nilai dengan spasi"'}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', width: '100%', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={handlePasteImport}>
                <Upload size={13} /> Import Variabel
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setPasteMode(false); setPasteText(''); }}>
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr 32px',
            gap: '0',
            padding: '8px 20px',
            background: 'var(--bg-hover)',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'sticky',
            top: 0,
            zIndex: 1
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>KEY</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>VALUE</span>
            <span />
          </div>

          {/* Rows */}
          <div style={{ padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {vars.map((v, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr 32px',
                  gap: '6px',
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom: idx < vars.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                }}
              >
                <input
                  className="form-input"
                  value={v.key}
                  onChange={e => updateRow(idx, 'key', e.target.value)}
                  placeholder="VARIABLE_NAME"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    padding: '5px 8px',
                    color: 'var(--accent-primary)',
                    fontWeight: 600
                  }}
                />
                <input
                  className="form-input"
                  type={showValues ? 'text' : 'password'}
                  value={v.value}
                  onChange={e => updateRow(idx, 'value', e.target.value)}
                  placeholder="nilai..."
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    padding: '5px 8px'
                  }}
                />
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => removeRow(idx)}
                  style={{ color: 'var(--text-muted)', width: '28px', height: '28px', padding: 0 }}
                  title="Hapus baris"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Row */}
          <div style={{ padding: '8px 20px 16px' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={addRow}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', width: '100%', justifyContent: 'center', padding: '7px' }}
            >
              <Plus size={13} /> Tambah Variabel
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {vars.filter(v => v.key.trim()).length} variabel
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Variables'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
