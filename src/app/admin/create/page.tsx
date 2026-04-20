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
    proctoring_enabled: true,
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const popularTech = [
    { name: 'React', icon: '⚛️' },
    { name: 'Next.js', icon: '▲' },
    { name: 'Node.js', icon: '🟢' },
    { name: 'Python', icon: '🐍' },
    { name: 'Java', icon: '☕' },
    { name: 'TypeScript', icon: '🔷' },
    { name: 'Angular', icon: '🅰️' },
    { name: 'Vue.js', icon: '🖖' },
    { name: 'HTML', icon: '🌐' },
    { name: 'CSS', icon: '🎨' },
    { name: 'Git', icon: '🌿' },
    { name: 'npm', icon: '📦' },
    { name: 'yarn', icon: '🧶' },
    { name: 'SQL', icon: '🗄️' },
    { name: 'MongoDB', icon: '🍃' },
    { name: 'Tailwind CSS', icon: '🌊' },
    { name: 'AWS', icon: '☁️' },
    { name: 'Docker', icon: '🐋' },
    { name: 'Fullstack', icon: '💻' },
    { name: 'Frontend', icon: '🖼️' },
    { name: 'Backend', icon: '⚙️' },
    { name: 'DevOps', icon: '♾️' },
    { name: 'C++', icon: '🔵' },
  ];

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
          proctoring_enabled: formData.proctoring_enabled,
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
    <>
      <style jsx global>{`
        select option {
          background-color: #1a1a1a !important;
          color: white !important;
          padding: 10px !important;
        }
        /* Custom arrow for select */
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 1rem center !important;
          background-size: 1em !important;
        }
      `}</style>
      <div className="container" style={{ maxWidth: '900px', padding: '2rem', position: 'relative' }}>
      {/* Close Button */}
      <button 
        type="button"
        onClick={() => router.push('/admin')}
        style={{ 
          position: 'absolute', top: '1.5rem', right: '1.5rem', 
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)', width: '40px', height: '40px', 
          borderRadius: '12px', cursor: 'pointer', fontSize: '1.2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease', zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
          e.currentTarget.style.color = 'var(--danger)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        ✕
      </button>

      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Create New Interview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Configure your assessment parameters and AI proctoring security.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Core Details Section */}
        <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)', borderRadius: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📝</span> General Information
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Interview Title</label>
              <input 
                required
                placeholder="e.g. Senior Frontend Developer Assessment"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                style={{ fontSize: '1.1rem', padding: '1rem', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Technology / Topic</label>
                <input 
                  required
                  placeholder="e.g. React, Next.js, Node.js"
                  value={formData.technology}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={(e) => setFormData({...formData, technology: e.target.value})}
                  style={{ fontSize: '1rem', padding: '1rem', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', width: '100%' }}
                />
                {showSuggestions && (
                  <div style={{ 
                    position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 100,
                    marginTop: '0.5rem', background: '#1a1a1a', border: '1px solid var(--border-color)',
                    borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', padding: '0.5rem',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem'
                  }}>
                    {popularTech.map((tech) => {
                      const isSelected = formData.technology.split(',').map(t => t.trim()).includes(tech.name);
                      return (
                        <div 
                          key={tech.name}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const currentTechs = formData.technology.split(',').map(t => t.trim()).filter(t => t !== '');
                            let newTechs;
                            if (isSelected) {
                              newTechs = currentTechs.filter(t => t !== tech.name);
                            } else {
                              newTechs = [...currentTechs, tech.name];
                            }
                            setFormData({...formData, technology: newTechs.join(', ')});
                          }}
                          style={{ 
                            padding: '0.6rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem',
                            transition: 'all 0.2s',
                            background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                            border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
                            color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span>{tech.icon}</span>
                          <span style={{ fontWeight: isSelected ? 700 : 400 }}>{tech.name}</span>
                          {isSelected && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Target Difficulty</label>
                <select 
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  style={{ fontSize: '1rem', padding: '1rem', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', width: '100%', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Creation Mode Section */}
        <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)', borderRadius: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span> Question Generation
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div 
              onClick={() => setFormData({...formData, mode: 'AI'})}
              style={{ 
                padding: '1.5rem', borderRadius: '20px', cursor: 'pointer',
                background: formData.mode === 'AI' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                border: formData.mode === 'AI' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: '1rem'
              }}
            >
              <div style={{ fontSize: '2rem', opacity: formData.mode === 'AI' ? 1 : 0.5 }}>🤖</div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem' }}>AI Generated</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Instantly generate tailored questions using LLMs.</span>
              </div>
            </div>
            
            <div 
              onClick={() => setFormData({...formData, mode: 'Custom'})}
              style={{ 
                padding: '1.5rem', borderRadius: '20px', cursor: 'pointer',
                background: formData.mode === 'Custom' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                border: formData.mode === 'Custom' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', gap: '1rem'
              }}
            >
              <div style={{ fontSize: '2rem', opacity: formData.mode === 'Custom' ? 1 : 0.5 }}>✍️</div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem' }}>Manual / Custom</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Craft your own questions or select from library.</span>
              </div>
            </div>
          </div>

          {formData.mode === 'AI' && (
            <div style={{ 
              marginTop: '1rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-color)'
            }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Number of AI Questions</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input 
                  type="range" min="1" max="100" step="1"
                  value={formData.numQuestions}
                  onChange={(e) => setFormData({...formData, numQuestions: parseInt(e.target.value, 10)})}
                  style={{ flex: 1, accentColor: 'var(--accent-color)' }}
                />
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-color)', minWidth: '40px', textAlign: 'center' }}>
                  {formData.numQuestions}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Security & Settings Section */}
        <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-premium)', borderRadius: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span> Security & Environment
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div 
              onClick={() => setFormData({...formData, is_offline_mode: !formData.is_offline_mode})}
              style={{ 
                padding: '1.5rem', borderRadius: '20px', cursor: 'pointer',
                background: formData.is_offline_mode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                border: formData.is_offline_mode ? '2px solid var(--danger)' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🌐</span>
                <div style={{ 
                  width: '40px', height: '22px', borderRadius: '20px', position: 'relative',
                  background: formData.is_offline_mode ? 'var(--danger)' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px',
                    left: formData.is_offline_mode ? '21px' : '3px', transition: 'all 0.3s'
                  }}></div>
                </div>
              </div>
              <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Offline Mode</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>Forces students to disconnect from the internet. Prevents online searches.</span>
            </div>

            <div 
              onClick={() => {
                if (!formData.is_offline_mode) setFormData({...formData, proctoring_enabled: !formData.proctoring_enabled});
              }}
              style={{ 
                padding: '1.5rem', borderRadius: '20px', cursor: formData.is_offline_mode ? 'not-allowed' : 'pointer',
                background: formData.proctoring_enabled && !formData.is_offline_mode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.02)',
                border: formData.proctoring_enabled && !formData.is_offline_mode ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                transition: 'all 0.2s ease',
                opacity: formData.is_offline_mode ? 0.4 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                <div style={{ 
                  width: '40px', height: '22px', borderRadius: '20px', position: 'relative',
                  background: formData.proctoring_enabled && !formData.is_offline_mode ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px',
                    left: formData.proctoring_enabled && !formData.is_offline_mode ? '21px' : '3px', transition: 'all 0.3s'
                  }}></div>
                </div>
              </div>
              <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '0.25rem' }}>AI Proctoring</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>Real-time face detection, tab-switching tracking, and webcam security.</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: '100%', padding: '1.25rem', fontSize: '1.2rem', fontWeight: 800, borderRadius: '20px',
              background: 'var(--accent-gradient)', border: 'none', color: '#fff', cursor: 'pointer',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)', transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? 'Creating Experience...' : formData.mode === 'AI' ? '✨ Generate & Create Interview' : '🚀 Create Interview'}
          </button>
        </div>
      </form>
    </div>
    </>
  );
}
