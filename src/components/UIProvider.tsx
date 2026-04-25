'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// ── Toast Types ──
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface UIContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}

let toastId = 0;

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [themeColors, setThemeColors] = useState<{
    primary_color?: string;
    secondary_color?: string;
    bg_primary?: string;
    bg_secondary?: string;
    text_primary?: string;
    text_secondary?: string;
    light_bg_primary?: string;
    light_bg_secondary?: string;
    light_text_primary?: string;
    light_text_secondary?: string;
    light_primary_color?: string;
    light_secondary_color?: string;
  } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setIsThemeLoaded(true);

    const fetchSettings = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('platform_settings').select('*').single();
        if (data) {
          setThemeColors({
            primary_color: data.primary_color,
            secondary_color: data.secondary_color,
            bg_primary: data.bg_primary,
            bg_secondary: data.bg_secondary,
            text_primary: data.text_primary,
            text_secondary: data.text_secondary,
            light_bg_primary: data.light_bg_primary,
            light_bg_secondary: data.light_bg_secondary,
            light_text_primary: data.light_text_primary,
            light_text_secondary: data.light_text_secondary,
            light_primary_color: data.light_primary_color,
            light_secondary_color: data.light_secondary_color
          });

          // Only use default if user hasn't explicitly set a preference
          if (!savedTheme && data.default_theme_mode) {
            setTheme(data.default_theme_mode as 'light' | 'dark');
          }
        }
      } catch (err) {
        console.error('Failed to load global theme:', err);
      }
    };
    
    fetchSettings();

    // Listen for custom event to refetch when settings are saved
    window.addEventListener('platform_settings_updated', fetchSettings);
    return () => window.removeEventListener('platform_settings_updated', fetchSettings);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // Only save to localStorage AFTER we've attempted to load the initial preference
    if (isThemeLoaded) {
      localStorage.setItem('theme-preference', theme);
    }
  }, [theme, isThemeLoaded]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Sync with server if student is logged in
    const email = localStorage.getItem('student_email');
    if (email) {
      try {
        const supabase = createClient();
        await supabase
          .from('students')
          .update({ preferred_theme: newTheme })
          .eq('email', email);
      } catch (err) {
        console.error('Failed to sync theme with server:', err);
      }
    }
  }, [theme]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({ options, resolve });
    });
  }, []);

  const handleConfirm = (value: boolean) => {
    confirm?.resolve(value);
    setConfirm(null);
  };

  const toastColors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', icon: '✓' },
    error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', icon: '✕' },
    warning: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', icon: '⚠' },
    info: { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', icon: 'ℹ' },
  };

  return (
    <UIContext.Provider value={{ showToast, showConfirm, theme, toggleTheme }}>
      {themeColors && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            ${theme === 'dark' && themeColors?.primary_color ? `--accent-color: ${themeColors.primary_color} !important;` : ''}
            ${theme === 'dark' && themeColors?.primary_color ? `--accent-gradient: linear-gradient(135deg, ${themeColors.primary_color} 0%, ${themeColors.secondary_color || themeColors.primary_color} 100%) !important;` : ''}
            ${theme === 'dark' && themeColors?.bg_primary ? `--bg-primary: ${themeColors.bg_primary} !important;` : ''}
            ${theme === 'dark' && themeColors?.bg_secondary ? `--bg-secondary: ${themeColors.bg_secondary} !important;` : ''}
            ${theme === 'dark' && themeColors?.text_primary ? `--text-primary: ${themeColors.text_primary} !important;` : ''}
            ${theme === 'dark' && themeColors?.text_secondary ? `--text-secondary: ${themeColors.text_secondary} !important;` : ''}
            
            ${theme === 'light' && themeColors?.light_primary_color ? `--accent-color: ${themeColors.light_primary_color} !important;` : ''}
            ${theme === 'light' && themeColors?.light_primary_color ? `--accent-gradient: linear-gradient(135deg, ${themeColors.light_primary_color} 0%, ${themeColors.light_secondary_color || themeColors.light_primary_color} 100%) !important;` : ''}
            ${theme === 'light' && themeColors?.light_bg_primary ? `--bg-primary: ${themeColors.light_bg_primary} !important;` : ''}
            ${theme === 'light' && themeColors?.light_bg_secondary ? `--bg-secondary: ${themeColors.light_bg_secondary} !important;` : ''}
            ${theme === 'light' && themeColors?.light_text_primary ? `--text-primary: ${themeColors.light_text_primary} !important;` : ''}
            ${theme === 'light' && themeColors?.light_text_secondary ? `--text-secondary: ${themeColors.light_text_secondary} !important;` : ''}
          }
        `}} />
      )}
      {children}

      {/* ── Toast Container ── */}
      <div style={{
        position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '400px',
      }}>
        {toasts.map((toast) => {
          const c = toastColors[toast.type];
          return (
            <div key={toast.id} style={{
              background: 'var(--bg-secondary)', border: `1px solid ${c.border}`,
              borderLeft: `4px solid ${c.border}`, borderRadius: '10px',
              padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease-out',
            }}>
              <span style={{
                width: '28px', height: '28px', borderRadius: '50%', background: c.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700, color: c.border, flexShrink: 0,
              }}>
                {c.icon}
              </span>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>
                {toast.message}
              </p>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                style={{
                  background: 'transparent', color: 'var(--text-secondary)', padding: '0.25rem',
                  fontSize: '1rem', lineHeight: 1, marginLeft: 'auto', flexShrink: 0,
                }}
              >✕</button>
            </div>
          );
        })}
      </div>

      {/* ── Confirm Modal ── */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }}
          onClick={() => handleConfirm(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              animation: 'scaleIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>{confirm.options.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
              {confirm.options.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleConfirm(false)}
                style={{ background: 'var(--bg-accent)', color: 'var(--text-primary)' }}
              >
                {confirm.options.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                style={{ background: confirm.options.danger ? 'var(--danger)' : 'var(--accent-color)' }}
              >
                {confirm.options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Animations ── */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </UIContext.Provider>
  );
}
