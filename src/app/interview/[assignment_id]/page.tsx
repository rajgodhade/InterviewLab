'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function InterviewSession() {
  const router = useRouter();
  const { showToast, showConfirm } = useUI();
  const params = useParams();
  const assignmentId = params.assignment_id as string;

  const [assignment, setAssignment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchInterviewData();

    // Warning when leaving the page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitted) {
        navigator.sendBeacon?.(`/api/leave-interview?id=${assignmentId}`);
        e.preventDefault();
        e.returnValue = 'You have unsaved changes! If you leave, you will lose all your answers. Are you sure?';
        return e.returnValue;
      }
    };

    // Prevent back button navigation
    const handlePopState = (e: PopStateEvent) => {
      if (!submitted) {
        window.history.pushState(null, '', window.location.href);
        showToast('Navigation is disabled during the interview. Please use the Submit button to leave.', 'warning');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [assignmentId, submitted]);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !loading && assignment && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, loading, assignment, submitted]);

  const fetchInterviewData = async () => {
    try {
      const { data: ad, error: ae } = await supabase
        .from('interview_assignments').select('*, interviews(*)').eq('id', assignmentId).single();
      if (ae) throw ae;
      if (ad.status === 'completed') { showToast('This interview has already been completed.', 'warning'); router.push('/student/dashboard'); return; }
      
      setAssignment(ad);

      // Load saved answers from localStorage for safety
      const savedAnswers = localStorage.getItem(`interview_progress_${assignmentId}`);
      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
          showToast('Draft answers restored from local storage.', 'success');
        } catch (e) {
          console.error('Failed to parse saved answers', e);
        }
      }

      // PERSISTENT TIMER LOGIC
      let startedAt = ad.started_at;
      const now = new Date();

      if (!startedAt) {
        startedAt = now.toISOString();
        await supabase.from('interview_assignments').update({ 
          started_at: startedAt,
          is_live: true, 
          last_seen_at: now.toISOString() 
        }).eq('id', assignmentId);
      } else {
        await supabase.from('interview_assignments').update({ 
          is_live: true, 
          last_seen_at: now.toISOString() 
        }).eq('id', assignmentId);
      }

      const startTime = new Date(startedAt).getTime();
      const currentTime = now.getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      const totalSeconds = ad.duration * 60;
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);
      
      setTimeLeft(remaining);

      const { data: qd, error: qe } = await supabase
        .from('questions').select('*').eq('interview_id', ad.interview_id).order('order_index', { ascending: true });
      if (qe) throw qe;
      setQuestions(qd || []);
    } catch (error) { console.error(error); showToast('Failed to load interview.', 'error'); }
    finally { setLoading(false); }
  };

  // HEARTBEAT LOGIC: Update last_seen_at every 30 seconds
  useEffect(() => {
    if (loading || submitted || !assignmentId) return;

    const interval = setInterval(async () => {
      await supabase.from('interview_assignments')
        .update({ last_seen_at: new Date().toISOString(), is_live: true })
        .eq('id', assignmentId);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading, submitted, assignmentId]);

  const setAnswer = (val: string) => {
    const newAnswers = { ...answers, [questions[currentQuestionIndex].id]: val };
    setAnswers(newAnswers);
    // Auto-save to localStorage
    localStorage.setItem(`interview_progress_${assignmentId}`, JSON.stringify(newAnswers));
  };

  const handleSubmit = async () => {
    if (submitted) return;

    const unansweredCount = questions.length - Object.keys(answers).length;
    const isAutoSubmit = timeLeft === 0;

    if (!isAutoSubmit) {
      let message = `Are you sure you want to submit your interview?`;
      if (unansweredCount > 0) {
        message = `You have ${unansweredCount} unanswered ${unansweredCount === 1 ? 'question' : 'questions'}. Are you sure you want to submit? Unanswered questions will be marked as "Not Answered".`;
      }

      const confirmed = await showConfirm({
        title: 'Submit Interview',
        message: message,
        confirmText: 'Submit Now',
      });
      if (!confirmed) return;
    }

    setSubmitted(true);
    try {
      // Calculate score
      let finalScore = 0;
      questions.forEach(q => {
        const studentAns = (answers[q.id] || '').trim().toLowerCase();
        const expectedAns = (q.expected_answer || '').trim().toLowerCase();
        // Exact match for MCQ/Short Answer. Long answers won't auto-score perfectly but this is a base.
        if (studentAns === expectedAns && expectedAns !== '') {
          finalScore++;
        }
      });

      const responsesToInsert = questions.map(q => ({
        assignment_id: assignmentId,
        question_id: q.id,
        answer_text: answers[q.id] || 'Not Answered'
      }));

      if (responsesToInsert.length > 0) {
        const { error } = await supabase.from('responses').insert(responsesToInsert);
        if (error) throw error;
      }

      await supabase.from('interview_assignments').update({ 
        status: 'completed', 
        is_live: false,
        submitted_at: new Date().toISOString(),
        final_score: finalScore,
        max_score: questions.length
      }).eq('id', assignmentId);

      // Clear local storage on successful submission
      localStorage.removeItem(`interview_progress_${assignmentId}`);

      showToast('Interview submitted successfully!', 'success');
      router.push('/student/dashboard');
    } catch (error) { 
      console.error(error); 
      showToast('Failed to submit interview.', 'error'); 
      setSubmitted(false); 
    }
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading interview...</div>;
  if (!assignment || questions.length === 0) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Interview data not found.</div>;

  const q = questions[currentQuestionIndex];
  const currentAnswer = answers[q.id] || '';
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Badge color for question type
  const typeBadge: Record<string, { label: string; color: string }> = {
    mcq: { label: 'MCQ', color: '#8b5cf6' },
    true_false: { label: 'True / False', color: '#f59e0b' },
    short_answer: { label: 'Short Answer', color: '#3b82f6' },
    long_answer: { label: 'Long Answer', color: '#10b981' },
  };
  const badge = typeBadge[q.question_type] || typeBadge.short_answer;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      {/* Header bar */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
        <div>
          <h3 style={{ marginBottom: '0.2rem' }}>{assignment.interviews?.title}</h3>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft < 60 ? 'var(--danger)' : 'var(--accent-color)' }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question card */}
      <div className="card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ background: badge.color, color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
            {badge.label}
          </span>
        </div>

        <h4 style={{ marginBottom: '1.5rem', fontSize: '1.15rem', lineHeight: '1.6' }}>
          {q.question_text}
        </h4>

        {/* MCQ */}
        {q.question_type === 'mcq' && q.options && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {q.options.map((opt: string, idx: number) => (
              <label key={idx} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem',
                background: currentAnswer === opt ? 'rgba(59,130,246,0.15)' : 'var(--bg-primary)',
                border: currentAnswer === opt ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)', cursor: 'pointer', transition: 'all 0.2s ease'
              }}>
                <input type="radio" name="mcq" value={opt} checked={currentAnswer === opt}
                  onChange={() => setAnswer(opt)} style={{ width: 'auto', accentColor: 'var(--accent-color)' }} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {/* True / False */}
        {q.question_type === 'true_false' && (
          <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
            {['True', 'False'].map((val) => (
              <button key={val} onClick={() => setAnswer(val)} style={{
                flex: 1, padding: '1rem', fontSize: '1.1rem', fontWeight: 600,
                background: currentAnswer === val ? (val === 'True' ? 'var(--success)' : 'var(--danger)') : 'var(--bg-primary)',
                color: currentAnswer === val ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)',
                transition: 'all 0.2s ease'
              }}>
                {val}
              </button>
            ))}
          </div>
        )}

        {/* Short Answer */}
        {q.question_type === 'short_answer' && (
          <input placeholder="Type your answer..." value={currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{ fontSize: '1rem' }} />
        )}

        {/* Long Answer / Coding */}
        {q.question_type === 'long_answer' && (
          <textarea placeholder="Write your code or detailed answer here..."
            value={currentAnswer} onChange={(e) => setAnswer(e.target.value)}
            style={{ flex: 1, minHeight: '200px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.95rem' }} />
        )}

        {/* Fallback for old questions without type */}
        {!q.question_type && (
          <textarea placeholder="Type your answer here..." value={currentAnswer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{ flex: 1, minHeight: '200px', resize: 'vertical' }} />
        )}

        {/* Navigation */}
        <div className="flex-between" style={{ marginTop: '2rem' }}>
          <button onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            style={{ background: currentQuestionIndex === 0 ? 'var(--bg-accent)' : 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            Previous
          </button>
          {currentQuestionIndex === questions.length - 1 ? (
            <button onClick={handleSubmit} style={{ background: 'var(--success)' }}>Submit Interview</button>
          ) : (
            <button onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
