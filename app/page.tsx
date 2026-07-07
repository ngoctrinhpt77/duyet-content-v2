'use client';

import { useState } from 'react';
import Nav from './nav';

const BRANDS = ['Daikiosan', 'Makano', 'Daikio', 'Nakami', 'Takasa', 'Kasuto', 'Achisa'];
const CHANNELS = [
  'Website - SEO Blog', 'Website - PDP', 'Website - Tin trúng thầu', 'Landing Page',
  'Facebook', 'TikTok', 'Zalo OA', 'PR báo chí', 'Group NPP/Đại lý',
  'Shopee', 'TikTok Shop', 'Lazada', 'Email/CRM', 'POSM/Offline',
];

type RedFlag = { quote: string; rule: string; fix: string };
type Review = {
  content_type: string; brand: string; tier: string; journey_stage: string;
  core_pass: boolean; red_flags: RedFlag[]; score: number;
  breakdown: Record<string, number>;
  decision: 'PASS' | 'MINOR_FIX' | 'MAJOR_FIX' | 'REWRITE';
  required_edits: string[]; summary: string;
  saved?: boolean; db_error?: string;
  product_warnings?: { product: string; note_type: string; note: string }[];
};

const DECISIONS = {
  PASS:      { label: 'PASS – Đăng ngay',    cls: 'bg-green-100 text-green-800 border-green-300' },
  MINOR_FIX: { label: 'MINOR FIX – Sửa nhẹ', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  MAJOR_FIX: { label: 'MAJOR FIX – Sửa lớn', cls: 'bg-orange-100 text-orange-800 border-orange-300' },
  REWRITE:   { label: 'REWRITE – Viết lại',  cls: 'bg-red-100 text-red-800 border-red-300' },
} as const;

const CRITERIA: Record<string, string> = {
  chinh_xac: 'Chính xác', cau_truc: 'Cấu trúc', loi_ich: 'Lợi ích',
  trust: 'Trust', cta: 'CTA', seo: 'SEO',
};

export default function Home() {
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState(CHANNELS[4]);
  const [brand, setBrand] = useState('');
  const [writer, setWriter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Review | null>(null);

  async function submit() {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, channel, brand, writer }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Có lỗi xảy ra');
      else setResult(data);
    } catch {
      setError('Không kết nối được máy chủ — thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />

      <main className="max-w-6xl mx-auto p-6 grid gap-6 lg:grid-cols-2">
        {/* Form nộp bài */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-lg mb-4 text-slate-800">Nộp bài duyệt</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-sm text-slate-600">Kênh đăng</span>
              <select value={channel} onChange={e => setChannel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 text-sm p-2">
                {CHANNELS.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Thương hiệu</span>
              <select value={brand} onChange={e => setBrand(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 text-sm p-2">
                <option value="">— AI tự nhận diện —</option>
                {BRANDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </label>
          </div>
          <label className="block mb-3">
            <span className="text-sm text-slate-600">Người viết <span className="text-red-500">*</span></span>
            <input value={writer} onChange={e => setWriter(e.target.value)} placeholder="VD: Nguyễn Thị Hoa"
              className="mt-1 w-full rounded-lg border border-slate-300 text-sm p-2" />
          </label>
          <label className="block mb-4">
            <span className="text-sm text-slate-600">Nội dung bài (dán toàn bộ)</span>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={12}
              placeholder="Dán bài viết, caption, mô tả sản phẩm…"
              className="mt-1 w-full rounded-lg border border-slate-300 text-sm font-mono p-2" />
          </label>
          <button onClick={submit} disabled={loading || !content.trim() || !writer.trim()}
            className="w-full rounded-lg bg-[#1B4DB1] text-white font-semibold py-3 hover:bg-[#163d8f] disabled:opacity-40 transition">
            {loading ? 'AI đang chấm…' : '⚡ Gửi AI chấm điểm'}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        {/* Kết quả */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-lg mb-4 text-slate-800">Kết quả chấm</h2>

          {!result && !loading && (
            <p className="text-slate-400 text-sm">Chưa có kết quả — nộp bài bên trái để AI chấm theo chuẩn MOS (Claims Register + rubric 100 điểm).</p>
          )}
          {loading && (
            <div className="animate-pulse space-y-3">
              <div className="h-24 bg-slate-100 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold ${result.score >= 90 ? 'text-green-600' : result.score >= 80 ? 'text-yellow-600' : result.score >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                  {result.score}
                </div>
                <span className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${DECISIONS[result.decision]?.cls ?? ''}`}>
                  {DECISIONS[result.decision]?.label ?? result.decision}
                </span>
              </div>

              <p className="text-sm text-slate-600">{result.summary}</p>

              {result.saved === true && (
                <p className="text-xs text-green-600">💾 Đã lưu vào hệ thống — xem ở tab “Hàng chờ duyệt”.</p>
              )}
              {result.saved === false && (
                <p className="text-xs text-orange-500">⚠️ Chưa lưu được DB ({result.db_error ?? 'chưa chạy SQL setup'}) — kết quả vẫn dùng được.</p>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{result.content_type}</span>
                <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded">{result.brand} · {result.tier === 'cao_cap' ? 'Cao cấp' : result.tier === 'pho_thong' ? 'Phổ thông' : '?'}</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">{result.journey_stage}</span>
              </div>

              {(result.product_warnings?.length ?? 0) > 0 && (
                <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-amber-800 mb-1">⚠️ Lưu ý từ Tài liệu sản phẩm</p>
                  {result.product_warnings!.map((w, i) => (
                    <p key={i} className="text-amber-800"><strong>{w.product}</strong>: {w.note}</p>
                  ))}
                </div>
              )}

              {result.red_flags?.length > 0 && (
                <div className="border border-red-300 bg-red-50 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 text-sm mb-2">🚩 Cờ đỏ Compliance ({result.red_flags.length})</h3>
                  {result.red_flags.map((f, i) => (
                    <div key={i} className="mb-3 last:mb-0 text-sm">
                      <p className="text-red-900">“{f.quote}”</p>
                      <p className="text-red-600 text-xs mt-0.5">{f.rule}</p>
                      <p className="text-green-700 text-xs mt-1 bg-green-50 rounded px-2 py-1">✏️ Thay bằng: {f.fix}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h3 className="font-semibold text-sm text-slate-700 mb-2">Điểm thành phần</h3>
                {Object.entries(result.breakdown ?? {}).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-slate-500 w-20">{CRITERIA[k] ?? k}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="bg-[#1B4DB1] h-2 rounded-full" style={{ width: `${Math.min(100, (v / 30) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-slate-600 w-6 text-right">{v}</span>
                  </div>
                ))}
              </div>

              {result.required_edits?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-slate-700 mb-2">Danh sách cần sửa</h3>
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    {result.required_edits.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-8 text-xs text-slate-400">
        MOS v1.0 · Chấm theo Marketing Knowledge Base (Claims Register + rubric module) · Gemini 2.5 Flash
      </footer>
    </div>
  );
}
