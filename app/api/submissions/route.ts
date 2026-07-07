import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/submissions?status=cho_duyet — danh sách theo trạng thái
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  let q = db.from('mos_submissions').select('*').order('created_at', { ascending: false }).limit(100);
  if (status) q = q.in('status', status.split(','));
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/submissions — cập nhật trạng thái (duyệt cuối / đánh dấu đã đăng)
export async function PATCH(req: NextRequest) {
  const { id, status, final_reviewer, final_note, published_url } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ error: 'Thiếu id hoặc status' }, { status: 400 });
  }
  const { error } = await db
    .from('mos_submissions')
    .update({
      status,
      final_reviewer: final_reviewer ?? null,
      final_note: final_note ?? null,
      published_url: published_url ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
