'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState<{id: string, name: string, email: string, photo_url: string} | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('student_email');
    if (!email) {
      router.push('/student');
      return;
    }
    fetchAssignments(email);
    const savedView = localStorage.getItem('student_dashboard_view') as 'grid' | 'list';
    if (savedView) setViewMode(savedView);
  }, [router]);

  const updateViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('student_dashboard_view', mode);
  };

  const fetchAssignments = async (email: string) => {
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

      if (studentError && studentError.code !== 'PGRST116') throw studentError;

      if (studentData) {
        setStudentInfo(studentData);
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('interview_assignments')
          .select(`
            *,
            interviews(*),
            responses (
              id,
              answer_text,
              questions (
                expected_answer
              )
            )
          `)
          .eq('student_id', studentData.id);

        if (assignmentError) throw assignmentError;
        setAssignments(assignmentData || []);

        // OFFLINE PRE-FETCH LOGIC
        const offlineAssignments = (assignmentData || []).filter(a => a.interviews?.is_offline_mode && a.status === 'pending');
        if (offlineAssignments.length > 0) {
          console.log('Detecting offline interviews, pre-fetching questions...');
          for (const ass of offlineAssignments) {
            const { data: qData, error: qError } = await supabase
              .from('questions')
              .select('*')
              .eq('interview_id', ass.interview_id)
              .order('order_index', { ascending: true });
            
            if (!qError && qData) {
              localStorage.setItem(`offline_questions_${ass.id}`, JSON.stringify(qData));
              localStorage.setItem(`offline_assignment_${ass.id}`, JSON.stringify(ass));
              console.log(`Pre-fetched ${qData.length} questions for assignment ${ass.id}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !studentInfo) return;

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File too large. Maximum size is 2MB.');
        return;
      }

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentInfo.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: publicUrl })
        .eq('id', studentInfo.id);

      if (updateError) throw updateError;

      setStudentInfo({ ...studentInfo, photo_url: publicUrl });
    } catch (err: any) {
      console.error(err);
      alert('Upload failed. Ensure "avatars" bucket is public in Supabase.');
    } finally {
      setUploading(false);
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.interviews?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.interviews?.technology.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!studentInfo && !loading) return null;

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex-responsive">
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', textAlign: 'left' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', 
                background: 'var(--bg-primary)', border: '3px solid var(--accent-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
              }}>
                {studentInfo?.photo_url ? (
                  <img src={studentInfo.photo_url} alt={studentInfo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{studentInfo?.name.charAt(0)}</span>
                )}
              </div>
              <label style={{ 
                position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-color)', 
                color: '#fff', width: '24px', height: '24px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                fontSize: '1rem', border: '2px solid var(--bg-secondary)'
              }}>
                +
                <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              {uploading && (
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                  background: 'rgba(0,0,0,0.7)', borderRadius: '50%', display: 'flex', 
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  color: '#fff', fontSize: '0.6rem', fontWeight: 600, zIndex: 10
                }}>
                  <div className="spinner-small" style={{ marginBottom: '2px', width: '15px', height: '15px' }}></div>
                  ...
                </div>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Welcome, {studentInfo?.name}</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{studentInfo?.email}</p>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); router.push('/student'); }} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '1rem', 
        marginBottom: '2.5rem',
        background: 'var(--glass-bg)',
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(10px)',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search by interview title or technology..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginRight: '1rem' }}>
            Showing <strong>{filteredAssignments.length}</strong> interviews
          </div>
          <div style={{ display: 'flex', background: 'var(--bg-accent)', padding: '0.2rem', borderRadius: '8px', gap: '0.2rem', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => updateViewMode('grid')}
              style={{ 
                padding: '0.4rem 0.8rem', 
                background: viewMode === 'grid' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Grid
            </button>
            <button 
              onClick={() => updateViewMode('list')}
              style={{ 
                padding: '0.4rem 0.8rem', 
                background: viewMode === 'list' ? 'var(--accent-gradient)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading your assignments...</p>
      ) : filteredAssignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No interviews found matching your criteria.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
          {filteredAssignments.map((assignment) => {
            const isCompleted = assignment.status === 'completed';
            const correctCount = assignment.responses?.reduce((acc: number, res: any) => {
              if (!res.questions?.expected_answer) return acc;
              const studentAns = (res.answer_text || '').trim().toLowerCase();
              const expectedAns = (res.questions.expected_answer || '').trim().toLowerCase();
              return studentAns === expectedAns ? acc + 1 : acc;
            }, 0) || 0;
            const totalQuestions = assignment.responses?.length || 0;
            const isPass = isCompleted && totalQuestions > 0 && (correctCount / totalQuestions) >= 0.5;

            return (
              <div 
                key={assignment.id} 
                className="card material-card" 
                style={{ 
                  display: 'flex', flexDirection: 'column', gap: '1.25rem', 
                  background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', 
                  border: '1px solid var(--border-color)', transition: 'all 0.3s ease'
                }}
              >
                <div className="flex-between">
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{assignment.interviews?.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {assignment.interviews?.technology} • {assignment.duration} mins
                    </div>
                  </div>
                  {assignment.interviews?.is_offline_mode && (
                    <span style={{ 
                      background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', 
                      fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
                      border: '1px solid rgba(239,68,68,0.2)', fontWeight: 800, height: 'fit-content'
                    }}>OFFLINE</span>
                  )}
                </div>

                <div className="flex-between" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                  <span style={{ 
                    background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : assignment.interviews?.is_archived ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                    color: isCompleted ? 'var(--success)' : assignment.interviews?.is_archived ? '#f59e0b' : 'var(--accent-color)',
                    padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                    border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.2)' : assignment.interviews?.is_archived ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                  }}>
                    {isCompleted ? assignment.status : (assignment.interviews?.is_archived ? 'archived' : assignment.status)}
                  </span>
                  {isCompleted && (
                    <span style={{ color: isPass ? 'var(--success)' : 'var(--danger)', fontWeight: 800, fontSize: '0.75rem' }}>
                      {isPass ? '● PASS' : '● FAIL'} ({correctCount}/{totalQuestions})
                    </span>
                  )}
                </div>

                <div style={{ marginTop: 'auto' }}>
                  {assignment.status === 'pending' ? (
                    assignment.interviews?.is_archived ? (
                      <button disabled style={{ width: '100%', background: 'var(--bg-accent)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}>Archived</button>
                    ) : (
                      <Link href={`/interview/${assignment.id}`}>
                        <button style={{ width: '100%', background: 'var(--accent-gradient)' }}>Attempt Interview</button>
                      </Link>
                    )
                  ) : (
                    <Link href={`/student/results/${assignment.id}`}>
                      <button style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>View Results</button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Interview</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Result</th>
                  <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => {
                  const isCompleted = assignment.status === 'completed';
                  
                  // Score calculation
                  const correctCount = assignment.responses?.reduce((acc: number, res: any) => {
                    if (!res.questions?.expected_answer) return acc;
                    const studentAns = (res.answer_text || '').trim().toLowerCase();
                    const expectedAns = (res.questions.expected_answer || '').trim().toLowerCase();
                    return studentAns === expectedAns ? acc + 1 : acc;
                  }, 0) || 0;
                  const totalQuestions = assignment.responses?.length || 0;
                  const isPass = isCompleted && totalQuestions > 0 && (correctCount / totalQuestions) >= 0.5;

                  return (
                    <tr key={assignment.id} className="material-card-list" style={{ borderBottom: '1px solid var(--border-color)', transition: 'all 0.2s ease' }}>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {assignment.interviews?.title}
                          {assignment.interviews?.is_offline_mode && (
                            <span style={{ 
                              background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', 
                              fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                              border: '1px solid rgba(239,68,68,0.2)', fontWeight: 800
                            }}>OFFLINE</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{assignment.interviews?.technology} • {assignment.duration} mins</div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {assignment.scheduled_date || 'Not scheduled'}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <span style={{ 
                          background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : assignment.interviews?.is_archived ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                          color: isCompleted ? 'var(--success)' : assignment.interviews?.is_archived ? '#f59e0b' : 'var(--accent-color)',
                          padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                          border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.2)' : assignment.interviews?.is_archived ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                        }}>
                          {isCompleted ? assignment.status : (assignment.interviews?.is_archived ? 'archived' : assignment.status)}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {isCompleted ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <strong style={{ fontSize: '1rem' }}>{correctCount}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {totalQuestions}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {isCompleted ? (
                          <span style={{ color: isPass ? 'var(--success)' : 'var(--danger)', fontWeight: 800, fontSize: '0.8rem' }}>
                            {isPass ? '● PASS' : '● FAIL'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        {assignment.status === 'pending' ? (
                          assignment.interviews?.is_archived ? (
                            <button disabled style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', background: 'var(--bg-accent)', color: 'var(--text-secondary)', cursor: 'not-allowed', border: '1px solid var(--border-color)' }}>Archived</button>
                          ) : (
                            <Link href={`/interview/${assignment.id}`}>
                              <button style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', background: 'var(--accent-gradient)' }}>Attempt Interview</button>
                            </Link>
                          )
                        ) : (
                          <Link href={`/student/results/${assignment.id}`}>
                            <button style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>View Results</button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .material-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent-color) !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .material-card-list:hover {
          background: rgba(255, 255, 255, 0.03) !important;
        }
      `}</style>
    </div>
  );
}
