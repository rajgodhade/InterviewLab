-- 1. Create Study Materials Table
CREATE TABLE IF NOT EXISTS study_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'document' CHECK (type IN ('video', 'document', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Study Material Assignments Table
CREATE TABLE IF NOT EXISTS study_material_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT one_target CHECK (
    (student_id IS NOT NULL AND group_id IS NULL) OR
    (student_id IS NULL AND group_id IS NOT NULL)
  )
);

-- 3. Disable RLS for MVP
ALTER TABLE study_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_material_assignments DISABLE ROW LEVEL SECURITY;
