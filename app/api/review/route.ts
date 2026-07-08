import { NextRequest, NextResponse } from 'next/server';
import { MOS_SYSTEM_PROMPT } from '@/lib/mos-prompt';
import { db } from '@/lib/db';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(req: NextRequest) {
  const { content, channel, brand, writer } = await req.json();

  if (!content || content.trim().length < 20) {
    return NextResponse.json(
      { error: 'Nội dung quá ngắn — dán đầy đủ bài cần duyệt.' },
      { status: 400 }
    );
  }

  // Ghi chú sản phẩm khớp với bài (kèm nội dung tài liệu đính kèm) — nạp TRƯỚC khi chấm
  // để AI chấm theo thông tin mới nhất (giá mới, ngừng bán, claim cập nhật...)
  type MatchedNote = { product: string; note_type: string; note: string; link_content: string | null };
  let matched: MatchedNote[] = [];
  try {
    const { data: notes } = await db
      .from('mos_product_notes')
      .select('product, note_type, note, effective_to, warn_on_review, link_content')
      .eq('warn_on_review', true);
    const today = new Date().toISOString().slice(0, 10);
    // Chuẩn hóa NFC + bỏ dấu để khớp bền vững (tiếng Việt từ Google Doc vs gõ tay hay lệch NFC/NFD)
    const norm = (s: string) => s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
    const lower = norm(content);
    matched = (notes ?? [])
      .filter(n =>
        n.product && lower.includes(norm(n.product)) &&
        (!n.effective_to || n.effective_to >= today) // hết hạn thì thôi; sắp hiệu lực vẫn tính
      )
      .map(n => ({ product: n.product, note_type: n.note_type, note: n.note, link_content: n.link_content }));
  } catch { /* bảng chưa tạo — bỏ qua */ }

  const notesContext = matched.length
    ? '\n\n## TÀI LIỆU SẢN PHẨM CẬP NHẬT (ưu tiên hơn mọi thông tin cũ — nếu bài viết mâu thuẫn với đây thì trừ điểm chinh_xac và ghi vào required_edits):\n' +
      matched.map(n =>
        `- [${n.product} · ${n.note_type}] ${n.note}` +
        (n.link_content ? `\n  Trích tài liệu đính kèm: """${n.link_content.slice(0, 2500)}"""` : '')
      ).join('\n')
    : '';

  const userText = [
    channel ? `Kênh dự kiến: ${channel}.` : '',
    brand ? `Thương hiệu khai báo: ${brand}.` : '',
    writer ? `Người viết: ${writer}.` : '',
    notesContext,
    '',
    'Bài cần duyệt:',
    content,
  ].join('\n');

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY ?? '',
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: MOS_SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: userText }] }],
      generationConfig: { response_mime_type: 'application/json', temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: `Gemini lỗi ${res.status}`, detail: detail.slice(0, 300) },
      { status: 502 }
    );
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  let review;
  try {
    review = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: 'AI trả về không đúng định dạng — thử lại.', raw: text?.slice(0, 300) },
      { status: 502 }
    );
  }

  // Lưu vào DB: PASS/MINOR → chờ duyệt cuối; MAJOR/REWRITE → cần sửa
  const status =
    review.decision === 'PASS' || review.decision === 'MINOR_FIX' ? 'cho_duyet' : 'can_sua';
  const { data: row, error: dbError } = await db
    .from('mos_submissions')
    .insert({
      content, channel, brand: review.brand ?? brand, writer,
      score: review.score, decision: review.decision, review, status,
    })
    .select('id')
    .single();

  return NextResponse.json({
    ...review,
    saved: !dbError,
    submission_id: row?.id ?? null,
    db_error: dbError ? dbError.message : undefined,
    product_warnings: matched.map(n => ({
      product: n.product, note_type: n.note_type, note: n.note,
      has_doc: !!n.link_content,
    })),
  });
}
