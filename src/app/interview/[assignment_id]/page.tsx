'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { useUI } from '@/components/UIProvider';

// Lazy-load heavy components — TensorFlow (~1.1MB) and Monaco (~400KB)
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
  loading: () => <div style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center', background: '#1e1e1e', borderRadius: '8px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Code Editor...</div>,
});
const ProctoringSystem = dynamic(() => import('@/components/ProctoringSystem'), {
  ssr: false,
  loading: () => null,
});

export default function InterviewSession() {
  const router = useRouter();
  const { showToast, showConfirm } = useUI();
  const params = useParams();
  const assignmentId = params.assignment_id as string;
  const supabase = createClient();

  const [assignment, setAssignment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

    const handleOnlineStatus = async () => {
      if (navigator.onLine) {
        // Double check with a real external fetch
        try {
          await fetch('https://cloudflare.com/cdn-cgi/trace?' + Date.now(), { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(3000) });
          setIsOnline(true); // Opaque response means success (no network error)
        } catch (e) {
          setIsOnline(false); // Fetch failed, treat as offline
        }
      } else {
        setIsOnline(false);
      }
    };
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    handleOnlineStatus();

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
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
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    // IMMEDIATE OFFLINE CHECK: If we are offline, don't even try Supabase yet
    if (!navigator.onLine) {
      const offlineQ = localStorage.getItem(`offline_questions_${assignmentId}`);
      const offlineA = localStorage.getItem(`offline_assignment_${assignmentId}`);
      if (offlineQ && offlineA) {
        console.log('Device is offline, loading from local storage...');
        setQuestions(JSON.parse(offlineQ));
        setAssignment(JSON.parse(offlineA));
        handleOfflineStart(JSON.parse(offlineA));
        setLoading(false);
        return;
      }
    }

    try {
      const { data: ad, error: ae } = await supabase
        .from('interview_assignments').select('*, interviews(*)').eq('id', assignmentId).single();
      
      if (ae) throw ae;
      if (ad.status === 'completed') { 
        showToast('This interview has already been completed.', 'warning'); 
        router.push('/student/dashboard'); 
        return; 
      }
      
      setAssignment(ad);

      // Load saved answers from localStorage for safety
      const savedAnswers = localStorage.getItem(`interview_progress_${assignmentId}`);
      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
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
      const questionsData = qd || [];
      setQuestions(questionsData);

      // CRITICAL: Save everything locally immediately so offline mode has data even if pre-fetch failed
      localStorage.setItem(`offline_questions_${assignmentId}`, JSON.stringify(questionsData));
      localStorage.setItem(`offline_assignment_${assignmentId}`, JSON.stringify(ad));
      
      console.log('Interview data fully loaded and cached locally.');
    } catch (error) { 
      // Network fetch failed (expected when offline), checking offline fallback
      const offlineQ = localStorage.getItem(`offline_questions_${assignmentId}`);
      const offlineA = localStorage.getItem(`offline_assignment_${assignmentId}`);
      if (offlineQ && offlineA) {
        setQuestions(JSON.parse(offlineQ));
        setAssignment(JSON.parse(offlineA));
        handleOfflineStart(JSON.parse(offlineA));
        showToast('Running in Offline Mode. Connect Your Internet Connection', 'warning');
      } else {
        showToast('Failed to load interview. Please check your connection.', 'error'); 
      }
    }
    finally { setLoading(false); }
  };

  const handleOfflineStart = (ad: any) => {
    // Timer logic for offline
    const localStartTime = localStorage.getItem(`interview_start_${assignmentId}`);
    const now = new Date();
    let startTime: number;
    if (!localStartTime) {
      startTime = now.getTime();
      localStorage.setItem(`interview_start_${assignmentId}`, now.toISOString());
    } else {
      startTime = new Date(localStartTime).getTime();
    }
    const elapsed = Math.floor((now.getTime() - startTime) / 1000);
    const total = ad.duration * 60;
    setTimeLeft(Math.max(0, total - elapsed));
  };

  // HEARTBEAT LOGIC: Update last_seen_at every 30 seconds
  useEffect(() => {
    if (loading || submitted || !assignmentId) return;

    const interval = setInterval(async () => {
      if (navigator.onLine && !assignment?.interviews?.is_offline_mode) {
        await supabase.from('interview_assignments')
          .update({ last_seen_at: new Date().toISOString(), is_live: true })
          .eq('id', assignmentId);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading, submitted, assignmentId]);

  // CONNECTION POLLING: Re-verify connection if browser says online but we think we are offline
  useEffect(() => {
    if (submitted || !assignment?.interviews?.is_offline_mode) return;

    const interval = setInterval(async () => {
      if (navigator.onLine && !isOnline) {
        try {
          await fetch('https://cloudflare.com/cdn-cgi/trace?' + Date.now(), { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(3000) });
          setIsOnline(true); // Internet fully connected, lock the screen!
        } catch (e) {
          // Still offline according to deep ping
        }
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [assignment, isOnline, submitted]);

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
    
    // OFFLINE MODE SYNC LOGIC
    if (!isOnline && assignment?.interviews?.is_offline_mode) {
      // Save for later sync
      localStorage.setItem(`pending_sync_${assignmentId}`, JSON.stringify({
        answers,
        submitted_at: new Date().toISOString()
      }));
      setPendingSync(true);
      showToast('Interview saved locally. Please reconnect to the internet to sync your answers.', 'warning');
      return;
    }

    await performSync(answers);
  };

  const performSync = async (answersToSync: any) => {
    try {
      // Calculate score
      let finalScore = 0;
      questions.forEach(q => {
        const studentAns = (answersToSync[q.id] || '').trim().toLowerCase();
        const expectedAns = (q.expected_answer || '').trim().toLowerCase();
        if (studentAns === expectedAns && expectedAns !== '') {
          finalScore++;
        }
      });

      const responsesToInsert = questions.map(q => ({
        assignment_id: assignmentId,
        question_id: q.id,
        answer_text: answersToSync[q.id] || 'Not Answered'
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
      localStorage.removeItem(`pending_sync_${assignmentId}`);
      localStorage.removeItem(`interview_start_${assignmentId}`);

      showToast('Interview synced successfully!', 'success');
      router.push('/student/dashboard');
    } catch (error: any) { 
      const errorName = error?.name || 'UnknownErrorName';
      const errorMsg = error?.message || error?.details || 'No message';
      
      showToast(`Failed to sync interview: [${errorName}] ${errorMsg}`, 'error'); 
      setSubmitted(false); 
      setPendingSync(true);
    }
  };

  const recheckConnection = async () => {
    try {
      await fetch('https://cloudflare.com/cdn-cgi/trace?' + Date.now(), { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(3000) });
      setIsOnline(true); // Opaque response means success (no network error)
      if (!submitted) {
        showToast('Still detecting an active internet connection.', 'error');
      } else {
        showToast('Internet connection restored!', 'success');
      }
    } catch (e) {
      setIsOnline(false);
      if (!submitted) {
        showToast('Offline status confirmed. Unlocking...', 'success');
      } else {
        showToast('Still no internet connection detected.', 'error');
      }
    }
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading interview...</div>;
  if (!assignment || questions.length === 0) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Interview data not found.</div>;

  const q = questions[currentQuestionIndex];
  const currentAnswer = answers[q.id] || '';

  // Framework & Library Support Template
  const getProcessedSrcDoc = (code: string) => {
    const isReact = code.includes('React') || code.includes('JSX') || code.includes('export default') || code.includes('render(');
    const isVue = code.includes('Vue') || code.includes('createApp') || code.includes('v-model') || code.includes('{{');
    const isTailwind = code.includes('class=') || code.includes('className=');
    const needsAutoRender = !code.includes('ReactDOM.render') && !code.includes('createRoot');

    if (isReact) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            ${isTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <style>
              body { margin: 0; padding: 1rem; font-family: sans-serif; background: #fff; }
              #root { min-height: 100vh; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              try {
                ${code}
                // Automatically render App if it exists and no manual render is present
                if (typeof App !== 'undefined' && ${needsAutoRender}) {
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(React.createElement(App));
                }
              } catch (err) {
                document.getElementById('root').innerHTML = '<pre style="color: red; padding: 1rem; white-space: pre-wrap;">' + err.message + '</pre>';
              }
            </script>
          </body>
        </html>
      `;
    }

    if (isVue) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            ${isTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
            <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
            <style>
              body { margin: 0; padding: 1rem; font-family: sans-serif; background: #fff; }
              #app { min-height: 100vh; }
            </style>
          </head>
          <body>
            ${!code.includes('id="app"') ? '<div id="app"></div>' : ''}
            <script>
              try {
                const { createApp, ref, reactive, onMounted, computed, watch } = Vue;
                ${code}
                // Automatically mount if App object is defined but not mounted
                if (typeof App !== 'undefined' && !document.querySelector('#app').__vue_app__) {
                  createApp(App).mount('#app');
                }
              } catch (err) {
                const appDiv = document.getElementById('app');
                if (appDiv) {
                  appDiv.innerHTML = '<pre style="color: red; padding: 1rem; white-space: pre-wrap;">' + err.message + '</pre>';
                } else {
                  document.body.innerHTML = '<pre style="color: red; padding: 1rem; white-space: pre-wrap;">' + err.message + '</pre>';
                }
              }
            </script>
          </body>
        </html>
      `;
    }

    // Default HTML/JS Template with Tailwind support
    return `
      <!DOCTYPE html>
      <html>
        <head>
          ${isTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
          <style>body { margin: 0; padding: 1rem; font-family: sans-serif; }</style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Badge color for question type
  const typeBadge: Record<string, { label: string; color: string }> = {
    mcq: { label: 'MCQ', color: '#8b5cf6' },
    true_false: { label: 'True / False', color: '#f59e0b' },
    short_answer: { label: 'Short Answer', color: '#3b82f6' },
    long_answer: { label: 'Long Answer', color: '#10b981' },
    coding: { label: 'Coding', color: '#6366f1' },
  };
  const badge = typeBadge[q.question_type] || typeBadge.short_answer;

  return (
    <div className="container" style={{ maxWidth: '800px', position: 'relative' }}>
      {/* Black Screen Overlay for Offline Mode */}
      {assignment?.interviews?.is_offline_mode && isOnline && !submitted && !pendingSync && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: '#000', color: '#fff', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '2rem'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '1.5rem' }}>Internet Connection Detected</h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.6' }}>
            This interview is set to <strong>Offline Mode</strong>. You are not allowed to have an active internet connection.
          </p>
          <div style={{ margin: '2rem 0', padding: '1.5rem', border: '1px dashed #ef4444', borderRadius: '12px', background: 'rgba(239,68,68,0.05)' }}>
            <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Please disconnect your internet to continue.</p>
            <div style={{ fontSize: '0.85rem', color: '#ef4444' }}>
              Current Status: <strong>{isOnline ? 'ONLINE' : 'OFFLINE'}</strong>
            </div>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>The interview content is fully loaded and ready. The screen will automatically unlock once you are offline.</p>
          
          <button 
            onClick={recheckConnection}
            style={{ 
              background: 'var(--accent-gradient)', 
              color: '#fff', border: 'none',
              padding: '0.85rem 2rem', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
            }}
          >
            <span>↻</span> I have disconnected. Re-check now.
          </button>
        </div>
      )}

      {/* Pending Sync Overlay */}
      {pendingSync && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', color: '#fff', zIndex: 9998,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '2rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h2 style={{ marginBottom: '1rem' }}>Interview Completed!</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
              Your answers have been saved locally. Please <strong>reconnect to the internet</strong> to sync your results with the server.
            </p>
            
            {!isOnline ? (
              <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <span>Offline: Please enable your internet.</span>
                <button 
                  onClick={recheckConnection}
                  style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Re-check Connection
                </button>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                Connected! You can now sync your data.
              </div>
            )}

            {isOnline && (
              <button 
                onClick={() => performSync(answers)}
                style={{ width: '100%', background: 'var(--accent-gradient)' }}
              >
                Sync to Server Now
              </button>
            )}
          </div>
        </div>
      )}
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
        {(q.question_type === 'long_answer' || q.question_type === 'coding') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Code Editor</span>
                <button 
                  onClick={() => setShowPreview(!showPreview)}
                  style={{ 
                    background: showPreview ? 'var(--accent-gradient)' : 'var(--bg-accent)', 
                    color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0.6rem', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' 
                  }}
                >
                  {showPreview ? '✕ Close Preview' : '👁 Show Preview'}
                </button>
              </div>
              <select 
                style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
                value={q.language || 'javascript'}
                disabled // Currently disabled as questions don't have language property yet
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: '400px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <CodeEditor 
                  value={currentAnswer}
                  onChange={(val) => setAnswer(val || '')}
                  height="400px"
                  language={q.language || 'javascript'}
                />
              </div>
              {showPreview && (
                <div style={{ flex: 1, background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ background: '#f1f5f9', padding: '0.4rem 1rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    Live Preview Output
                  </div>
                  <iframe 
                    srcDoc={getProcessedSrcDoc(currentAnswer)}
                    title="preview"
                    style={{ flex: 1, border: 'none', width: '100%' }}
                    sandbox="allow-scripts"
                  />
                </div>
              )}
            </div>
          </div>
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
      
      {/* AI Proctoring System */}
      {assignment?.interviews?.proctoring_enabled && (
        <ProctoringSystem 
          assignmentId={assignmentId} 
          isOffline={assignment?.interviews?.is_offline_mode} 
          isSubmitted={submitted}
        />
      )}
    </div>
  );
}
