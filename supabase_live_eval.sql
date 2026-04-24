-- Add columns for live interview tracking and manual admin evaluation
ALTER TABLE interview_assignments ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER;
ALTER TABLE interview_assignments ADD COLUMN IF NOT EXISTS pass_status TEXT CHECK (pass_status IN ('pass', 'fail'));
ALTER TABLE interview_assignments ADD COLUMN IF NOT EXISTS admin_feedback TEXT;
