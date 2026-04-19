'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function StudyMaterialManager() {
  const router = useRouter();
  const { showToast } = useUI();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    link: '',
    type: 'document'
  });

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
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMaterials(data || []);
    } catch (err: any) {
      showToast('Error fetching materials: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title || !newMaterial.link) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('study_materials')
        .insert([newMaterial]);
      
      if (error) throw error;
      
      showToast('Study material added successfully!', 'success');
      setNewMaterial({ title: '', link: '', type: 'document' });
      setShowAddForm(false);
      fetchMaterials();
    } catch (err: any) {
      showToast('Failed to add material: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    
    try {
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast('Material deleted', 'success');
      fetchMaterials();
    } catch (err: any) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Study Material</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage and share documents or video links with students.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Material'}
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
          <h3>Add New Material</h3>
          <form onSubmit={handleAddMaterial} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
              <input 
                type="text" 
                placeholder="e.g. React Hooks Masterclass" 
                value={newMaterial.title}
                onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Resource Link</label>
              <input 
                type="url" 
                placeholder="https://..." 
                value={newMaterial.link}
                onChange={e => setNewMaterial({...newMaterial, link: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Type</label>
              <select 
                value={newMaterial.type}
                onChange={e => setNewMaterial({...newMaterial, type: e.target.value})}
              >
                <option value="document">Document / PDF</option>
                <option value="video">Video / Tutorial</option>
                <option value="other">Other Resource</option>
              </select>
            </div>
            <button type="submit" style={{ marginTop: '0.5rem', background: 'var(--accent-gradient)' }}>
              Save Material
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <div className="spinner"></div>
          <p style={{ marginLeft: '1rem' }}>Loading materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <span style={{ fontSize: '3rem' }}>📚</span>
          <h3 style={{ marginTop: '1rem' }}>No study materials yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Add your first video link or document to share with students.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {materials.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: '160px', width: '100%' }}>
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
                <button 
                  onClick={() => handleDelete(item.id)}
                  style={{ 
                    position: 'absolute', 
                    top: '0.5rem', 
                    right: '0.5rem', 
                    background: 'rgba(0,0,0,0.5)', 
                    padding: '0.4rem', 
                    borderRadius: '50%', 
                    color: '#ff4d4d', 
                    fontSize: '1rem',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  🗑️
                </button>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.8rem' }}>{item.title}</h3>
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.8rem', color: 'var(--accent-color)', wordBreak: 'break-all', display: 'block', marginBottom: '1.5rem', opacity: 0.8 }}
                >
                  {item.link.length > 40 ? item.link.substring(0, 40) + '...' : item.link}
                </a>
                
                <button 
                  onClick={() => router.push(`/admin/study-material/assign/${item.id}`)}
                  style={{ width: '100%', background: 'var(--bg-accent)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                >
                  Assign to Students / Batches
                </button>
              </div>
            </div>
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
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
