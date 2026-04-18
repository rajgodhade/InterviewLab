'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function StudentLogin() {
  const router = useRouter();
  const { showToast } = useUI();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const savedEmail = localStorage.getItem('student_email');
    if (savedEmail) {
      router.push('/student/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setLoading(true);
    try {
      // Check if student exists in the system (assigned by admin)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        showToast('This email is not registered for any interviews. Please contact your admin.', 'error');
        setLoading(false);
        return;
      }

      // Store in localStorage for session
      localStorage.setItem('student_email', email.trim().toLowerCase());
      localStorage.setItem('student_name', data.name || name); // Use database name if available
      
      showToast(`Welcome back, ${data.name || name}!`, 'success');
      router.push('/student/dashboard');
    } catch (err: any) {
      console.error(err);
      showToast('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex-center" style={{ minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Student Portal</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Full Name</label>
            <input 
              required
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
            <input 
              required
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: '1rem', background: loading ? 'var(--bg-accent)' : 'var(--accent-color)' }}>
            {loading ? 'Verifying...' : 'Enter Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
