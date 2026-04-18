'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function ManageGroup() {
  const params = useParams();
  const router = useRouter();
  const { showToast, showConfirm } = useUI();
  const groupId = params.group_id as string;

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding new student
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const { data: gData, error: gError } = await supabase.from('groups').select('*').eq('id', groupId).single();
      if (gError) throw gError;
      setGroup(gData);

      const { data: mData, error: mError } = await supabase
        .from('group_members')
        .select('id, students(*)')
        .eq('group_id', groupId);
      if (mError) throw mError;
      setMembers(mData || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load group details: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      // 1. Check if student exists or create new
      let studentId;
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('email', studentEmail)
        .single();

      if (existingStudent) {
        studentId = existingStudent.id;
      } else {
        const { data: newStudent, error: createStudentError } = await supabase
          .from('students')
          .insert({ name: studentName, email: studentEmail })
          .select()
          .single();
        if (createStudentError) throw createStudentError;
        studentId = newStudent.id;
      }

      // 2. Check if already in group
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('student_id', studentId)
        .single();

      if (existingMember) {
        showToast('Student is already in this group.', 'warning');
        setAdding(false);
        return;
      }

      // 3. Add to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, student_id: studentId });
      
      if (memberError) throw memberError;

      showToast('Student added to group successfully!', 'success');
      setStudentName('');
      setStudentEmail('');
      fetchGroupDetails(); // refresh list
    } catch (err: any) {
      console.error(err);
      showToast('Failed to add student: ' + err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStudent = async (memberId: string, studentName: string) => {
    const confirmed = await showConfirm({
      title: 'Remove Student',
      message: `Are you sure you want to remove ${studentName} from this group?`,
      confirmText: 'Remove',
      danger: true,
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('group_members').delete().eq('id', memberId);
      if (error) throw error;

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast('Student removed from group', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to remove student: ' + err.message, 'error');
    }
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading group...</div>;
  if (!group) return <div className="container">Group not found.</div>;

  return (
    <div className="container">
      <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>{group.name}</h2>
          {group.description && <p style={{ color: 'var(--text-secondary)' }}>{group.description}</p>}
        </div>
        <button 
          onClick={() => router.push('/admin/groups')} 
          style={{ 
            background: 'transparent', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', 
            fontSize: '1.25rem', lineHeight: 1, borderRadius: '6px', transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-accent)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Back to Groups"
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '4fr 8fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT: Add Student Form */}
        <div className="card" style={{ position: 'sticky', top: '1rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Add Student to Group</h3>
          <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>Name</label>
              <input 
                required
                placeholder="e.g. Jane Doe"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>Email</label>
              <input 
                required
                type="email"
                placeholder="e.g. jane@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />
            </div>
            <button type="submit" disabled={adding} style={{ marginTop: '0.5rem' }}>
              {adding ? 'Adding...' : 'Add Student'}
            </button>
          </form>
        </div>

        {/* RIGHT: Members List */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Group Members ({members.length})</h3>
          </div>

          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No students in this group yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {members.map((m) => (
                <div key={m.id} className="flex-between" style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      overflow: 'hidden', 
                      background: 'var(--bg-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      border: '1px solid var(--border-color)'
                    }}>
                      {m.students?.photo_url ? (
                        <img src={m.students.photo_url} alt={m.students.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{m.students?.name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{m.students?.name}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{m.students?.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveStudent(m.id, m.students?.name)}
                    style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
