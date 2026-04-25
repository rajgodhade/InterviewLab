'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUI } from '@/components/UIProvider';
import { useRouter } from 'next/navigation';

export default function PlatformSettings() {
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [settings, setSettings] = useState({
    id: '',
    platform_name: 'InterviewLab',
    logo_url: '/logo.png',
    primary_color: '#3b82f6',
    secondary_color: '#8b5cf6',
    bg_primary: '#0a0f1d',
    bg_secondary: '#161e31',
    text_primary: '#f8fafc',
    text_secondary: '#94a3b8',
    light_bg_primary: '#f8fafc',
    light_bg_secondary: '#ffffff',
    light_text_primary: '#0f172a',
    light_text_secondary: '#64748b',
    light_primary_color: '#3b82f6',
    light_secondary_color: '#8b5cf6',
    default_theme_mode: 'dark',
    company_website: '',
    contact_phone: '',
    support_email: '',
    timezone: 'UTC',
    allow_student_registration: true,
    enable_ai_proctoring: false,
    max_students_per_batch: 50
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is 0 rows returned
        throw error;
      }
      
      if (data) {
        setSettings(data);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const { id, updated_at, ...updateData } = settings as any;
      
      let res;
      if (id) {
        res = await supabase
          .from('platform_settings')
          .update(updateData)
          .eq('id', id);
      } else {
        res = await supabase
          .from('platform_settings')
          .insert([updateData]);
      }
      
      if (res.error) throw res.error;
      
      showToast('Settings saved successfully', 'success');
      fetchSettings(); // Refresh to get any updated metadata like id
      router.refresh(); // Force Next.js to re-evaluate the layout and UIProvider
      
      // Also manually update the UIProvider's injected style by dispatching a custom event
      window.dispatchEvent(new Event('platform_settings_updated'));
    } catch (err: any) {
      console.error('Error saving settings:', err);
      showToast('Failed to save settings: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({...settings, logo_url: reader.result as string});
      };
      reader.readAsDataURL(file);
    } else {
      showToast('Please upload a valid image file.', 'error');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  if (loading) return <div className="container"><p>Loading settings...</p></div>;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ margin: 0 }}>Global Platform Settings</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Configure core behaviors and branding for your platform.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Branding & Theme Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Branding & Theme</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Platform Name</label>
              <input 
                type="text" 
                value={settings.platform_name || ''}
                onChange={(e) => setSettings({...settings, platform_name: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                required
              />
              <small style={{ color: 'var(--text-secondary)' }}>The main title displayed in the navigation bar and emails.</small>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Default Theme Mode</label>
              <select 
                value={settings.default_theme_mode || 'dark'}
                onChange={(e) => setSettings({...settings, default_theme_mode: e.target.value})}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="dark">Dark Mode (Default)</option>
                <option value="light">Light Mode</option>
              </select>
              <small style={{ color: 'var(--text-secondary)' }}>Choose the default look for new users and visitors.</small>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Dark Mode Palette</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Primary Accent Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.primary_color || '#3b82f6'}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.primary_color || '#3b82f6'}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      placeholder="#3b82f6"
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Secondary Color (Button Gradient)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.secondary_color || '#8b5cf6'}
                      onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.secondary_color || '#8b5cf6'}
                      onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                      placeholder="#8b5cf6"
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Background Primary</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.bg_primary || '#0a0f1d'}
                      onChange={(e) => setSettings({...settings, bg_primary: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.bg_primary || '#0a0f1d'}
                      onChange={(e) => setSettings({...settings, bg_primary: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Background Secondary</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.bg_secondary || '#161e31'}
                      onChange={(e) => setSettings({...settings, bg_secondary: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.bg_secondary || '#161e31'}
                      onChange={(e) => setSettings({...settings, bg_secondary: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Text Primary</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.text_primary || '#f8fafc'}
                      onChange={(e) => setSettings({...settings, text_primary: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.text_primary || '#f8fafc'}
                      onChange={(e) => setSettings({...settings, text_primary: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Text Secondary</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.text_secondary || '#94a3b8'}
                      onChange={(e) => setSettings({...settings, text_secondary: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.text_secondary || '#94a3b8'}
                      onChange={(e) => setSettings({...settings, text_secondary: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Light Mode Palette</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Light Primary Accent</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.light_primary_color || '#3b82f6'}
                      onChange={(e) => setSettings({...settings, light_primary_color: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.light_primary_color || '#3b82f6'}
                      onChange={(e) => setSettings({...settings, light_primary_color: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Light Secondary (Button Gradient)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.light_secondary_color || '#8b5cf6'}
                      onChange={(e) => setSettings({...settings, light_secondary_color: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.light_secondary_color || '#8b5cf6'}
                      onChange={(e) => setSettings({...settings, light_secondary_color: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Light Background Primary</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.light_bg_primary || '#f8fafc'}
                      onChange={(e) => setSettings({...settings, light_bg_primary: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.light_bg_primary || '#f8fafc'}
                      onChange={(e) => setSettings({...settings, light_bg_primary: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Light Background Secondary</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.light_bg_secondary || '#ffffff'}
                      onChange={(e) => setSettings({...settings, light_bg_secondary: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.light_bg_secondary || '#ffffff'}
                      onChange={(e) => setSettings({...settings, light_bg_secondary: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Light Text Primary</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.light_text_primary || '#0f172a'}
                      onChange={(e) => setSettings({...settings, light_text_primary: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.light_text_primary || '#0f172a'}
                      onChange={(e) => setSettings({...settings, light_text_primary: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontWeight: 600 }}>Light Text Secondary</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="color" 
                      value={settings.light_text_secondary || '#64748b'}
                      onChange={(e) => setSettings({...settings, light_text_secondary: e.target.value})}
                      style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      value={settings.light_text_secondary || '#64748b'}
                      onChange={(e) => setSettings({...settings, light_text_secondary: e.target.value})}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', flex: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Platform Logo</label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  border: `2px dashed ${isDragging ? 'var(--accent-color)' : 'var(--border-color)'}`,
                  background: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0])} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                
                {settings.logo_url && settings.logo_url !== '' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={settings.logo_url} alt="Logo Preview" style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', borderRadius: '8px' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600 }}>Click or drag to replace image</span>
                  </div>
                ) : (
                  <>
                    <span className="material-icons-round" style={{ fontSize: '3rem', color: 'var(--text-secondary)' }}>cloud_upload</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Drag and drop an image here</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>or click to browse from your computer</p>
                    </div>
                  </>
                )}
              </div>
              <small style={{ color: 'var(--text-secondary)' }}>Recommended format: PNG or SVG with transparent background.</small>
            </div>
          </div>

          {/* Platform Defaults Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Platform Defaults</h3>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                <label style={{ fontWeight: 600 }}>Default Timezone</label>
                <select 
                  value={settings.timezone || 'UTC'}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                <label style={{ fontWeight: 600 }}>Max Students per Batch</label>
                <input 
                  type="number" 
                  min="1"
                  value={settings.max_students_per_batch || 50}
                  onChange={(e) => setSettings({...settings, max_students_per_batch: parseInt(e.target.value)})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                <input 
                  type="checkbox" 
                  id="allow_registration"
                  checked={settings.allow_student_registration}
                  onChange={(e) => setSettings({...settings, allow_student_registration: e.target.checked})}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="allow_registration" style={{ fontWeight: 600, cursor: 'pointer' }}>Allow Student Registration</label>
                  <small style={{ color: 'var(--text-secondary)' }}>If disabled, only admins can create student accounts manually.</small>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                <input 
                  type="checkbox" 
                  id="enable_ai_proctoring"
                  checked={settings.enable_ai_proctoring}
                  onChange={(e) => setSettings({...settings, enable_ai_proctoring: e.target.checked})}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="enable_ai_proctoring" style={{ fontWeight: 600, cursor: 'pointer' }}>Enable AI Proctoring by Default</label>
                  <small style={{ color: 'var(--text-secondary)' }}>Automatically toggle AI proctoring on for new interviews.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Contact Information</h3>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                <label style={{ fontWeight: 600 }}>Support Email</label>
                <input 
                  type="email" 
                  value={settings.support_email || ''}
                  onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                <label style={{ fontWeight: 600 }}>Contact Phone</label>
                <input 
                  type="tel" 
                  value={settings.contact_phone || ''}
                  onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Company Website</label>
              <input 
                type="url" 
                value={settings.company_website || ''}
                onChange={(e) => setSettings({...settings, company_website: e.target.value})}
                placeholder="https://example.com"
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                background: 'var(--accent-gradient)', 
                color: '#fff', 
                padding: '0.75rem 2rem', 
                borderRadius: '8px', 
                border: 'none', 
                fontWeight: 'bold',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
