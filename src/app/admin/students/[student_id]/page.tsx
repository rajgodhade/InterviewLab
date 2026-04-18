'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function StudentProfile() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.student_id as string;
  const { showToast } = useUI();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (studentId && studentId !== 'undefined') {
      fetchStudentData();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          interview_assignments (
            id,
            status,
            scheduled_date,
            interview_id,
            interviews (
              title,
              technology,
              difficulty
            ),
            responses (
              id,
              answer_text,
              questions (
                expected_answer
              )
            )
          )
        `)
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load student record: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast('File too large. Maximum size is 2MB.', 'error');
        return;
      }

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage (requires 'avatars' bucket to be public)
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
        .eq('id', studentId);

      if (updateError) throw updateError;

      setStudent({ ...student, photo_url: publicUrl });
      showToast('Photo updated successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Upload failed. Please ensure the "avatars" bucket exists and is public in Supabase.', 'error');
    } finally {
      setUploading(false);
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

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading student record...</div>;
  if (!student) return <div className="container">Student not found.</div>;

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={() => router.back()} 
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
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {/* Avatar Section */}
            <div style={{ position: 'relative' }}>
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', 
                background: 'var(--bg-primary)', border: '4px solid var(--accent-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem'
              }}>
                {student.photo_url ? (
                  <img src={student.photo_url} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{student.name.charAt(0)}</span>
                )}
              </div>
              <label style={{ 
                position: 'absolute', bottom: '5px', right: '5px', background: 'var(--accent-color)', 
                color: '#fff', width: '35px', height: '35px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                border: '3px solid var(--bg-secondary)', fontSize: '1.2rem', fontWeight: 'bold'
              }}>
                +
                <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} disabled={uploading} />
              </label>
              {uploading && (
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                  background: 'rgba(0,0,0,0.7)', borderRadius: '50%', display: 'flex', 
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  color: '#fff', fontSize: '0.75rem', fontWeight: 600, zIndex: 10
                }}>
                  <div className="spinner-small" style={{ marginBottom: '5px' }}></div>
                  UPLOADING...
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div className="flex-between">
                <div>
                  <h1 style={{ margin: 0, fontSize: '2.2rem' }}>{student.name}</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.4rem' }}>{student.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Status</span>
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <span style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%' }}></span>
                    <strong style={{ fontSize: '1rem' }}>Active</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analytics Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📊</span> Performance Analytics
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Overall Score Donut */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
              <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-primary)" strokeWidth="3" />
                {(() => {
                  const totalPossible = student.interview_assignments
                    ?.filter((a: any) => a.status === 'completed')
                    .reduce((acc: number, a: any) => acc + (a.responses?.length || 0), 0) || 0;
                  const totalCorrect = student.interview_assignments
                    ?.filter((a: any) => a.status === 'completed')
                    .reduce((acc: number, a: any) => acc + calculateScore(a.responses), 0) || 0;
                  const percentage = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;
                  return (
                    <>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        fill="none" stroke="var(--accent-color)" strokeWidth="3" 
                        strokeDasharray={`${percentage}, 100`} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease-out' }} />
                      <text x="18" y="20.5" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>{percentage}%</text>
                    </>
                  );
                })()}
              </svg>
            </div>
            <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Overall Proficiency</p>
          </div>

          {/* Technology Breakdown */}
          <div className="card" style={{ padding: '2rem' }}>
            <h4 style={{ marginTop: 0, marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Skill Distribution</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(() => {
                const techStats: any = {};
                student.interview_assignments?.forEach((a: any) => {
                  if (a.status !== 'completed') return;
                  const tech = a.interviews?.technology || 'General';
                  if (!techStats[tech]) techStats[tech] = { correct: 0, total: 0 };
                  techStats[tech].total += (a.responses?.length || 0);
                  techStats[tech].correct += calculateScore(a.responses);
                });

                const techs = Object.keys(techStats);
                if (techs.length === 0) return <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Complete interviews to see breakdown</p>;

                return techs.map((tech) => {
                  const percent = Math.round((techStats[tech].correct / techStats[tech].total) * 100);
                  return (
                    <div key={tech}>
                      <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{tech}</span>
                        <span style={{ color: 'var(--accent-color)', fontWeight: 800 }}>{percent}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${percent}%`, height: '100%', background: 'var(--accent-gradient)', 
                          borderRadius: '10px', transition: 'width 1s ease-out' 
                        }}></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>Interview Performance Record</h2>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
            {student.interview_assignments?.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No interviews assigned yet.</td>
              </tr>
            ) : (
              student.interview_assignments.map((assign: any) => {
                const correctCount = calculateScore(assign.responses);
                const totalQuestions = assign.responses?.length || 0;
                const isCompleted = assign.status === 'completed';
                const passPercentage = 50;
                const isPass = isCompleted && (totalQuestions > 0 ? (correctCount / totalQuestions) * 100 >= passPercentage : false);
                
                return (
                  <tr key={assign.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{assign.interviews?.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{assign.interviews?.technology} • {assign.interviews?.difficulty}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {assign.scheduled_date}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ 
                        background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: isCompleted ? 'var(--success)' : 'var(--accent-color)',
                        padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                        border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                      }}>
                        {assign.status}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {isCompleted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{correctCount}</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>/ {totalQuestions}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {isCompleted ? (
                        <span style={{ 
                          color: isPass ? 'var(--success)' : 'var(--danger)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          {isPass ? '● PASS' : '● FAIL'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      {isCompleted && (
                        <Link href={`/admin/results/${assign.interview_id}?student=${studentId}`} style={{ 
                          padding: '0.4rem 1.2rem', background: 'var(--bg-primary)', 
                          borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', 
                          fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border-color)',
                          transition: 'all 0.2s'
                        }}>
                          View Results
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
