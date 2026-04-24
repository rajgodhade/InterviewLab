'use client';

import { useState, useRef, useEffect } from 'react';
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
    mode: 'AI', // 'AI' | 'Custom' | 'Live'
    numQuestions: 5,
    is_offline_mode: false,
    proctoring_enabled: true,
  });

  // Assignment State
  const [assignNow, setAssignNow] = useState(false);
  const [assignType, setAssignType] = useState<'individual' | 'batch'>('individual');
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [scheduleData, setScheduleData] = useState({
    scheduledDate: '',
    startTime: '',
    duration: 30,
  });

  const [csvQuestions, setCsvQuestions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const popularTech = [
    { name: 'React', icon: '⚛️' },
    { name: 'Next.js', icon: '▲' },
    { name: 'Node.js', icon: '🟢' },
    { name: 'JavaScript', icon: '🟨' },
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

  useEffect(() => {
    fetchAssignmentData();
  }, []);

  const fetchAssignmentData = async () => {
    const { data: students } = await supabase.from('students').select('*').order('name');
    const { data: groups } = await supabase.from('groups').select('*').order('name');
    if (students) setRegisteredStudents(students);
    if (groups) setBatches(groups);
  };

  const downloadSampleCSV = () => {
    const headers = ['question_text', 'question_type', 'options', 'expected_answer'];
    const rows = [
      ['"What is React?"', 'mcq', '"Option A | Option B | Option C | Option D"', '"Option A"'],
      ['"Is JavaScript single-threaded?"', 'true_false', '', 'True'],
      ['"Explain closures in JS."', 'short_answer', '', '"Closures allow functions to access outer scope..."']
    ];
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'interview_questions_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const questions: any[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parsing (handling quoted values)
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < 2) continue;

        const [qText, qType, optionsStr, expected] = parts;
        const options = optionsStr ? optionsStr.split('|').map(o => o.trim()) : null;

        questions.push({
          question_text: qText,
          question_type: qType || 'short_answer',
          options: options,
          expected_answer: expected
        });
      }

      if (questions.length === 0) {
        showToast('No valid questions found in CSV', 'error');
      } else {
        setCsvQuestions(questions);
        showToast(`Parsed ${questions.length} questions from CSV`, 'success');
      }
    };
    reader.readAsText(file);
  };

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
          is_offline_mode: formData.mode === 'Live' ? false : formData.is_offline_mode,
          proctoring_enabled: formData.mode === 'Live' ? false : formData.proctoring_enabled,
        })
        .select()
        .single();

      if (interviewError) throw interviewError;

      const interviewId = interviewData.id;

      // 2. If AI Mode, call our API to generate questions
      if (formData.mode === 'AI' || formData.mode === 'Live') {
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

      // 3. Insert Custom Questions if any
      if (formData.mode === 'Custom' && csvQuestions.length > 0) {
        await supabase.from('questions').insert(csvQuestions.map((q, index) => ({
          interview_id: interviewId,
          ...q,
          order_index: index
        })));
      }

      // 4. Handle Assignments if enabled
      if (assignNow) {
        let studentIds: string[] = [];
        if (assignType === 'individual') {
          studentIds = selectedStudentIds;
        } else if (selectedBatchId) {
          const { data: members } = await supabase.from('group_members').select('student_id').eq('group_id', selectedBatchId);
          if (members) studentIds = members.map(m => m.student_id);
        }

        if (studentIds.length > 0) {
          const assignments = studentIds.map(sid => ({
            interview_id: interviewId,
            student_id: sid,
            group_id: assignType === 'batch' ? selectedBatchId : null,
            scheduled_date: scheduleData.scheduledDate || null,
            start_time: scheduleData.startTime || null,
            duration: scheduleData.duration,
            status: 'pending'
          }));

          const { error: assignError } = await supabase.from('interview_assignments').insert(assignments);
          if (assignError) throw assignError;

          // Notifications
          const notifications = studentIds.map(sid => ({
            student_id: sid,
            title: 'New Interview Assigned',
            message: `You have been assigned: ${formData.title}.`,
            link: '/student/interviews'
          }));
          await supabase.from('notifications').insert(notifications);
        }
      }

      showToast('Interview created and assigned successfully!', 'success');
      router.push('/admin');
    } catch (err: any) {
      console.error(err);
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Technology Multi-Select State
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');

  useEffect(() => {
    setFormData(prev => ({ ...prev, technology: selectedTechs.join(', ') }));
  }, [selectedTechs]);

  const addTech = (tech: string) => {
    if (!selectedTechs.includes(tech)) {
      setSelectedTechs([...selectedTechs, tech]);
    }
    setTechInput('');
    setShowSuggestions(false);
  };

  const removeTech = (tech: string) => {
    setSelectedTechs(selectedTechs.filter(t => t !== tech));
  };

  const filteredStudents = registeredStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <>
      <style jsx global>{`
        select option {
          background-color: #1a1a1a !important;
          color: white !important;
          padding: 10px !important;
        }
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 1rem center !important;
          background-size: 1em !important;
        }
      `}</style>
      <div className="container" style={{ maxWidth: '950px', padding: '2rem', position: 'relative' }}>
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
      >
        ✕
      </button>

      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Create New Interview
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Configure your assessment parameters and AI proctoring security.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Core Details */}
        <div className="card" style={{ padding: '2rem', borderRadius: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>📝</span> General Information
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>INTERVIEW TITLE</label>
              <input required placeholder="e.g. Senior Frontend Developer" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>

            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TECHNOLOGIES</label>
              
              <div 
                style={{ 
                  display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.6rem', 
                  background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', 
                  borderRadius: '14px', minHeight: '52px', alignItems: 'center',
                  transition: 'all 0.2s ease', cursor: 'text'
                }} 
                onClick={() => document.getElementById('tech-input-field')?.focus()}
              >
                {selectedTechs.map(tech => {
                  const techData = popularTech.find(t => t.name === tech);
                  return (
                    <div key={tech} style={{ 
                      background: 'var(--bg-accent)', color: 'var(--accent-color)', 
                      padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem', 
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', 
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      animation: 'fadeIn 0.2s ease'
                    }}>
                      {techData?.icon && <span>{techData.icon}</span>}
                      {tech}
                      <span 
                        onClick={(e) => { e.stopPropagation(); removeTech(tech); }} 
                        style={{ cursor: 'pointer', opacity: 0.5, fontSize: '1.2rem', marginLeft: '0.2rem', display: 'flex', alignItems: 'center' }}
                      >
                        ×
                      </span>
                    </div>
                  );
                })}
                <input 
                  id="tech-input-field"
                  placeholder={selectedTechs.length > 0 ? "" : "e.g. React, Node.js"} 
                  value={techInput} 
                  onFocus={() => setShowSuggestions(true)} 
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                  onChange={(e) => {
                    setTechInput(e.target.value);
                    setShowSuggestions(true);
                  }} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && techInput.trim()) {
                      e.preventDefault();
                      addTech(techInput.trim());
                    } else if (e.key === 'Backspace' && !techInput && selectedTechs.length > 0) {
                      removeTech(selectedTechs[selectedTechs.length - 1]);
                    }
                  }}
                  style={{ 
                    flex: 1, border: 'none', background: 'transparent', outline: 'none', 
                    minWidth: '120px', padding: '0', fontSize: '1rem', color: '#fff'
                  }}
                />
              </div>

              {showSuggestions && (
                <div style={{ 
                  position: 'absolute', top: 'calc(100% + 5px)', left: 0, width: '100%', zIndex: 100, 
                  background: '#1a1a1a', border: '1px solid var(--border-color)', 
                  borderRadius: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', padding: '0.6rem',
                  maxHeight: '280px', overflowY: 'auto', boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
                }}>
                  {popularTech
                    .filter(tech => tech.name.toLowerCase().includes(techInput.toLowerCase()) && !selectedTechs.includes(tech.name))
                    .map(tech => (
                      <div 
                        key={tech.name} 
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addTech(tech.name);
                        }} 
                        style={{ 
                          padding: '0.7rem 0.85rem', cursor: 'pointer', borderRadius: '10px',
                          display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.9rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{tech.icon}</span> 
                        <span style={{ fontWeight: 500 }}>{tech.name}</span>
                      </div>
                    ))
                  }
                  {techInput.trim() && !popularTech.some(t => t.name.toLowerCase() === techInput.toLowerCase()) && (
                    <div 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addTech(techInput.trim());
                      }}
                      style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--accent-color)', fontSize: '0.85rem', cursor: 'pointer', gridColumn: 'span 2', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '12px', marginTop: '0.2rem', fontWeight: 600 }}
                    >
                      + Add "{techInput}" as custom tech
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DIFFICULTY</label>
              <select value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})} style={{ appearance: 'none' }}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="card" style={{ padding: '2rem', borderRadius: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>🤖</span> Mode & Generation
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            {['AI', 'Custom', 'Live'].map(m => (
              <div key={m} onClick={() => setFormData({...formData, mode: m})} style={{ padding: '1rem', borderRadius: '16px', cursor: 'pointer', border: formData.mode === m ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', background: formData.mode === m ? 'rgba(139, 92, 246, 0.05)' : 'transparent', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{m === 'AI' ? '🤖' : m === 'Custom' ? '✍️' : '🎥'}</div>
                <strong>{m} Mode</strong>
              </div>
            ))}
          </div>

          {formData.mode === 'AI' && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.1)' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>QUESTION COUNT</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={formData.numQuestions} 
                  onChange={(e) => setFormData({...formData, numQuestions: parseInt(e.target.value) || 1})}
                  style={{ flex: 1, accentColor: 'var(--accent-color)' }}
                />
                <input 
                  type="number" 
                  min="1" 
                  max="50" 
                  value={formData.numQuestions} 
                  onChange={(e) => setFormData({...formData, numQuestions: parseInt(e.target.value) || 1})} 
                  style={{ width: '80px', fontSize: '1.1rem', fontWeight: 800, textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem' }}
                />
              </div>
              <p style={{ margin: '0.75rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Questions will be generated by AI.</p>
            </div>
          )}

          {formData.mode === 'Custom' && (
            <div style={{ 
              marginTop: '1.5rem', padding: '1.5rem', borderRadius: '16px', 
              background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-color)',
              display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>Bulk Upload Questions</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Upload a CSV file to import questions in bulk.</span>
                </div>
                <button 
                  type="button"
                  onClick={downloadSampleCSV}
                  style={{ background: 'transparent', color: 'var(--accent-color)', fontSize: '0.8rem', border: '1px solid var(--accent-color)', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  📥 Sample CSV
                </button>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  padding: '1.5rem', border: '2px dashed rgba(255,255,255,0.1)', 
                  borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s', background: csvQuestions.length > 0 ? 'rgba(52, 211, 153, 0.05)' : 'transparent'
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleCSVUpload} 
                  accept=".csv" 
                  style={{ display: 'none' }} 
                />
                {csvQuestions.length > 0 ? (
                  <div>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <p style={{ margin: '0.5rem 0 0 0', fontWeight: 700, color: '#34d399' }}>{csvQuestions.length} Questions Loaded</p>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                    <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600 }}>Click to upload CSV</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security & Settings Section */}
        {formData.mode !== 'Live' && (
          <div className="card" style={{ padding: '2rem', borderRadius: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>🛡️</span> Security & Environment
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div 
                onClick={() => {
                  const newOffline = !formData.is_offline_mode;
                  setFormData({
                    ...formData, 
                    is_offline_mode: newOffline,
                    // If offline is turned on, proctoring MUST be off
                    proctoring_enabled: newOffline ? false : formData.proctoring_enabled
                  });
                }}
                style={{ 
                  padding: '1.5rem', 
                  borderRadius: '20px', 
                  cursor: 'pointer', 
                  background: formData.is_offline_mode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)', 
                  border: formData.is_offline_mode ? '2px solid var(--danger)' : '1px solid var(--border-color)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Offline Mode</strong>
                  {formData.is_offline_mode && <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 800 }}>ACTIVE</span>}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Forces students to disconnect from internet.</p>
              </div>

              <div 
                onClick={() => {
                  if (!formData.is_offline_mode) {
                    setFormData({...formData, proctoring_enabled: !formData.proctoring_enabled});
                  }
                }}
                style={{ 
                  padding: '1.5rem', 
                  borderRadius: '20px', 
                  cursor: formData.is_offline_mode ? 'not-allowed' : 'pointer', 
                  background: formData.proctoring_enabled ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.02)', 
                  border: formData.proctoring_enabled ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                  opacity: formData.is_offline_mode ? 0.5 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>AI Proctoring</strong>
                  {formData.proctoring_enabled && <span style={{ color: 'var(--accent-color)', fontSize: '0.8rem', fontWeight: 800 }}>ENABLED</span>}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {formData.is_offline_mode ? 'Not available in Offline Mode' : 'Face detection and tab tracking.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Section */}
        <div className="card" style={{ padding: '2rem', borderRadius: '24px', border: assignNow ? '2px solid var(--accent-color)' : '1px solid var(--border-color)', transition: 'all 0.3s' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>👥</span> Assign Students (Optional)
            </h3>
            <button 
              type="button" 
              onClick={() => setAssignNow(!assignNow)}
              style={{ background: assignNow ? 'var(--success)' : 'var(--bg-accent)', color: assignNow ? '#fff' : 'var(--text-primary)', padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
            >
              {assignNow ? '✓ Assignment Enabled' : '+ Enable Assignment'}
            </button>
          </div>

          {assignNow && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.1)', padding: '0.3rem', borderRadius: '10px' }}>
                <button type="button" onClick={() => setAssignType('individual')} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: assignType === 'individual' ? 'var(--bg-secondary)' : 'transparent', border: 'none', color: '#fff' }}>Individual</button>
                <button type="button" onClick={() => setAssignType('batch')} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', background: assignType === 'batch' ? 'var(--bg-secondary)' : 'transparent', border: 'none', color: '#fff' }}>Batch</button>
              </div>

              {assignType === 'individual' ? (
                <div>
                   <input 
                    type="text" 
                    placeholder="Search students..." 
                    value={studentSearch} 
                    onChange={e => setStudentSearch(e.target.value)}
                    style={{ marginBottom: '1rem' }}
                  />
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {filteredStudents.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                        style={{ padding: '0.75rem', borderRadius: '10px', background: selectedStudentIds.includes(s.id) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)', border: selectedStudentIds.includes(s.id) ? '1px solid var(--accent-color)' : '1px solid transparent', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}>
                  <option value="">Select Batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem' }}>DATE</label>
                  <input type="date" value={scheduleData.scheduledDate} onChange={e => setScheduleData({...scheduleData, scheduledDate: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem' }}>TIME</label>
                  <input type="time" value={scheduleData.startTime} onChange={e => setScheduleData({...scheduleData, startTime: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem' }}>DURATION (MIN)</label>
                  <input type="number" value={scheduleData.duration} onChange={e => setScheduleData({...scheduleData, duration: parseInt(e.target.value) || 30})} />
                </div>
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} style={{ background: 'var(--accent-gradient)', padding: '1.25rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: '20px' }}>
          {loading ? 'Processing...' : '🚀 Create & Finalize Interview'}
        </button>
      </form>
    </div>
    </>
  );
}
