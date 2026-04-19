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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📩</div>
          <h3>Your inbox is empty</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Notifications about your interviews will appear here.</p>
          <Link href="/student/dashboard" style={{ marginTop: '1.5rem' }}>
            <button style={{ background: 'var(--accent-gradient)' }}>Go to Dashboard</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className="card" 
              style={{ 
                padding: '1.5rem', 
                borderLeft: n.is_read ? '1px solid var(--border-color)' : '4px solid var(--accent-color)',
                background: n.is_read ? 'var(--glass-bg)' : 'rgba(59, 130, 246, 0.05)',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'flex-start',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '1.5rem', background: 'var(--bg-accent)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {n.title.includes('Assigned') ? '📝' : '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: n.is_read ? 'var(--text-primary)' : 'var(--accent-color)' }}>{n.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {n.link && (
                    <Link href={n.link} onClick={() => markAsRead(n.id)}>
                      <button style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--accent-gradient)' }}>View Details</button>
                    </Link>
                  )}
                  {!n.is_read && (
                    <button onClick={() => markAsRead(n.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--bg-accent)' }}>Mark as Read</button>
                  )}
                  <button onClick={() => deleteNotification(n.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'transparent', color: 'var(--danger)', border: 'none' }}>Delete</button>
                </div>
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
