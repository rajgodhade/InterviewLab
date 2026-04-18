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
  const [assignType, setAssignType] = useState<'individual' | 'group'>('individual');

  // Individual Form
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    scheduledDate: '',
    startTime: '',
    duration: 30,
  });

  // Group Form
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch interview
      const { data: intData } = await supabase.from('interviews').select('*').eq('id', interviewId).single();
      if (intData) setInterview(intData);

      // Fetch groups (filter out archived)
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('is_archived', false)
        .order('name');
      if (groupData) setGroups(groupData);
    };
    fetchData();
  }, [interviewId]);

  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Check if student exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id, is_archived')
        .eq('email', formData.studentEmail)
        .single();

      if (existingStudent?.is_archived) {
        showToast('This student is archived and cannot be assigned new interviews.', 'error');
        setLoading(false);
        return;
      }

      let studentId;
      if (existingStudent) {
        studentId = existingStudent.id;
      } else {
        const { data: newStudent, error: createStudentError } = await supabase
          .from('students').insert({ name: formData.studentName, email: formData.studentEmail }).select().single();
        if (createStudentError) throw createStudentError;
        studentId = newStudent.id;
      }

      // 2. Check duplicate
      const { data: existingAssignment } = await supabase
        .from('interview_assignments').select('id, status').eq('interview_id', interviewId).eq('student_id', studentId).single();

      if (existingAssignment) {
        showToast(`This student already has this interview (${existingAssignment.status.toUpperCase()}).`, 'warning');
        setLoading(false);
        return;
      }

      // 3. Create
      const { error: assignmentError } = await supabase
        .from('interview_assignments').insert({
          interview_id: interviewId, student_id: studentId,
          scheduled_date: formData.scheduledDate || null, 
          start_time: formData.startTime || null,
          duration: parseInt(formData.duration.toString()) || 30, 
          status: 'pending'
        });

      if (assignmentError) throw assignmentError;

      showToast('Interview assigned successfully!', 'success');
      router.push(`/admin/view/${interviewId}`);
    } catch (error: any) {
      console.error('Individual Assignment Error:', error);
      showToast('Error assigning interview: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) {
      showToast('Please select a group.', 'warning');
      return;
    }
    
    setLoading(true);

    try {
      // 1. Get all students in the group who are NOT archived
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
          student_id,
          students!inner(is_archived)
        `)
        .eq('group_id', selectedGroupId)
        .eq('students.is_archived', false);
      
      if (membersError) throw membersError;
      if (!members || members.length === 0) {
        showToast('Selected group has no active (non-archived) students.', 'warning');
        setLoading(false);
        return;
      }

      // 2. Get existing assignments to avoid duplicates
      const studentIds = members.map(m => m.student_id);
      const { data: existingAssignments, error: existingError } = await supabase
        .from('interview_assignments')
        .select('student_id')
        .eq('interview_id', interviewId)
        .in('student_id', studentIds);
      
      if (existingError) throw existingError;

      const existingStudentIds = new Set(existingAssignments?.map(a => a.student_id) || []);
      const newAssignments = members
        .filter(m => !existingStudentIds.has(m.student_id))
        .map(m => ({
          interview_id: interviewId,
          student_id: m.student_id,
          group_id: selectedGroupId,
          scheduled_date: formData.scheduledDate || null,
          start_time: formData.startTime || null,
          duration: parseInt(formData.duration.toString()) || 30,
          status: 'pending'
        }));

      if (newAssignments.length === 0) {
        showToast('All active students in this group already have this interview assigned.', 'warning');
        setLoading(false);
        return;
      }

      // 3. Insert new assignments
      const { error: insertError } = await supabase.from('interview_assignments').insert(newAssignments);
      if (insertError) throw insertError;

      showToast(`Assigned interview to ${newAssignments.length} student(s) successfully!`, 'success');
      if (existingStudentIds.size > 0) {
        showToast(`Skipped ${existingStudentIds.size} student(s) who were already assigned.`, 'info');
      }
      
      router.push(`/admin/view/${interviewId}`);
    } catch (error: any) {
      console.error('Group Assignment Error:', error);
      showToast('Error assigning group: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className="flex-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Assign Interview</h2>
          {interview && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Assigning: <strong>{interview.title}</strong> ({interview.technology})
            </p>
          )}
        </div>
        <button 
          onClick={() => router.back()} 
          style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', fontSize: '1.25rem', lineHeight: 1, borderRadius: '6px', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setAssignType('individual')}
          style={{ background: 'transparent', color: assignType === 'individual' ? 'var(--accent-color)' : 'var(--text-secondary)', border: 'none', borderBottom: assignType === 'individual' ? '2px solid var(--accent-color)' : '2px solid transparent', padding: '0.5rem 1rem', borderRadius: 0, fontWeight: 600 }}
        >
          Individual Student
        </button>
        <button 
          onClick={() => setAssignType('group')}
          style={{ background: 'transparent', color: assignType === 'group' ? 'var(--accent-color)' : 'var(--text-secondary)', border: 'none', borderBottom: assignType === 'group' ? '2px solid var(--accent-color)' : '2px solid transparent', padding: '0.5rem 1rem', borderRadius: 0, fontWeight: 600 }}
        >
          Student Group
        </button>
      </div>

      <div className="card">
        <form onSubmit={assignType === 'individual' ? handleIndividualSubmit : handleGroupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {assignType === 'individual' ? (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Student Name</label>
                <input required placeholder="e.g. John Doe" value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Student Email</label>
                <input required type="email" placeholder="e.g. john@example.com" value={formData.studentEmail} onChange={(e) => setFormData({...formData, studentEmail: e.target.value})} />
              </div>
            </>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Group</label>
              <select required value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '1rem' }}>
                <option value="">-- Choose a group --</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          {/* Common Schedule Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Scheduled Date</label>
              <input required type="date" value={formData.scheduledDate} onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Start Time</label>
              <input required type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Duration (minutes)</label>
            <input required type="number" min="10" max="180" value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})} />
          </div>

          <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Assigning...' : (assignType === 'individual' ? 'Assign to Student' : 'Assign to Group')}
          </button>
        </form>
      </div>
    </div>
  );
}
