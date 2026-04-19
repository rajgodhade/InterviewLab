'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function AssignInterview() {
  const router = useRouter();
  const { showToast } = useUI();
  const params = useParams();
  const interviewId = params.interview_id as string;

  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Assignment Type
  const [assignType, setAssignType] = useState<'individual' | 'batch'>('individual');

  // Individual/Multiple Selection
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);


  // Shared Schedule Data
  const [scheduleData, setScheduleData] = useState({
    scheduledDate: '',
    startTime: '',
    duration: 30,
  });

  // Batch Form
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  useEffect(() => {
    fetchData();
  }, [interviewId]);

  const fetchData = async () => {
    // 1. Fetch interview
    const { data: intData } = await supabase.from('interviews').select('*').eq('id', interviewId).single();
    if (intData) setInterview(intData);

    // 2. Fetch batches (filter out archived)
    const { data: batchData } = await supabase
      .from('groups')
      .select('*')
      .eq('is_archived', false)
      .order('name');
    if (batchData) setBatches(batchData);

    // 3. Fetch all active students
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('is_archived', false)
      .order('name');
    if (studentData) setRegisteredStudents(studentData);
  };

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalStudentIds = [...selectedStudentIds];

    if (finalStudentIds.length === 0) {
      showToast('Please select at least one student or add a new one.', 'warning');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Create assignments for all selected students
      const assignments = finalStudentIds.map(sid => ({
        interview_id: interviewId,
        student_id: sid,
        scheduled_date: scheduleData.scheduledDate || null,
        start_time: scheduleData.startTime || null,
        duration: parseInt(scheduleData.duration.toString()) || 30,
        status: 'pending'
      }));

      const { error } = await supabase.from('interview_assignments').insert(assignments);
      if (error) throw error;

      // Notifications
      const notifications = finalStudentIds.map(sid => ({
        student_id: sid,
        title: 'New Interview Assigned',
        message: `You have been assigned: ${interview?.title}. Check your dashboard.`,
        link: '/student/dashboard'
      }));
      await supabase.from('notifications').insert(notifications);

      showToast(`Successfully assigned to ${finalStudentIds.length} student(s)!`, 'success');
      router.push(`/admin/view/${interviewId}`);
    } catch (err: any) {
      console.error(err);
      showToast('Assignment failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      showToast('Please select a batch.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`student_id, students!inner(is_archived)`)
        .eq('group_id', selectedBatchId)
        .eq('students.is_archived', false);
      
      if (membersError) throw membersError;
      if (!members || members.length === 0) {
        showToast('Selected batch has no active students.', 'warning');
        setLoading(false);
        return;
      }

      const studentIds = members.map(m => m.student_id);
      const assignments = studentIds.map(sid => ({
        interview_id: interviewId,
        student_id: sid,
        group_id: selectedBatchId,
        scheduled_date: scheduleData.scheduledDate || null,
        start_time: scheduleData.startTime || null,
        duration: parseInt(scheduleData.duration.toString()) || 30,
        status: 'pending'
      }));

      const { error: insertError } = await supabase.from('interview_assignments').insert(assignments);
      if (insertError) throw insertError;

      const notifications = studentIds.map(sid => ({
        student_id: sid,
        title: 'New Interview Assigned',
        message: `You have been assigned: ${interview?.title} as part of your batch.`,
        link: '/student/dashboard'
      }));
      await supabase.from('notifications').insert(notifications);

      showToast(`Assigned to ${studentIds.length} students!`, 'success');
      router.push(`/admin/view/${interviewId}`);
    } catch (error: any) {
      showToast('Batch assignment failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = registeredStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}} />
      <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Assign Interview</h2>
          {interview && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Assigning: <strong>{interview.title}</strong> ({interview.technology})
            </p>
          )}
        </div>
        <button onClick={() => router.back()} style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)', padding: '0.5rem' }}>✕</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setAssignType('individual')}
          style={{ background: 'transparent', color: assignType === 'individual' ? 'var(--accent-color)' : 'var(--text-secondary)', border: 'none', borderBottom: assignType === 'individual' ? '3px solid var(--accent-color)' : '3px solid transparent', padding: '0.75rem 1.5rem', borderRadius: 0, fontWeight: 700, fontSize: '1rem' }}
        >
          Select Students
        </button>
        <button 
          onClick={() => setAssignType('batch')}
          style={{ background: 'transparent', color: assignType === 'batch' ? 'var(--accent-color)' : 'var(--text-secondary)', border: 'none', borderBottom: assignType === 'batch' ? '3px solid var(--accent-color)' : '3px solid transparent', padding: '0.75rem 1.5rem', borderRadius: 0, fontWeight: 700, fontSize: '1rem' }}
        >
          Select Batch
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={assignType === 'individual' ? handleIndividualSubmit : handleBatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {assignType === 'individual' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Search & Select Registered Students */}
                <div>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: 700, fontSize: '1.1rem' }}>Choose Registered Students</label>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 600 }}>{selectedStudentIds.length} Selected</span>
                  </div>
                  
                  <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#fff', opacity: 0.8 }}>🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search students by name or email..." 
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      onFocus={() => setShowStudentList(true)}
                      style={{ paddingLeft: '2.75rem' }}
                    />
                  </div>

                  {/* Selected Students Chips */}
                  {selectedStudentIds.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {selectedStudentIds.map(id => {
                        const student = registeredStudents.find(s => s.id === id);
                        if (!student) return null;
                        return (
                          <div 
                            key={id} 
                            style={{ 
                              background: 'rgba(59, 130, 246, 0.2)', 
                              color: '#60a5fa', 
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              padding: '0.35rem 0.75rem', 
                              borderRadius: '20px', 
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              animation: 'fadeIn 0.2s ease'
                            }}
                          >
                            {student.name}
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
                              }}
                              style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}
                            >
                              ✕
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showStudentList && (
                    <div style={{ 
                      maxHeight: '250px', 
                      overflowY: 'auto', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      background: 'rgba(0,0,0,0.1)',
                      marginBottom: '1rem',
                      animation: 'fadeIn 0.2s ease'
                    }}>
                      <div className="flex-between" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registered Students</span>
                        <button type="button" onClick={() => setShowStudentList(false)} style={{ background: 'transparent', padding: 0, color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Close List</button>
                      </div>
                      {filteredStudents.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No students found</div>
                      ) : (
                        filteredStudents.map(student => (
                          <div 
                            key={student.id} 
                            onClick={() => {
                              if (selectedStudentIds.includes(student.id)) {
                                setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                              } else {
                                setSelectedStudentIds(prev => [...prev, student.id]);
                              }
                            }}
                            style={{ 
                              padding: '0.75rem 1rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '1rem', 
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              background: selectedStudentIds.includes(student.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedStudentIds.includes(student.id)} 
                              onChange={() => {}} // Controlled by div click
                              style={{ width: '18px', height: '18px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600 }}>{student.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                            </div>
                          </div>
                        )))
                      }
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700 }}>Select Batch</label>
                <select required value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} style={{ width: '100%', padding: '0.85rem' }}>
                  <option value="">-- Choose a batch --</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            {/* Schedule Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Scheduled Date</label>
                  <input required type="date" value={scheduleData.scheduledDate} onChange={(e) => setScheduleData({...scheduleData, scheduledDate: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Start Time</label>
                  <input required type="time" value={scheduleData.startTime} onChange={(e) => setScheduleData({...scheduleData, startTime: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Duration (minutes)</label>
                <input required type="number" min="5" max="180" value={scheduleData.duration} onChange={(e) => setScheduleData({...scheduleData, duration: parseInt(e.target.value)})} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ background: 'var(--accent-gradient)', padding: '1rem', fontSize: '1.1rem', fontWeight: 700, marginTop: '1rem' }}>
              {loading ? 'Processing...' : 'Complete Assignment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
