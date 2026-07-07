'use client';

import { useEffect, useState, useCallback } from 'react';
import Nav from '../nav';

type Row = {
  id: string; created_at: string; content: string; channel: string | null;
  brand: string | null; writer: string; score: number | null; decision: string | null;
  status: string;
  review: { red_flags?: { quote: string; rule: string; fix: string }[]; summary?: string; required_edits?: string[] } | null;
};

const DECISION_CLS: Record<string, string> = {
  PASS: 'bg-green-100 text-green-700', MINOR_FIX: 'bg-yellow-100 text-yellow-700',
  MAJOR_FIX: 'bg-orange-100 text-orange-700', REWRITE: 'bg-red-100 text-red-700',
};

export default function Duyet() {
  const [tab, setTab] = useState<'cho_duyet' | 'can_sua'>('cho_duyet');
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState<Row | null>(null);
  const [reviewer, setReviewer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  async function act(id: string, status: string) {
    if (!reviewer.trim()) { alert('Nhập tên người duyệt cuối trước.'); return; }
    await fetch('/api/submissions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, final_reviewer: reviewer }),
    });
    setOpen(null); load();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-2">
            <button onClick={() => setTab('cho_duyet')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'cho_duyet' ? 'bg-[#1B4DB1] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              🕐 Chờ duyệt cuối
            </button>
            <button onClick={() => setTab('can_sua')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'can_sua' ? 'bg-[#1B4DB1] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              ✏️ Cần sửa
            </button>
          </div>
          <input value={reviewer} onChange={e => setReviewer(e.target.value)}
            placeholder="Tên người duyệt cuối *"
            className="rounded-lg border border-slate-300 text-sm p-2 w-56" />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {loading && <p className="text-slate-400 text-sm">Đang tải…</p>}
        {!loading && rows.length === 0 && !error && (
          <p className="text-slate-400 text-sm">Trống — chưa có bài nào ở trạng thái này.</p>
        )}

        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 line-clamp-2">{r.content.slice(0, 180)}…</p>
                  <div className="flex gap-2 mt-2 text-xs flex-wrap">
                    <span className={`px-2 py-0.5 rounded font-semibold ${DECISION_CLS[r.decision ?? ''] ?? 'bg-slate-100'}`}>
                      {r.score} · {r.decision}
                    </span>
                    {r.brand && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{r.brand}</span>}
                    {r.channel && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{r.channel}</span>}
                    <span className="text-slate-400">✍️ {r.writer} · {new Date(r.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
                <button onClick={() => setOpen(open?.id === r.id ? null : r)}
                  className="text-sm text-[#1B4DB1] font-medium shrink-0">
                  {open?.id === r.id ? 'Đóng' : 'Xem & duyệt →'}
                </button>
              </div>

              {open?.id === r.id && (
                <div className="mt-4 border-t border-slate-100 pt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Nội dung đầy đủ</h4>
                    <pre className="text-xs bg-slate-50 rounded-lg p-3 whitespace-pre-wrap max-h-64 overflow-y-auto">{r.content}</pre>
                  </div>
                  <div className="space-y-3">
                    {r.review?.summary && <p className="text-sm text-slate-600">{r.review.summary}</p>}
                    {(r.review?.red_flags?.length ?? 0) > 0 && (
                      <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-xs space-y-2">
                        {r.review!.red_flags!.map((f, i) => (
                          <div key={i}><p className="text-red-800">“{f.quote}” — {f.rule}</p>
                          <p className="text-green-700">✏️ {f.fix}</p></div>
                        ))}
                      </div>
                    )}
                    {(r.review?.required_edits?.length ?? 0) > 0 && (
                      <ul className="list-disc list-inside text-xs text-slate-600">
                        {r.review!.required_edits!.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                    <div className="flex gap-2 pt-1">
                      {tab === 'cho_duyet' && (
                        <>
                          <button onClick={() => act(r.id, 'da_duyet')}
                            className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700">
                            ✅ Duyệt → Kho copy
                          </button>
                          <button onClick={() => act(r.id, 'can_sua')}
                            className="bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-200">
                            ↩ Trả về sửa
                          </button>
                        </>
                      )}
                      {tab === 'can_sua' && (
                        <button onClick={() => act(r.id, 'cho_duyet')}
                          className="bg-[#1B4DB1] text-white text-sm font-semibold px-4 py-2 rounded-lg">
                          Đã sửa xong → Chờ duyệt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
