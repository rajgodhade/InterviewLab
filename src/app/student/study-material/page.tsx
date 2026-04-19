'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function StudentStudyMaterial() {
  const { showToast } = useUI();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getThumbnail = (link: string, type: string) => {
    if (type === 'video') {
      const ytMatch = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n<]+)/);
      if (ytMatch && ytMatch[1]) {
        return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
      }
      return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1074&auto=format&fit=crop';
    }
    if (type === 'document') {
      return 'https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1031&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=1170&auto=format&fit=crop';
  };

  useEffect(() => {
    const email = localStorage.getItem('student_email');
    if (email) {
      fetchStudentMaterials(email);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchStudentMaterials = async (email: string) => {
    try {
      // 1. Get student ID and their batches
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .single();
      
      if (studentError) throw studentError;
      if (!student) return;

      const { data: batchMemberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('student_id', student.id);
      
      const batchIds = batchMemberships?.map(m => m.group_id) || [];

      // 2. Fetch assignments for this student OR their batches
      let query = supabase
        .from('study_material_assignments')
        .select('material_id, study_materials(*)');
      
      if (batchIds.length > 0) {
        query = query.or(`student_id.eq.${student.id},group_id.in.(${batchIds.join(',')})`);
      } else {
        query = query.eq('student_id', student.id);
      }

      const { data: assignments, error: assignError } = await query;
      
      if (assignError) throw assignError;

      // 3. Extract unique materials
      const materials = assignments.flatMap(a => a.study_materials ?? []);

      // Deduplicate by id using a Map (keeps the first occurrence)
      const uniqueMaterials = Array.from(
        new Map(
          materials.map((m: { id: string } & Record<string, any>) => [m.id, m])
        ).values()
      );

      setMaterials(uniqueMaterials || []);
    } catch (err: any) {
      showToast('Error fetching materials: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Study Material</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Resources shared by your instructors to help you prepare.</p>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <div className="spinner"></div>
          <p style={{ marginLeft: '1rem' }}>Loading resources...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <span style={{ fontSize: '3rem' }}>📖</span>
          <h3 style={{ marginTop: '1rem' }}>No materials yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>You haven't been assigned any study materials yet. Stay tuned!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {materials.map(item => (
            <a 
              key={item.id} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="card material-card"
              style={{ textDecoration: 'none', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
            >
              <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                <img 
                  src={getThumbnail(item.link, item.type)} 
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.65rem', 
                    background: item.type === 'video' ? 'rgba(244, 63, 94, 0.9)' : 'rgba(59, 130, 246, 0.9)',
                    color: '#fff',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {item.type}
                  </span>
                </div>
                <div style={{ 
                  position: 'absolute', 
                  bottom: '0.75rem', 
                  right: '0.75rem',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '0.4rem',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                  fontSize: '1.2rem'
                }}>
                  {item.type === 'video' ? '▶️' : '📄'}
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 600 }}>
                  Open Resource <span>→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <style jsx>{`
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid var(--border-color);
          border-top: 3px solid var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .material-card:hover {
          transform: translateY(-5px);
          border-color: var(--accent-color);
          background: rgba(255, 255, 255, 0.02);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
