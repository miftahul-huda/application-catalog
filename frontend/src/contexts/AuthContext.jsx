import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Apply saved theme instantly before API call completes
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch(_) {}
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      // localStorage theme wins - only fallback to server if no local theme stored
      const localTheme = localStorage.getItem('theme');
      const theme = localTheme || res.data.theme || 'dark';
      applyTheme(theme);
      localStorage.setItem('theme', theme);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    const theme = userData.theme || 'dark';
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch(_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateTheme = useCallback(async (theme) => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
    setUser(prev => ({ ...prev, theme }));
    try { await api.patch('/users/me/theme', { theme }); } catch(_) {}
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateTheme, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
