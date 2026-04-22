'use client';

import { useEffect, useRef, useState } from 'react';

interface LiveMeetingProps {
  roomName: string;
  userName: string;
  onLeave?: () => void;
}

export default function LiveMeeting({ roomName, userName, onLeave }: LiveMeetingProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  useEffect(() => {
    // Load Jitsi script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const domain = 'meet.ffmuc.net';
      const options = {
        roomName: `InterviewLab-${roomName}`,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: userName,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: true,
          enableWelcomePage: false,
        },
        interfaceConfigOverwrite: {
          INITIAL_TOOLBAR_TIMEOUT: 20000,
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'tileview', 'videobackgroundblur', 'help', 'mute-everyone',
            'security'
          ],
        },
      };

      const jitsiApi = new (window as any).JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = jitsiApi;

      jitsiApi.addEventListeners({
        readyToClose: () => {
          if (onLeave) onLeave();
        },
        videoConferenceLeft: () => {
          if (onLeave) onLeave();
        }
      });
    };

    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.executeCommand('hangup');
          jitsiApiRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi:', e);
        }
      }
      // Aggressive track stopping to ensure camera turns off
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
          }).catch(() => {});
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [roomName, userName]);

  return (
    <div 
      ref={jitsiContainerRef} 
      style={{ 
        width: '100%', 
        height: 'calc(100vh - 100px)', 
        borderRadius: '24px', 
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-premium)',
        background: '#000'
      }} 
    />
  );
}
