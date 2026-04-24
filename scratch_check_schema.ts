
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gevzmylvzreglbetchuy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdldnpteWx2enJlZ2xiZXRjaHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTgwNzAsImV4cCI6MjA5MTk5NDA3MH0.Jmq9Be7ivIU6riV8LxN4eAUXIUK0xgpqaXqcnz0ESVU';

async function testJoin() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('Testing join query...');
  // Try joining with admins
  const { data, error } = await supabase
    .from('messages')
    .select('*, admins(name)')
    .limit(1);

  if (error) {
    console.error('Error joining with admins:', error.message);
  } else {
    console.log('Successfully joined with admins!');
  }

  // Try joining with students
  const { data: sData, error: sError } = await supabase
    .from('messages')
    .select('*, students(name)')
    .limit(1);

  if (sError) {
    console.error('Error joining with students:', sError.message);
  } else {
    console.log('Successfully joined with students!');
  }
}

testJoin();
