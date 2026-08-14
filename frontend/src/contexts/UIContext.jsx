import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const showModal = useCallback((config) => {
    setModal(config);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  // Support both await confirm(title, msg, variant) AND confirm(title, msg, callback, variant)
  const confirm = useCallback((title, message, arg3, arg4) => {
    let callback = null;
    let variant = 'danger';

    if (typeof arg3 === 'function') {
      callback = arg3;
      if (typeof arg4 === 'string') variant = arg4;
    } else if (typeof arg3 === 'string') {
      variant = arg3;
    }

    return new Promise((resolve) => {
      setModal({
        type: 'confirm',
        title,
        message,
        variant,
        onConfirm: async () => {
          if (callback) {
            try {
              await callback();
            } catch (err) {
              console.error(err);
            }
          }
          resolve(true);
          closeModal();
        },
        onCancel: () => {
          resolve(false);
          closeModal();
        }
      });
    });
  }, [closeModal]);

  // For toast, we might have multiple arguments
  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  // Update showToast for backward compatibility where old code passed (type, message)
  const showToast = useCallback((type, message) => {
    // If first argument is type (success, error, etc), adapt to toast
    if (['success', 'error', 'warning', 'info'].includes(type) && typeof message === 'string') {
      toast(message, type);
    } else {
      toast(type, message);
    }
  }, [toast]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <UIContext.Provider value={{ showModal, closeModal, confirm, toast, showToast }}>
      {children}
      
      {/* Modal Layer */}
      <AnimatePresence>
        {modal && (
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { 
              if (e.target === e.currentTarget) {
                if (modal.onCancel) modal.onCancel();
                closeModal();
              }
            }}
            style={{ zIndex: 9999, position: 'fixed', inset: 0, background: 'rgba(5, 7, 15, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div 
              className={`modal ${modal.size === 'lg' ? 'modal-lg' : modal.size === 'xl' ? 'modal-xl' : ''}`}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                background: 'var(--bg-surface)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '16px', 
                boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px inset rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
                width: '90%',
                maxWidth: modal.type === 'confirm' ? '420px' : '600px'
              }}
            >
              {modal.type === 'confirm' ? (
                <ConfirmModal modal={modal} onClose={() => { if(modal.onCancel) modal.onCancel(); closeModal(); }} />
              ) : modal.type === 'alert' ? (
                <AlertModal modal={modal} onClose={closeModal} />
              ) : (
                <>
                  <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="modal-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>{modal.title}</span>
                    <button className="icon-btn" onClick={() => { if(modal.onCancel) modal.onCancel(); closeModal(); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20}/></button>
                  </div>
                  <div className="modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>{modal.content}</div>
                  {modal.footer && <div className="modal-footer" style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>{modal.footer}</div>}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Layer */}
      <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id} 
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', 
                background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.08)', 
                borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                minWidth: '320px'
              }}
            >
              {t.type === 'success' && <CheckCircle size={20} style={{color:'var(--accent-success)',flexShrink:0}}/>}
              {t.type === 'error'   && <XCircle size={20} style={{color:'var(--accent-danger)',flexShrink:0}}/>}
              {t.type === 'warning' && <AlertTriangle size={20} style={{color:'var(--accent-warning)',flexShrink:0}}/>}
              {t.type === 'info'    && <Info size={20} style={{color:'var(--accent-primary)',flexShrink:0}}/>}
              <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', flex: 1, fontWeight: 500 }}>{t.message}</span>
              <button 
                onClick={() => removeToast(t.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <X size={16}/>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UIContext.Provider>
  );
};

const ConfirmModal = ({ modal, onClose }) => {
  const variantColors = {
    danger: 'var(--accent-danger)',
    warning: 'var(--accent-warning)',
    primary: 'var(--accent-primary)'
  };
  const color = variantColors[modal.variant] || variantColors.danger;

  return (
    <>
      <div style={{ padding: '32px 24px 24px', textAlign: 'center', position: 'relative' }}>
        {/* Animated Background Glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '150px', height: '150px', background: color, filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none' }} />
        
        <motion.div 
          initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", delay: 0.1, damping: 15 }}
          style={{ width: 64, height: 64, borderRadius: '20px', background: `linear-gradient(135deg, ${color}22, ${color}11)`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: color, boxShadow: `0 8px 16px ${color}20` }}
        >
          <AlertTriangle size={32} strokeWidth={1.5} />
        </motion.div>
        
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{modal.title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{modal.message}</p>
      </div>
      
      <div style={{ padding: '20px', background: 'rgba(0,0,0,0.15)', display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <button 
          onClick={onClose}
          style={{ flex: 1, padding: '10px 0', background: 'var(--bg-hover)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
          onMouseOut={(e) => e.target.style.background = 'var(--bg-hover)'}
        >
          Batal
        </button>
        <button
          onClick={() => { modal.onConfirm?.(); }}
          style={{ flex: 1, padding: '10px 0', background: color, border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: `0 4px 12px ${color}40`, transition: 'all 0.2s' }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Ya, Lanjutkan
        </button>
      </div>
    </>
  );
};

const AlertModal = ({ modal, onClose }) => (
  <>
    <div className="modal-body" style={{ textAlign:'center', padding: '32px 24px' }}>
      <p style={{ color:'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>{modal.message}</p>
    </div>
    <div className="modal-footer" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <button 
        onClick={onClose}
        style={{ width: '100%', padding: '10px 0', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
      >
        Mengerti
      </button>
    </div>
  </>
);

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be inside UIProvider');
  return ctx;
};
