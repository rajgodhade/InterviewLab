import Link from 'next/link';

export default function Home() {
  return (
    <div className="container" style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)' }}>
        <h1 style={{ marginBottom: '0.5rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          InterviewLab
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>
          The AI-powered interview simulation platform for modern teams.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin" style={{ width: '100%', maxWidth: '200px' }}>
            <button style={{ width: '100%' }}>Admin Dashboard</button>
          </Link>
          <Link href="/student" style={{ width: '100%', maxWidth: '200px' }}>
            <button style={{ width: '100%', background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              Student Portal
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

