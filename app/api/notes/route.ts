import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchLinkContent } from '@/lib/fetch-link';

export const dynamic = 'force-dynamic';

// GET /api/notes — toàn bộ ghi chú sản phẩm (mới nhất trước)
export async function GET() {
  const { data, error } = await db
    .from('mos_product_notes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/notes — thêm ghi chú
export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.product?.trim() || !b.note?.trim() || !b.note_type) {
    return NextResponse.json({ error: 'Thiếu sản phẩm / loại / nội dung ghi chú' }, { status: 400 });
  }
  // Nếu có link tài liệu → đọc nội dung ngay khi lưu (Google Docs/Sheets/Drive, web)
  let link_content: string | null = null;
  let link_status: string | undefined;
  const link = b.link?.trim() || null;
  if (link) {
    const fetched = await fetchLinkContent(link);
    link_content = fetched.content;
    link_status = fetched.content
      ? `Đã đọc ${fetched.content.length} ký tự từ tài liệu`
      : `Không đọc được nội dung: ${fetched.error}`;
  }

  const base = {
    product: b.product.trim(), brand: b.brand ?? null, note_type: b.note_type,
    note: b.note.trim(), effective_from: b.effective_from || null,
    effective_to: b.effective_to || null,
    warn_on_review: b.warn_on_review ?? true, created_by: b.created_by ?? null,
  };
  let { error } = await db.from('mos_product_notes').insert({ ...base, link, link_content });
  if (error && link && /link/.test(error.message)) {
    // Chưa chạy supabase-setup-3.sql (thiếu cột link) → lưu ghi chú không kèm link
    ({ error } = await db.from('mos_product_notes').insert(base));
    if (!error) link_status = 'Ghi chú đã lưu NHƯNG chưa lưu được link — chạy supabase-setup-3.sql rồi thêm lại.';
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, link_status });
}

// DELETE /api/notes?id=... — gỡ ghi chú
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });
  const { error } = await db.from('mos_product_notes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
