import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Shield, Clock, Zap } from 'lucide-react';
import catLogo from '../assets/cat.png';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useUI();
  const divRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5050/api'}/config`)
      .then(res => res.json())
      .then(data => {
        if (data.googleClientId) {
          setClientId(data.googleClientId);
        }
      })
      .catch(err => {
        console.error('Failed to load config', err);
        toast('Failed to load configuration', 'error');
      });
  }, [toast]);

  useEffect(() => {
    if (!clientId) return;

    const initGSI = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 300,
        text: 'signin_with',
        shape: 'rectangular',
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
  }, [clientId]);

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

  const features = [
    { icon: Shield,  text: 'Login aman menggunakan Google Account' },
    { icon: Layers,  text: 'Manajemen Application Group & Portfolio' },
    { icon: Clock,   text: 'Riwayat lengkap Backlog & Deployment' },
    { icon: Zap,     text: 'Dashboard real-time & analytics' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'stretch',
      background: '#080b12',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── Left panel ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        background: 'linear-gradient(145deg, #080b12 0%, #0f1220 40%, #141030 100%)',
      }}>
        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '-120px', left: '-80px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,141,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', right: '10%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Floating grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(124,141,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,141,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />

        {/* Orbit rings */}
        <div style={{
          position: 'absolute', top: '15%', right: '8%',
          width: '180px', height: '180px',
          border: '1px solid rgba(124,141,255,0.08)',
          borderRadius: '50%',
          animation: 'orbitSpin 20s linear infinite',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)',
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'rgba(124,141,255,0.6)',
            boxShadow: '0 0 10px rgba(124,141,255,0.6)',
          }} />
        </div>
        <div style={{
          position: 'absolute', top: 'calc(15% + 25px)', right: 'calc(8% + 25px)',
          width: '130px', height: '130px',
          border: '1px solid rgba(167,139,250,0.06)',
          borderRadius: '50%',
          animation: 'orbitSpin 14s linear infinite reverse',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)',
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'rgba(167,139,250,0.6)',
            boxShadow: '0 0 8px rgba(167,139,250,0.6)',
          }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3.5rem' }}>
            <div style={{
              width: 42, height: 42,
              background: 'linear-gradient(135deg, #667eea 0%, #9b59fa 50%, #a78bfa 100%)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(124,141,255,0.35), 0 0 0 1px rgba(255,255,255,0.12)',
              overflow: 'hidden'
            }}>
              <img src={catLogo} alt="AppCat Logo" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>AppCat</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 400, letterSpacing: '0.04em' }}>APPLICATION REGISTRY</div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 900,
            color: 'white',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            letterSpacing: '-0.04em',
          }}>
            Manage your<br />
            <span style={{
              background: 'linear-gradient(135deg, #7c8dff, #c084fc, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Application Portfolio
            </span>
          </h1>
          <p style={{
            fontSize: '0.9375rem',
            color: 'rgba(255,255,255,0.45)',
            maxWidth: 400,
            lineHeight: 1.75,
            marginBottom: '3rem',
          }}>
            Platform terpusat untuk mendaftarkan, mengelola, dan memantau seluruh aplikasi dalam portofolio teknologi Anda.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {features.map(({ icon: Icon, text }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateX(0)' : 'translateX(-12px)',
                transition: `opacity 0.5s ease ${0.1 + i * 0.08}s, transform 0.5s ease ${0.1 + i * 0.08}s`,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(124,141,255,0.1)',
                  border: '1px solid rgba(124,141,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={15} color="#a78bfa" />
                </div>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        width: '440px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        position: 'relative',
        background: '#0f1220',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Subtle top glow */}
        <div style={{
          position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,141,255,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          width: '100%', maxWidth: 340, textAlign: 'center', position: 'relative', zIndex: 1,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
        }}>
          {/* Glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            marginBottom: '1.5rem',
          }}>
            {/* Icon */}
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #667eea 0%, #a78bfa 100%)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 24px rgba(124,141,255,0.35)',
            }}>
              <Layers size={26} color="white" />
            </div>

            <h2 style={{
              fontSize: '1.5rem', fontWeight: 800,
              color: 'white', marginBottom: '8px',
              letterSpacing: '-0.03em',
            }}>
              Selamat Datang
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.875rem',
              marginBottom: '2rem',
              lineHeight: 1.6,
            }}>
              Masuk menggunakan akun Google Anda untuk melanjutkan.
            </p>

            {/* Google button */}
            <div style={{
              display: 'flex', justifyContent: 'center',
              minHeight: 44,
              alignItems: 'center',
            }}>
              {loading ? (
                <div style={{
                  width: 24, height: 24,
                  border: '2px solid rgba(255,255,255,0.15)',
                  borderTopColor: '#7c8dff',
                  borderRadius: '50%',
                  animation: 'orbitSpin 0.65s linear infinite',
                }} />
              ) : (
                <div ref={divRef} />
              )}
            </div>
          </div>

          <p style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.25)',
            lineHeight: 1.8,
            padding: '0 8px',
          }}>
            Akun baru memerlukan persetujuan administrator sebelum dapat mengakses sistem.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes orbitSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
