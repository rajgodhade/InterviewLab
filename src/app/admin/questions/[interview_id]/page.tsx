'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function QuestionEditor() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const interviewId = params.interview_id as string;

  const [interview, setInterview] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Question Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'short_answer',
    options: ['', '', '', ''],
    expected_answer: '',
  });

  useEffect(() => {
    fetchData();
  }, [interviewId]);

  const fetchData = async () => {
    try {
      // 1. Fetch Interview
      const { data: intData, error: intError } = await supabase
        .from('interviews').select('*').eq('id', interviewId).single();
      if (intError) throw intError;
      setInterview(intData);

      // 2. Fetch Questions
      const { data: qData, error: qError } = await supabase
        .from('questions').select('*').eq('interview_id', interviewId).order('order_index', { ascending: true });
      if (qError) throw qError;
      setQuestions(qData || []);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (questions.length === 0) {
      showToast('No questions to export', 'info');
      return;
    }

    const headers = ['question_text', 'question_type', 'options', 'expected_answer'];
    const rows = questions.map(q => {
      const optionsStr = q.options ? q.options.join(' | ') : '';
      return [
        `"${q.question_text.replace(/"/g, '""')}"`,
        q.question_type,
        `"${optionsStr.replace(/"/g, '""')}"`,
        `"${(q.expected_answer || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${interview?.title || 'interview'}_questions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Questions exported to CSV', 'success');
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const questionData = {
        interview_id: interviewId,
        question_text: newQuestion.question_text,
        question_type: newQuestion.question_type,
        options: newQuestion.question_type === 'mcq' ? newQuestion.options.filter(o => o.trim() !== '') : null,
        expected_answer: newQuestion.expected_answer,
      };

      if (editingId) {
        const { data, error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;
        setQuestions(questions.map(q => q.id === editingId ? data : q));
        showToast('Question updated successfully', 'success');
      } else {
        const orderIndex = questions.length;
        const { data, error } = await supabase
          .from('questions')
          .insert({ ...questionData, order_index: orderIndex })
          .select()
          .single();

        if (error) throw error;
        setQuestions([...questions, data]);
        showToast('Question added successfully', 'success');
      }

      setShowAddForm(false);
      setEditingId(null);
      setNewQuestion({
        question_text: '',
        question_type: 'short_answer',
        options: ['', '', '', ''],
        expected_answer: '',
      });
    } catch (err: any) {
      console.error(err);
      showToast('Error saving question: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (q: any) => {
    setEditingId(q.id);
    setNewQuestion({
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || ['', '', '', ''],
      expected_answer: q.expected_answer || '',
    });
    setShowAddForm(false); // Close the 'Add' form if open
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
      setQuestions(questions.filter(q => q.id !== id));
      showToast('Question deleted', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Error deleting: ' + err.message, 'error');
    }
  };

  const renderQuestionForm = (isEdit: boolean) => (
    <>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
        {isEdit ? 'Edit Question' : 'Add New Question'}
      </h3>
      <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Question Text</label>
          <textarea 
            required
            placeholder="Enter your question here..."
            value={newQuestion.question_text}
            onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
            rows={3}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Question Type</label>
            <select 
              value={newQuestion.question_type}
              onChange={(e) => setNewQuestion({...newQuestion, question_type: e.target.value, options: ['', '', '', ''], expected_answer: ''})}
            >
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
              <option value="long_answer">Long Answer</option>
            </select>
          </div>
          <div>
            {newQuestion.question_type === 'true_false' && (
              <>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Correct Answer</label>
                <select 
                  required
                  value={newQuestion.expected_answer}
                  onChange={(e) => setNewQuestion({...newQuestion, expected_answer: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </>
            )}
            {(newQuestion.question_type === 'short_answer' || newQuestion.question_type === 'long_answer') && (
              <>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Reference Answer (Optional)</label>
                <input 
                  placeholder="Key points for evaluation..."
                  value={newQuestion.expected_answer}
                  onChange={(e) => setNewQuestion({...newQuestion, expected_answer: e.target.value})}
                />
              </>
            )}
          </div>
        </div>

        {newQuestion.question_type === 'mcq' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>Options & Correct Answer</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {newQuestion.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="radio" 
                    name="correct_opt" 
                    checked={newQuestion.expected_answer === opt && opt !== ''}
                    onChange={() => setNewQuestion({...newQuestion, expected_answer: opt})}
                    style={{ width: 'auto' }}
                    title="Set as correct answer"
                  />
                  <input 
                    required
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newQuestion.options];
                      updated[i] = e.target.value;
                      setNewQuestion({...newQuestion, options: updated});
                    }}
                  />
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>* Select the radio button next to the correct option.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving...' : isEdit ? 'Update Question' : 'Add Question'}
          </button>
          <button 
            type="button" 
            onClick={() => {
              setShowAddForm(false);
              setEditingId(null);
              setNewQuestion({
                question_text: '',
                question_type: 'short_answer',
                options: ['', '', '', ''],
                expected_answer: '',
              });
            }} 
            style={{ background: 'var(--bg-accent)', flex: 1 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading editor...</div>;

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Set Questions</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Interview: <strong>{interview?.title}</strong> ({interview?.technology})</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleExportCSV}
            style={{ background: 'transparent', color: 'var(--accent-color)', border: '1px solid var(--accent-color)' }}
          >
            📥 Export CSV
          </button>
          <button onClick={() => router.push('/admin')}>Done & Finish</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Existing Questions List */}
        {questions.length === 0 && !showAddForm && (
          <div className="card flex-center" style={{ padding: '4rem 1rem', flexDirection: 'column', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>No questions added yet. Start by adding your first question.</p>
            <button onClick={() => setShowAddForm(true)}>+ Add Question</button>
          </div>
        )}

        {questions.map((q, index) => (
          editingId === q.id ? (
            <div key={q.id} className="card" style={{ border: '2px dashed var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
              {renderQuestionForm(true)}
            </div>
          ) : (
            <div key={q.id} className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  background: 'var(--bg-accent)', width: '32px', height: '32px', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                    <span style={{ 
                      background: 'var(--bg-accent)', padding: '0.2rem 0.6rem', 
                      borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' 
                    }}>
                      {q.question_type.replace('_', ' ')}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEditClick(q)}
                        style={{ background: 'transparent', color: 'var(--accent-color)', padding: '0.25rem', fontSize: '1rem' }}
                        title="Edit Question"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        style={{ background: 'transparent', color: 'var(--danger)', padding: '0.25rem', fontSize: '1.2rem' }}
                        title="Delete Question"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <h4 style={{ margin: '0 0 1rem 0' }}>{q.question_text}</h4>
                  
                  {q.question_type === 'mcq' && q.options && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      {q.options.map((opt: string, i: number) => (
                        <div key={i} style={{ padding: '0.6rem 1rem', background: 'var(--bg-primary)', borderRadius: '6px', fontSize: '0.9rem', border: opt === q.expected_answer ? '1px solid var(--success)' : '1px solid var(--border-color)' }}>
                          {opt} {opt === q.expected_answer && '✅'}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.expected_answer && q.question_type !== 'mcq' && (
                    <div style={{ padding: '0.8rem', background: 'var(--bg-primary)', borderRadius: '6px', fontSize: '0.9rem', borderLeft: '3px solid var(--success)' }}>
                      <strong style={{ display: 'block', fontSize: '0.7rem', color: 'var(--success)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Expected Answer</strong>
                      {q.expected_answer}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ))}

        {/* Add Question Form */}
        {showAddForm ? (
          <div className="card" style={{ border: '2px dashed var(--accent-color)' }}>
            {renderQuestionForm(false)}
          </div>
        ) : !editingId && questions.length > 0 && (
          <button 
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              setNewQuestion({
                question_text: '',
                question_type: 'short_answer',
                options: ['', '', '', ''],
                expected_answer: '',
              });
            }}
            style={{ padding: '1.5rem', border: '2px dashed var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '1.1rem' }}
          >
            + Add Another Question
          </button>
        )}
      </div>
    </div>
  );
}
