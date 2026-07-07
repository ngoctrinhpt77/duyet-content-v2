import { createClient } from '@supabase/supabase-js';

// Server-side only — key không bao giờ xuống trình duyệt
export const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export type Submission = {
  id: string;
  created_at: string;
  content: string;
  channel: string | null;
  brand: string | null;
  writer: string;
  score: number | null;
  decision: string | null;
  review: Record<string, unknown> | null;
  status: 'cho_duyet' | 'can_sua' | 'da_duyet' | 'da_dang';
  final_reviewer: string | null;
  final_note: string | null;
  published_url: string | null;
};
