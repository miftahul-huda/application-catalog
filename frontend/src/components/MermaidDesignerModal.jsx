import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, GitFork, AlertTriangle } from 'lucide-react';
import mermaid from 'mermaid';
import html2canvas from 'html2canvas';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' });

const TEMPLATES = {
  Flowchart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D`,
  Sequence: `sequenceDiagram
    participant User
    participant System
    User->>System: Request
    System-->>User: Response`,
  Class: `classDiagram
    class Animal {
      +String name
      +makeSound()
    }
    class Dog
    Animal <|-- Dog`,
  ER: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains`,
  Gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Task A :a1, 2024-01-01, 7d
    Task B :after a1, 5d`,
};

export default function MermaidDesignerModal({ onClose, onInsert }) {
  const [code, setCode] = useState(TEMPLATES.Flowchart);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const renderCounter = useRef(0);
  const previewRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      renderCounter.current += 1;
      const renderId = `mermaid-designer-${renderCounter.current}`;
      try {
        const result = await mermaid.render(renderId, code);
        if (!cancelled) {
          setSvg(result.svg);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Syntax diagram tidak valid');
        }
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [code]);

  const handleInsert = async () => {
    if (!svg || error || !previewRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(previewRef.current, { backgroundColor: '#ffffff', scale: 2 });
      onInsert(canvas.toDataURL('image/png'));
    } catch {
      setError('Gagal menyimpan diagram sebagai gambar');
    }
    setSaving(false);
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ width: '90vw', maxWidth: '1100px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitFork size={18} style={{ color: 'var(--accent-primary)' }} />
            <span className="modal-title">Mermaid Diagram Designer</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {Object.keys(TEMPLATES).map(name => (
              <button
                key={name}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem' }}
                onClick={() => setCode(TEMPLATES[name])}
              >
                {name}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minHeight: '360px' }}>
            <div>
              <label className="form-label">Mermaid Syntax</label>
              <textarea
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', height: '340px', resize: 'vertical' }}
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div>
              <label className="form-label">Preview</label>
              <div style={{
                height: '340px',
                overflow: 'auto',
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {error ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--accent-danger)', textAlign: 'center', padding: '1rem' }}>
                    <AlertTriangle size={28} />
                    <span style={{ fontSize: '0.8rem' }}>{error}</span>
                  </div>
                ) : (
                  <div ref={previewRef} style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: svg }} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary" onClick={handleInsert} disabled={!!error || !svg || saving}>
            {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : 'Simpan & Sisipkan ke Content'}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
