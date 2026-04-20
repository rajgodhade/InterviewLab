'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Navigation() {
  const pathname = usePathname();
  const supabase = createClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Auth check for Admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Auth check for Student
  useEffect(() => {
    const checkStudent = () => {
      const email = typeof window !== 'undefined' ? localStorage.getItem('student_email') : null;
      setIsStudent(!!email);
    };
    checkStudent();

    window.addEventListener('storage', checkStudent);
    return () => window.removeEventListener('storage', checkStudent);
  }, [pathname]);

  // Hide admin menus on student/interview routes
  const isStudentRoute = pathname?.startsWith('/student') || pathname?.startsWith('/interview');
  const isAdminRoute = pathname?.startsWith('/admin');
  const isLoginRoute = pathname === '/login';
  // Determine if we are IN an interview (not just on student portal)
  const isInsideInterview = pathname?.startsWith('/interview/');

  // Fetch unread notifications and messages for students
  useEffect(() => {
    if (isStudentRoute && isStudent) {
      const email = localStorage.getItem('student_email');
      if (email) {
        fetchUnreadCount(email);
        fetchUnreadMessages(email);
        
        // Setup Realtime Subscription for notifications
        const notifChannel = supabase
          .channel('nav-notifications')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            () => fetchUnreadCount(email)
          )
          .subscribe();

        // Setup Realtime Subscription for messages
        const msgChannel = supabase
          .channel('nav-messages')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'messages' },
            () => fetchUnreadMessages(email)
          )
          .subscribe();

        return () => {
          supabase.removeChannel(notifChannel);
          supabase.removeChannel(msgChannel);
        };
      }
    }
  }, [isStudentRoute, isStudent, pathname]);

  // Fetch unread messages for admins
  useEffect(() => {
    if (isAdmin || isAdminRoute) {
      fetchAdminUnreadMessages();
      
      const channel = supabase
        .channel('admin-nav-messages')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          () => fetchAdminUnreadMessages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin, isAdminRoute, pathname]);

  const fetchUnreadCount = async (email: string) => {
    try {
      const { data: student } = await supabase.from('students').select('id').eq('email', email).single();
      if (!student) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchUnreadMessages = async (email: string) => {
    try {
      const { data: student } = await supabase.from('students').select('id').eq('email', email).single();
      if (!student) return;

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .eq('sender_role', 'admin')
        .eq('is_read', false);

      setUnreadMessages(count || 0);
    } catch (err) {
      console.error('Error fetching unread messages:', err);
    }
  };

  const fetchAdminUnreadMessages = async () => {
    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_role', 'student')
        .eq('is_read', false);

      setUnreadMessages(count || 0);
    } catch (err) {
      console.error('Error fetching admin unread messages:', err);
    }
  };

  let navLinks = null;

  if (isInsideInterview) {
    navLinks = <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Interview in Progress...</span>;
  } else if (isStudentRoute) {
    if (isStudent) {
      const isActive = (path: string) => pathname === path || (path !== '/' && pathname?.startsWith(path));
      navLinks = (
        <>
          <Link href="/student/dashboard" style={{ fontSize: '0.9rem', color: isActive('/student/dashboard') ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: isActive('/student/dashboard') ? 700 : 500 }}>My Interviews</Link>
          <Link href="/student/study-material" style={{ fontSize: '0.9rem', color: isActive('/student/study-material') ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: isActive('/student/study-material') ? 700 : 500 }}>Study Material</Link>
          <Link href="/student/leaderboard" style={{ fontSize: '0.9rem', color: isActive('/student/leaderboard') ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: isActive('/student/leaderboard') ? 700 : 500 }}>Leaderboard</Link>
          <Link href="/student/inbox" style={{ 
            fontSize: '0.9rem', 
            color: isActive('/student/inbox') ? 'var(--accent-color)' : 'inherit', 
            textDecoration: 'none', 
            fontWeight: isActive('/student/inbox') ? 700 : 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ 
                background: 'var(--accent-color)', 
                color: '#fff', 
                fontSize: '0.65rem', 
                padding: '0.1rem 0.4rem', 
                borderRadius: '10px', 
                fontWeight: 800,
                animation: 'pulse 2s infinite'
              }}>
                {unreadCount}
              </span>
            )}
          </Link>
          <Link href="/student/messages" style={{ 
            fontSize: '0.9rem', 
            color: isActive('/student/messages') ? 'var(--accent-color)' : 'inherit', 
            textDecoration: 'none', 
            fontWeight: isActive('/student/messages') ? 700 : 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            Messages
            {unreadMessages > 0 && (
              <span style={{ 
                background: '#ef4444', 
                color: '#fff', 
                fontSize: '0.65rem', 
                padding: '0.1rem 0.4rem', 
                borderRadius: '10px', 
                fontWeight: 800,
              }}>
                {unreadMessages}
              </span>
            )}
          </Link>
        </>
      );
    }
  } else if (!isLoginRoute) {
    // Admin or Home route
    if (isAdmin || isAdminRoute) {
      const isActive = (path: string) => {
        if (path === '/admin') return pathname === '/admin';
        return pathname?.startsWith(path);
      };
      navLinks = (
        <>
          <Link href="/admin" style={{ fontSize: '0.9rem', color: isActive('/admin') ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: isActive('/admin') ? 700 : 500 }}>Dashboard</Link>
          <Link href="/admin/batches" style={{ fontSize: '0.9rem', color: isActive('/admin/batches') ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: isActive('/admin/batches') ? 700 : 500 }}>Batches</Link>
          <Link href="/admin/students" style={{ fontSize: '0.9rem', color: isActive('/admin/students') ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: isActive('/admin/students') ? 700 : 500 }}>Students</Link>
          <Link href="/admin/study-material" style={{ fontSize: '0.9rem', color: isActive('/admin/study-material') ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: isActive('/admin/study-material') ? 700 : 500 }}>Study Material</Link>
          <Link href="/admin/monitor" style={{ fontSize: '0.9rem', color: isActive('/admin/monitor') ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: isActive('/admin/monitor') ? 700 : 500 }}>Monitor</Link>
          <Link href="/admin/leaderboard" style={{ fontSize: '0.9rem', color: isActive('/admin/leaderboard') ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: isActive('/admin/leaderboard') ? 700 : 500 }}>Leaderboard</Link>
          <Link href="/admin/messages" style={{ 
            fontSize: '0.9rem', 
            color: isActive('/admin/messages') ? 'var(--accent-color)' : 'inherit', 
            textDecoration: 'none', 
            fontWeight: isActive('/admin/messages') ? 700 : 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            Messages
            {unreadMessages > 0 && (
              <span style={{ 
                background: '#ef4444', 
                color: '#fff', 
                fontSize: '0.65rem', 
                padding: '0.1rem 0.4rem', 
                borderRadius: '10px', 
                fontWeight: 800,
              }}>
                {unreadMessages}
              </span>
            )}
          </Link>
        </>
      );
    }
  }

  return (
    <nav style={{ 
      position: 'sticky', top: 0, zIndex: 1000,
      padding: '0.75rem 1.5rem', background: 'var(--glass-bg)', 
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
    }}>
      <Link 
        href={isInsideInterview ? '#' : (isAdmin || isAdminRoute ? '/admin' : (isStudent || isStudentRoute ? '/student/dashboard' : '/'))} 
        style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none', cursor: isInsideInterview ? 'default' : 'pointer', zIndex: 1001 }}
      >
        Interview<span style={{ color: 'var(--accent-color)' }}>Lab</span>
      </Link>

      {/* Desktop Navigation */}
      <div className="flex-desktop" style={{ gap: '1.5rem', alignItems: 'center' }}>
        {navLinks}
      </div>

      {/* Mobile Menu Toggle */}
      {!isInsideInterview && (
        <button 
          className="mobile-flex"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ 
            background: 'none', border: 'none', color: 'var(--text-primary)', 
            fontSize: '1.5rem', padding: '0.5rem', zIndex: 1001, alignItems: 'center'
          }}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      )}


      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', 
          background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', gap: '2rem', zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', fontSize: '1.2rem' }}>
            {navLinks}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </nav>
  );
}

