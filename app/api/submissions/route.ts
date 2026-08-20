import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/submissions?status=cho_duyet — danh sách theo trạng thái
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  const id = req.nextUrl.searchParams.get('id'); // lấy 1 bản (dùng cho diff bản gốc ↔ bản sửa)
  let q = db.from('mos_submissions').select('*').order('created_at', { ascending: false }).limit(100);
  if (id) q = q.in('id', id.split(','));
  else if (status) q = q.in('status', status.split(','));
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/submissions — cập nhật trạng thái (duyệt cuối / đánh dấu đã đăng)
export async function PATCH(req: NextRequest) {
  const { id, status, final_reviewer, final_note, published_url, override_requested } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: 'Thiếu id hoặc status' }, { status: 400 });
  }
  const patch: Record<string, unknown> = {
    status,
    final_reviewer: final_reviewer ?? null,
    final_note: final_note ?? null,
    published_url: published_url ?? null,
    updated_at: new Date().toISOString(),
  };
  // Director xin ngoại lệ cho bài FAIL — luật chặn (fact sai / legal CRITICAL) do Quality Gate quyết,
  // ở đây chỉ ghi lại lý do. Cột có thể chưa tồn tại nếu chưa chạy supabase-setup-4.sql → bỏ qua.
  if (override_requested) patch.override_requested = override_requested;
  const { error } = await db.from('mos_submissions').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
