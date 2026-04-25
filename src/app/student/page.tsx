'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUI } from '@/components/UIProvider';

export default function StudentLogin() {
  const router = useRouter();
  const { showToast } = useUI();
  const [email, setEmail] = useState('');
  const [accessKey, setAccessKey] = useState('');
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
    if (!email) return;

    setLoading(true);
    try {
      // Check if student exists in the system (assigned by admin)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('access_key', accessKey.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Double check if email exists but key is wrong to give better error
        const { data: emailExists } = await supabase
          .from('students')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        
        if (emailExists) {
          showToast('Invalid access key. Please check and try again.', 'error');
        } else {
          showToast('This email is not registered. Please contact your admin.', 'error');
        }
        setLoading(false);
        return;
      }

      // Store in localStorage for session
      localStorage.setItem('student_email', email.trim().toLowerCase());
      localStorage.setItem('student_name', data.name || 'Student'); 
      
      // Load and apply preferred theme from server
      if (data.preferred_theme) {
        localStorage.setItem('theme-preference', data.preferred_theme);
        // Dispatch event to notify UIProvider to refresh if it's already mounted
        window.dispatchEvent(new Event('storage'));
      }
      
      showToast(`Welcome back, ${data.name || 'Student'}!`, 'success');
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email Address</label>
            <input 
              required
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Access Key (4-digit)</label>
            <input 
              required
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter your 4-digit key"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.2rem' }}
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
