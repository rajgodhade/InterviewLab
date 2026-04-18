import Link from 'next/link';

export default function Home() {
  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          InterviewLab
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.25rem' }}>
          The AI-powered interview simulation platform.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin">
            <button style={{ width: '200px' }}>Admin Dashboard</button>
          </Link>
          <Link href="/student">
            <button style={{ width: '200px', background: 'var(--bg-accent)', color: 'var(--text-primary)' }}>
              Student Portal
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
