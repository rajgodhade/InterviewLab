'use client';

import { useState, useEffect } from 'react';

interface LiveMeetingProps {
  roomName: string;
  userName: string;
  onLeave?: () => void;
}

export default function LiveMeeting({ roomName, userName, onLeave }: LiveMeetingProps) {
  const [meetingWindow, setMeetingWindow] = useState<Window | null>(null);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [durationTracker, setDurationTracker] = useState(0);

  // Clean up and tracking
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    
    if (meetingWindow && isMeetingActive) {
      checkInterval = setInterval(() => {
        // Track duration (approximate)
        setDurationTracker(prev => prev + 1);

        // Check if user closed the window
        if (meetingWindow.closed) {
          setIsMeetingActive(false);
          setMeetingWindow(null);
          clearInterval(checkInterval);
        }
      }, 1000);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [meetingWindow, isMeetingActive]);

  const startMeeting = () => {
    const domain = 'meet.jit.si';
    const room = `InterviewLab-${roomName}`;
    const url = `https://${domain}/${room}#userInfo.displayName="${encodeURIComponent(userName)}"&config.prejoinPageEnabled=true`;
    
    // Open in a new popup window
    const width = 1024;
    const height = 768;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popup = window.open(url, 'InterviewLab_LiveMeeting', `width=${width},height=${height},left=${left},top=${top}`);
    
    if (popup) {
      setMeetingWindow(popup);
      setIsMeetingActive(true);
    } else {
      alert("Please allow popups to open the meeting window.");
    }
  };

  const endMeeting = () => {
    if (meetingWindow && !meetingWindow.closed) {
      meetingWindow.close();
    }
    setIsMeetingActive(false);
    setMeetingWindow(null);
    if (onLeave) onLeave();
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ 
      width: '100%', 
      height: 'calc(100vh - 200px)', 
      borderRadius: '24px', 
      border: '1px solid var(--glass-border)',
      boxShadow: 'var(--shadow-premium)',
      background: 'var(--glass-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        background: isMeetingActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        padding: '3rem',
        borderRadius: '24px',
        border: isMeetingActive ? '2px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {isMeetingActive ? '📹' : '🎥'}
        </div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          {isMeetingActive ? 'Meeting in Progress' : 'Live Video Meeting'}
        </h3>
        
        {isMeetingActive ? (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Your meeting is currently open in a separate window to ensure the highest quality and prevent timeouts.
            </p>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', marginBottom: '2rem' }}>
              {formatDuration(durationTracker)}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  if (meetingWindow && !meetingWindow.closed) {
                    meetingWindow.focus();
                  }
                }}
                style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)' }}
              >
                Focus Window
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Click the button below to launch your secure video session. The meeting will open in a new window.
            </p>
            <button 
              onClick={startMeeting}
              style={{ background: 'var(--accent-gradient)', padding: '1rem 2rem', fontSize: '1.1rem', width: '100%' }}
            >
              Launch Meeting Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
