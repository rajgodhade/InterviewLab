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

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading student profiles...</div>;

  return (
    <div className="container">
      <div className="flex-responsive" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Profiles</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>View full interview records for each student.</p>
        </div>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="Search name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No students found matching your search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
          {filteredStudents.map((student) => (
            <div key={student.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-color)' }}>
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
                    border: '2px solid var(--accent-color)',
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
                  <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--accent-color)' }}>{student.interview_assignments?.length || 0}</strong>
                </div>
              </div>
              
              <Link href={`/admin/students/${student.id}`} style={{ marginTop: 'auto' }}>
                <button style={{ width: '100%', background: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  View Full Record →
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>

  );
}
