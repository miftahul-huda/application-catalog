import { createPortal } from 'react-dom';
import { X, Download, ExternalLink } from 'lucide-react';

export default function ImagePreviewModal({ src, title, onClose }) {
  if (!src) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{ zIndex: 11000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          color: '#fff',
          padding: '0 8px'
        }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title || 'Screenshot Preview'}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-icon btn-sm"
              style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }}
              title="Open Original"
            >
              <ExternalLink size={16} />
            </a>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon btn-sm"
              style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <img
          src={src}
          alt={title || 'Preview'}
          style={{
            maxWidth: '100%',
            maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        />
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
