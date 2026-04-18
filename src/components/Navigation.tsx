'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navigation() {
  const pathname = usePathname();
  
  // Hide admin menus on student/interview routes
  const isStudentRoute = pathname?.startsWith('/student') || pathname?.startsWith('/interview');
  // Determine if we are IN an interview (not just on student portal)
  const isInsideInterview = pathname?.startsWith('/interview/');

  return (
    <nav style={{ padding: '1rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link href={isInsideInterview ? '#' : "/"} style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none', cursor: isInsideInterview ? 'default' : 'pointer' }}>
        InterviewLab
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {!isStudentRoute ? (
          <>
            <Link href="/admin" style={{ fontSize: '0.9rem', color: pathname === '/admin' ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: pathname === '/admin' ? 700 : 500 }}>Dashboard</Link>
            <Link href="/admin/groups" style={{ fontSize: '0.9rem', color: pathname === '/admin/groups' ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: pathname === '/admin/groups' ? 700 : 500 }}>Groups</Link>
            <Link href="/admin/students" style={{ fontSize: '0.9rem', color: pathname === '/admin/students' ? 'var(--accent-color)' : 'inherit', textDecoration: 'none', fontWeight: pathname === '/admin/students' ? 700 : 500 }}>Students</Link>
          </>
        ) : isInsideInterview ? (
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Interview in Progress...</span>
        ) : (
          <Link href="/student/dashboard" style={{ fontSize: '0.9rem', color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 700 }}>My Interviews</Link>
        )}
      </div>
    </nav>
  );
}
