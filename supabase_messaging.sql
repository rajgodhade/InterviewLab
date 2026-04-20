-- 12. Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  sender_role TEXT CHECK (sender_role IN ('admin', 'student')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for MVP (consistent with other tables)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
