import { Clock, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PendingPage() {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
      <div style={{ textAlign:'center', maxWidth:460, padding:'var(--space-8)' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(251,191,36,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto var(--space-6)' }}>
          <Clock size={32} color="var(--accent-warning)" />
        </div>
        <h1 style={{ fontSize:'1.6rem', fontWeight:700, marginBottom:'var(--space-3)' }}>Menunggu Persetujuan</h1>
        <p style={{ color:'var(--text-secondary)', lineHeight:1.8, marginBottom:'var(--space-6)' }}>
          Akun <strong>{user?.email}</strong> telah berhasil dibuat. Administrator akan segera meninjau dan menyetujui akun Anda.
          Anda akan dapat mengakses sistem setelah disetujui.
        </p>
        <button className="btn btn-secondary" onClick={logout}>Keluar</button>
      </div>
    </div>
  );
}
