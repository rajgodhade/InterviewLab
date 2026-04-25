'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function LiveRoom() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const interviewId = params.interview_id as string;

  const [interview, setInterview] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Setup Realtime Subscription
    const channel = supabase
      .channel('live-assignments')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'interview_assignments', filter: `interview_id=eq.${interviewId}` },
        (payload) => {
          setAssignments((prev) => 
            prev.map((a) => (a.id === payload.new.id ? { ...a, ...payload.new } : a))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [interviewId]);

  const fetchData = async () => {
    try {
      const { data: intData } = await supabase.from('interviews').select('*').eq('id', interviewId).single();
      setInterview(intData);

      const { data: assignData } = await supabase
        .from('interview_assignments')
        .select('*, students(*)')
        .eq('interview_id', interviewId);
      
      setAssignments(assignData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Entering Monitor Session...</div>;

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--danger)', borderRadius: '50%', boxShadow: '0 0 10px var(--danger)', animation: 'pulse-live 1.5s infinite' }}></span>
            <h2 style={{ margin: 0 }}>Interview Monitoring Session</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Interview: <strong>{interview?.title}</strong> | Tracking {assignments.length} assigned seats</p>
        </div>
        <button onClick={() => router.back()} style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Back to Dashboard</button>
      </div>

      <div style={{ 
        background: 'var(--bg-secondary)', 
        padding: '4rem 2rem', 
        borderRadius: '24px', 
        border: '1px solid var(--border-color)',
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.1)',
        position: 'relative',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Stage / Screen Visual */}
        <div style={{ textAlign: 'center', marginBottom: '5rem', width: '100%', maxWidth: '600px' }}>
          <div style={{ 
            height: '6px', 
            background: 'var(--accent-gradient)', 
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
            marginBottom: '1rem'
          }}></div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 700 }}>Interview Screen / Stage</span>
        </div>

        {/* Classroom Grid */}
        {(() => {
          const cols = 10;
          const totalSeats = Math.max(cols * Math.ceil(Math.max(assignments.length, 10) / cols), 30);
          const seats = [];
          for (let i = 0; i < totalSeats; i++) {
            const assignment = assignments[i] || null;
            const isAssigned = !!assignment;
            const isLive = assignment?.is_live && assignment?.status !== 'completed';
            const isCompleted = assignment?.status === 'completed';
            const studentName = assignment?.students?.name || 'Student';
            const photoUrl = assignment?.students?.photo_url;
            const initial = studentName.charAt(0).toUpperCase();

            // Seat colors based on state
            const seatBg = isCompleted 
              ? '#f59e0b' 
              : isLive 
                ? 'var(--success)' 
                : isAssigned 
                  ? 'rgba(59, 130, 246, 0.15)' 
                  : 'var(--bg-primary)';
            const seatBorder = isCompleted 
              ? '2px solid #f59e0b' 
              : isLive 
                ? '2px solid var(--success)' 
                : isAssigned 
                  ? '2px solid rgba(59, 130, 246, 0.3)' 
                  : '1px solid var(--border-color)';
            const seatShadow = isCompleted 
              ? '0 0 15px rgba(245, 158, 11, 0.4)' 
              : isLive 
                ? '0 0 15px rgba(16, 185, 129, 0.4)' 
                : 'none';

            seats.push(
              <div 
                key={i} 
                className={isAssigned ? 'seat-container' : ''}
                style={{ position: 'relative', cursor: isAssigned ? 'pointer' : 'default' }}
              >
                <div 
                  className={isAssigned ? 'seat' : ''}
                  style={{
                    width: '55px',
                    height: '55px',
                    background: seatBg,
                    border: seatBorder,
                    borderRadius: '12px 12px 4px 4px',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: seatShadow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isAssigned ? 1 : 0.35,
                    overflow: 'hidden'
                  }}
                >
                  {/* Avatar for live or completed students */}
                  {isAssigned && (isLive || isCompleted) && (
                    photoUrl ? (
                      <img 
                        src={photoUrl} 
                        alt={studentName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px 10px 2px 2px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        {initial}
                      </span>
                    )
                  )}

                  {/* Assigned but not joined - show initial faintly */}
                  {isAssigned && !isLive && !isCompleted && (
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(59, 130, 246, 0.5)' }}>
                      {initial}
                    </span>
                  )}

                  {/* Empty seat icon */}
                  {!isAssigned && (
                    <div style={{ 
                      position: 'absolute', top: '15%', width: '60%', height: '45%', 
                      border: '1px solid var(--border-color)', borderRadius: '6px' 
                    }}></div>
                  )}

                  {/* Status indicator dot */}
                  {isAssigned && (isLive || isCompleted) && (
                    <div style={{ 
                      position: 'absolute', bottom: '2px', right: '2px', 
                      width: '12px', height: '12px', 
                      background: isCompleted ? '#f59e0b' : 'var(--success)', 
                      borderRadius: '50%', 
                      border: '2px solid var(--bg-secondary)'
                    }}></div>
                  )}
                </div>

                {/* Hover Tooltip - MOVED OUTSIDE of seat to prevent clipping */}
                {isAssigned && (
                  <div className="tooltip" style={{ minWidth: '150px' }}>
                    <div style={{ fontWeight: 800, whiteSpace: 'nowrap', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>{studentName}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isCompleted ? '#f59e0b' : isLive ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {isCompleted ? '✅ Completed' : isLive ? '🟢 Attempting Now' : '⚪ Not Joined Yet'}
                    </div>
                    {isCompleted && assignment.submitted_at && (
                      <div style={{ fontSize: '0.65rem', marginTop: '0.4rem', color: 'var(--text-secondary)' }}>
                        Submitted: {new Date(assignment.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${cols}, 55px)`, 
              gap: '0.75rem',
              justifyContent: 'center'
            }}>
              {seats}
            </div>
          );
        })()}

        {/* Legend - Now more prominent */}
        <div style={{ 
          marginTop: '4rem', 
          display: 'flex', 
          gap: '2rem', 
          padding: '1.5rem 3rem', 
          background: 'var(--bg-primary)', 
          borderRadius: '20px', 
          border: '1px solid var(--border-color)', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          boxShadow: 'var(--shadow-premium)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '22px', height: '22px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-secondary)' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>EMPTY SEAT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '22px', height: '22px', background: 'rgba(59, 130, 246, 0.15)', border: '2px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ASSIGNED / ABSENT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '22px', height: '22px', background: 'var(--success)', borderRadius: '6px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>LIVE NOW</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '22px', height: '22px', background: '#f59e0b', borderRadius: '6px', boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>COMPLETED</span>
          </div>
        </div>
        {/* Floor Label */}
        <div style={{ 
          position: 'absolute', bottom: '1.5rem', left: '0', right: '0', textAlign: 'center',
          color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.5
        }}>
          Virtual Classroom Floor
        </div>
      </div>
    </div>
  );
}
