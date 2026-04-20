'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useUI } from '@/components/UIProvider';
import { getTechIcons } from '@/utils/tech-utils';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    // Close menu when clicking anywhere else
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    // Realtime subscription for interview assignments to track live room status
    // Use a unique channel name to avoid "callbacks after subscribe" errors on re-mount
    const channelId = `dashboard-live-updates-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interview_assignments' },
        (payload) => {
          setInterviews((prev) => {
            return prev.map(interview => {
              // If this assignment belongs to this interview
              const targetInterviewId = payload.new ? (payload.new as any).interview_id : (payload.old as any).interview_id;
              
              if (targetInterviewId === interview.id) {
                const updatedAssignments = [...(interview.interview_assignments || [])];
                
                if (payload.eventType === 'INSERT') {
                  updatedAssignments.push(payload.new);
                } else if (payload.eventType === 'UPDATE') {
                  const idx = updatedAssignments.findIndex(a => a.id === payload.new.id);
                  if (idx !== -1) updatedAssignments[idx] = payload.new;
                  else updatedAssignments.push(payload.new);
                } else if (payload.eventType === 'DELETE') {
                  const idx = updatedAssignments.findIndex(a => a.id === payload.old.id);
                  if (idx !== -1) updatedAssignments.splice(idx, 1);
                }
                
                return { ...interview, interview_assignments: updatedAssignments };
              }
              return interview;
            });
          });
        }
      )
      .subscribe();

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      fetchData();
      fetchViewMode();
    };

    checkAuth();

    return () => {
      supabase.removeChannel(channel);
    };
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
        .select('*, interview_assignments(status, is_live)')
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

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      danger: true,
    });
    if (!confirmed) return;

    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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
      <div className="flex-responsive" style={{ marginBottom: '2.5rem', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'rgba(244, 63, 94, 0.1)', 
              color: 'var(--danger)', 
              border: '1px solid rgba(244, 63, 94, 0.2)',
              padding: '0.5rem 1rem'
            }}
          >
            Logout
          </button>
          <Link href="/admin/create">
            <button style={{ background: 'var(--accent-gradient)' }}>+ Create Interview</button>
          </Link>
        </div>
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

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('active')}
            style={{ 
              background: 'none', border: 'none', padding: '0.75rem 0.5rem', cursor: 'pointer',
              color: activeTab === 'active' ? 'var(--accent-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'active' ? '2px solid var(--accent-color)' : '2px solid transparent',
              fontWeight: 700, fontSize: '1.05rem', transition: 'all 0.2s',
              marginBottom: '-1px'
            }}
          >
            Active Interviews
          </button>
          <button 
            onClick={() => setActiveTab('archived')}
            style={{ 
              background: 'none', border: 'none', padding: '0.75rem 0.5rem', cursor: 'pointer',
              color: activeTab === 'archived' ? 'var(--accent-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'archived' ? '2px solid var(--accent-color)' : '2px solid transparent',
              fontWeight: 700, fontSize: '1.05rem', transition: 'all 0.2s',
              marginBottom: '-1px'
            }}
          >
            Archived
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '1.5rem', 
          background: 'var(--glass-bg)',
          padding: '0.75rem 1.25rem',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-premium)',
          flexWrap: 'wrap',
          marginBottom: '2rem'
        }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search interviews..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', height: '42px', borderRadius: '12px', border: 'none', background: 'rgba(0,0,0,0.2)', width: '100%', fontSize: '0.9rem' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              style={{ width: 'auto', height: '42px', minWidth: '140px', fontSize: '0.85rem', padding: '0 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}
            >
              <option value="All">All Difficulty</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }}></div>

            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '10px', gap: '0.25rem' }}>
              <button 
                onClick={() => updateViewMode('grid')}
                style={{ 
                  width: '36px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: viewMode === 'grid' ? 'var(--accent-color)' : 'transparent',
                  color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.2s'
                }}
              >
                ⊞
              </button>
              <button 
                onClick={() => updateViewMode('list')}
                style={{ 
                  width: '36px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: viewMode === 'list' ? 'var(--accent-color)' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.2s'
                }}
              >
                ≡
              </button>
            </div>
          </div>
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
                  gap: '1.5rem', 
                  position: 'relative', 
                  padding: '2rem',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--shadow-premium)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
                  e.currentTarget.style.borderColor = 'var(--accent-color)';
                  e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-premium)';
                }}
              >
                {/* Three Dot Menu */}
                <div 
                  style={{ position: 'absolute', top: '1.5rem', right: '1rem', zIndex: 20 }}
                  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                >
                  <button 
                    onClick={() => setActiveMenu(activeMenu === interview.id ? null : interview.id)}
                    style={{ 
                      background: 'none', border: 'none', color: 'var(--text-secondary)', 
                      cursor: 'pointer', fontSize: '1.5rem', padding: '0.5rem', lineHeight: 0,
                      transition: '0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    ⋮
                  </button>
                  
                  {activeMenu === interview.id && (
                    <div style={{ 
                      position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                      background: 'rgba(23, 23, 23, 0.95)', backdropFilter: 'blur(10px)',
                      border: '1px solid var(--glass-border)', borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)', width: '160px',
                      overflow: 'hidden', animation: 'fadeIn 0.2s ease'
                    }}>
                      {activeTab === 'active' ? (
                        <button 
                          onClick={() => { handleArchive(interview.id, interview.title); setActiveMenu(null); }}
                          style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                          <span>📥</span> Archive
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => { handleRestore(interview.id); setActiveMenu(null); }}
                            style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--success)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            <span>↺</span> Restore
                          </button>
                          <button 
                            onClick={() => { handleDelete(interview.id, interview.title); setActiveMenu(null); }}
                            style={{ width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                            <span>✕</span> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Tech Accent Line */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  background: interview.is_offline_mode ? 'var(--danger)' : 'var(--accent-gradient)',
                  opacity: 0.6
                }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>{interview.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{getTechIcons(interview.technology)[0] || '💻'}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>{interview.technology}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginRight: '2rem' }}>
                    {interview.is_offline_mode && (
                      <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.65rem', fontWeight: 800, padding: '0.25rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>Offline</span>
                    )}
                    <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', fontSize: '0.65rem', fontWeight: 800, padding: '0.25rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>{interview.difficulty}</span>
                  </div>
                </div>

                {/* Metrics Visualization */}
                <div style={{ 
                  display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{interview.interview_assignments?.length || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.5rem' }}>Assigned</div>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--success)', lineHeight: 1 }}>
                      {interview.interview_assignments?.filter((a: any) => a.status === 'completed').length || 0}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.5rem' }}>Completed</div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Link href={`/admin/view/${interview.id}`} style={{ gridColumn: 'span 2' }}>
                    <button style={{ 
                      width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', 
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.8rem', 
                      fontSize: '0.85rem', fontWeight: 600, transition: '0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      Manage Assignments
                    </button>
                  </Link>
                  
                  <Link href={`/admin/live/${interview.id}`}>
                    <button style={{ 
                      width: '100%', height: '100%', borderRadius: '12px', padding: '0.8rem', fontSize: '0.85rem', fontWeight: 700,
                      background: interview.interview_assignments?.some((a: any) => a.is_live && a.status !== 'completed') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.05)',
                      color: interview.interview_assignments?.some((a: any) => a.is_live && a.status !== 'completed') ? 'var(--success)' : 'var(--text-secondary)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: '0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = interview.interview_assignments?.some((a: any) => a.is_live && a.status !== 'completed') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = interview.interview_assignments?.some((a: any) => a.is_live && a.status !== 'completed') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.05)'; }}
                    >
                      <span style={{ 
                        width: '8px', height: '8px', background: interview.interview_assignments?.some((a: any) => a.is_live && a.status !== 'completed') ? 'var(--success)' : 'currentColor', 
                        borderRadius: '50%', animation: interview.interview_assignments?.some((a: any) => a.is_live && a.status !== 'completed') ? 'pulse-live 1.5s infinite' : 'none', opacity: 0.6
                      }}></span>
                      {interview.interview_assignments?.filter((a: any) => a.is_live && a.status !== 'completed').length > 0 ? (
                        <span>Monitor Live ({interview.interview_assignments?.filter((a: any) => a.is_live && a.status !== 'completed').length})</span>
                      ) : (
                        <span>Live Monitor</span>
                      )}
                    </button>
                  </Link>

                  <Link href={`/admin/results/${interview.id}`}>
                    <button style={{ 
                      width: '100%', borderRadius: '12px', padding: '0.8rem', fontSize: '0.85rem', fontWeight: 700,
                      background: 'var(--accent-gradient)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: '0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'; }}
                    >
                      View Results
                    </button>
                  </Link>
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
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ display: 'flex', gap: '2px' }}>
                        {getTechIcons(interview.technology).map((icon, idx) => (
                          <span key={idx}>{icon}</span>
                        ))}
                      </span> 
                      {interview.technology}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🎯 {interview.difficulty}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-color)', background: 'rgba(59,130,246,0.1)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{interview.mode}</span>
                    {interview.is_offline_mode && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>Offline</span>}
                    {interview.interview_assignments?.some((a: any) => a.is_live) && (
                      <span style={{ 
                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '0.1rem 0.5rem', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                      }}>
                        <span style={{ width: '5px', height: '5px', background: 'var(--success)', borderRadius: '50%', animation: 'pulse-live 1.5s infinite' }}></span>
                        LIVE
                      </span>
                    )}
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
                    <button style={{ 
                      padding: '0.6rem 1rem', fontSize: '0.85rem', 
                      background: interview.interview_assignments?.some((a: any) => a.is_live) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', 
                      color: interview.interview_assignments?.some((a: any) => a.is_live) ? 'var(--success)' : 'var(--danger)', 
                      border: interview.interview_assignments?.some((a: any) => a.is_live) ? '1px solid rgba(16, 185, 129, 0.1)' : '1px solid rgba(244, 63, 94, 0.1)' 
                    }}>
                      Monitor
                    </button>
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
