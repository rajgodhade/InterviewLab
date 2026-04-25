-- SQL migration to add access_key to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS access_key TEXT NOT NULL DEFAULT '0000';
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
