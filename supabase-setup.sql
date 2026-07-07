-- MOS Đại Việt — chạy 1 lần trong Supabase SQL Editor
-- Bảng riêng tiền tố mos_, không đụng dữ liệu hiện có

create table if not exists mos_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content text not null,
  channel text,
  brand text,
  writer text not null,
  score int,
  decision text,              -- PASS | MINOR_FIX | MAJOR_FIX | REWRITE
  review jsonb,               -- full kết quả AI (red_flags, breakdown, edits...)
  status text not null default 'cho_duyet',  -- cho_duyet | can_sua | da_duyet | da_dang
  final_reviewer text,        -- người duyệt cuối
  final_note text,
  published_url text
);

create index if not exists mos_submissions_status_idx on mos_submissions (status, created_at desc);
create index if not exists mos_submissions_writer_idx on mos_submissions (writer);

-- RLS: bật + cho phép anon (app chỉ gọi từ server, key không lộ ra trình duyệt)
alter table mos_submissions enable row level security;
drop policy if exists "mos_anon_all" on mos_submissions;
create policy "mos_anon_all" on mos_submissions for all to anon using (true) with check (true);
