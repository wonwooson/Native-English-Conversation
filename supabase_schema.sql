-- Run this entire script in your Supabase SQL Editor

-- 1. Create lessons table for saving generated content
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  topic TEXT NOT NULL,
  situation TEXT NOT NULL,
  dialogue JSONB NOT NULL,
  key_expressions JSONB NOT NULL,
  opic_script TEXT NOT NULL,
  vocabulary JSONB NOT NULL,
  speaking_guide JSONB, -- Added column to store analyzed coaching data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create qa_history table for saved Contextual Q&A
CREATE TABLE IF NOT EXISTS public.qa_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_history ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for lessons
CREATE POLICY "Users can insert their own lessons."
  ON public.lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own lessons."
  ON public.lessons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lessons."
  ON public.lessons FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create Policies for qa_history
CREATE POLICY "Users can insert their own QA."
  ON public.qa_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own QA."
  ON public.qa_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own QA."
  ON public.qa_history FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Important: Enable realtime for lessons to sync across devices seamlessly
alter publication supabase_realtime add table public.lessons;
alter publication supabase_realtime add table public.qa_history;
