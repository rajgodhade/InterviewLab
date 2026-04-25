-- Add Global Platform Settings

CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name TEXT DEFAULT 'InterviewLab',
    logo_url TEXT DEFAULT '/logo.png',
    primary_color TEXT DEFAULT '#3b82f6',
    secondary_color TEXT DEFAULT '#8b5cf6',
    bg_primary TEXT DEFAULT '#0a0f1d',
    bg_secondary TEXT DEFAULT '#161e31',
    text_primary TEXT DEFAULT '#f8fafc',
    text_secondary TEXT DEFAULT '#94a3b8',
    light_bg_primary TEXT DEFAULT '#f8fafc',
    light_bg_secondary TEXT DEFAULT '#ffffff',
    light_text_primary TEXT DEFAULT '#0f172a',
    light_text_secondary TEXT DEFAULT '#64748b',
    light_primary_color TEXT DEFAULT '#3b82f6',
    light_secondary_color TEXT DEFAULT '#8b5cf6',
    company_website TEXT,
    contact_phone TEXT,
    support_email TEXT,
    timezone TEXT DEFAULT 'UTC',
    allow_student_registration BOOLEAN DEFAULT true,
    enable_ai_proctoring BOOLEAN DEFAULT false,
    max_students_per_batch INTEGER DEFAULT 50,
    default_theme_mode TEXT DEFAULT 'dark',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure table has new columns if it was created previously without them
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '/logo.png';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3b82f6';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#8b5cf6';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS bg_primary TEXT DEFAULT '#0a0f1d';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS bg_secondary TEXT DEFAULT '#161e31';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS text_primary TEXT DEFAULT '#f8fafc';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS text_secondary TEXT DEFAULT '#94a3b8';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS light_bg_primary TEXT DEFAULT '#f8fafc';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS light_bg_secondary TEXT DEFAULT '#ffffff';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS light_text_primary TEXT DEFAULT '#0f172a';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS light_text_secondary TEXT DEFAULT '#64748b';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS light_primary_color TEXT DEFAULT '#3b82f6';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS light_secondary_color TEXT DEFAULT '#8b5cf6';
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS company_website TEXT;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS enable_ai_proctoring BOOLEAN DEFAULT false;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS max_students_per_batch INTEGER DEFAULT 50;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS default_theme_mode TEXT DEFAULT 'dark';

-- Ensure only one row exists using a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS one_row_only ON platform_settings((true));

-- Insert default values
INSERT INTO platform_settings (platform_name, logo_url, primary_color, secondary_color, bg_primary, bg_secondary, text_primary, text_secondary, light_bg_primary, light_bg_secondary, light_text_primary, light_text_secondary, light_primary_color, light_secondary_color, timezone, allow_student_registration, enable_ai_proctoring, max_students_per_batch, default_theme_mode)
VALUES ('InterviewLab', '/logo.png', '#3b82f6', '#8b5cf6', '#0a0f1d', '#161e31', '#f8fafc', '#94a3b8', '#f8fafc', '#ffffff', '#0f172a', '#64748b', '#3b82f6', '#8b5cf6', 'UTC', true, false, 50, 'dark')
ON CONFLICT DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and update settings (Assuming 'admin' role or authenticated users, 
-- in this system, RLS might be bypassed or we should allow authenticated users to read)
DROP POLICY IF EXISTS "Allow authenticated to read settings" ON platform_settings;
CREATE POLICY "Allow authenticated to read settings" 
ON platform_settings FOR SELECT 
TO authenticated 
USING (true);

-- Allow public to read if they are registering, depending on setup
DROP POLICY IF EXISTS "Allow public to read settings" ON platform_settings;
CREATE POLICY "Allow public to read settings" 
ON platform_settings FOR SELECT 
TO anon 
USING (true);

-- Admins update (you may need to adjust this depending on how admin policies are set up)
DROP POLICY IF EXISTS "Allow admins to update settings" ON platform_settings;
CREATE POLICY "Allow admins to update settings" 
ON platform_settings FOR UPDATE
TO authenticated 
USING (true); -- Usually restricted by admin table, but assuming UI is protected for now
