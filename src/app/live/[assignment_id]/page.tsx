'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Check if user is Admin
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserRole('admin');
          setUserName('Interviewer (Admin)');
        } else {
          // 2. Check if user is Student
          const studentEmail = localStorage.getItem('student_email');
          const studentName = localStorage.getItem('student_name');
          if (studentEmail) {
            setUserRole('student');
            setUserName(studentName || 'Student');
          } else {
            // No auth, redirect to login
            router.push('/login');
            return;
          }
        }

        // 3. Fetch Assignment Details
        const { data, error } = await supabase
          .from('interview_assignments')
          .select('*, interviews(*), students(*)')
          .eq('id', assignmentId)
          .single();

        if (error) throw error;
        setAssignment(data);

        // If student, update name with their real name if we didn't have it
        if (!userName && data.students?.name) {
          setUserName(data.students.name);
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

  // Block students if expired
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
            onClick={() => {
              if (userRole === 'admin') {
                router.push(`/admin/view/${assignment.interview_id}`);
              } else {
                router.push('/student/interviews');
              }
            }}
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
            Leave Call
          </button>
        </div>
      </header>

      <main>
        <LiveMeeting 
          roomName={assignmentId} 
          userName={userName} 
          onLeave={() => {
            if (userRole === 'admin') {
              router.push(`/admin/view/${assignment.interview_id}`);
            } else {
              router.push('/student/interviews');
            }
          }} 
        />
      </main>

      <footer style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <p>Tip: Ensure your camera and microphone are enabled. Stay in this tab until the interview is complete.</p>
      </footer>
    </div>
  );
}
