'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Nav from '../nav';
import {
  type Row, type Issue, type FilterKey, type DiffLine,
  CAT_UI, SEV_UI, kindOf, productsOf, toIssues, topIssues, badgesOf,
  riskRank, matchFilter, planHealth, diffLines, compactDiff, gateDelta,
} from '@/lib/review-view';

const DECISION_CLS: Record<string, string> = {
  PASS: 'bg-green-100 text-green-700', MINOR_FIX: 'bg-yellow-100 text-yellow-700',
  MAJOR_FIX: 'bg-orange-100 text-orange-700', REWRITE: 'bg-red-100 text-red-700',
};

const GATE_CLS: Record<string, string> = {
  PASS: 'bg-green-100 text-green-700', WARN: 'bg-yellow-100 text-yellow-700', FAIL: 'bg-red-100 text-red-700',
};
const GATE_DOT: Record<string, string> = { PASS: '🟢', WARN: '🟡', FAIL: '🔴' };

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'BLOCKER', label: 'Có blocker' },
  { key: 'FACT', label: 'Sai dữ liệu' },
  { key: 'LEGAL', label: 'Pháp lý' },
  { key: 'CONVERSION', label: 'Yếu chuyển đổi' },
  { key: 'PLAN', label: 'Plan' },
  { key: 'CONTENT', label: 'Content' },
];

export default function Duyet() {
  const [tab, setTab] = useState<'cho_duyet' | 'can_sua' | 'ngoai_le'>('cho_duyet');
  const [rows, setRows] = useState<Row[]>([]);
  const [reviewer, setReviewer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state — không đụng data model
  const [panel, setPanel] = useState<Record<string, string | null>>({});
  const [filters, setFilters] = useState<FilterKey[]>([]);
  const [writerFilter, setWriterFilter] = useState('');
  const [sortNewest, setSortNewest] = useState(false);
  const [act2, setAct2] = useState<{ id: string; mode: 'return' | 'exception'; text: string } | null>(null);
  const [origin, setOrigin] = useState<Record<string, Row | null>>({});
  const [openItem, setOpenItem] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/submissions?status=${tab}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Lỗi tải dữ liệu');
      else setRows(data);
    } catch { setError('Không kết nối được máy chủ'); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, status: string, note?: string, override?: string) {
    if (!reviewer.trim()) { alert('Nhập tên người duyệt cuối trước.'); return; }
    await fetch('/api/submissions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, final_reviewer: reviewer, final_note: note ?? null, override_requested: override }),
    });
    setAct2(null); setPanel({}); load();
  }

  function toggle(id: string, name: string) {
    setPanel(s => ({ ...s, [id]: s[id] === name ? null : name }));
  }

  async function openDiff(r: Row) {
    toggle(r.id, 'diff');
    if (r.parent_id && origin[r.id] === undefined) {
      try {
        const res = await fetch(`/api/submissions?id=${r.parent_id}`);
        const d = await res.json();
        setOrigin(s => ({ ...s, [r.id]: Array.isArray(d) ? (d[0] ?? null) : null }));
      } catch { setOrigin(s => ({ ...s, [r.id]: null })); }
    }
  }

  // Tính 1 lần cho mỗi lần rows/filter đổi
  const prepared = useMemo(() => rows.map(r => {
    const issues = toIssues(r);
    return { r, issues, top: topIssues(issues, 3), badges: badgesOf(r, issues), rank: riskRank(r, issues) };
  }), [rows]);

  const writers = useMemo(
    () => Array.from(new Set(rows.map(r => r.writer).filter(Boolean))).sort(),
    [rows]);

  const view = useMemo(() => {
    let v = prepared;
    for (const f of filters) v = v.filter(x => matchFilter(x.r, x.issues, f));
    if (writerFilter) v = v.filter(x => x.r.writer === writerFilter);
    return [...v].sort((a, b) => sortNewest
      ? +new Date(b.r.created_at) - +new Date(a.r.created_at)
      : a.rank - b.rank || +new Date(b.r.created_at) - +new Date(a.r.created_at));
  }, [prepared, filters, writerFilter, sortNewest]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div className="flex gap-2">
            {([['cho_duyet', '🕐 Chờ duyệt cuối'], ['can_sua', '✏️ Cần sửa'], ['ngoai_le', '🚩 Ngoại lệ']] as const).map(([k, l]) => (
              <button key={k} onClick={() => { setTab(k); setPanel({}); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === k ? 'bg-[#1B4DB1] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                {l}
              </button>
            ))}
          </div>
          <input value={reviewer} onChange={e => setReviewer(e.target.value)}
            placeholder="Tên người duyệt cuối *"
            className="rounded-lg border border-slate-300 text-sm p-2 w-56" />
        </div>

        {/* Bộ lọc — client-side, không đổi backend */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap text-xs">
          {FILTERS.map(f => {
            const on = filters.includes(f.key);
            return (
              <button key={f.key}
                onClick={() => setFilters(s => on ? s.filter(x => x !== f.key) : [...s, f.key])}
                className={`px-2.5 py-1 rounded-full border ${on ? 'bg-[#1B4DB1] text-white border-[#1B4DB1]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                {f.label}
              </button>
            );
          })}
          <select value={writerFilter} onChange={e => setWriterFilter(e.target.value)}
            className="px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-600">
            <option value="">Tất cả người viết</option>
            {writers.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <button onClick={() => setSortNewest(s => !s)}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-400">
            {sortNewest ? '⏱️ Mới nhất' : '⚠️ Rủi ro cao trước'}
          </button>
          {(filters.length > 0 || writerFilter) && (
            <button onClick={() => { setFilters([]); setWriterFilter(''); }} className="text-slate-400 underline px-1">bỏ lọc</button>
          )}
          <span className="text-slate-400 ml-auto">{view.length}/{rows.length} bài</span>
        </div>

        {/fetch failed|ENOTFOUND|timeout/i.test(error) ? (
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 text-sm text-orange-800 mb-3">
            🔌 <b>Database đang tạm dừng</b> — vào supabase.com → project → bấm <b>Restore</b>, chờ ~2 phút rồi tải lại.
          </div>
        ) : error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {loading && <p className="text-slate-400 text-sm">Đang tải…</p>}
        {!loading && rows.length === 0 && !error && (
          <p className="text-slate-400 text-sm">Trống — chưa có bài nào ở trạng thái này.</p>
        )}
        {!loading && rows.length > 0 && view.length === 0 && (
          <p className="text-slate-400 text-sm">Không bài nào khớp bộ lọc.</p>
        )}

        <div className="space-y-2.5">
          {view.map(({ r, issues, top, badges }) => {
            const kind = kindOf(r);
            const models = productsOf(r);
            const health = kind === 'PLAN' ? planHealth(r) : null;
            const items = r.review?.items ?? [];
            const open = panel[r.id];
            const canException = !(
              (r.gates?.fact?.contradicted ?? 0) > 0 || r.gates?.legal?.highest === 'CRITICAL' ||
              issues.some(i => i.severity === 'BLOCKER' && (i.category === 'FACT' || i.category === 'LEGAL'))
            );

            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
                {/* ---- dòng nhận diện ---- */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className={`px-1.5 py-0.5 rounded font-bold ${kind === 'PLAN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{kind}</span>
                  {models.length > 0 && <span className="font-semibold text-slate-700">{models.join('/')}</span>}
                  <span className="text-slate-500">· {r.writer}</span>
                  {(r.version ?? 1) > 1 && <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">v{r.version}</span>}
                  {r.channel && <span className="text-slate-400">· {r.channel}</span>}
                  <span className="text-slate-400 ml-auto">{new Date(r.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* ---- trạng thái + badges ---- */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-xs">
                  {r.gate_status
                    ? <span className={`px-2 py-0.5 rounded font-bold ${GATE_CLS[r.gate_status]}`}>{GATE_DOT[r.gate_status]} {r.gate_status}</span>
                    : <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500">chưa qua Gate</span>}
                  <span className={`px-2 py-0.5 rounded font-semibold ${DECISION_CLS[r.decision ?? ''] ?? 'bg-slate-100'}`}>
                    {r.score}/100 · {r.decision}
                  </span>
                  {badges.map((b, i) => <span key={i} className={`px-2 py-0.5 rounded font-medium ${b.cls}`}>{b.text}</span>)}
                  {r.declared_journey && <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700">{r.declared_journey}</span>}
                </div>

                {/* ---- PLAN HEALTH (chỉ hiện metric có dữ liệu thật) ---- */}
                {health && (
                  <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="flex gap-x-4 gap-y-1 flex-wrap text-xs">
                      <span className="font-semibold text-slate-700">PLAN HEALTH</span>
                      {health.total != null && <span className="text-slate-600">{health.total} bài</span>}
                      {health.pass != null && <span className="text-green-700">PASS {health.pass}</span>}
                      {health.warn != null && <span className="text-yellow-700">WARN {health.warn}</span>}
                      {health.fail != null && <span className="text-red-700">FAIL {health.fail}</span>}
                      {health.awareness != null && <span className="text-slate-600">Awareness {health.awareness}</span>}
                      {health.consideration != null && <span className="text-slate-600">Consideration {health.consideration}</span>}
                      {health.conversion != null && <span className="text-slate-600">Conversion {health.conversion}</span>}
                      {health.retention != null && <span className="text-slate-600">Retention {health.retention}</span>}
                    </div>
                    {(r.review?.dimensions?.journey?.ty_le_phieu) && (
                      <p className="text-xs text-slate-500 mt-1">📊 {r.review!.dimensions!.journey!.ty_le_phieu}</p>
                    )}
                  </div>
                )}

                {/* ---- 3 lỗi cần xử lý trước ---- */}
                {top.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 tracking-wide">
                      {top.length === 1 ? 'LỖI CẦN XỬ LÝ TRƯỚC' : `${top.length} LỖI CẦN XỬ LÝ TRƯỚC`}
                      {issues.length > top.length && <span className="font-normal text-slate-400"> · còn {issues.length - top.length} mục nhỏ hơn</span>}
                    </p>
                    {top.map((it, i) => <IssueLine key={i} it={it} compact />)}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-green-600">Không có lỗi chặn — kiểm tra nhanh rồi duyệt.</p>
                )}

                {r.override_requested && (
                  <p className="mt-2 text-xs text-orange-800 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
                    🚩 Xin ngoại lệ: {r.override_requested}
                  </p>
                )}

                {/* ---- hành động ---- */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  {tab !== 'can_sua' ? (
                    <>
                      <button onClick={() => act(r.id, 'da_duyet')}
                        className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700">
                        ✅ Duyệt
                      </button>
                      <button onClick={() => setAct2({ id: r.id, mode: 'return', text: prefill(issues) })}
                        className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-200">
                        ↩️ Trả lại
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => act(r.id, 'cho_duyet')}
                        className="bg-[#1B4DB1] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        Đã sửa xong → Chờ duyệt
                      </button>
                      <a href={`/?parent=${r.id}`}
                        className="bg-white border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:border-slate-400">
                        ✏️ Nộp bản sửa
                      </a>
                      {r.gate_status === 'FAIL' && (canException
                        ? <button onClick={() => setAct2({ id: r.id, mode: 'exception', text: '' })}
                            className="bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                            🚩 Yêu cầu ngoại lệ
                          </button>
                        : <span className="text-[11px] text-red-600">⛔ Sai dữ liệu / pháp lý nghiêm trọng — không cho ngoại lệ</span>)}
                    </>
                  )}

                  <span className="ml-auto flex gap-2 text-xs">
                    <button onClick={() => toggle(r.id, 'content')} className="text-[#1B4DB1] font-medium">
                      {open === 'content' ? 'Ẩn nội dung' : 'Xem nội dung'}
                    </button>
                    <button onClick={() => toggle(r.id, 'detail')} className="text-[#1B4DB1] font-medium">
                      {open === 'detail' ? 'Ẩn phân tích' : `Xem phân tích chi tiết${issues.length > 3 ? ` (${issues.length})` : ''}`}
                    </button>
                    {r.parent_id && (
                      <button onClick={() => openDiff(r)} className="text-[#1B4DB1] font-medium">
                        {open === 'diff' ? 'Ẩn bản sửa' : 'Xem bản sửa'}
                      </button>
                    )}
                  </span>
                </div>

                {/* ---- ô nhập lý do (trả lại / ngoại lệ) ---- */}
                {act2?.id === r.id && (
                  <div className="mt-2 border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-700 mb-1">
                      {act2.mode === 'return' ? 'Lý do trả lại (đã điền sẵn blocker — sửa thêm nếu cần)' : 'Lý do xin ngoại lệ (bắt buộc)'}
                    </p>
                    <textarea value={act2.text} rows={3}
                      onChange={e => setAct2({ ...act2, text: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 text-xs p-2" />
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={() => act2.mode === 'return'
                          ? act(r.id, 'can_sua', act2.text)
                          : act(r.id, 'ngoai_le', act2.text, act2.text)}
                        disabled={act2.mode === 'exception' && !act2.text.trim()}
                        className="bg-[#1B4DB1] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40">
                        Xác nhận
                      </button>
                      <button onClick={() => setAct2(null)} className="text-xs text-slate-500 px-2">Huỷ</button>
                    </div>
                  </div>
                )}

                {/* ---- nội dung đầy đủ (mặc định đóng, có giới hạn chiều cao) ---- */}
                {open === 'content' && (
                  <pre className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 whitespace-pre-wrap max-h-80 overflow-y-auto">{r.content}</pre>
                )}

                {/* ---- phân tích chi tiết ---- */}
                {open === 'detail' && (
                  <div className="mt-2 border-t border-slate-100 pt-2.5 space-y-3">
                    {(r.review?.plan_issues?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 mb-1">VẤN ĐỀ CẤP PLAN</p>
                        <ul className="text-xs text-slate-700 space-y-0.5">
                          {r.review!.plan_issues!.slice(0, 5).map((p, i) => <li key={i}>• {p}</li>)}
                        </ul>
                      </div>
                    )}
                    {items.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 mb-1">BẢNG BÀI TRONG PLAN ({items.length})</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-slate-500">
                              <tr className="border-b border-slate-200">
                                <th className="text-left py-1 pr-2 font-medium w-8">#</th>
                                <th className="text-left py-1 pr-2 font-medium">Topic</th>
                                <th className="text-left py-1 pr-2 font-medium">Model</th>
                                <th className="text-left py-1 pr-2 font-medium">Journey</th>
                                <th className="text-left py-1 pr-2 font-medium">Gate</th>
                                <th className="text-left py-1 pr-2 font-medium">Điểm</th>
                                <th className="text-left py-1 font-medium">Vấn đề</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((it, i) => {
                                const k = `${r.id}:${i}`;
                                const g = (it.gate ?? '').toUpperCase();
                                return (
                                  <tr key={i} onClick={() => setOpenItem(s => ({ ...s, [k]: !s[k] }))}
                                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer align-top">
                                    <td className="py-1 pr-2 text-slate-400">{it.no ?? i + 1}</td>
                                    <td className="py-1 pr-2 text-slate-800">{it.topic}</td>
                                    <td className="py-1 pr-2 text-slate-600">{it.product}</td>
                                    <td className="py-1 pr-2 text-slate-600">{it.journey}</td>
                                    <td className="py-1 pr-2">
                                      {GATE_CLS[g] && <span className={`px-1.5 py-0.5 rounded ${GATE_CLS[g]}`}>{g}</span>}
                                    </td>
                                    <td className="py-1 pr-2 text-slate-600">{it.score ?? ''}</td>
                                    <td className={`py-1 text-slate-600 ${openItem[k] ? '' : 'truncate max-w-[16rem]'}`}>
                                      {it.issue}
                                      {openItem[k] && it.channel && <span className="block text-slate-400">Kênh: {it.channel}</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {issues.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-500">TẤT CẢ VẤN ĐỀ ({issues.length}) — nặng trước</p>
                        {issues.map((it, i) => <IssueLine key={i} it={it} />)}
                      </div>
                    )}

                    {r.review?.summary && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-slate-500">Nhận xét tổng của AI</summary>
                        <p className="mt-1 text-slate-600">{r.review.summary}</p>
                      </details>
                    )}
                    {r.final_note && <p className="text-xs text-orange-700">Ghi chú duyệt trước: {r.final_note}</p>}
                  </div>
                )}

                {/* ---- diff bản gốc ↔ bản sửa ---- */}
                {open === 'diff' && (
                  <DiffBlock cur={r} prev={origin[r.id]} />
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function prefill(issues: Issue[]) {
  const b = issues.filter(i => i.severity === 'BLOCKER' || i.severity === 'HIGH').slice(0, 5);
  if (!b.length) return '';
  return 'Cần sửa trước khi gửi lại:\n' + b.map((i, n) => `${n + 1}. [${i.category}] ${i.finding}${i.action ? ` → ${i.action}` : ''}`).join('\n');
}

function IssueLine({ it, compact }: { it: Issue; compact?: boolean }) {
  return (
    <div className={`text-xs rounded-lg border px-2.5 py-1.5 ${CAT_UI[it.category].cls}`}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`px-1.5 rounded text-[10px] font-bold ${SEV_UI[it.severity].cls}`}>{SEV_UI[it.severity].label}</span>
        <span className="font-bold">{CAT_UI[it.category].label}</span>
        <span className={compact ? 'text-slate-700 flex-1 min-w-0 line-clamp-2' : 'text-slate-700'}>{it.finding}</span>
      </div>
      {!compact && it.quote && <p className="text-slate-500 mt-0.5">“{it.quote}”</p>}
      {!compact && it.source && <p className="text-slate-400 mt-0.5">Căn cứ: {it.source}</p>}
      {!compact && it.action && <p className="text-slate-700 mt-0.5">✏️ {it.action}</p>}
    </div>
  );
}

function DiffBlock({ cur, prev }: { cur: Row; prev: Row | null | undefined }) {
  if (prev === undefined) return <p className="mt-2 text-xs text-slate-400">Đang tải bản gốc…</p>;
  if (prev === null) return <p className="mt-2 text-xs text-slate-400">Không tìm thấy bản gốc.</p>;

  const { deltas, resolved } = gateDelta(prev, cur);
  const lines = compactDiff(diffLines(prev.content, cur.content));

  return (
    <div className="mt-2 border-t border-slate-100 pt-2.5">
      <div className="flex gap-2 flex-wrap text-xs mb-2">
        {resolved && (
          <span className={`px-2 py-0.5 rounded font-semibold ${resolved.fixed >= resolved.total ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            Blockers resolved: {resolved.fixed}/{resolved.total}
          </span>
        )}
        {deltas.map((d, i) => (
          <span key={i} className={`px-2 py-0.5 rounded ${d.better ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {d.label}: {d.from} → {d.to}
          </span>
        ))}
        {!resolved && deltas.length === 0 && <span className="text-slate-400">Không có chỉ số so sánh được.</span>}
      </div>
      <div className="text-xs font-mono border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        {lines.map((l, i) => (
          <div key={i} className={
            l.type === 'add' ? 'bg-green-50 text-green-800 px-2 py-0.5'
            : l.type === 'del' ? 'bg-red-50 text-red-800 line-through px-2 py-0.5'
            : l.type === 'skip' ? 'bg-slate-50 text-slate-400 px-2 py-0.5 italic'
            : 'text-slate-600 px-2 py-0.5'}>
            {l.type === 'add' ? '+ ' : l.type === 'del' ? '− ' : ''}{(l as DiffLine).text}
          </div>
        ))}
      </div>
    </div>
  );
}
