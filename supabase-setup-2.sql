-- MOS Đại Việt — BƯỚC 2: bảng ghi chú sản phẩm theo thời gian
-- Chạy trong Supabase SQL Editor (giống lần trước)

create table if not exists mos_product_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product text not null,          -- VD: "Makano MN205" hoặc "DC101"
  brand text,
  note_type text not null,        -- doi_gia | ngung_ban | claim_moi | khuyen_mai | luu_y
  note text not null,
  effective_from date,
  effective_to date,
  warn_on_review boolean not null default true,  -- cảnh báo khi duyệt bài nhắc tới sản phẩm này
  created_by text
);

create index if not exists mos_product_notes_product_idx on mos_product_notes (product);

alter table mos_product_notes enable row level security;
drop policy if exists "mos_notes_anon_all" on mos_product_notes;
create policy "mos_notes_anon_all" on mos_product_notes for all to anon using (true) with check (true);
