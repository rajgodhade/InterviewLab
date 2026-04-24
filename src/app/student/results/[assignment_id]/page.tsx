'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function StudentInterviewResults() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const assignmentId = params.assignment_id as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assignmentId) {
      fetchResults();
    }
  }, [assignmentId]);

  const fetchResults = async () => {
    try {
      // Fetch Assignment, Student, Interview, and Responses with Questions
      const { data: assignmentData, error: aError } = await supabase
        .from('interview_assignments')
        .select(`
          *,
          interviews (*),
          students (*),
          responses (
            *,
            questions (*)
          )
        `)
        .eq('id', assignmentId)
        .single();

      if (aError) throw aError;
      setAssignment(assignmentData);

      // Fetch Total Questions count for this interview
      const { count, error: qError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('interview_id', assignmentData.interview_id);
      
      if (qError) throw qError;
      setTotalQuestions(count || 0);

    } catch (err: any) {
      console.error('Error fetching results:', err);
      showToast('Error loading results: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (responses: any[]) => {
    if (!responses || responses.length === 0) return 0;
    return responses.reduce((acc: number, res: any) => {
      if (!res.questions?.expected_answer) return acc;
      const studentAns = (res.answer_text || '').trim().toLowerCase();
      const expectedAns = (res.questions.expected_answer || '').trim().toLowerCase();
      return studentAns === expectedAns ? acc + 1 : acc;
    }, 0);
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;
  if (!assignment) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Results not found.</div>;

  const score = calculateScore(assignment.responses);
  const passingMark = Math.ceil(totalQuestions / 2);
  const isAutoPass = score >= passingMark;
  
  // Use manual status if available, fallback to auto
  const finalPass = assignment.pass_status ? (assignment.pass_status === 'pass') : isAutoPass;
  const resultLabel = assignment.pass_status ? (assignment.pass_status === 'pass' ? 'PASSED' : 'FAILED') : (isAutoPass ? 'PASSED' : 'FAILED');

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <button 
        onClick={() => router.back()} 
        style={{ 
          background: 'none', border: 'none', padding: 0, marginBottom: '1.5rem', 
          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}
      >
        &larr; Back to Dashboard
      </button>

      {/* Manual Evaluation Header (New Section) */}
      {assignment.pass_status && (
        <div className="card" style={{ 
          marginBottom: '2rem', 
          background: assignment.pass_status === 'pass' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
          border: `2px solid ${assignment.pass_status === 'pass' ? 'var(--success)' : 'var(--danger)'}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: 0.1, pointerEvents: 'none'
          }}>
            {assignment.pass_status === 'pass' ? '✅' : '❌'}
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ color: assignment.pass_status === 'pass' ? 'var(--success)' : 'var(--danger)', marginBottom: '1rem' }}>
              Final Interview Evaluation: {resultLabel}
            </h3>
            {assignment.admin_feedback ? (
              <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Interviewer Feedback:</strong>
                <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  {assignment.admin_feedback}
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>The interviewer has marked this session as {assignment.pass_status.toUpperCase()}.</p>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex-responsive" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>{assignment.interviews?.title}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {assignment.interviews?.technology} • {assignment.interviews?.difficulty}
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Scheduled</span>
                <strong>{assignment.scheduled_date} at {assignment.start_time}</strong>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Submitted</span>
                <strong>{assignment.submitted_at ? new Date(assignment.submitted_at).toLocaleString() : 'N/A'}</strong>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: '200px' }}>
            <div style={{ 
              background: finalPass ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: finalPass ? 'var(--success)' : 'var(--danger)',
              padding: '1.5rem', borderRadius: '16px', border: `1px solid ${finalPass ? 'var(--success)' : 'var(--danger)'}`,
              textAlign: 'center'
            }}>
              <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '1px' }}>Result Status</span>
              {totalQuestions > 0 && (
                <strong style={{ fontSize: '2.5rem', display: 'block', lineHeight: 1 }}>{score}/{totalQuestions}</strong>
              )}
              <span style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem', display: 'block' }}>{resultLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {assignment.responses && assignment.responses.length > 0 && (
        <>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Detailed Review</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({assignment.responses?.length || 0} Questions)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {assignment.responses.map((res: any, idx: number) => {
              const studentAns = (res.answer_text || '').trim().toLowerCase();
              const expectedAns = (res.questions?.expected_answer || '').trim().toLowerCase();
              const isCorrect = studentAns === expectedAns && expectedAns !== '';

              return (
                <div key={res.id} className="card" style={{ borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                  <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-color)' }}>QUESTION {idx + 1}</span>
                        <span style={{ background: 'var(--bg-accent)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', textTransform: 'uppercase' }}>{res.questions?.question_type?.replace('_', ' ') || 'SHORT ANSWER'}</span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.5' }}>{res.questions?.question_text}</h4>
                    </div>
                    {res.questions?.expected_answer && (
                      <div style={{ 
                        background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isCorrect ? 'var(--success)' : 'var(--danger)',
                        padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700
                      }}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your Answer:</strong>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem' }}>{res.answer_text || <em style={{ color: 'var(--text-secondary)' }}>No answer provided</em>}</p>
                    </div>

                    {res.questions?.expected_answer && (
                      <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.03)', borderRadius: '12px', border: '1px dashed rgba(16, 185, 129, 0.3)' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--success)' }}>Correct Answer:</strong>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem' }}>{res.questions.expected_answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
