'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';
import Link from 'next/link';

export default function StudentInbox() {
  const router = useRouter();
  const { showToast } = useUI();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('student_email');
    if (!email) {
      router.push('/student');
      return;
    }
    fetchNotifications(email);
  }, [router]);

  const fetchNotifications = async (email: string) => {
    try {
      // 1. Get student ID
      const { data: student } = await supabase.from('students').select('id').eq('email', email).single();
      if (!student) return;

      // 2. Fetch notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification deleted', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>My Inbox</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Stay updated with your assigned interviews and feedback.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={async () => {
              const ids = notifications.filter(n => !n.is_read).map(n => n.id);
              await supabase.from('notifications').update({ is_read: true }).in('id', ids);
              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }}
            style={{ background: 'var(--bg-secondary)', fontSize: '0.85rem' }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '40vh' }}>
          <div className="spinner"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card flex-center" style={{ minHeight: '300px', flexDirection: 'column', textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <h3>Your inbox is empty</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Notifications about your interviews will appear here.</p>
          <Link href="/student/dashboard" style={{ marginTop: '1.5rem' }}>
            <button style={{ background: 'var(--accent-gradient)' }}>Go to Dashboard</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className="inbox-item"
              style={{ 
                padding: '1.25rem 1.5rem', 
                background: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.03)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {!n.is_read && (
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-color)', 
                  position: 'absolute', 
                  left: '0.5rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  boxShadow: '0 0 10px var(--accent-color)'
                }}></div>
              )}

              <div style={{ 
                fontSize: '1.2rem', 
                background: n.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(59, 130, 246, 0.1)', 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                color: n.is_read ? 'var(--text-secondary)' : 'var(--accent-color)'
              }}>
                {n.title.includes('Assigned') ? '📂' : '✨'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '1rem', 
                    fontWeight: n.is_read ? 500 : 700, 
                    color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {n.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7, whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ 
                  margin: 0, 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.9rem',
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  opacity: n.is_read ? 0.6 : 0.9
                }}>
                  {n.message}
                </p>
              </div>

              <div className="item-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {n.link && (
                  <Link href={n.link} onClick={() => markAsRead(n.id)}>
                    <button style={{ 
                      padding: '0.5rem 1rem', 
                      fontSize: '0.75rem', 
                      background: 'var(--accent-color)', 
                      borderRadius: '8px',
                      height: '34px'
                    }}>View</button>
                  </Link>
                )}
                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)} 
                    title="Mark as read"
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      padding: '0',
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    ✓
                  </button>
                )}
                <button 
                  onClick={() => deleteNotification(n.id)} 
                  title="Delete"
                  style={{ 
                    background: 'transparent', 
                    padding: '0',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    color: 'var(--danger)',
                    borderRadius: '8px',
                    opacity: 0.6
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          border-top-color: var(--accent-color);
          animation: spin 1s linear infinite;
        }
        .inbox-item:hover {
          background: rgba(255,255,255,0.02) !important;
        }
        .item-actions {
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.2s ease;
        }
        .inbox-item:hover .item-actions {
          opacity: 1;
          transform: translateX(0);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
