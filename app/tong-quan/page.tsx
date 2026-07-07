'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '../nav';

type Stats = {
  total: number; byStatus: Record<string, number>; avgScore: number;
  passRate: number; redFlagTotal: number;
  writers: { name: string; count: number; avgScore: number; pass1Rate: number; rewriteCount: number }[];
  recent: { writer: string; score: number; decision: string; status: string; created_at: string; brand: string | null }[];
};

const STATUS_LABEL: Record<string, [string, string]> = {
  cho_duyet: ['🕐 Chờ duyệt', 'text-blue-700 bg-blue-50'],
  can_sua: ['✏️ Cần sửa', 'text-orange-700 bg-orange-50'],
  da_duyet: ['✅ Đã duyệt', 'text-green-700 bg-green-50'],
  da_dang: ['🚀 Đã đăng', 'text-indigo-700 bg-indigo-50'],
};

export default function TongQuan() {
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => d.error ? setError(d.error) : setS(d))
      .catch(() => setError('Không tải được dữ liệu'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <h2 className="text-xl font-bold text-slate-800">Tổng quan chất lượng content</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!s && !error && <p className="text-slate-400 text-sm">Đang tải…</p>}

        {s && (
          <>
            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['Tổng bài đã chấm', s.total, ''],
                ['Điểm AI trung bình', s.avgScore, '/100'],
                ['Tỷ lệ PASS lần 1', s.passRate, '%'],
                ['Bài REWRITE (cờ đỏ)', s.redFlagTotal, ''],
              ].map(([label, val, suffix]) => (
                <div key={label as string} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className="text-3xl font-bold text-[#1B4DB1] mt-1">{val}<span className="text-base text-slate-400">{suffix}</span></p>
                </div>
              ))}
            </div>

            {/* Trạng thái luồng */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-sm text-slate-700 mb-3">Luồng công việc</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(STATUS_LABEL).map(([k, [label, cls]]) => (
                  <Link key={k} href={k === 'da_duyet' || k === 'da_dang' ? '/kho' : '/duyet'}
                    className={`rounded-lg p-3 ${cls} hover:opacity-80 transition`}>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-2xl font-bold">{s.byStatus[k] ?? 0}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Theo người viết */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-sm text-slate-700 mb-3">Chất lượng theo người viết</h3>
                {s.writers.length === 0 && <p className="text-slate-400 text-sm">Chưa có dữ liệu.</p>}
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-400 text-left">
                    <th className="pb-2">Người viết</th><th>Số bài</th><th>Điểm TB</th><th>PASS lần 1</th>
                  </tr></thead>
                  <tbody>
                    {s.writers.slice(0, 8).map(w => (
                      <tr key={w.name} className="border-t border-slate-100">
                        <td className="py-2 font-medium text-slate-700">{w.name}</td>
                        <td>{w.count}</td>
                        <td className={w.avgScore >= 80 ? 'text-green-600' : 'text-orange-600'}>{w.avgScore}</td>
                        <td>{w.pass1Rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bài gần nhất */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-sm text-slate-700 mb-3">Bài chấm gần nhất</h3>
                {s.recent.map((r, i) => (
                  <div key={i} className="flex items-center justify-between border-t border-slate-100 py-2 text-sm first:border-0">
                    <span className="text-slate-600">✍️ {r.writer}{r.brand ? ` · ${r.brand}` : ''}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${r.decision === 'PASS' ? 'bg-green-100 text-green-700' : r.decision === 'REWRITE' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.score} · {r.decision}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
