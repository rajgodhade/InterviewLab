import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Interview = {
  id: string;
  title: string;
  technology: string;
  mode: 'AI' | 'Custom';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  created_at: string;
};

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'long_answer';

export type Question = {
  id: string;
  interview_id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[]; // for MCQ choices
  expected_answer?: string;
  order_index: number;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
};

export type Assignment = {
  id: string;
  interview_id: string;
  student_id: string;
  group_id?: string;
  scheduled_date: string;
  start_time: string;
  duration: number; // in minutes
  status: 'pending' | 'completed';
};

export type Response = {
  id: string;
  assignment_id: string;
  question_id: string;
  answer_text: string;
  score?: number;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  student_id: string;
};
