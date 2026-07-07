'use client';

import { useEffect, useState } from 'react';
import Nav from '../nav';

type Row = {
  id: string; created_at: string; content: string; channel: string | null;
  brand: string | null; writer: string; score: number | null;
  status: string; final_reviewer: string | null; published_url: string | null;
};

export default function Kho() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/submissions?status=da_duyet,da_dang')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRows(d); })
      .finally(() => setLoading(false));
  }, []);

  const brands = [...new Set(rows.map(r => r.brand).filter(Boolean))] as string[];
  const filtered = rows.filter(r =>
    (!q || r.content.toLowerCase().includes(q.toLowerCase())) &&
    (!brand || r.brand === brand)
  );

  async function copy(r: Row) {
    await navigator.clipboard.writeText(r.content);
    setCopied(r.id);
    setTimeout(() => setCopied(''), 1500);
  }

  async function markPublished(r: Row) {
    const url = prompt('Link bài đã đăng (bỏ trống nếu chưa có):') ?? '';
    await fetch('/api/submissions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, status: 'da_dang', published_url: url || null, final_reviewer: r.final_reviewer }),
    });
    setRows(rows.map(x => x.id === r.id ? { ...x, status: 'da_dang', published_url: url || null } : x));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Tìm trong kho…"
            className="rounded-lg border border-slate-300 text-sm p-2 flex-1 min-w-48" />
          <select value={brand} onChange={e => setBrand(e.target.value)}
            className="rounded-lg border border-slate-300 text-sm p-2">
            <option value="">Tất cả thương hiệu</option>
            {brands.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>

        {loading && <p className="text-slate-400 text-sm">Đang tải…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-slate-400 text-sm">Kho trống — bài được duyệt cuối sẽ xuất hiện ở đây để copy dùng lại.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
              <p className="text-sm text-slate-800 line-clamp-4 flex-1 whitespace-pre-wrap">{r.content}</p>
              <div className="flex gap-2 mt-3 text-xs flex-wrap items-center">
                {r.status === 'da_dang'
                  ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">🚀 Đã đăng</span>
                  : <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">✅ Đã duyệt</span>}
                {r.brand && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{r.brand}</span>}
                {r.channel && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{r.channel}</span>}
                <span className="text-slate-400">✍️ {r.writer}{r.final_reviewer ? ` · duyệt: ${r.final_reviewer}` : ''}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => copy(r)}
                  className="flex-1 bg-[#1B4DB1] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#163d8f]">
                  {copied === r.id ? '✓ Đã copy' : '📋 Copy nội dung'}
                </button>
                {r.status !== 'da_dang' && (
                  <button onClick={() => markPublished(r)}
                    className="bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-slate-200">
                    Đánh dấu đã đăng
                  </button>
                )}
                {r.published_url && (
                  <a href={r.published_url} target="_blank" rel="noreferrer"
                    className="bg-slate-100 text-slate-700 text-sm px-3 py-2 rounded-lg hover:bg-slate-200">🔗</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
