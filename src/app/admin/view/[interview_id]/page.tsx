'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

const typeBadge: Record<string, { label: string; color: string }> = {
  mcq: { label: 'MCQ', color: '#8b5cf6' },
  true_false: { label: 'True / False', color: '#f59e0b' },
  short_answer: { label: 'Short Answer', color: '#3b82f6' },
  long_answer: { label: 'Long Answer', color: '#10b981' },
};

export default function ViewInterviewQuestions() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interview_id as string;

  const [interview, setInterview] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingGroup, setViewingGroup] = useState<any>(null);
  const { showToast, showConfirm } = useUI();

  const handleRemove = async (assignmentId: string, studentName: string) => {
    const confirmed = await showConfirm({
      title: 'Remove Assignment',
      message: `Are you sure you want to remove the interview assignment for ${studentName}?`,
      confirmText: 'Remove',
      danger: true,
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('interview_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      showToast('Assignment removed successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to remove assignment: ' + err.message, 'error');
    }
  };

  const handleRemoveGroup = async (groupId: string, groupName: string) => {
    const confirmed = await showConfirm({
      title: 'Remove Group Assignment',
      message: `Are you sure you want to remove the entire group "${groupName}" from this interview? This will delete all assignments for students in this group.`,
      confirmText: 'Remove All',
      danger: true,
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('interview_assignments')
        .delete()
        .eq('interview_id', interviewId)
        .eq('group_id', groupId);
      
      if (error) throw error;
      setAssignments((prev) => prev.filter((a) => a.group_id !== groupId));
      showToast(`Group "${groupName}" removed successfully`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to remove group: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: id } = await supabase.from('interviews').select('*').eq('id', interviewId).single();
        if (id) setInterview(id);
        const { data: qd } = await supabase.from('questions').select('*').eq('interview_id', interviewId).order('order_index', { ascending: true });
        setQuestions(qd || []);
        const { data: ad } = await supabase.from('interview_assignments').select('*, students(*), groups(*)').eq('interview_id', interviewId);
        setAssignments(ad || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [interviewId]);

  if (loading) return <div className="container">Loading questions...</div>;
  if (!interview) return <div className="container">Interview not found.</div>;

  return (
    <div className="container">
      <button 
        onClick={() => router.back()} 
        style={{ 
          background: 'none', 
          border: 'none', 
          padding: 0, 
          marginBottom: '1.5rem', 
          color: 'var(--text-secondary)', 
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        &larr; Back
      </button>

      <h2 style={{ marginBottom: '0.5rem' }}>{interview.title}</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{interview.technology} • {interview.difficulty}</p>
        <span style={{ background: 'var(--bg-accent)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{interview.mode} Mode</span>
      </div>

      {/* 12-col grid: 4 left (Students) | 8 right (Questions) */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 8fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: Assigned Students (4 span) */}
        <div className="card" style={{ position: 'sticky', top: '1rem' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Assigned Students</h3>
          </div>
          <Link href={`/admin/assign/${interviewId}`}>
            <button style={{ width: '100%', marginBottom: '1rem' }}>+ Assign Student/Group</button>
          </Link>
          {assignments.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0', fontSize: '0.9rem' }}>No students assigned yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                const individual: any[] = [];
                const groups: Record<string, { groupName: string; assignments: any[] }> = {};

                assignments.forEach(a => {
                  if (a.group_id && a.groups?.name) {
                    if (!groups[a.group_id]) groups[a.group_id] = { groupName: a.groups.name, assignments: [] };
                    groups[a.group_id].assignments.push(a);
                  } else {
                    individual.push(a);
                  }
                });

                return (
                  <>
                    {/* Render Groups */}
                    {Object.entries(groups).map(([groupId, groupData]: [string, any]) => (
                      <div 
                        key={groupId} 
                        onClick={() => setViewingGroup(groupData)}
                        style={{ 
                          padding: '0.85rem', 
                          background: 'var(--bg-primary)', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          marginBottom: '0.75rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>📁</span>
                          <div>
                            <strong style={{ display: 'block' }}>{groupData.groupName}</strong>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Group ({groupData.assignments.length} members)</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600 }}>View List →</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveGroup(groupId, groupData.groupName);
                            }}
                            title="Remove entire group"
                            style={{ background: 'transparent', color: 'var(--danger)', fontSize: '1.2rem', padding: '0.2rem', lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

                    {individual.map((a) => (
                      <div key={a.id} style={{ padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <strong style={{ fontSize: '0.95rem' }}>{a.students?.name}</strong>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{
                              background: a.status === 'completed' ? 'var(--success)' : 'var(--accent-color)',
                              padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', color: '#fff', fontWeight: 600
                            }}>
                              {a.status.toUpperCase()}
                            </span>
                            <button 
                              onClick={() => handleRemove(a.id, a.students?.name)}
                              title="Remove assignment"
                              style={{ background: 'transparent', color: 'var(--danger)', padding: '0.2rem', fontSize: '1rem', lineHeight: 1 }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{a.students?.email}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          {a.scheduled_date} at {a.start_time} • {a.duration} mins
                        </p>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* RIGHT: Questions (8 span) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Questions ({questions.length})</h3>
          {questions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No questions added yet.</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const badge = typeBadge[q.question_type] || typeBadge.short_answer;
              return (
                <div key={q.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>Q{idx + 1}.</span>
                    <span style={{ background: badge.color, color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {badge.label}
                    </span>
                  </div>

                  <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', lineHeight: '1.5' }}>{q.question_text}</h4>

                  {q.question_type === 'mcq' && q.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {q.options.map((opt: string, i: number) => (
                        <div key={i} style={{
                          padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.95rem',
                          background: opt === q.expected_answer ? 'rgba(34,197,94,0.15)' : 'var(--bg-primary)',
                          border: opt === q.expected_answer ? '1px solid var(--success)' : '1px solid var(--border-color)',
                          color: opt === q.expected_answer ? 'var(--success)' : 'var(--text-primary)',
                          fontWeight: opt === q.expected_answer ? 600 : 400,
                        }}>
                          {opt === q.expected_answer ? '✓ ' : ''}{opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.expected_answer && q.question_type !== 'mcq' && (
                    <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.1)', borderRadius: 'var(--border-radius)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>Expected Answer:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontFamily: q.question_type === 'long_answer' ? 'monospace' : 'inherit', fontSize: '0.9rem' }}>
                        {q.expected_answer}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Group Members Modal */}
      {viewingGroup && (
        <div className="modal-overlay">
          <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{viewingGroup.groupName} Members</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>{viewingGroup.assignments.length} Students assigned</p>
              </div>
              <button onClick={() => setViewingGroup(null)} style={{ background: 'transparent', fontSize: '1.5rem', color: 'var(--text-secondary)', padding: 0 }}>✕</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
              {viewingGroup.assignments.map((a: any) => (
                <div key={a.id} className="flex-between" style={{ padding: '0.85rem', background: 'var(--bg-accent)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ 
                      width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', 
                      background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid var(--border-color)'
                    }}>
                      {a.students?.photo_url ? (
                        <img src={a.students.photo_url} alt={a.students.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{a.students?.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{a.students?.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.students?.email}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{
                      background: a.status === 'completed' ? 'var(--success)' : 'var(--accent-color)',
                      padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.65rem', color: '#fff', fontWeight: 600
                    }}>
                      {a.status.toUpperCase()}
                    </span>
                    <button 
                      onClick={() => {
                        handleRemove(a.id, a.students?.name);
                        setViewingGroup(null);
                      }}
                      style={{ background: 'transparent', color: 'var(--danger)', fontSize: '1.1rem', padding: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setViewingGroup(null)} style={{ marginTop: '1.5rem', width: '100%', background: 'var(--bg-accent)' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
