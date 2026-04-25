'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformName, setPlatformName] = useState('InterviewLab');
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('platform_name, logo_url')
          .single();
        if (data) {
          if (data.platform_name) setPlatformName(data.platform_name);
          if (data.logo_url) setLogoUrl(data.logo_url);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '1.5rem'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '2.5rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-premium)',
        borderRadius: '24px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <img src={logoUrl} alt="Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
            <div style={{ 
              fontSize: '2.5rem', 
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              letterSpacing: '-1px'
            }}>
              {platformName}
            </div>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Admin Login</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Secure access to your dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                transition: 'all 0.2s'
              }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                transition: 'all 0.2s'
              }}
            />
          </div>

          {error && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: '10px', 
              background: 'rgba(244, 63, 94, 0.1)', 
              color: 'var(--danger)',
              fontSize: '0.85rem',
              fontWeight: 500,
              border: '1px solid rgba(244, 63, 94, 0.2)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ 
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.2s, opacity 0.2s',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Contact support</span>
        </p>
      </div>
    </div>
  );
}
