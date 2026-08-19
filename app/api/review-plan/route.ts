import { NextRequest, NextResponse } from 'next/server';
import { MOS_PLAN_PROMPT } from '@/lib/mos-plan-prompt';
import { fetchLinkContent } from '@/lib/fetch-link';
import { db } from '@/lib/db';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { source, writer } = await req.json();
  if (!source || source.trim().length < 10) {
    return NextResponse.json({ error: 'Dán link Google Sheet hoặc nội dung plan.' }, { status: 400 });
  }

  // source là link → tải nội dung (Sheet xuất CSV, giữ đúng gid)
  let planText = source.trim();
  let fetched_from: string | null = null;
  if (/^https?:\/\//.test(planText)) {
    const f = await fetchLinkContent(planText);
    if (!f.content) {
      return NextResponse.json(
        { error: `Không đọc được link: ${f.error ?? 'kiểm tra quyền "Anyone with the link can view"'}` },
        { status: 400 }
      );
    }
    fetched_from = planText;
    planText = f.content;
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY ?? '',
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: MOS_PLAN_PROMPT }] },
      contents: [{ parts: [{ text: `Content plan cần duyệt (dạng CSV/bảng):\n\n${planText.slice(0, 50000)}` }] }],
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

  // Lưu vào cùng bảng submissions, channel riêng để lọc
  const status =
    review.decision === 'PASS' || review.decision === 'MINOR_FIX' ? 'cho_duyet' : 'can_sua';
  const { data: row, error: dbError } = await db
    .from('mos_submissions')
    .insert({
      content: (fetched_from ? `[PLAN] ${fetched_from}\n\n` : '[PLAN]\n\n') + planText.slice(0, 20000),
      channel: 'Content Plan',
      brand: null,
      writer: writer || 'Chưa ghi tên',
      score: review.score,
      decision: review.decision,
      review,
      status,
    })
    .select('id')
    .single();

  return NextResponse.json({
    ...review,
    saved: !dbError,
    submission_id: row?.id ?? null,
    db_error: dbError ? dbError.message : undefined,
  });
}
