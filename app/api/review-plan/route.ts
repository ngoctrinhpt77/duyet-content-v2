import { NextRequest, NextResponse } from 'next/server';
import { MOS_PLAN_PROMPT } from '@/lib/mos-plan-prompt';
import { fetchLinkContent } from '@/lib/fetch-link';
import { parseUpload, type Upload } from '@/lib/parse-upload';
import { db } from '@/lib/db';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { source, writer, file } = (await req.json()) as
    { source?: string; writer?: string; file?: Upload };

  let planText = (source ?? '').trim();
  let media: { mime: string; data: string } | null = null;
  let sourceNote = '';

  // 1) Có file đính kèm → ưu tiên xử lý file
  if (file?.data) {
    const p = parseUpload(file);
    if (p.kind === 'error') return NextResponse.json({ error: p.error }, { status: 400 });
    if (p.kind === 'media') { media = { mime: p.mime, data: p.data }; sourceNote = `${file.name} (${p.note})`; }
    else { planText = p.text; sourceNote = `${file.name} (${p.note})`; }
  }
  // 2) Không có file → link hoặc text dán tay
  else if (/^https?:\/\//.test(planText)) {
    const f = await fetchLinkContent(planText);
    if (!f.content) {
      return NextResponse.json(
        { error: `Không đọc được link: ${f.error ?? 'kiểm tra quyền "Anyone with the link can view"'}` },
        { status: 400 }
      );
    }
    sourceNote = planText;
    planText = f.content;
  }

  if (!media && planText.length < 30) {
    return NextResponse.json({ error: 'Chưa có nội dung plan — dán link, dán bảng, hoặc tải file lên.' }, { status: 400 });
  }

  // Nạp CSDL sản phẩm cho ĐÚNG các model xuất hiện trong plan.
  // Không có bước này AI phải đoán tính năng model → hay kết luận "gán nhầm model" sai.
  const notesContext = await loadProductNotes(planText);

  const parts: Record<string, unknown>[] = [{
    text: (media
      ? 'Content plan nằm trong file đính kèm (ảnh/PDF). Hãy ĐỌC KỸ bảng trong file rồi duyệt theo đúng quy trình.'
      : `Content plan cần duyệt (dạng CSV/bảng):\n\n${planText.slice(0, 50000)}`) + notesContext,
  }];
  if (media) parts.push({ inline_data: { mime_type: media.mime, data: media.data } });

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY ?? '' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: MOS_PLAN_PROMPT }] },
      contents: [{ parts }],
      generationConfig: { response_mime_type: 'application/json', temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: `Gemini lỗi ${res.status}`, detail: detail.slice(0, 300) }, { status: 502 });
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  let review;
  try {
    review = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'AI trả về không đúng định dạng — thử lại.', raw: text?.slice(0, 300) }, { status: 502 });
  }

  const status =
    review.decision === 'PASS' || review.decision === 'MINOR_FIX' ? 'cho_duyet' : 'can_sua';
  const stored = media
    ? `[PLAN] Nguồn: ${sourceNote}\n(Plan gửi dạng ảnh/PDF — xem lại file gốc)`
    : `[PLAN] Nguồn: ${sourceNote || 'dán trực tiếp'}\n\n${planText.slice(0, 20000)}`;

  const { data: row, error: dbError } = await db
    .from('mos_submissions')
    .insert({
      content: stored, channel: 'Content Plan', brand: null,
      writer: writer || 'Chưa ghi tên',
      score: review.score, decision: review.decision, review, status,
    })
    .select('id')
    .single();

  return NextResponse.json({
    ...review,
    source_note: sourceNote,
    saved: !dbError,
    submission_id: row?.id ?? null,
    db_error: dbError ? dbError.message : undefined,
  });
}

// ---- CSDL sản phẩm (mos_product_notes) cho các model có mặt trong plan ----
async function loadProductNotes(planText: string): Promise<string> {
  if (!planText) return '';
  try {
    const { data: notes } = await db
      .from('mos_product_notes')
      .select('product, note_type, note, effective_to, warn_on_review, link_content')
      .eq('warn_on_review', true);
    const today = new Date().toISOString().slice(0, 10);
    const norm = (x: string) => x.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
    const hay = norm(planText);

    const seen = new Set<string>();
    const hit: { product: string; note: string }[] = [];
    for (const n of notes ?? []) {
      if (!n.product || (n.effective_to && n.effective_to < today)) continue;
      // "DE075 1F / ME075 1F" → khớp theo từng mã
      const codes = n.product.split('/').map((c: string) => norm(c)).filter(Boolean);
      if (!codes.some((c: string) => c.length >= 4 && hay.includes(c))) continue;
      if (seen.has(n.product)) continue;
      seen.add(n.product);
      hit.push({ product: n.product, note: (n.note ?? '') + (n.link_content ? `\n  Tài liệu đính kèm: ${n.link_content.slice(0, 1200)}` : '') });
      if (hit.length >= 30) break;
    }
    if (!hit.length) return '';

    return '\n\n## CSDL SẢN PHẨM CỦA CÁC MODEL CÓ TRONG PLAN (nguồn đối chiếu DUY NHẤT về thông số/tính năng):\n' +
      hit.map(h => `### ${h.product}\n${h.note.slice(0, 1800)}`).join('\n') +
      '\n(Model nào KHÔNG có ở trên = không có dữ liệu → ghi "chưa xác minh", TUYỆT ĐỐI không kết luận là sai.)';
  } catch {
    return '';
  }
}
