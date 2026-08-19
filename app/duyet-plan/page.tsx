'use client';

import { useState } from 'react';
import Nav from '../nav';

type Dim = { score: number; issues: string[]; best_hook?: string; weakest_hook?: string };
type PlanReview = {
  plan_title: string; total_items: number; score: number;
  decision: 'PASS' | 'MINOR_FIX' | 'MAJOR_FIX' | 'REWRITE';
  dimensions: { journey: Dim; product: Dim; legal: Dim; attractiveness: Dim; structure: Dim };
  blocking_issues: string[]; recommendations: string[]; summary: string;
  saved?: boolean; db_error?: string;
};

const DIM_LABEL: Record<string, string> = {
  journey: '🧭 Hành trình KH',
  product: '📦 Thông tin sản phẩm',
  legal: '⚖️ Pháp lý & Claims',
  attractiveness: '✨ Độ hấp dẫn',
  structure: '🧮 Số học & CTA',
};

const DECISIONS = {
  PASS:      { label: 'PASS – Cho triển khai',       cls: 'bg-green-100 text-green-800 border-green-300' },
  MINOR_FIX: { label: 'MINOR FIX – Sửa nhỏ',          cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  MAJOR_FIX: { label: 'MAJOR FIX – Sửa xong duyệt lại', cls: 'bg-orange-100 text-orange-800 border-orange-300' },
  REWRITE:   { label: 'REWRITE – Làm lại plan',       cls: 'bg-red-100 text-red-800 border-red-300' },
} as const;

export default function DuyetPlan() {
  const [source, setSource] = useState('');
  const [writer, setWriter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [r, setR] = useState<PlanReview | null>(null);

  async function submit() {
    setLoading(true); setError(''); setR(null);
    try {
      const res = await fetch('/api/review-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, writer }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Có lỗi xảy ra');
      else setR(data);
    } catch { setError('Không kết nối được máy chủ — thử lại.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Duyệt Content Plan</h2>
        <p className="text-sm text-slate-500 mb-5">
          Chấm cả kế hoạch nội dung theo 5 trục: hành trình khách hàng · thông tin sản phẩm · pháp lý · độ hấp dẫn · số học/CTA.
        </p>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Input */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2 h-fit">
            <label className="block mb-3">
              <span className="text-sm text-slate-600">Link Google Sheet (đúng tab) hoặc dán bảng plan</span>
              <textarea value={source} onChange={e => setSource(e.target.value)} rows={6}
                placeholder={'https://docs.google.com/spreadsheets/d/...#gid=...\n\nhoặc copy & dán trực tiếp bảng plan vào đây'}
                className="mt-1 w-full rounded-lg border border-slate-300 text-sm p-2 font-mono" />
              <span className="text-xs text-slate-400">Sheet phải mở quyền “Anyone with the link can view”. Link giữ nguyên #gid để đọc đúng tab.</span>
            </label>
            <label className="block mb-4">
              <span className="text-sm text-slate-600">Người lập plan</span>
              <input value={writer} onChange={e => setWriter(e.target.value)} placeholder="VD: Nguyễn Thị Hoa"
                className="mt-1 w-full rounded-lg border border-slate-300 text-sm p-2" />
            </label>
            <button onClick={submit} disabled={loading || !source.trim()}
              className="w-full rounded-lg bg-[#1B4DB1] text-white font-semibold py-3 hover:bg-[#163d8f] disabled:opacity-40 transition">
              {loading ? 'AI đang duyệt plan…' : '📅 Duyệt plan'}
            </button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </section>

          {/* Result */}
          <section className="lg:col-span-3 space-y-4">
            {!r && !loading && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-400">
                Kết quả hiện ở đây — điểm từng trục, lỗi chặn theo vị trí, và đề xuất sửa cụ thể.
              </div>
            )}
            {loading && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-3">
                <div className="h-16 bg-slate-100 rounded-lg" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            )}

            {r && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className={`text-4xl font-bold ${r.score >= 90 ? 'text-green-600' : r.score >= 80 ? 'text-yellow-600' : r.score >= 70 ? 'text-orange-600' : 'text-red-600'}`}>{r.score}</div>
                    <span className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${DECISIONS[r.decision]?.cls ?? ''}`}>
                      {DECISIONS[r.decision]?.label ?? r.decision}
                    </span>
                    <span className="text-xs text-slate-400">{r.plan_title} · {r.total_items} bài</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-3">{r.summary}</p>
                  {r.saved === true && <p className="text-xs text-green-600 mt-2">💾 Đã lưu — xem trong Hàng chờ (kênh: Content Plan).</p>}
                  {r.saved === false && <p className="text-xs text-orange-500 mt-2">⚠️ Chưa lưu được DB ({r.db_error ?? 'DB đang gián đoạn'}) — kết quả vẫn dùng được.</p>}
                </div>

                {(r.blocking_issues?.length ?? 0) > 0 && (
                  <div className="border border-red-300 bg-red-50 rounded-xl p-4">
                    <h3 className="font-semibold text-red-800 text-sm mb-2">⛔ Lỗi chặn — sửa xong mới cho viết ({r.blocking_issues.length})</h3>
                    <ul className="list-disc list-inside text-sm text-red-900 space-y-1">
                      {r.blocking_issues.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(r.dimensions ?? {}).map(([k, d]) => (
                    <div key={k} className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm text-slate-700">{DIM_LABEL[k] ?? k}</h4>
                        <span className={`text-sm font-bold ${d.score >= 16 ? 'text-green-600' : d.score >= 12 ? 'text-yellow-600' : 'text-red-600'}`}>{d.score}/20</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-1.5 mb-2">
                        <div className={`h-1.5 rounded-full ${d.score >= 16 ? 'bg-green-500' : d.score >= 12 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(d.score / 20) * 100}%` }} />
                      </div>
                      {d.issues?.length > 0 ? (
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                          {d.issues.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      ) : <p className="text-xs text-green-600">Không có vấn đề.</p>}
                      {k === 'attractiveness' && d.best_hook && (
                        <p className="text-xs text-green-700 mt-2">👍 Hook tốt nhất: “{d.best_hook}”</p>
                      )}
                      {k === 'attractiveness' && d.weakest_hook && (
                        <p className="text-xs text-orange-600 mt-1">👎 Hook yếu nhất: “{d.weakest_hook}”</p>
                      )}
                    </div>
                  ))}
                </div>

                {(r.recommendations?.length ?? 0) > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="font-semibold text-sm text-slate-700 mb-2">💡 Đề xuất hành động</h3>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {r.recommendations.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
