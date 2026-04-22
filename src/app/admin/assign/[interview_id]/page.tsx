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

  // Booked slots for Live mode
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);

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

  useEffect(() => {
    if (interview?.mode === 'Live' && scheduleData.scheduledDate) {
      fetchBookedSlots();
    }
  }, [scheduleData.scheduledDate, interview]);

  const fetchBookedSlots = async () => {
    const { data } = await supabase
      .from('interview_assignments')
      .select('start_time, duration, students(name)')
      .eq('scheduled_date', scheduleData.scheduledDate)
      .eq('status', 'pending');
    
    if (data) setBookedSlots(data);
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
      // 1. Check for slot availability if it's a Live Interview
      if (interview?.mode === 'Live') {
        const { data: existingAssignments, error: fetchError } = await supabase
          .from('interview_assignments')
          .select('id, start_time, duration')
          .eq('scheduled_date', scheduleData.scheduledDate)
          .eq('status', 'pending');

        if (fetchError) throw fetchError;

        if (existingAssignments && existingAssignments.length > 0) {
          const newStart = timeToMinutes(scheduleData.startTime);
          const newEnd = newStart + parseInt(scheduleData.duration.toString()) + 10; // 10 min buffer

          for (const existing of existingAssignments) {
            if (!existing.start_time) continue;
            const exStart = timeToMinutes(existing.start_time);
            const exEnd = exStart + (existing.duration || 30) + 10; // 10 min buffer

            // Overlap condition: (StartA < EndB) && (EndA > StartB)
            if (newStart < exEnd && exStart < newEnd) {
              showToast(`Time slot conflict! There is already a live interview scheduled at ${existing.start_time}. For live interviews, please allow at least 10 minutes buffer between slots.`, 'error');
              setLoading(false);
              return;
            }
          }
        }

        // For Live interviews, we also don't allow assigning multiple students to the same slot at once
        if (finalStudentIds.length > 1) {
          showToast('For Live Video interviews, you can only assign one student per slot.', 'warning');
          setLoading(false);
          return;
        }
      }

      // 2. Create assignments for all selected students
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
        link: '/student/interviews'
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
      // Slot check for Live Interview batches (usually not recommended, but let's enforce it)
      if (interview?.mode === 'Live') {
        showToast('Live Video interviews cannot be assigned to entire batches at once. Please assign students individually to specific slots.', 'error');
        setLoading(false);
        return;
      }

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
        link: '/student/interviews'
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

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

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
          onClick={() => interview?.mode !== 'Live' && setAssignType('batch')}
          disabled={interview?.mode === 'Live'}
          style={{ 
            background: 'transparent', 
            color: assignType === 'batch' ? 'var(--accent-color)' : 'var(--text-secondary)', 
            border: 'none', 
            borderBottom: assignType === 'batch' ? '3px solid var(--accent-color)' : '3px solid transparent', 
            padding: '0.75rem 1.5rem', 
            borderRadius: 0, 
            fontWeight: 700, 
            fontSize: '1rem',
            cursor: interview?.mode === 'Live' ? 'not-allowed' : 'pointer',
            opacity: interview?.mode === 'Live' ? 0.4 : 1
          }}
          title={interview?.mode === 'Live' ? 'Batch assignment is not available for Live interviews' : ''}
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
                              if (interview?.mode === 'Live') {
                                // For Live mode, only allow one student
                                if (selectedStudentIds.includes(student.id)) {
                                  setSelectedStudentIds([]);
                                } else {
                                  setSelectedStudentIds([student.id]);
                                }
                                return;
                              }

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
                              type={interview?.mode === 'Live' ? 'radio' : 'checkbox'} 
                              checked={selectedStudentIds.includes(student.id)} 
                              onChange={() => {}} // Controlled by div click
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
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

              {interview?.mode === 'Live' && scheduleData.scheduledDate && bookedSlots.length > 0 && (
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚠️</span> Booked Slots for {scheduleData.scheduledDate}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {bookedSlots.map((slot, i) => {
                      const start = timeToMinutes(slot.start_time);
                      const endWithBuffer = start + (slot.duration || 30) + 10;
                      return (
                        <div key={i} style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <strong>{slot.start_time}</strong> - {Math.floor(endWithBuffer/60)}:{(endWithBuffer%60).toString().padStart(2, '0')} 
                          <span style={{ opacity: 0.6, marginLeft: '0.4rem' }}>({slot.students?.name})</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    * Slots include a 10-minute buffer after the interview ends.
                  </p>
                </div>
              )}
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
