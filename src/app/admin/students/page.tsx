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
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Student Profiles</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Select a student to view their full interview records.</p>
        </div>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '300px' }}
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No students found matching your search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {filteredStudents.map((student) => (
            <div key={student.id} className="card hover-scale" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="flex-between">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    background: 'var(--bg-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    border: '2px solid var(--border-color)'
                  }}>
                    {student.photo_url ? (
                      <img src={student.photo_url} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{student.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{student.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.1rem 0 0 0' }}>{student.email}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Interviews</span>
                  <strong style={{ display: 'block', fontSize: '1.1rem' }}>{student.interview_assignments?.length || 0}</strong>
                </div>
              </div>
              
              <Link href={`/admin/students/${student.id}`} style={{ 
                marginTop: 'auto',
                padding: '0.75rem',
                background: 'var(--bg-accent)',
                borderRadius: '6px',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: '1px solid var(--border-color)'
              }}>
                View Full Record →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
