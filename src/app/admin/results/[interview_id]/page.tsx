'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function InterviewResults() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useUI();
  const interviewId = params.interview_id as string;
  const targetStudentId = searchParams.get('student');

  const [interview, setInterview] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [passingMark, setPassingMark] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  useEffect(() => {
    console.log('Params from useParams:', params);
    if (interviewId && interviewId !== 'undefined') {
      fetchResults();
    }
  }, [interviewId]);

  useEffect(() => {
    if (targetStudentId && assignments.length > 0) {
      const target = assignments.find(a => a.student_id === targetStudentId);
      if (target) {
        setSelectedAssignment(target);
      }
    }
  }, [targetStudentId, assignments]);

  const fetchResults = async () => {
    if (!interviewId || interviewId === 'undefined') return;
    try {
      console.log('Starting fetchResults for ID:', interviewId);
      
      // Fetch Interview
      console.log('Fetching interview details...');
      const { data: interviewData, error: iError } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .maybeSingle();
      
      if (iError) {
        console.error('Interview fetch error:', iError);
        throw iError;
      }
      if (interviewData) setInterview(interviewData);

      // Fetch Total Questions
      console.log('Fetching questions count...');
      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('id')
        .eq('interview_id', interviewId);
      
      if (qError) {
        console.error('Questions fetch error:', qError);
        throw qError;
      }
      const qCount = qData?.length || 0;
      setTotalQuestions(qCount);
      setPassingMark(Math.ceil(qCount / 2));

      // Fetch Assignments and Responses
      console.log('Fetching assignments and responses...');
      const { data: assignmentData, error: aError } = await supabase
        .from('interview_assignments')
        .select(`
          *,
          students (*),
          responses (
            *,
            questions (*)
          )
        `)
        .eq('interview_id', interviewId);

      if (aError) {
        console.error('Assignments fetch error:', aError);
        throw aError;
      }
      console.log('Fetch complete. Rows found:', assignmentData?.length || 0);
      setAssignments(assignmentData || []);
    } catch (err: any) {
      console.error('Final catch in fetchResults:', err);
      // Log specific fields to avoid empty {} in console
      if (err.message) console.error('Error Message:', err.message);
      if (err.details) console.error('Error Details:', err.details);
      if (err.hint) console.error('Error Hint:', err.hint);
      
      showToast('Error loading results: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">Loading results...</div>;

  // Auto-grade calculation
  const calculateScore = (responses: any[]) => {
    if (!responses) return 0;
    return responses.reduce((acc: number, res: any) => {
      if (!res.questions?.expected_answer) return acc;
      const studentAns = (res.answer_text || '').trim().toLowerCase();
      const expectedAns = (res.questions.expected_answer || '').trim().toLowerCase();
      return studentAns === expectedAns ? acc + 1 : acc;
    }, 0);
  };

  return (
    <div className="container print-container">
      <button 
        onClick={() => router.back()} 
        className="print-hidden"
        style={{ 
          background: 'none', 
          border: 'none', 
          padding: 0, 
          marginBottom: '1rem', 
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
      {/* CSS for printing hidden elements and layout */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .print-hidden { display: none !important; }
          .card { border: 1px solid #ddd; box-shadow: none; break-inside: avoid; margin-bottom: 1rem; }
        }
      `}} />

      <div className="flex-between print-hidden" style={{ marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Results for {interview?.title}</h2>
        {selectedAssignment && (
          <button onClick={() => window.print()} style={{ background: 'var(--accent-color)' }}>
            📄 Download PDF
          </button>
        )}
      </div>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        {interview?.technology} • {interview?.difficulty}
      </p>

      {selectedAssignment ? (
        <div>
          <div className="flex-between print-hidden" style={{ marginBottom: '1.5rem' }}>
            <div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Passing Mark:</label>
              <input 
                type="number" 
                min="0" 
                max={totalQuestions} 
                value={passingMark} 
                onChange={(e) => setPassingMark(Number(e.target.value))}
                style={{ width: '60px', padding: '0.25rem', textAlign: 'center' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ {totalQuestions}</span>
            </div>
          </div>
          
          <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '1.5rem' }}>{selectedAssignment.students.name}</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{selectedAssignment.students.email}</p>
            </div>
            
            {/* Score & Pass/Fail Badge */}
            {(() => {
              const score = calculateScore(selectedAssignment.responses);
              const isPass = score >= passingMark;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'right' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</span>
                    <strong style={{ fontSize: '1.5rem' }}>{score} / {totalQuestions}</strong>
                  </div>
                  <div style={{ 
                    background: isPass ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: isPass ? 'var(--success)' : 'var(--danger)',
                    padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${isPass ? 'var(--success)' : 'var(--danger)'}`,
                    fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase'
                  }}>
                    {isPass ? 'PASS' : 'FAIL'}
                  </div>
                </div>
              );
            })()}
          </div>

          <h4 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>Detailed Responses</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {selectedAssignment.responses && selectedAssignment.responses.length > 0 ? (
              selectedAssignment.responses.map((res: any, idx: number) => {
                const studentAns = (res.answer_text || '').trim().toLowerCase();
                const expectedAns = (res.questions?.expected_answer || '').trim().toLowerCase();
                const isCorrect = studentAns === expectedAns && expectedAns !== '';

                return (
                  <div key={res.id} className="card">
                    <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', flex: 1, paddingRight: '1rem' }}>
                        Q{idx + 1}: {res.questions?.question_text}
                      </h4>
                      {res.questions?.expected_answer && (
                        <span style={{ 
                          background: isCorrect ? 'var(--success)' : 'var(--danger)', 
                          color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 
                        }}>
                          {isCorrect ? '+1 Mark' : '0 Marks'}
                        </span>
                      )}
                    </div>

                    <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius)', marginBottom: '1rem', borderLeft: isCorrect ? '4px solid var(--success)' : '4px solid var(--danger)' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Student's Answer:</strong>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{res.answer_text || <em style={{ color: 'var(--text-secondary)' }}>No answer provided</em>}</p>
                    </div>

                    {res.questions?.expected_answer && (
                      <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: 'var(--border-radius)', border: '1px dashed rgba(34, 197, 94, 0.4)' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--success)' }}>Expected Answer:</strong>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{res.questions.expected_answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p>No responses found (student might not have started or completed the interview).</p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {assignments.length === 0 ? (
            <p>No students have been assigned to this interview yet.</p>
          ) : (
            assignments.map((assignment) => {
              const score = calculateScore(assignment.responses);
              const isPass = assignment.status === 'completed' && score >= passingMark;
              
              return (
                <div key={assignment.id} className="card flex-between">
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ 
                      width: '45px', 
                      height: '45px', 
                      borderRadius: '50%', 
                      overflow: 'hidden', 
                      background: 'var(--bg-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      border: '1px solid var(--border-color)'
                    }}>
                      {assignment.students?.photo_url ? (
                        <img src={assignment.students.photo_url} alt={assignment.students.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{assignment.students?.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h4 style={{ marginBottom: '0.1rem', margin: 0 }}>{assignment.students?.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{assignment.students?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex-center" style={{ gap: '1.5rem' }}>
                    {assignment.status === 'completed' && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          display: 'block', 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: isPass ? 'var(--success)' : 'var(--danger)',
                          marginBottom: '0.1rem'
                        }}>
                          {isPass ? 'PASS' : 'FAIL'}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Score: <strong>{score}</strong>/{totalQuestions}
                        </span>
                      </div>
                    )}
                    
                    <span style={{ 
                      background: assignment.status === 'completed' ? 'var(--success)' : 'var(--accent-color)', 
                      padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', fontWeight: 600
                    }}>
                      {assignment.status.toUpperCase()}
                    </span>
                    
                    <button 
                      disabled={assignment.status !== 'completed'} 
                      onClick={() => setSelectedAssignment(assignment)}
                      style={{ 
                        background: assignment.status !== 'completed' ? 'var(--bg-accent)' : 'var(--accent-color)',
                        padding: '0.5rem 1.25rem'
                      }}
                    >
                      View Results
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
