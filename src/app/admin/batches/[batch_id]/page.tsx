'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function ManageBatch() {
  const params = useParams();
  const router = useRouter();
  const { showToast, showConfirm } = useUI();
  const batchId = params.batch_id as string;

  const [batch, setBatch] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding new student
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      const { data: bData, error: bError } = await supabase.from('groups').select('*').eq('id', batchId).single();
      if (bError) throw bError;
      setBatch(bData);

      const { data: mData, error: mError } = await supabase
        .from('group_members')
        .select('id, students(*)')
        .eq('group_id', batchId);
      if (mError) throw mError;
      // Filter out archived students from the member list
      const activeMembers = (mData || []).filter(m => m.students && !m.students.is_archived);
      setMembers(activeMembers);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load batch details: ' + err.message, 'error');
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
        .select('id, is_archived')
        .eq('email', studentEmail)
        .single();

      if (existingStudent) {
        if (existingStudent.is_archived) {
          showToast('This student is archived and cannot be added to new groups.', 'error');
          setAdding(false);
          return;
        }
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

      // 2. Check if already in batch
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', batchId)
        .eq('student_id', studentId)
        .single();

      if (existingMember) {
        showToast('Student is already in this batch.', 'warning');
        setAdding(false);
        return;
      }

      // 3. Add to batch
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: batchId, student_id: studentId });
      
      if (memberError) throw memberError;

      showToast('Student added to batch successfully!', 'success');
      setStudentName('');
      setStudentEmail('');
      fetchBatchDetails(); // refresh list
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
      message: `Are you sure you want to remove ${studentName} from this batch?`,
      confirmText: 'Remove',
      danger: true,
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('group_members').delete().eq('id', memberId);
      if (error) throw error;

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast('Student removed from batch', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to remove student: ' + err.message, 'error');
    }
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading batch...</div>;
  if (!batch) return <div className="container">Batch not found.</div>;

  return (
    <div className="container">
      <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>{batch.name}</h2>
          {batch.description && <p style={{ color: 'var(--text-secondary)' }}>{batch.description}</p>}
        </div>
        <button 
          onClick={() => router.push('/admin/batches')} 
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
          title="Back to Batches"
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '4fr 8fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* LEFT: Add Student Form */}
        <div className="card" style={{ position: 'sticky', top: '1rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Add Student to Batch</h3>
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
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Batch Members ({members.length})</h3>
          </div>

          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No students in this batch yet.</p>
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
