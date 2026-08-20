'use client';

import { useState } from 'react';
import Nav from './nav';

const BRANDS = ['Daikiosan', 'Makano', 'Daikio', 'Nakami', 'Takasa', 'Kasuto', 'Achisa'];
const JOURNEYS = ['Awareness', 'Consideration', 'Conversion', 'Retention'];
const OBJECTIVES = ['Educate', 'Build Trust', 'Generate Leads', 'Drive Sales', 'Engagement', 'Retention'];
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
  gate_status?: 'PASS' | 'WARN' | 'FAIL';
  gates?: {
    fact: { status: string; contradicted: number; unverified_critical: number };
    journey: { status: string; declared?: string; detected?: string; match: boolean };
    conversion: { status: string; score: number; threshold: number };
    legal: { status: string; highest: string };
    generic: { risk: string };
  };
  blockers?: string[]; gate_warnings?: string[]; can_request_exception?: boolean;
  fact_checks?: { claim: string; status: string; database?: string; source?: string; critical?: boolean; explanation?: string }[];
  conversion?: { score?: number; top3?: string[]; missing?: string[] };
  legal_issues?: { issue: string; severity: string; rule?: string; fix?: string }[];
  generic_reason?: string;
  submission_id?: string | null;
};

const GATE_UI = {
  PASS: { label: 'PASS — Đủ điều kiện gửi duyệt', cls: 'bg-green-50 border-green-300 text-green-800', dot: '🟢' },
  WARN: { label: 'WARN — Gửi được nhưng còn điểm cần cải thiện', cls: 'bg-yellow-50 border-yellow-300 text-yellow-800', dot: '🟡' },
  FAIL: { label: 'FAIL — Chưa vượt Quality Gate, phải sửa trước', cls: 'bg-red-50 border-red-300 text-red-800', dot: '🔴' },
} as const;

const ST = (s?: string) => s === 'PASS' || s === 'READY' ? 'text-green-600'
  : s === 'FAIL' || s === 'NOT_READY' ? 'text-red-600' : 'text-yellow-600';

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
  const [journey, setJourney] = useState(JOURNEYS[0]);
  const [objective, setObjective] = useState(OBJECTIVES[0]);
  const [audience, setAudience] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Review | null>(null);

  async function requestException() {
    setLoading(true);
    try {
      const res = await fetch('/api/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, channel, brand, writer,
          declared_journey: journey, objective, audience, override_requested: exceptionReason }),
      });
      const d = await res.json();
      if (res.ok) { setResult(d); setExceptionReason(''); }
      else setError(d.error ?? 'Lỗi gửi ngoại lệ');
    } catch { setError('Không kết nối được máy chủ'); }
    finally { setLoading(false); }
  }

  async function submit() {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, channel, brand, writer, declared_journey: journey, objective, audience }),
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
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-sm text-slate-600">Customer Journey <span className="text-red-500">*</span></span>
              <select value={journey} onChange={e => setJourney(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 text-sm p-2">
                {JOURNEYS.map(j => <option key={j}>{j}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Objective <span className="text-red-500">*</span></span>
              <select value={objective} onChange={e => setObjective(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 text-sm p-2">
                {OBJECTIVES.map(o => <option key={o}>{o}</option>)}
              </select>
            </label>
          </div>
          <label className="block mb-3">
            <span className="text-sm text-slate-600">Audience (đối tượng nhắm tới)</span>
            <input value={audience} onChange={e => setAudience(e.target.value)}
              placeholder="VD: Gia đình có con nhỏ ở chung cư, ngân sách 15-20 triệu"
              className="mt-1 w-full rounded-lg border border-slate-300 text-sm p-2" />
          </label>
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
              {result.gate_status && result.gates && (
                <>
                  <div className={`rounded-lg border-2 p-3 ${GATE_UI[result.gate_status].cls}`}>
                    <p className="font-bold">{GATE_UI[result.gate_status].dot} {GATE_UI[result.gate_status].label}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="border border-slate-200 rounded-lg p-2">
                      <p className="text-slate-500">Fact Accuracy</p>
                      <p className={`font-bold ${ST(result.gates.fact.status)}`}>{result.gates.fact.status}</p>
                      {result.gates.fact.contradicted > 0 && <p className="text-red-600">{result.gates.fact.contradicted} claim sai dữ liệu</p>}
                      {result.gates.fact.unverified_critical > 0 && <p className="text-orange-600">{result.gates.fact.unverified_critical} claim trọng yếu chưa xác minh</p>}
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2">
                      <p className="text-slate-500">Customer Journey</p>
                      <p className={`font-bold ${ST(result.gates.journey.status)}`}>{result.gates.journey.match ? 'KHỚP' : 'MISMATCH'}</p>
                      <p className="text-slate-500">Khai: {result.gates.journey.declared} → AI thấy: {result.gates.journey.detected}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2">
                      <p className="text-slate-500">Conversion Readiness</p>
                      <p className={`font-bold ${ST(result.gates.conversion.status)}`}>{result.gates.conversion.score}/{result.gates.conversion.threshold} · {result.gates.conversion.status}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2">
                      <p className="text-slate-500">Brand / Legal</p>
                      <p className={`font-bold ${ST(result.gates.legal.status)}`}>{result.gates.legal.status}</p>
                      <p className="text-slate-500">Mức cao nhất: {result.gates.legal.highest}</p>
                    </div>
                  </div>

                  {result.gates.generic.risk !== 'LOW' && (
                    <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-amber-800">⚠️ Generic Risk: {result.gates.generic.risk}</p>
                      {result.generic_reason && <p className="text-amber-800 text-xs mt-1">{result.generic_reason}</p>}
                    </div>
                  )}

                  {(result.blockers?.length ?? 0) > 0 && (
                    <div className="border-2 border-red-300 bg-red-50 rounded-lg p-3">
                      <p className="font-bold text-red-800 text-sm mb-1">🚫 Phải sửa trước khi gửi duyệt</p>
                      <ul className="list-disc list-inside text-sm text-red-900 space-y-1">
                        {result.blockers!.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                  )}

                  {(result.conversion?.top3?.length ?? 0) > 0 && (
                    <div className="border border-slate-200 rounded-lg p-3">
                      <p className="font-semibold text-sm text-slate-700 mb-1">🎯 3 việc cần sửa trước</p>
                      <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                        {result.conversion!.top3!.map((t, i) => <li key={i}>{t}</li>)}
                      </ol>
                    </div>
                  )}

                  {(result.gate_warnings?.length ?? 0) > 0 && (
                    <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-yellow-800 mb-1">Lưu ý</p>
                      <ul className="list-disc list-inside text-yellow-900 text-xs space-y-0.5">
                        {result.gate_warnings!.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {result.gate_status === 'FAIL' && (
                    <div className="border border-slate-300 rounded-lg p-3 text-sm bg-slate-50">
                      {result.can_request_exception ? (
                        <>
                          <p className="text-slate-700 font-medium mb-1">Cần gửi gấp dù chưa đạt?</p>
                          <input value={exceptionReason} onChange={e => setExceptionReason(e.target.value)}
                            placeholder="Bắt buộc: lý do xin ngoại lệ"
                            className="w-full rounded-lg border border-slate-300 text-sm p-2 mb-2" />
                          <button onClick={requestException} disabled={!exceptionReason.trim() || loading}
                            className="text-sm bg-slate-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-40">
                            Yêu cầu ngoại lệ
                          </button>
                        </>
                      ) : (
                        <p className="text-red-700 text-xs">
                          ⛔ Bài sai dữ liệu sản phẩm hoặc vi phạm pháp lý nghiêm trọng — <b>không thể xin ngoại lệ</b>. Phải sửa rồi chấm lại.
                        </p>
                      )}
                    </div>
                  )}

                  <button onClick={() => setShowDetail(!showDetail)} className="text-sm text-[#1B4DB1] font-medium">
                    {showDetail ? '▲ Ẩn phân tích chi tiết' : '▼ Xem phân tích chi tiết (rubric 100đ, claims, cờ đỏ)'}
                  </button>
                </>
              )}

              {(!result.gate_status || showDetail) && (
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

              {(result.fact_checks?.length ?? 0) > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-slate-700 mb-2">Đối chiếu dữ liệu (Fact check)</h3>
                  <div className="space-y-1.5">
                    {result.fact_checks!.map((f, i) => (
                      <div key={i} className="text-xs border border-slate-200 rounded-lg p-2">
                        <p className={f.status === 'CONTRADICTED' ? 'text-red-700' : f.status === 'UNVERIFIED' ? 'text-orange-700' : 'text-green-700'}>
                          {f.status === 'CONTRADICTED' ? '🔴' : f.status === 'UNVERIFIED' ? '🟡' : '🟢'} {f.status}{f.critical ? ' · trọng yếu' : ''}
                        </p>
                        <p className="text-slate-800">{f.claim}</p>
                        {f.database && <p className="text-slate-500">Chuẩn: {f.database}{f.source ? ` — ${f.source}` : ''}</p>}
                        {!f.database && f.status === 'UNVERIFIED' && <p className="text-slate-500">Không tìm thấy cơ sở xác minh trong Knowledge Base — cần kiểm nguồn trước khi dùng.</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
