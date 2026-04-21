import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Terminal, Box, Cpu, Wrench } from 'lucide-react';
import api from '../services/api';
import { useUI } from '../contexts/UIContext';

const STACK_CONFIG = [
  { key: 'languages', title: 'Programming Languages', icon: Terminal, placeholder: 'e.g. JavaScript, Go, Python' },
  { key: 'frameworks', title: 'Frameworks', icon: Box, placeholder: 'e.g. React, Gin, Django' },
  { key: 'libraries', title: 'Libraries', icon: Cpu, placeholder: 'e.g. Redux, Sequelize, Pandas' },
  { key: 'tools', title: 'Tools & DevOps', icon: Wrench, placeholder: 'e.g. Docker, Kubernetes, Jenkins' },
];

export default function TechStackModal({ app, onClose, onSuccess }) {
  const { toast } = useUI();
  const [loading, setLoading] = useState(false);
  const [techStack, setTechStack] = useState({
    languages: [],
    frameworks: [],
    libraries: [],
    tools: []
  });
  const [currentInputs, setCurrentInputs] = useState({
    languages: '',
    frameworks: '',
    libraries: '',
    tools: ''
  });

  useEffect(() => {
    if (app?.techStack) {
      setTechStack({
        languages: Array.isArray(app.techStack.languages) ? app.techStack.languages : [],
        frameworks: Array.isArray(app.techStack.frameworks) ? app.techStack.frameworks : [],
        libraries: Array.isArray(app.techStack.libraries) ? app.techStack.libraries : [],
        tools: Array.isArray(app.techStack.tools) ? app.techStack.tools : [],
      });
    }
  }, [app]);

  const handleAddTag = (key) => {
    const value = currentInputs[key].trim();
    if (!value) return;
    
    if (techStack[key].includes(value)) {
      toast(`${value} sudah ada`, 'info');
      setCurrentInputs(prev => ({ ...prev, [key]: '' }));
      return;
    }

    setTechStack(prev => ({
      ...prev,
      [key]: [...prev[key], value]
    }));
    setCurrentInputs(prev => ({ ...prev, [key]: '' }));
  };

  const handleRemoveTag = (key, index) => {
    setTechStack(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/apps/${app.id}`, { techStack });
      toast('Tech Stack berhasil diperbarui', 'success');
      onSuccess();
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menyimpan Tech Stack', 'error');
    }
    setLoading(false);
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ width: 700 }}>
        <div className="modal-header">
          <span className="modal-title">Edit Technology Stack</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {STACK_CONFIG.map(config => (
                <div key={config.key} className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <config.icon size={16} color="var(--accent-primary)" />
                    <label className="form-label" style={{ margin: 0 }}>{config.title}</label>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <input 
                      className="form-input" 
                      style={{ fontSize: '1rem' }}
                      placeholder={config.placeholder}
                      value={currentInputs[config.key]}
                      onChange={(e) => setCurrentInputs(prev => ({ ...prev, [config.key]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(config.key);
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm" 
                      onClick={() => handleAddTag(config.key)}
                      style={{ padding: '0 12px' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '34px', padding: '10px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    {techStack[config.key].length > 0 ? techStack[config.key].map((tag, i) => (
                      <span 
                        key={i} 
                        className="badge badge-primary" 
                        style={{ 
                          padding: '4px 8px 4px 12px', 
                          fontSize: '0.9rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px' 
                        }}
                      >
                        {tag}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTag(config.key, i)}
                          style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', display: 'flex' }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    )) : (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Belum ada data...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{width:14,height:14}}/> : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
