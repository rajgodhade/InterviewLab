'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';
import EmojiPicker from '@/components/EmojiPicker';

export default function StudentMessages() {
  const router = useRouter();
  const { showToast } = useUI();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>('admin'); // 'admin' or group_id
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});
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

  // Real-time subscription for message updates (sidebar & active chat)
  useEffect(() => {
    if (!student) return;

    const groupIds = groups.map(g => g.id);
    const filter = groupIds.length > 0 
      ? `student_id.eq.${student.id},group_id.in.(${groupIds.join(',')})`
      : `student_id.eq.${student.id}`;

    const channel = supabase
      .channel('student-messages-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          
          // If it's for the currently active chat, add to messages list
          const isActiveChat = (selectedChatId === 'admin' && !newMsg.group_id && newMsg.student_id === student.id) ||
                               (newMsg.group_id === selectedChatId);
          
          if (isActiveChat) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            if (newMsg.sender_role === 'admin') {
              markAsRead(newMsg.id);
            }
          } else {
            // Otherwise, update unread counts for the sidebar
            const chatKey = newMsg.group_id || 'admin';
            if (newMsg.sender_role === 'admin') {
              setUnreadCounts(prev => ({
                ...prev,
                [chatKey]: (prev[chatKey] || 0) + 1
              }));
            }
          }
        }
      )
      .subscribe();

    fetchMessages(selectedChatId);
    fetchUnreadCounts();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [student, selectedChatId, groups]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStudentAndMessages = async (email: string) => {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('*, group_members(group_id, groups(*))')
        .eq('email', email)
        .single();

      if (!studentData) throw new Error('Student not found');
      setStudent(studentData);
      
      const studentGroups = studentData.group_members?.map((gm: any) => gm.groups) || [];
      setGroups(studentGroups);

      // Initial fetch for 'admin' chat
      fetchMessages('admin');
    } catch (err) {
      console.error(err);
      showToast('Failed to load student data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    if (!student) return;
    try {
      const groupIds = groups.map(g => g.id);
      
      // Fetch unread for admin chat
      const { count: adminUnread } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .is('group_id', null)
        .eq('sender_role', 'admin')
        .eq('is_read', false);

      const counts: {[key: string]: number} = { admin: adminUnread || 0 };

      // Fetch unread for each group
      if (groupIds.length > 0) {
        const { data: groupUnreads } = await supabase
          .from('messages')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('sender_role', 'admin')
          .eq('is_read', false);

        if (groupUnreads) {
          groupUnreads.forEach((msg: any) => {
            counts[msg.group_id] = (counts[msg.group_id] || 0) + 1;
          });
        }
      }

      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (!student) return;
    try {
      let query = supabase.from('messages').select('*, students(name, photo_url)');
      
      if (chatId === 'admin') {
        query = query.eq('student_id', student.id).is('group_id', null);
      } else {
        query = query.eq('group_id', chatId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read and clear unread count for this chat
      const unreadIds = data
        ?.filter((m) => m.sender_role === 'admin' && !m.is_read)
        .map((m) => m.id);

      if (unreadIds && unreadIds.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
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
    if (!newMessage.trim() || !student || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const insertData: any = {
      content: content,
      sender_role: 'student',
      is_read: false
    };

    if (selectedChatId === 'admin') {
      insertData.student_id = student.id;
    } else {
      insertData.group_id = selectedChatId;
      insertData.student_id = student.id; // Still attach student_id for sender identification
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
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(content);
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

  const selectedGroup = groups.find(g => g.id === selectedChatId);

  return (
    <div className="container" style={{ maxWidth: '1100px', height: 'calc(100vh - 120px)', display: 'flex', gap: '1.5rem' }}>
      {/* Sidebar */}
      <div className="card" style={{ 
        width: '280px', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0, 
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        flexShrink: 0
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0 }}>Messages</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div 
            onClick={() => setSelectedChatId('admin')}
            style={{ 
              padding: '1.25rem', 
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: selectedChatId === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              transition: '0.2s'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid var(--border-color)' }}>
              🛡️
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Admin Support</h4>
                {unreadCounts['admin'] > 0 && (
                  <span style={{ 
                    background: '#ef4444', 
                    color: '#fff', 
                    fontSize: '0.65rem', 
                    padding: '2px 6px', 
                    borderRadius: '10px', 
                    fontWeight: 700,
                    marginLeft: '0.5rem'
                  }}>
                    {unreadCounts['admin']}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Direct Support Chat</p>
            </div>
          </div>

          {groups.map(group => (
            <div 
              key={group.id} 
              onClick={() => setSelectedChatId(group.id)}
              style={{ 
                padding: '1.25rem', 
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: selectedChatId === group.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                transition: '0.2s'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '1px solid var(--border-color)' }}>
                👥
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</h4>
                  {unreadCounts[group.id] > 0 && (
                    <span style={{ 
                      background: '#ef4444', 
                      color: '#fff', 
                      fontSize: '0.65rem', 
                      padding: '2px 6px', 
                      borderRadius: '10px', 
                      fontWeight: 700,
                      marginLeft: '0.5rem'
                    }}>
                      {unreadCounts[group.id]}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Batch Group</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="card" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 0, 
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px'
      }}>
        {/* Chat Header */}
        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid var(--border-color)' }}>
            {selectedChatId === 'admin' ? '🛡️' : '👥'}
          </div>
          <div>
            <h4 style={{ margin: 0 }}>{selectedChatId === 'admin' ? 'Admin Support' : selectedGroup?.name}</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {selectedChatId === 'admin' ? 'Get help from our team' : selectedGroup?.description || 'Batch Group Chat'}
            </p>
          </div>
        </div>

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
                  alignSelf: msg.sender_role === 'student' && msg.student_id === student.id ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  gap: '0.75rem',
                  flexDirection: msg.sender_role === 'student' && msg.student_id === student.id ? 'row-reverse' : 'row',
                  alignItems: 'flex-end'
                }}
              >
                {/* Avatar */}
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
                  {msg.sender_role === 'admin' ? (
                    '🛡️'
                  ) : (
                    msg.students?.photo_url ? (
                      <img src={msg.students.photo_url} style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (msg.students?.name?.[0] || 'S')
                  )}
                </div>

                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender_role === 'student' && msg.student_id === student.id ? 'flex-end' : 'flex-start',
                  flex: 1
                }}>
                  {selectedChatId !== 'admin' && (msg.sender_role !== 'student' || msg.student_id !== student.id) && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem', marginLeft: '0.2rem' }}>
                      {msg.sender_role === 'admin' ? 'Admin' : (msg.student_id === student.id ? 'You' : (msg.students?.name || 'Student'))}
                    </span>
                  )}
                  <div style={{ 
                    padding: '0.8rem 1.2rem', 
                    borderRadius: msg.sender_role === 'student' && msg.student_id === student.id ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    background: msg.sender_role === 'student' && msg.student_id === student.id ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                    color: msg.sender_role === 'student' && msg.student_id === student.id ? '#fff' : 'var(--text-primary)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    fontSize: '0.95rem',
                    lineHeight: 1.4,
                    width: 'fit-content'
                  }}>
                    {msg.content}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem', opacity: 0.7 }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender_role === 'student' && msg.student_id === student.id && (
                      <span style={{ marginLeft: '0.5rem' }}>
                        {msg.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </span>
                </div>
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
            placeholder={selectedChatId === 'admin' ? "Message Admin..." : `Message ${selectedGroup?.name}...`} 
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
