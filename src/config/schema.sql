-- ==============================================================================
-- DocuMind AI - Supabase PostgreSQL Database Schema
-- Run this script in your Supabase SQL Editor
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  text_content TEXT NOT NULL,
  page_count INT DEFAULT 1,
  word_count INT DEFAULT 0,
  document_type TEXT DEFAULT 'General Document',
  confidence NUMERIC(5,2) DEFAULT 85.00,
  executive_summary TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  important_dates JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  entities JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  missing_information JSONB DEFAULT '[]'::jsonb,
  decisions JSONB DEFAULT '[]'::jsonb,
  source_references JSONB DEFAULT '[]'::jsonb,
  health_status JSONB DEFAULT '{"quality": "Good", "textStatus": "Available", "analysis": "Complete", "missingCount": 0}'::jsonb,
  processing_status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Document Action Items (Interactive Action Center)
CREATE TABLE IF NOT EXISTS public.document_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  deadline TEXT,
  relative_deadline TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  source_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Document Chats (Grounded Q&A History)
CREATE TABLE IF NOT EXISTS public.document_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  source_references JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_actions_doc_id ON public.document_actions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_actions_user_id ON public.document_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chats_doc_id ON public.document_chats(document_id);
