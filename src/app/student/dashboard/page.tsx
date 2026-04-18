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

  useEffect(() => {
    const email = localStorage.getItem('student_email');
    if (!email) {
      router.push('/student');
      return;
    }
    fetchAssignments(email);
  }, [router]);

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
          .select('*, interviews(*)')
          .eq('student_id', studentData.id);

        if (assignmentError) throw assignmentError;
        setAssignments(assignmentData || []);
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

  if (!studentInfo && !loading) return null;

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
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
            <div>
              <h2 style={{ margin: 0 }}>Welcome, {studentInfo?.name}</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>{studentInfo?.email}</p>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); router.push('/student'); }} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
            Sign Out
          </button>
        </div>
      </div>

      <h3>Your Interviews</h3>
      {loading ? (
        <p>Loading your assignments...</p>
      ) : assignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>You don't have any interviews assigned yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginTop: '1rem' }}>
          {assignments.map((assignment) => (
            <div key={assignment.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>{assignment.interviews?.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {assignment.interviews?.technology} • {assignment.duration} mins
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--bg-accent)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                    Scheduled: {assignment.scheduled_date} at {assignment.start_time}
                  </span>
                  <span style={{ 
                    background: assignment.status === 'completed' ? 'var(--success)' : 'var(--accent-color)', 
                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: '#fff' 
                  }}>
                    {assignment.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {assignment.status === 'pending' && (
                <Link href={`/interview/${assignment.id}`} style={{ marginTop: 'auto' }}>
                  <button style={{ width: '100%' }}>Start Interview</button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
