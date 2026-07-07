import { NextRequest, NextResponse } from 'next/server';
import { MOS_SYSTEM_PROMPT } from '@/lib/mos-prompt';

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

  const userText = [
    channel ? `Kênh dự kiến: ${channel}.` : '',
    brand ? `Thương hiệu khai báo: ${brand}.` : '',
    writer ? `Người viết: ${writer}.` : '',
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
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json(
      { error: 'AI trả về không đúng định dạng — thử lại.', raw: text?.slice(0, 300) },
      { status: 502 }
    );
  }
}
