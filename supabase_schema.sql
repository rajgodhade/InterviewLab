-- Copy and paste this into the Supabase SQL Editor

-- 1. Create Interviews Table
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  technology TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('AI', 'Custom')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Questions Table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'short_answer' CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'long_answer')),
  options JSONB, -- for MCQ: ["Option A", "Option B", "Option C", "Option D"]
  expected_answer TEXT,
  order_index INTEGER DEFAULT 0
);

-- Run this if you already have the table and just need to add the new columns:
-- ALTER TABLE questions ADD COLUMN question_type TEXT NOT NULL DEFAULT 'short_answer' CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'long_answer'));
-- ALTER TABLE questions ADD COLUMN options JSONB;

-- 3. Create Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  photo_url TEXT
);

-- Run this to add photo_url to an existing students table:
-- ALTER TABLE students ADD COLUMN photo_url TEXT;

-- 4. Create Interview Assignments Table
CREATE TABLE interview_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  scheduled_date DATE,
  start_time TIME,
  duration INTEGER NOT NULL, -- in minutes
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending'
);

-- Run this to support Live Room tracking:
-- ALTER TABLE interview_assignments ADD COLUMN is_live BOOLEAN DEFAULT false;
-- ALTER TABLE interview_assignments ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE interview_assignments ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE interview_assignments ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;

-- 5. Create Responses Table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES interview_assignments(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  score INTEGER
);

-- 6. Create Groups Table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Group Members Table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(group_id, student_id)
);

-- 8. Disable Row Level Security (RLS) for MVP since we are not using authenticated users yet
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE interview_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- 9. Storage Policies (for 'avatars' bucket)
-- Run these in your Supabase SQL Editor to allow public uploads/views for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

