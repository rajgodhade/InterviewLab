-- Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: You should add your email to this table to access the admin dashboard:
-- INSERT INTO admins (email) VALUES ('your-email@example.com');

-- Enable RLS on admins table (optional, but good practice)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read for admins" ON admins FOR SELECT USING (true);
