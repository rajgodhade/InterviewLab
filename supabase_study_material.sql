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

-- 3. Create Study Material Folders Table
CREATE TABLE IF NOT EXISTS study_material_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES study_material_folders(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Study Material Folder Assignments Table
CREATE TABLE IF NOT EXISTS study_material_folder_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID REFERENCES study_material_folders(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT one_target_folder CHECK (
    (student_id IS NOT NULL AND group_id IS NULL) OR
    (student_id IS NULL AND group_id IS NOT NULL)
  )
);

-- 5. Add folder_id to study_materials to support folder organization
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES study_material_folders(id) ON DELETE CASCADE;

-- 6. Disable RLS for MVP
ALTER TABLE study_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_material_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_material_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_material_folder_assignments DISABLE ROW LEVEL SECURITY;
