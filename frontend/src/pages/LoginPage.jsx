import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Layers, Shield, Clock } from 'lucide-react';

const GOOGLE_CLIENT_ID = '580310498308-m4dh08nb6g0e0ctgsfanp2i2u738rfdi.apps.googleusercontent.com';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useUI();
  const divRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initGSI = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'pill',
      });
    };

    if (window.google) {
      initGSI();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGSI;
      document.head.appendChild(script);
    }
  }, []);

  const handleCredential = async (response) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5050/api'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      login(data, data.token);
      if (!data.isApproved) {
        window.location.href = '/pending';
      }
    } catch (err) {
      toast(err.message || 'Login gagal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'stretch',
      background: 'var(--bg-base)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0f1225 0%, #1a1040 50%, #0d0f14 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{position:'absolute',top:'-80px',left:'-80px',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(124,141,255,0.08)',filter:'blur(40px)'}} />
        <div style={{position:'absolute',bottom:'-60px',right:'-60px',width:'300px',height:'300px',borderRadius:'50%',background:'rgba(167,139,250,0.08)',filter:'blur(40px)'}} />

        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:'var(--space-3)',marginBottom:'3rem'}}>
            <div className="sidebar-logo-icon"><Layers size={22} color="white"/></div>
            <div>
              <div style={{fontSize:'1.1rem',fontWeight:700,color:'white'}}>AppCatalog</div>
              <div style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.4)'}}>Application Registry</div>
            </div>
          </div>

          <h1 style={{fontSize:'2.4rem',fontWeight:800,color:'white',lineHeight:1.2,marginBottom:'1.5rem',letterSpacing:'-0.03em'}}>
            Manage your<br/>
            <span style={{background:'linear-gradient(135deg,#7c8dff,#a78bfa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Application Portfolio
            </span>
          </h1>
          <p style={{fontSize:'1rem',color:'rgba(255,255,255,0.5)',maxWidth:400,lineHeight:1.7}}>
            Platform terpusat untuk mendaftarkan, mengelola, dan memantau seluruh aplikasi dalam portofolio teknologi Anda.
          </p>

          <div style={{display:'flex',flexDirection:'column',gap:'var(--space-4)',marginTop:'3rem'}}>
            {[
              { icon: Shield, text: 'Login aman menggunakan Google Account' },
              { icon: Layers, text: 'Manajemen Application Group & Portfolio' },
              { icon: Clock, text: 'Riwayat lengkap Backlog & Deployment' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{display:'flex',alignItems:'center',gap:'var(--space-3)'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(124,141,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Icon size={16} color="#7c8dff" />
                </div>
                <span style={{fontSize:'0.875rem',color:'rgba(255,255,255,0.6)'}}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: '440px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
      }}>
        <div style={{width:'100%',maxWidth:320,textAlign:'center'}}>
          <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'var(--space-2)',letterSpacing:'-0.02em'}}>
            Selamat Datang
          </h2>
          <p style={{color:'var(--text-muted)',fontSize:'0.875rem',marginBottom:'2.5rem'}}>
            Masuk menggunakan akun Google Anda untuk melanjutkan.
          </p>

          <div style={{display:'flex',justifyContent:'center',marginBottom:'var(--space-6)'}}>
            {loading ? (
              <div className="spinner" />
            ) : (
              <div ref={divRef} />
            )}
          </div>

          <p style={{fontSize:'0.75rem',color:'var(--text-muted)',lineHeight:1.8}}>
            Akun baru memerlukan persetujuan administrator sebelum dapat mengakses sistem.
          </p>
        </div>
      </div>
    </div>
  );
}
