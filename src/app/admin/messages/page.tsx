'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useUI } from '@/components/UIProvider';

export default function AdminMessages() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { showToast } = useUI();
  
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      // Get admin record
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      setAdmin(adminData);
      
      const params = new URLSearchParams(window.location.search);
      const studentIdParam = params.get('student');
      if (studentIdParam) {
        setSelectedStudentId(studentIdParam);
      }
      
      fetchStudentsWithMessages();
    };
    checkAuth();
  }, [router, supabase]);

  // Real-time for message list updates (new messages from any student)
  useEffect(() => {
    const channel = supabase
      .channel('admin-messages-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('New message received in list:', payload);
          fetchStudentsWithMessages();
        }
      )
      .subscribe((status) => {
        console.log('Admin messages list subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Real-time for current chat
  useEffect(() => {
    if (selectedStudentId) {
      const channel = supabase
        .channel(`chat-${selectedStudentId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `student_id=eq.${selectedStudentId}` },
          (payload) => {
            console.log('New message received in chat:', payload);
            setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            if (payload.new.sender_role === 'student') {
              markAsRead(payload.new.id);
            }
          }
        )
        .subscribe((status) => {
          console.log('Admin chat subscription status:', status);
        });

      fetchMessages(selectedStudentId);

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedStudentId, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStudentsWithMessages = async () => {
    try {
      // 1. Get all students
      const { data: allStudents } = await supabase.from('students').select('*').order('name');
      
      // 2. Get latest message and unread count for each student
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      // Process students with their latest messages
      const studentsWithMeta = allStudents?.map(student => {
        const studentMessages = latestMessages?.filter(m => m.student_id === student.id) || [];
        const latest = studentMessages[0];
        const unreadCount = studentMessages.filter(m => m.sender_role === 'student' && !m.is_read).length;
        
        return {
          ...student,
          latestMessage: latest,
          unreadCount
        };
      }) || [];

      // Sort by latest message date
      studentsWithMeta.sort((a, b) => {
        const dateA = a.latestMessage ? new Date(a.latestMessage.created_at).getTime() : 0;
        const dateB = b.latestMessage ? new Date(b.latestMessage.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setStudents(studentsWithMeta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      const unreadIds = data
        ?.filter(m => m.sender_role === 'student' && !m.is_read)
        .map(m => m.id);

      if (unreadIds && unreadIds.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        // Refresh counts in list
        fetchStudentsWithMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudentId || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const tempMessage = {
      id: 'temp-' + Date.now(),
      student_id: selectedStudentId,
      admin_id: admin?.id,
      content: content,
      sender_role: 'admin',
      is_read: false,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase.from('messages').insert({
        student_id: selectedStudentId,
        admin_id: admin?.id,
        content: content,
        sender_role: 'admin',
        is_read: false
      }).select().single();

      if (error) throw error;
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? data : m));
      // Refresh list to update latest message preview
      fetchStudentsWithMessages();
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  if (loading && students.length === 0) {
    return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading messages...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', height: 'calc(100vh - 120px)', display: 'flex', gap: '2rem' }}>
      {/* Sidebar - Student List */}
      <div className="card" style={{ 
        width: '350px', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0, 
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        flexShrink: 0
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Messages</h3>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.2rem', fontSize: '0.9rem', background: 'var(--bg-secondary)', borderRadius: '10px' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredStudents.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No students found.</p>
          ) : (
            filteredStudents.map(s => (
              <div 
                key={s.id} 
                onClick={() => setSelectedStudentId(s.id)}
                style={{ 
                  padding: '1.25rem', 
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  background: selectedStudentId === s.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}>
                  {s.photo_url ? <img src={s.photo_url} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} /> : s.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex-between">
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</h4>
                    {s.latestMessage && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {new Date(s.latestMessage.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="flex-between" style={{ marginTop: '0.2rem' }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      opacity: s.unreadCount > 0 ? 1 : 0.6,
                      fontWeight: s.unreadCount > 0 ? 600 : 400
                    }}>
                      {s.latestMessage ? s.latestMessage.content : 'No messages yet'}
                    </p>
                    {s.unreadCount > 0 && (
                      <span style={{ 
                        background: '#ef4444', 
                        color: '#fff', 
                        fontSize: '0.65rem', 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '10px', 
                        fontWeight: 800 
                      }}>
                        {s.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="card" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0, 
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        background: 'var(--bg-secondary)'
      }}>
        {!selectedStudentId ? (
          <div className="flex-center" style={{ height: '100%', flexDirection: 'column', opacity: 0.5 }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📫</div>
            <h3>Select a student to start chatting</h3>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={{ 
              padding: '1rem 1.5rem', 
              borderBottom: '1px solid var(--border-color)', 
              background: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'var(--bg-secondary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 700,
                border: '1px solid var(--border-color)'
              }}>
                {selectedStudent?.photo_url ? <img src={selectedStudent.photo_url} style={{ width: '100%', height: '100%', borderRadius: '10px' }} /> : selectedStudent?.name[0]}
              </div>
              <div>
                <h4 style={{ margin: 0 }}>{selectedStudent?.name}</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selectedStudent?.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem' 
            }}>
              {messages.length === 0 ? (
                <div className="flex-center" style={{ height: '100%', opacity: 0.3 }}>
                  <p>No messages yet. Send a message to {selectedStudent?.name}!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg.id} 
                    style={{ 
                      alignSelf: msg.sender_role === 'admin' ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender_role === 'admin' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{ 
                      padding: '0.8rem 1.2rem', 
                      borderRadius: msg.sender_role === 'admin' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                      background: msg.sender_role === 'admin' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                      color: msg.sender_role === 'admin' ? '#fff' : 'var(--text-primary)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      fontSize: '0.95rem'
                    }}>
                      {msg.content}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem', opacity: 0.7 }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_role === 'admin' && (
                        <span style={{ marginLeft: '0.5rem' }}>{msg.is_read ? '✓✓' : '✓'}</span>
                      )}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} style={{ 
              padding: '1.25rem', 
              background: 'var(--bg-primary)', 
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '1rem'
            }}>
              <input 
                type="text" 
                placeholder={`Reply to ${selectedStudent?.name}...`} 
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
                  fontWeight: 600
                }}
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
