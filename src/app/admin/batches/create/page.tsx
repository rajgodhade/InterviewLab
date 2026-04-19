'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function CreateBatch() {
  const router = useRouter();
  const { showToast } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('groups').insert([formData]);
      if (error) throw error;

      showToast('Batch created successfully!', 'success');
      router.push('/admin/batches');
    } catch (err: any) {
      console.error(err);
      showToast('Error creating batch: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Create Student Batch</h2>
        <button 
          onClick={() => router.back()} 
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
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Batch Name</label>
            <input 
              required
              placeholder="e.g. React Native Batch - Morning"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description (Optional)</label>
            <textarea 
              placeholder="Brief description of the batch..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
          </div>
          
          <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Creating...' : 'Create Batch'}
          </button>
        </form>
      </div>
    </div>
  );
}
