'use client';

import { useState, useRef, useEffect } from 'react';

const COMMON_EMOJIS = [
  '😀', '😂', '😍', '🤣', '😊', '🙏', '👍', '👎', '🔥', '💯', 
  '✨', '✅', '❌', '🚀', '💡', '📅', '📝', '💻', '🎓', '🎯', 
  '🏆', '👋', '🙌', '👏', '🤝', '💪', '🤔', '🧐', '👀', '⭐'
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.25rem',
          padding: '0.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: '0.2s',
          filter: isOpen ? 'grayscale(0)' : 'grayscale(100%)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        😀
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          marginBottom: '10px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.75rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '0.5rem',
          zIndex: 1000,
          width: 'max-content',
          animation: 'popIn 0.2s ease-out'
        }}>
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setIsOpen(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                padding: '0.25rem',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: '0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              {emoji}
            </button>
          ))}
          
          <style jsx>{`
            @keyframes popIn {
              from { opacity: 0; transform: scale(0.9) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
