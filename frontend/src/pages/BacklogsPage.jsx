import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import BacklogList from '../components/BacklogList';

export default function BacklogsPage() {
  const [apps, setApps] = useState([]);

  const fetchApps = useCallback(async () => {
    try {
      const res = await api.get('/apps');
      setApps(res.data || []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  return (
    <div className="animate-fade-in" style={{ padding: '4px' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '6px' }}>Backlogs</h1>
          <p className="page-subtitle">
            Request perubahan, fitur, atau perbaikan bug yang dikelola lintas aplikasi.
          </p>
        </div>
      </div>

      <BacklogList
        showAppLink={true}
        showAppFilter={true}
        apps={apps}
      />
    </div>
  );
}
