'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function StudentProfileList() {
  const { showToast } = useUI();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`*, interview_assignments (id)`)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load students: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (studentId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_archived: !isArchived })
        .eq('id', studentId);
      
      if (error) throw error;
      
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, is_archived: !isArchived } : s));
      showToast(isArchived ? 'Student unarchived' : 'Student archived', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Action failed. Ensure "is_archived" column exists in students table.', 'error');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchive = (s.is_archived || false) === showArchived;
    return matchesSearch && matchesArchive;
  });

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading student profiles...</div>;

  return (
    <div className="container">
      <div className="flex-responsive" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Profiles</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>View full interview records for each student.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '600px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="text" 
              placeholder="Search name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', width: '100%' }}
            />
          </div>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            style={{ 
              background: showArchived ? 'var(--accent-gradient)' : 'var(--bg-accent)', 
              color: 'var(--text-primary)', border: '1px solid var(--border-color)',
              fontSize: '0.85rem', padding: '0.75rem 1rem'
            }}
          >
            {showArchived ? '📦 Showing Archived' : '📁 Show Archived'}
          </button>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            {showArchived ? 'No archived students found.' : 'No active students found matching your search.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
          {filteredStudents.map((student) => (
            <div key={student.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)', opacity: student.is_archived ? 0.8 : 1 }}>
              <div className="flex-between">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', textAlign: 'left' }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    border: student.is_archived ? '2px solid var(--text-secondary)' : '2px solid var(--accent-color)',
                    flexShrink: 0
                  }}>
                    {student.photo_url ? (
                      <img src={student.photo_url} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{student.name.charAt(0)}</span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.1rem 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sessions</span>
                  <strong style={{ display: 'block', fontSize: '1.2rem', color: student.is_archived ? 'var(--text-secondary)' : 'var(--accent-color)' }}>{student.interview_assignments?.length || 0}</strong>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', marginTop: 'auto' }}>
                <Link href={`/admin/students/${student.id}`}>
                  <button style={{ width: '100%', background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    View Record
                  </button>
                </Link>
                <button 
                  onClick={() => handleArchive(student.id, student.is_archived)}
                  title={student.is_archived ? 'Unarchive' : 'Archive'}
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0 1rem' }}
                >
                  {student.is_archived ? '📤' : '📥'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

  );
}
