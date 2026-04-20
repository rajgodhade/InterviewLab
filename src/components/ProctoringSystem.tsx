'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { supabase } from '@/lib/supabase';
import { useUI } from './UIProvider';

interface ProctoringSystemProps {
  assignmentId: string;
  isOffline?: boolean;
  isSubmitted?: boolean;
}

const ProctoringSystem: React.FC<ProctoringSystemProps> = ({ assignmentId, isOffline, isSubmitted }) => {
  const { showToast } = useUI();
  const videoRef = useRef<HTMLVideoElement>(null);
  const modelRef = useRef<any>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [faceMissingCount, setFaceMissingCount] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Tab Switching Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);
        showToast('WARNING: Tab switching detected. This incident has been logged.', 'warning');
        
        if (!isOffline) {
          // Note: This requires 'tab_switches_count' column in interview_assignments table
          supabase.from('interview_assignments')
            .update({ tab_switches_count: newCount })
            .eq('id', assignmentId)
            .then(({ error }) => {
               // Silence error to prevent console noise if column is missing
               if (error) console.warn('Proctoring log skipped: tab_switches_count column may be missing in database.');
            });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [assignmentId, isOffline, showToast, tabSwitches]);

  // Webcam & Face Detection
  useEffect(() => {
    let interval: any;

    async function setupProctoring() {
      try {
        // 1. Load Model
        await tf.ready();
        modelRef.current = await blazeface.load();
        
        // 2. Setup Webcam
        const userStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240 } 
        });
        setStream(userStream);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }

        // 3. Periodic Detection
        interval = setInterval(async () => {
          if (modelRef.current && videoRef.current) {
            const predictions = await modelRef.current.estimateFaces(videoRef.current, false);
            
            if (predictions.length === 0) {
              setIsFaceDetected(false);
              setFaceMissingCount(prev => {
                const newCount = prev + 1;
                if (!isOffline) {
                  // Note: This requires 'face_missing_count' column in interview_assignments table
                  supabase.from('interview_assignments')
                    .update({ face_missing_count: newCount })
                    .eq('id', assignmentId)
                    .then(({ error }) => {
                       if (error) console.warn('Proctoring log skipped: face_missing_count column may be missing in database.');
                    });
                }
                return newCount;
              });
              showToast('PROCTORING ALERT: No face detected. Please stay in front of the camera.', 'error');
            } else if (predictions.length > 1) {
              showToast('PROCTORING ALERT: Multiple people detected.', 'error');
            } else {
              setIsFaceDetected(true);
            }
          }
        }, 15000); // Check every 15 seconds

      } catch (err) {
        console.error('Proctoring setup failed:', err);
        showToast('Camera access is required for proctoring.', 'error');
        
        // Log camera denial to database
        if (!isOffline) {
          supabase.from('interview_assignments')
            .update({ camera_access_denied: true })
            .eq('id', assignmentId)
            .then(({ error }) => {
               if (error) console.warn('Proctoring log skipped: camera_access_denied column may be missing.');
            });
        }
      }
    }

    setupProctoring();

    return () => {
      if (interval) clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Cleanup webcam when submitted
  useEffect(() => {
    if (isSubmitted && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [isSubmitted, stream]);

  if (isSubmitted || isOffline) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      width: '140px',
      height: '105px',
      borderRadius: '16px',
      overflow: 'hidden',
      border: `3px solid ${isFaceDetected ? 'var(--border-color)' : 'var(--danger)'}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      zIndex: 1000,
      background: '#000',
      transition: 'all 0.3s ease'
    }}>
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
      />
      {!isFaceDetected && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(239, 68, 68, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center', padding: '0.5rem',
          backdropFilter: 'blur(2px)'
        }}>
          FACE MISSING
        </div>
      )}
      <div style={{
        position: 'absolute',
        top: '0.5rem',
        left: '0.5rem',
        background: 'rgba(0,0,0,0.5)',
        padding: '0.1rem 0.4rem',
        borderRadius: '4px',
        fontSize: '0.6rem',
        color: '#fff',
        fontWeight: 600
      }}>
        LIVE PROCTOR
      </div>
    </div>
  );
};

export default ProctoringSystem;
