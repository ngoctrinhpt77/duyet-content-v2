import { NextRequest, NextResponse } from 'next/server';
import { MOS_SYSTEM_PROMPT } from '@/lib/mos-prompt';
import { db } from '@/lib/db';
import { evaluateGate } from '@/lib/quality-gate';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(req: NextRequest) {
  const { content, channel, brand, writer,
          declared_journey, objective, audience,
          parent_id, override_requested } = await req.json();

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
    declared_journey ? `Journey người viết KHAI BÁO: ${declared_journey}.` : '',
    objective ? `Mục tiêu bài (Objective): ${objective}.` : '',
    audience ? `Đối tượng nhắm tới (Audience): ${audience}.` : '',
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

  // ---- AI QUALITY GATE (deterministic, code quyết định) ----
  const gate = evaluateGate(review, declared_journey);

  // PASS/WARN → vào hàng chờ Director. FAIL → giữ ở "cần sửa", KHÔNG lên Director.
  // Xin ngoại lệ (có lý do + được phép) → vào Exception Queue.
  const isException = gate.gate_status === 'FAIL' && override_requested && gate.can_request_exception;
  const status = isException ? 'ngoai_le'
    : gate.gate_status === 'FAIL' ? 'can_sua'
    : 'cho_duyet';

  // version: nếu là bản sửa lại của bài cũ
  let version = 1;
  if (parent_id) {
    const { data: prev } = await db.from('mos_submissions').select('version').eq('id', parent_id).single();
    version = (prev?.version ?? 1) + 1;
  }

  const { data: row, error: dbError } = await db
    .from('mos_submissions')
    .insert({
      content, channel, brand: review.brand ?? brand, writer,
      score: review.score, decision: review.decision, review, status,
      gate_status: gate.gate_status, gates: gate.gates,
      declared_journey: declared_journey ?? null,
      objective: objective ?? null,
      audience: audience ?? null,
      parent_id: parent_id ?? null,
      version,
      override_requested: isException ? override_requested : null,
    })
    .select('id')
    .single();

  return NextResponse.json({
    ...review,
    gate_status: gate.gate_status,
    gates: gate.gates,
    blockers: gate.blockers,
    gate_warnings: gate.warnings,
    can_request_exception: gate.can_request_exception,
    version,
    saved: !dbError,
    submission_id: row?.id ?? null,
    db_error: dbError ? dbError.message : undefined,
    product_warnings: matched.map(n => ({
      product: n.product, note_type: n.note_type, note: n.note,
      has_doc: !!n.link_content,
    })),
  });
}
