'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    // In v1, we just store name/email in localStorage for simple identity
    localStorage.setItem('student_email', email);
    localStorage.setItem('student_name', name);
    
    router.push('/student/dashboard');
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
          <button type="submit" style={{ marginTop: '1rem' }}>Enter Portal</button>
        </form>
      </div>
    </div>
  );
}
