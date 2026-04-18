'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function AdminDashboard() {
  const { showToast, showConfirm } = useUI();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGroups: 0,
    totalCompleted: 0,
    totalPending: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Interviews and assignments
      const { data: intData, error: intError } = await supabase
        .from('interviews')
        .select('*, interview_assignments(status)')
        .order('created_at', { ascending: false });
      
      if (intError) throw intError;
      setInterviews(intData || []);

      // 2. Fetch Student Count
      const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      
      // 3. Fetch Group Count
      const { count: groupCount } = await supabase.from('groups').select('*', { count: 'exact', head: true });

      // 4. Calculate status stats from interviews data
      let completed = 0;
      let pending = 0;
      intData?.forEach(i => {
        i.interview_assignments?.forEach((a: any) => {
          if (a.status === 'completed') completed++;
          else pending++;
        });
      });

      setStats({
        totalStudents: studentCount || 0,
        totalGroups: groupCount || 0,
        totalCompleted: completed,
        totalPending: pending
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (interviewId: string, title: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Interview',
      message: `Are you sure you want to delete "${title}"? This will also delete all questions, assignments, and responses linked to this interview.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('interviews').delete().eq('id', interviewId);
      if (error) throw error;
      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
      showToast('Interview deleted successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete interview: ' + err.message, 'error');
    }
  };

  if (loading) return <div className="container"><p>Loading interviews...</p></div>;

  return (
    <div className="container">
      <div className="flex-responsive" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <Link href="/admin/create">
          <button style={{ width: '100%', background: 'var(--accent-gradient)' }}>+ Create Interview</button>
        </Link>
      </div>

      {/* Stats Overview Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.25rem', 
        marginBottom: '3.5rem' 
      }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📄</div>
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{interviews.length}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Interviews</span>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✅</div>
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--success)' }}>{stats.totalCompleted}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Completed</span>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⏳</div>
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: '#f59e0b' }}>{stats.totalPending}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Pending</span>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👨‍🎓</div>
          <div>
            <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: '#8b5cf6' }}>{stats.totalStudents}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Students</span>
          </div>
        </div>
      </div>

      <div className="flex-responsive" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>All Interviews</h3>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Showing {interviews.length} sessions</div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }}>
        {interviews.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--glass-bg)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No interviews created yet.</p>
            <Link href="/admin/create">
              <button style={{ background: 'var(--accent-gradient)' }}>Create your first interview</button>
            </Link>
          </div>
        ) : (
          interviews.map((interview) => (
            <div 
              key={interview.id} 
              className="card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.25rem', 
                position: 'relative', 
                padding: '1.75rem',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-premium)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              {/* Delete button in top-right corner */}
              <button
                onClick={() => handleDelete(interview.id, interview.title)}
                title="Delete interview"
                style={{
                  position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(244, 63, 94, 0.1)',
                  color: 'var(--danger)', padding: '0.4rem', fontSize: '0.9rem',
                  lineHeight: 1, borderRadius: '8px', transition: 'all 0.2s ease', border: '1px solid rgba(244, 63, 94, 0.2)'
                }}
              >
                ✕
              </button>

              <div>
                <h3 style={{ marginBottom: '0.75rem', paddingRight: '2.5rem', fontSize: '1.4rem', lineHeight: '1.2', fontWeight: 800 }}>{interview.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem' }}>💻</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{interview.technology}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem' }}>🎯</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{interview.difficulty}</span>
                  </div>
                  <span style={{ 
                    background: interview.mode === 'AI' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                    color: interview.mode === 'AI' ? '#a78bfa' : '#60a5fa', 
                    padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {interview.mode}
                  </span>
                </div>
              </div>

              {/* Premium Stats Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {interview.interview_assignments?.length || 0}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.4rem', fontWeight: 700 }}>
                    Assigned
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>
                    {interview.interview_assignments?.filter((a: any) => a.status === 'completed').length || 0}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.4rem', fontWeight: 700 }}>
                    Completed
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                <Link href={`/admin/view/${interview.id}`} style={{ gridColumn: 'span 2' }}>
                  <button style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', padding: '0.75rem', fontWeight: 600 }}>Manage Interview Details</button>
                </Link>
                <Link href={`/admin/live/${interview.id}`}>
                  <button style={{ 
                    width: '100%', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', 
                    border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.85rem', padding: '0.75rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}>
                    <span style={{ width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }}></span>
                    Live Room
                  </button>
                </Link>
                <Link href={`/admin/results/${interview.id}`}>
                  <button style={{ width: '100%', background: 'var(--accent-gradient)', color: '#fff', fontSize: '0.85rem', padding: '0.75rem', fontWeight: 700, border: 'none' }}>View Results</button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

  );
}
