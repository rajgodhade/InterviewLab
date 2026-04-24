'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import LiveMeeting from '@/components/LiveMeeting';
import Link from 'next/link';

export default function LiveInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignment_id as string;
  
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'student' | null>(null);
  const [userName, setUserName] = useState('');

  // Admin Evaluation State
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [passStatus, setPassStatus] = useState<'pass' | 'fail' | null>(null);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserRole('admin');
          setUserName('Interviewer (Admin)');
        } else {
          const studentEmail = localStorage.getItem('student_email');
          const studentName = localStorage.getItem('student_name');
          if (studentEmail) {
            setUserRole('student');
            setUserName(studentName || 'Student');
          } else {
            router.push('/login');
            return;
          }
        }

        const { data, error } = await supabase
          .from('interview_assignments')
          .select('*, interviews(*), students(*)')
          .eq('id', assignmentId)
          .single();

        if (error) throw error;
        setAssignment(data);

        if (data.students?.name) {
          setUserName((prev) => prev || data.students.name);
        }

      } catch (err) {
        console.error('Error loading live session:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, router]);

  const isCallExpired = (scheduledDate: string, startTime: string, duration: number) => {
    if (!scheduledDate || !startTime) return false;
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    const scheduledStartTime = new Date(year, month - 1, day, hours, minutes);
    const scheduledEndTime = new Date(scheduledStartTime.getTime() + (duration || 30) * 60000);
    return new Date() > scheduledEndTime;
  };

  const handleEndCall = () => {
    if (userRole === 'admin') {
      setShowEvaluation(true);
    } else {
      // For student, ending the call completes their side
      completeStudentSession();
    }
  };

  const completeStudentSession = async () => {
    const supabase = createClient();
    // Don't mark completed yet, wait for Admin to do it, just set is_live = false
    await supabase.from('interview_assignments').update({ is_live: false }).eq('id', assignmentId);
    router.push(`/student/results/${assignmentId}`);
  };

  const submitAdminEvaluation = async () => {
    if (!passStatus) return;
    setEvaluating(true);
    try {
      const supabase = createClient();
      await supabase.from('interview_assignments').update({
        status: 'completed',
        pass_status: passStatus,
        admin_feedback: adminFeedback,
        is_live: false
      }).eq('id', assignmentId);
      
      router.push(`/admin/view/${assignment.interview_id}`);
    } catch (err) {
      console.error('Failed to submit evaluation', err);
      alert('Failed to save evaluation.');
      setEvaluating(false);
    }
  };

  const isExpired = assignment && isCallExpired(assignment.scheduled_date, assignment.start_time, assignment.duration);

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '80vh' }}>
        <div className="spinner"></div>
        <p style={{ marginLeft: '1rem' }}>Initializing live session...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container flex-center" style={{ minHeight: '80vh' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Invalid Session</h2>
          <p style={{ color: 'var(--text-secondary)' }}>This interview session could not be found.</p>
          <button onClick={() => router.back()} style={{ marginTop: '1.5rem' }}>Go Back</button>
        </div>
      </div>
    );
  }

  if (userRole === 'student' && isExpired) {
    return (
      <div className="container flex-center" style={{ minHeight: '80vh' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '500px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
          <h2>Session Expired</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            This live interview slot has expired. You can only join during your assigned time window: 
            <br />
            <strong>{assignment.scheduled_date} at {assignment.start_time}</strong>
          </p>
          <button 
            onClick={() => router.push('/student/interviews')} 
            style={{ marginTop: '2rem', background: 'var(--accent-gradient)', width: '100%' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (showEvaluation && userRole === 'admin') {
    return (
      <div className="container flex-center" style={{ minHeight: '80vh' }}>
        <div className="card" style={{ padding: '3rem', maxWidth: '600px', width: '100%' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Evaluate Candidate</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            The meeting has ended. Please provide the final result for <strong>{assignment.students?.name}</strong>.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={() => setPassStatus('pass')}
              style={{ 
                flex: 1, padding: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold',
                background: passStatus === 'pass' ? 'var(--success)' : 'rgba(16, 185, 129, 0.1)',
                color: passStatus === 'pass' ? '#fff' : 'var(--success)',
                border: passStatus === 'pass' ? '2px solid var(--success)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              ✅ PASS
            </button>
            <button 
              onClick={() => setPassStatus('fail')}
              style={{ 
                flex: 1, padding: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold',
                background: passStatus === 'fail' ? 'var(--danger)' : 'rgba(239, 68, 68, 0.1)',
                color: passStatus === 'fail' ? '#fff' : 'var(--danger)',
                border: passStatus === 'fail' ? '2px solid var(--danger)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              ❌ FAIL
            </button>
          </div>

          <div className="form-group">
            <label>Interviewer Feedback (Visible to Student)</label>
            <textarea 
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              placeholder="Provide constructive feedback on the candidate's performance..."
              rows={4}
              style={{ width: '100%' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button onClick={() => setShowEvaluation(false)} style={{ flex: 1, background: 'var(--bg-accent)' }}>Cancel</button>
            <button 
              onClick={submitAdminEvaluation} 
              disabled={!passStatus || evaluating}
              style={{ flex: 2, background: 'var(--accent-gradient)' }}
            >
              {evaluating ? 'Saving...' : 'Submit Evaluation & Complete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1400px', padding: '1rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        padding: '1rem 1.5rem',
        background: 'var(--glass-bg)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{assignment.interviews?.title}</h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Live Interview • {assignment.students?.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            background: 'rgba(16, 185, 129, 0.1)', 
            color: 'var(--success)', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '20px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', animation: 'pulse-live 1.5s infinite' }}></span>
            LIVE SESSION
          </span>
          <button 
            onClick={handleEndCall}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            End Call
          </button>
        </div>
      </header>

      <main>
        <LiveMeeting 
          roomName={assignmentId} 
          userName={userName} 
          onLeave={handleEndCall} 
        />
      </main>

      <footer style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <p>Tip: When you are finished with the interview, click "End Call" to proceed.</p>
      </footer>
    </div>
  );
}
