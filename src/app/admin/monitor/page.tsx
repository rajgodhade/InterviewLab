'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';
import Link from 'next/link';

export default function AdminMonitorPage() {
  const { showToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetchActiveSessions();

    // Subscribe to all changes in interview_assignments
    const channel = supabase
      .channel('global-monitoring')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interview_assignments' },
        () => {
          fetchActiveSessions(); // Re-fetch on any change for simplicity in global view
        }
      )
      .subscribe();

    // Polling as a fallback and to update "Last Seen" timers
    const interval = setInterval(fetchActiveSessions, 10000);

    // Local tick for per-second UI updates
    const tickInterval = setInterval(() => setTick(n => n + 1), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      clearInterval(tickInterval);
    };
  }, []);

  const fetchActiveSessions = async () => {
    try {
      // Fetch assignments where is_live is true and not completed
      const { data, error } = await supabase
        .from('interview_assignments')
        .select(`
          *,
          students (*),
          interviews (title, technology, difficulty),
          responses (id)
        `)
        .eq('is_live', true)
        .neq('status', 'completed')
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      setActiveSessions(data || []);
    } catch (err) {
      console.error('Error fetching active sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCountdown = (startedAt: string, duration: number) => {
    if (!startedAt) return 'N/A';
    const start = new Date(startedAt).getTime();
    const totalDurationMs = duration * 60 * 1000;
    const now = new Date().getTime();
    const elapsed = now - start;
    const remaining = Math.max(0, totalDurationMs - elapsed);
    
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    
    return {
      text: `${mins}:${secs.toString().padStart(2, '0')}`,
      isCritical: remaining < 300000, // Less than 5 mins
      total: `${duration}:00`
    };
  };

  const getStatusColor = (lastSeenAt: string) => {
    const lastSeen = new Date(lastSeenAt).getTime();
    const now = new Date().getTime();
    const diff = now - lastSeen;
    if (diff < 40000) return 'var(--success)'; // Active in last 40s
    if (diff < 120000) return '#f59e0b'; // Idle for 2 mins
    return 'var(--text-secondary)'; // Likely disconnected
  };

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Live Monitor</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track all students currently attempting interviews in real-time.</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span>
            <span>Note: Interviews in <strong>Offline Mode</strong> cannot be tracked in real-time.</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <span style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }}></span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activeSessions.length} Active Now</span>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '40vh' }}>
          <div className="spinner"></div>
        </div>
      ) : activeSessions.length === 0 ? (
        <div className="card flex-center" style={{ minHeight: '300px', flexDirection: 'column', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
          <h3>No active sessions</h3>
          <p style={{ color: 'var(--text-secondary)' }}>When students start an interview, they will appear here automatically.</p>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#f59e0b', padding: '0.5rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <strong>Offline Mode Notice:</strong> Students taking interviews offline will not appear here until they sync their results.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {activeSessions.map((session) => (
            <div key={session.id} className="card" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '1.5rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', transition: 'all 0.2s ease' }}>
              {/* Student Avatar & Status */}
              <div style={{ position: 'relative' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-accent)', border: '2px solid var(--border-color)' }}>
                  {session.students?.photo_url ? (
                    <img src={session.students.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="flex-center" style={{ width: '100%', height: '100%', fontSize: '1.2rem', fontWeight: 700 }}>
                      {session.students?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: getStatusColor(session.last_seen_at), border: '3px solid var(--bg-secondary)' }}></div>
              </div>

              {/* Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{session.students?.name}</h4>
                  <span style={{ fontSize: '0.7rem', background: 'var(--bg-accent)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{session.interviews?.technology}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Attempting: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{session.interviews?.title}</span>
                </div>
              </div>

              {/* Stats & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Time Remaining</div>
                  {(() => {
                    const countdown = getCountdown(session.started_at, session.duration);
                    if (typeof countdown === 'string') return <div>{countdown}</div>;
                    return (
                      <div style={{ fontWeight: 700, color: countdown.isCritical ? 'var(--danger)' : 'var(--accent-color)' }}>
                        {countdown.text} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500 }}>/ {countdown.total}</span>
                      </div>
                    );
                  })()}
                </div>
                
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Responses</div>
                  <div style={{ fontWeight: 700 }}>{session.responses?.length || 0} Questions</div>
                </div>

                <Link href={`/admin/live/${session.interview_id}`}>
                  <button style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-color)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    Open Live Room
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          border-top-color: var(--accent-color);
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
