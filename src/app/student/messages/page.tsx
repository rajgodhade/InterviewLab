'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function StudentMessages() {
  const router = useRouter();
  const { showToast } = useUI();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const email = localStorage.getItem('student_email');
    if (!email) {
      router.push('/student');
      return;
    }
    fetchStudentAndMessages(email);
  }, [router]);

  useEffect(() => {
    if (student) {
      const channel = supabase
        .channel('student-messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `student_id=eq.${student.id}` },
          (payload) => {
            console.log('Student received new message:', payload);
            setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            // If it's from admin, mark as read
            if (payload.new.sender_role === 'admin') {
              markAsRead(payload.new.id);
            }
          }
        )
        .subscribe((status) => {
          console.log('Student chat subscription status:', status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [student]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStudentAndMessages = async (email: string) => {
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

      if (studentError || !studentData) throw studentError || new Error('Student not found');
      setStudent(studentData);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Mark all unread admin messages as read
      const unreadIds = messagesData
        ?.filter((m) => m.sender_role === 'admin' && !m.is_read)
        .map((m) => m.id);

      if (unreadIds && unreadIds.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !student || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const tempMessage = {
      id: 'temp-' + Date.now(),
      student_id: student.id,
      content: content,
      sender_role: 'student',
      is_read: false,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase.from('messages').insert({
        student_id: student.id,
        content: content,
        sender_role: 'student',
        is_read: false
      }).select().single();

      if (error) throw error;
      
      // Replace optimistic message with real one to avoid duplicates when subscription fires
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? data : m));
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(content); // Restore message text
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0 }}>Messages</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Chat with the InterviewLab Admin team.</p>
        </div>
      </div>

      <div className="card chat-container" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0, 
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px'
      }}>
        {/* Messages List */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem' 
        }}>
          {messages.length === 0 ? (
            <div className="flex-center" style={{ height: '100%', flexDirection: 'column', opacity: 0.3 }}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id} 
                style={{ 
                  alignSelf: msg.sender_role === 'student' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender_role === 'student' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{ 
                  padding: '0.8rem 1.2rem', 
                  borderRadius: msg.sender_role === 'student' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  background: msg.sender_role === 'student' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                  color: msg.sender_role === 'student' ? '#fff' : 'var(--text-primary)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  fontSize: '0.95rem',
                  lineHeight: 1.4
                }}>
                  {msg.content}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem', opacity: 0.7 }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.sender_role === 'student' && (
                    <span style={{ marginLeft: '0.5rem' }}>
                      {msg.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} style={{ 
          padding: '1.25rem', 
          background: 'var(--bg-primary)', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '1rem'
        }}>
          <input 
            type="text" 
            placeholder="Type your message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            style={{ 
              flex: 1, 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)',
              padding: '0.8rem 1.2rem',
              borderRadius: '12px'
            }}
          />
          <button 
            type="submit" 
            disabled={sending || !newMessage.trim()}
            style={{ 
              padding: '0 1.5rem', 
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600
            }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          border-top-color: var(--accent-color);
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .chat-container::-webkit-scrollbar {
          width: 6px;
        }
        .chat-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-container::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
