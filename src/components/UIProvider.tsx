'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

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
    <UIContext.Provider value={{ showToast, showConfirm }}>
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
