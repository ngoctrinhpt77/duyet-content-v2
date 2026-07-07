'use client';

import { useState } from 'react';
import Nav from '../nav';
import { CLAIMS, DISCLAIMER } from '@/lib/claims-data';

export default function Claims() {
  const [q, setQ] = useState('');
  const groups = [...new Set(CLAIMS.map(c => c.group))];
  const filtered = CLAIMS.filter(c =>
    !q || (c.code + c.allowed + c.banned + c.group).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-slate-800">Sổ Claims — câu được nói / cấm nói</h2>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Tìm mã claim, từ khóa…"
            className="rounded-lg border border-slate-300 text-sm p-2 w-64" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm text-amber-800">
          📌 Miễn trừ chuẩn (bắt buộc kèm khi nói công dụng sức khỏe): <em>“{DISCLAIMER}”</em>
        </div>

        {groups.map(g => {
          const rows = filtered.filter(c => c.group === g);
          if (!rows.length) return null;
          return (
            <div key={g} className="mb-6">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wide mb-2">{g}</h3>
              <div className="space-y-3">
                {rows.map(c => (
                  <div key={c.code} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono font-bold text-[#1B4DB1]">{c.code}</span>
                      {c.status === 'co_bang_chung'
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Đã có bằng chứng</span>
                        : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Chờ số hiệu</span>}
                      <span className="text-xs text-slate-400">{c.evidence}</span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 mb-1">✅ ĐƯỢC nói</p>
                        <p className="text-green-900">{c.allowed}</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-700 mb-1">⛔ CẤM nói</p>
                        <p className="text-red-900">{c.banned}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">📎 {c.note}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
