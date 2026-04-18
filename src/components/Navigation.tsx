'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Hide admin menus on student/interview routes
  const isStudentRoute = pathname?.startsWith('/student') || pathname?.startsWith('/interview');
  // Determine if we are IN an interview (not just on student portal)
  const isInsideInterview = pathname?.startsWith('/interview/');

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = !isStudentRoute ? (
    <>
      <Link href="/admin" style={{ fontSize: '0.9rem', color: pathname === '/admin' ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: pathname === '/admin' ? 700 : 500 }}>Dashboard</Link>
      <Link href="/admin/groups" style={{ fontSize: '0.9rem', color: pathname === '/admin/groups' ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: pathname === '/admin/groups' ? 700 : 500 }}>Groups</Link>
      <Link href="/admin/students" style={{ fontSize: '0.9rem', color: pathname === '/admin/students' ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: pathname === '/admin/students' ? 700 : 500 }}>Students</Link>
    </>
  ) : isInsideInterview ? (
    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Interview in Progress...</span>
  ) : (
    <Link href="/student/dashboard" style={{ fontSize: '0.9rem', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 700 }}>My Interviews</Link>
  );

  return (
    <nav style={{ 
      position: 'sticky', top: 0, zIndex: 1000,
      padding: '0.75rem 1.5rem', background: 'var(--glass-bg)', 
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
    }}>
      <Link href={isInsideInterview ? '#' : "/"} style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none', cursor: isInsideInterview ? 'default' : 'pointer', zIndex: 1001 }}>
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
      `}</style>
    </nav>
  );
}

