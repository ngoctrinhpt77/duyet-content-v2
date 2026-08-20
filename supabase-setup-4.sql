-- MOS Đại Việt — BƯỚC 4: AI Quality Gate (Phase 2)
-- An toàn với dữ liệu cũ: chỉ ADD COLUMN, tất cả nullable, không đổi/xoá cột nào.
-- Bài cũ giữ nguyên (gate_status = NULL → UI hiển thị "chưa qua Quality Gate").

alter table mos_submissions add column if not exists gate_status text;          -- PASS | WARN | FAIL
alter table mos_submissions add column if not exists gates jsonb;               -- {fact, journey, conversion, legal, generic}
alter table mos_submissions add column if not exists declared_journey text;     -- Awareness|Consideration|Conversion|Retention
alter table mos_submissions add column if not exists objective text;            -- Educate|Build Trust|Generate Leads|Drive Sales|Engagement|Retention
alter table mos_submissions add column if not exists audience text;             -- text tự do
alter table mos_submissions add column if not exists parent_id uuid;            -- bản trước (self-correction loop)
alter table mos_submissions add column if not exists version int not null default 1;
alter table mos_submissions add column if not exists escalation_reason text;    -- lý do cần Director
alter table mos_submissions add column if not exists override_requested text;   -- lý do xin ngoại lệ khi FAIL
alter table mos_submissions add column if not exists override_category text;    -- FACT_ERROR | WEAK_HOOK | ... (learning loop)
alter table mos_submissions add column if not exists original_decision text;    -- quyết định AI trước khi Director override

create index if not exists mos_submissions_gate_idx on mos_submissions (gate_status, created_at desc);
create index if not exists mos_submissions_parent_idx on mos_submissions (parent_id);
