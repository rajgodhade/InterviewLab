'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function CreateInterview() {
  const router = useRouter();
  const { showToast } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    technology: '',
    difficulty: 'Intermediate',
    mode: 'AI', // 'AI' | 'Custom'
    numQuestions: 5,
    is_offline_mode: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create the interview record
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .insert({
          title: formData.title,
          technology: formData.technology,
          difficulty: formData.difficulty,
          mode: formData.mode,
          is_offline_mode: formData.is_offline_mode,
        })
        .select()
        .single();

      if (interviewError) throw interviewError;

      const interviewId = interviewData.id;

      // 2. If AI Mode, call our API to generate questions
      if (formData.mode === 'AI') {
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewId,
            technology: formData.technology,
            difficulty: formData.difficulty,
            numQuestions: formData.numQuestions
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate AI questions');
        }
      }

      showToast('Interview created successfully!', 'success');
      
      if (formData.mode === 'Custom') {
        router.push(`/admin/questions/${interviewId}`);
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      console.error('Full Error Object:', err);
      const errorMessage = err.message || err.details || 'Unknown error occurred';
      showToast('Error creating interview: ' + errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '2rem' }}>Create New Interview</h2>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Interview Title</label>
            <input 
              required
              placeholder="e.g. Frontend Developer Screen Q3"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Technology / Topic</label>
              <input 
                required
                placeholder="e.g. React, Node.js"
                value={formData.technology}
                onChange={(e) => setFormData({...formData, technology: e.target.value})}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Difficulty</label>
              <select 
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Creation Mode</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="mode" 
                  value="AI" 
                  checked={formData.mode === 'AI'}
                  onChange={() => setFormData({...formData, mode: 'AI'})}
                  style={{ width: 'auto' }}
                />
                AI Generated
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="mode" 
                  value="Custom" 
                  checked={formData.mode === 'Custom'}
                  onChange={() => setFormData({...formData, mode: 'Custom'})}
                  style={{ width: 'auto' }}
                />
                Manual / Custom
              </label>
            </div>
          </div>

          {formData.mode === 'AI' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Number of Questions (AI)</label>
              <input 
                type="number" 
                min="1" max="20"
                value={Number.isNaN(formData.numQuestions) ? '' : formData.numQuestions}
                onChange={(e) => setFormData({...formData, numQuestions: parseInt(e.target.value, 10)})}
              />
            </div>
          )}

          <div className="card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
              <input 
                type="checkbox" 
                checked={formData.is_offline_mode}
                onChange={(e) => setFormData({...formData, is_offline_mode: e.target.checked})}
                style={{ width: 'auto' }}
              />
              <div>
                <strong style={{ display: 'block' }}>Enable Offline Mode</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Students must disconnect from the internet to take this interview. Data is pre-fetched and synced later.</span>
              </div>
            </label>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating...' : formData.mode === 'AI' ? 'Generate & Create Interview' : 'Create Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
