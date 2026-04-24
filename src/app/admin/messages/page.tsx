'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useUI } from '@/components/UIProvider';
import EmojiPicker from '@/components/EmojiPicker';

export default function AdminMessages() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { showToast } = useUI();
  
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [chatType, setChatType] = useState<'direct' | 'batch'>('direct');
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
        setChatType('direct');
        setSelectedId(studentIdParam);
      }
      
      const batchIdParam = params.get('batch');
      if (batchIdParam) {
        setChatType('batch');
        setSelectedId(batchIdParam);
      }
      
      fetchSidebarData();
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
          fetchSidebarData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Real-time for current chat
  useEffect(() => {
    if (selectedId) {
      const filter = chatType === 'direct' 
        ? `student_id=eq.${selectedId}` 
        : `group_id=eq.${selectedId}`;

      const channel = supabase
        .channel(`chat-${selectedId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter },
          (payload) => {
            setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            if (payload.new.sender_role !== 'admin') {
              markAsRead(payload.new.id);
            }
          }
        )
        .subscribe();

      fetchMessages(selectedId);

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedId, chatType, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSidebarData = async () => {
    try {
      // Get Students
      const { data: allStudents } = await supabase.from('students').select('*').order('name');
      const { data: allBatches } = await supabase.from('groups').select('*').order('name');
      
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      const studentsWithMeta = allStudents?.map(student => {
        const studentMessages = latestMessages?.filter(m => m.student_id === student.id && !m.group_id) || [];
        return {
          ...student,
          latestMessage: studentMessages[0],
          unreadCount: studentMessages.filter(m => m.sender_role === 'student' && !m.is_read).length
        };
      }) || [];

      const batchesWithMeta = allBatches?.map(batch => {
        const batchMessages = latestMessages?.filter(m => m.group_id === batch.id) || [];
        return {
          ...batch,
          latestMessage: batchMessages[0],
          unreadCount: batchMessages.filter(m => m.sender_role === 'student' && !m.is_read).length
        };
      }) || [];

      setStudents(studentsWithMeta.sort((a, b) => {
        const dateA = a.latestMessage ? new Date(a.latestMessage.created_at).getTime() : 0;
        const dateB = b.latestMessage ? new Date(b.latestMessage.created_at).getTime() : 0;
        return dateB - dateA;
      }));

      setBatches(batchesWithMeta.sort((a, b) => {
        const dateA = a.latestMessage ? new Date(a.latestMessage.created_at).getTime() : 0;
        const dateB = b.latestMessage ? new Date(b.latestMessage.created_at).getTime() : 0;
        return dateB - dateA;
      }));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      let query = supabase.from('messages').select('*, students(name, photo_url)');
      
      if (chatType === 'direct') {
        query = query.eq('student_id', id).is('group_id', null);
      } else {
        query = query.eq('group_id', id);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      const unreadIds = data
        ?.filter(m => m.sender_role !== 'admin' && !m.is_read)
        .map(m => m.id);

      if (unreadIds && unreadIds.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        fetchSidebarData();
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
    if (!newMessage.trim() || !selectedId || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const insertData: any = {
      admin_id: admin?.id,
      content: content,
      sender_role: 'admin',
      is_read: false
    };

    if (chatType === 'direct') {
      insertData.student_id = selectedId;
    } else {
      insertData.group_id = selectedId;
    }

    // Optimistic update
    const tempMessage = {
      id: 'temp-' + Date.now(),
      ...insertData,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase.from('messages').insert(insertData).select().single();

      if (error) throw error;
      
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? data : m));
      fetchSidebarData();
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
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

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedStudent = students.find(s => s.id === selectedId);
  const selectedBatch = batches.find(b => b.id === selectedId);

  const totalStudentUnread = students.reduce((acc, s) => acc + (s.unreadCount || 0), 0);
  const totalBatchUnread = batches.reduce((acc, b) => acc + (b.unreadCount || 0), 0);

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
          
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setChatType('direct')}
              style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', background: chatType === 'direct' ? 'var(--accent-gradient)' : 'transparent', color: chatType === 'direct' ? '#fff' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              Students
              {totalStudentUnread > 0 && (
                <span style={{ background: chatType === 'direct' ? 'rgba(255,255,255,0.2)' : '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '10px', minWidth: '18px' }}>
                  {totalStudentUnread}
                </span>
              )}
            </button>
            <button 
              onClick={() => setChatType('batch')}
              style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '8px', background: chatType === 'batch' ? 'var(--accent-gradient)' : 'transparent', color: chatType === 'batch' ? '#fff' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              Batches
              {totalBatchUnread > 0 && (
                <span style={{ background: chatType === 'batch' ? 'rgba(255,255,255,0.2)' : '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '10px', minWidth: '18px' }}>
                  {totalBatchUnread}
                </span>
              )}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder={`Search ${chatType === 'direct' ? 'students' : 'batches'}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.2rem', fontSize: '0.9rem', background: 'var(--bg-secondary)', borderRadius: '10px' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chatType === 'direct' ? (
            filteredStudents.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No students found.</p>
            ) : (
              filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedId(s.id)}
                  style={{ 
                    padding: '1.25rem', 
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: selectedId === s.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
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
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 800 }}>{s.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredBatches.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No batches found.</p>
            ) : (
              filteredBatches.map(b => (
                <div 
                  key={b.id} 
                  onClick={() => setSelectedId(b.id)}
                  style={{ 
                    padding: '1.25rem', 
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: selectedId === b.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
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
                    👥
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex-between">
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</h4>
                      {b.latestMessage && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {new Date(b.latestMessage.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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
                        opacity: b.unreadCount > 0 ? 1 : 0.6,
                        fontWeight: b.unreadCount > 0 ? 600 : 400
                      }}>
                        {b.latestMessage ? b.latestMessage.content : 'No group messages yet'}
                      </p>
                      {b.unreadCount > 0 && (
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 800 }}>{b.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
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
        {!selectedId ? (
          <div className="flex-center" style={{ height: '100%', flexDirection: 'column', opacity: 0.3 }}>
            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Select a {chatType === 'direct' ? 'student' : 'batch'} to start chatting</h3>
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
                {chatType === 'direct' ? (
                  selectedStudent?.photo_url ? <img src={selectedStudent.photo_url} style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover', display: 'block' }} /> : selectedStudent?.name[0]
                ) : '👥'}
              </div>
              <div>
                <h4 style={{ margin: 0 }}>{chatType === 'direct' ? selectedStudent?.name : selectedBatch?.name}</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {chatType === 'direct' ? selectedStudent?.email : `${selectedBatch?.description || 'Batch Group Chat'}`}
                </p>
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
                      maxWidth: '85%',
                      display: 'flex',
                      gap: '0.75rem',
                      flexDirection: 'row',
                      alignItems: 'flex-end'
                    }}
                  >
                    {msg.sender_role !== 'admin' && (
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '8px', 
                        background: 'var(--bg-primary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        border: '1px solid var(--border-color)',
                        flexShrink: 0,
                        marginBottom: '1.2rem'
                      }}>
                        {msg.students?.photo_url ? (
                          <img src={msg.students.photo_url} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (msg.students?.name?.[0] || 'S')}
                      </div>
                    )}
                    
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender_role === 'admin' ? 'flex-end' : 'flex-start',
                      flex: 1
                    }}>
                      {chatType === 'batch' && msg.sender_role !== 'admin' && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem', marginLeft: '0.2rem' }}>
                          {msg.students?.name || 'Student'}
                        </span>
                      )}
                      <div style={{ 
                        padding: '0.8rem 1.2rem', 
                        borderRadius: msg.sender_role === 'admin' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                        background: msg.sender_role === 'admin' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                        color: msg.sender_role === 'admin' ? '#fff' : 'var(--text-primary)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        fontSize: '0.95rem',
                        width: 'fit-content'
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
                placeholder={`Message ${chatType === 'direct' ? selectedStudent?.name : selectedBatch?.name}...`} 
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
              <EmojiPicker onSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
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
