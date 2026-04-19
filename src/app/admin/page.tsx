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
    totalBatches: 0,
    totalCompleted: 0,
    totalPending: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  useEffect(() => {
    fetchData();
    fetchViewMode();
  }, []);

  const fetchViewMode = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_dashboard_view')
        .single();
      
      if (data && data.value) {
        setViewMode(data.value as 'grid' | 'list');
      } else {
        // Fallback to localStorage if not in server yet
        const savedView = localStorage.getItem('admin_view_mode') as 'grid' | 'list';
        if (savedView) setViewMode(savedView);
      }
    } catch (err) {
      console.warn('Could not fetch view mode from server:', err);
      // Fallback
      const savedView = localStorage.getItem('admin_view_mode') as 'grid' | 'list';
      if (savedView) setViewMode(savedView);
    }
  };

  const updateViewMode = async (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('admin_view_mode', mode); // Still keep local for instant load
    try {
      await supabase
        .from('app_settings')
        .upsert({ key: 'admin_dashboard_view', value: mode });
    } catch (err) {
      console.error('Error saving view mode to server:', err);
    }
  };

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
      
      // 3. Fetch Batch Count
      const { count: batchCount } = await supabase.from('groups').select('*', { count: 'exact', head: true });

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
        totalBatches: batchCount || 0,
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
      title: 'Permanently Delete Interview',
      message: `Are you sure you want to permanently delete "${title}"? This action cannot be undone and will remove all associated data.`,
      confirmText: 'Delete Permanently',
      danger: true,
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('interviews').delete().eq('id', interviewId);
      if (error) throw error;
      setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
      showToast('Interview deleted permanently', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete interview: ' + err.message, 'error');
    }
  };

  const handleArchive = async (interviewId: string, title: string) => {
    const confirmed = await showConfirm({
      title: 'Archive Interview',
      message: `Are you sure you want to archive "${title}"? It will be moved to the archive and hidden from students starting new attempts, but history will be preserved.`,
      confirmText: 'Archive',
      danger: false,
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('interviews')
        .update({ is_archived: true })
        .eq('id', interviewId);
      
      if (error) throw error;
      
      setInterviews((prev) => prev.map(i => i.id === interviewId ? { ...i, is_archived: true } : i));
      showToast('Interview archived successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to archive interview: ' + err.message, 'error');
    }
  };

  const handleRestore = async (interviewId: string) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ is_archived: false })
        .eq('id', interviewId);
      
      if (error) throw error;
      
      setInterviews((prev) => prev.map(i => i.id === interviewId ? { ...i, is_archived: false } : i));
      showToast('Interview restored successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to restore interview: ' + err.message, 'error');
    }
  };

  const filteredInterviews = interviews.filter(i => {
    const matchesTab = activeTab === 'active' ? !i.is_archived : i.is_archived;
    const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.technology.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'All' || i.difficulty === filterDifficulty;
    return matchesTab && matchesSearch && matchesDifficulty;
  });

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

      <div className="flex-responsive" style={{ marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
              <button 
                onClick={() => setActiveTab('active')}
                style={{ 
                  background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer',
                  color: activeTab === 'active' ? 'var(--accent-color)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'active' ? '2px solid var(--accent-color)' : 'none',
                  fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.2s'
                }}
              >
                Active
              </button>
              <button 
                onClick={() => setActiveTab('archived')}
                style={{ 
                  background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer',
                  color: activeTab === 'archived' ? 'var(--accent-color)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'archived' ? '2px solid var(--accent-color)' : 'none',
                  fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.2s'
                }}
              >
                Archived
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Showing {filteredInterviews.length} {activeTab} sessions</div>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginLeft: '1rem' }}>
            <button 
              onClick={() => updateViewMode('grid')}
              style={{ 
                padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px',
                background: viewMode === 'grid' ? 'var(--bg-accent)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--accent-color)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              ⊞ Grid
            </button>
            <button 
              onClick={() => updateViewMode('list')}
              style={{ 
                padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px',
                background: viewMode === 'list' ? 'var(--bg-accent)' : 'transparent',
                color: viewMode === 'list' ? 'var(--accent-color)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              ≡ List
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search by title or tech..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem', fontSize: '0.9rem' }}
            />
          </div>
          <select 
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            style={{ width: 'auto', minWidth: '150px', fontSize: '0.9rem' }}
          >
            <option value="All">All Difficulty</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div style={{ 
        display: viewMode === 'grid' ? 'grid' : 'flex', 
        flexDirection: viewMode === 'grid' ? 'initial' : 'column',
        gap: '1.5rem', 
        gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'none' 
      }}>
        {filteredInterviews.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--glass-bg)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No interviews found matching your criteria.</p>
            {(searchQuery || filterDifficulty !== 'All') && (
              <button onClick={() => { setSearchQuery(''); setFilterDifficulty('All'); }} style={{ background: 'var(--bg-accent)' }}>Clear Filters</button>
            )}
          </div>
        ) : (
          filteredInterviews.map((interview) => (
            viewMode === 'grid' ? (
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
                {/* Archive/Delete button in top-right corner */}
                {activeTab === 'active' ? (
                  <button
                    onClick={() => handleArchive(interview.id, interview.title)}
                    title="Archive interview"
                    style={{
                      position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(245, 158, 11, 0.1)',
                      color: '#f59e0b', padding: '0.4rem', fontSize: '0.9rem',
                      lineHeight: 1, borderRadius: '8px', transition: 'all 0.2s ease', border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    📥
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(interview.id, interview.title)}
                    title="Delete permanently"
                    style={{
                      position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(244, 63, 94, 0.1)',
                      color: 'var(--danger)', padding: '0.4rem', fontSize: '0.9rem',
                      lineHeight: 1, borderRadius: '8px', transition: 'all 0.2s ease', border: '1px solid rgba(244, 63, 94, 0.2)'
                    }}
                  >
                    ✕
                  </button>
                )}

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
                  {activeTab === 'archived' && (
                    <button 
                      onClick={() => handleRestore(interview.id)}
                      style={{ 
                        gridColumn: 'span 2', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', 
                        border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', fontWeight: 700 
                      }}
                    >
                      Restore Interview
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* LIST VIEW ITEM */
              <div 
                key={interview.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '2rem', 
                  padding: '1.25rem 1.75rem',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--shadow-premium)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '0.4rem' }}>{interview.title}</h4>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💻 {interview.technology}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🎯 {interview.difficulty}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-color)', background: 'rgba(59,130,246,0.1)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{interview.mode}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{interview.interview_assignments?.length || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assigned</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--success)' }}>{interview.interview_assignments?.filter((a: any) => a.status === 'completed').length || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Completed</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link href={`/admin/live/${interview.id}`}>
                    <button style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', border: '1px solid rgba(244, 63, 94, 0.1)' }}>Live</button>
                  </Link>
                  <Link href={`/admin/view/${interview.id}`}>
                    <button style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', background: 'var(--bg-accent)', color: 'var(--text-primary)' }}>Manage</button>
                  </Link>
                  <Link href={`/admin/results/${interview.id}`}>
                    <button style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', background: 'var(--accent-gradient)' }}>Results</button>
                  </Link>
                  {activeTab === 'active' ? (
                    <button 
                      onClick={() => handleArchive(interview.id, interview.title)}
                      title="Archive"
                      style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', opacity: 0.8 }}
                    >
                      📥
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleRestore(interview.id)}
                        title="Restore"
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', background: 'transparent', color: 'var(--success)', border: '1px solid var(--success)', opacity: 0.8 }}
                      >
                        ↺
                      </button>
                      <button 
                        onClick={() => handleDelete(interview.id, interview.title)}
                        title="Delete Permanently"
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', opacity: 0.6 }}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>

  );
}
