'use client';

import { useEffect, useState } from 'react';
import Nav from '../nav';

type Stats = {
  writers: { name: string; count: number; avgScore: number; pass1Rate: number; rewriteCount: number }[];
};

export default function NhanSu() {
  const [s, setS] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => d.error ? setError(d.error) : setS(d))
      .catch(() => setError('Không tải được dữ liệu'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Nhân sự & Hiệu suất</h2>
        <p className="text-sm text-slate-500 mb-5">Ai viết gì, chất lượng ra sao — tính từ toàn bộ bài đã chấm.</p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!s && !error && <p className="text-slate-400 text-sm">Đang tải…</p>}

        {s && s.writers.length === 0 && <p className="text-slate-400 text-sm">Chưa có bài nào được chấm.</p>}

        {s && s.writers.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-xs text-slate-400 text-left border-b border-slate-100">
                  <th className="p-4">Người viết</th>
                  <th className="p-4">Số bài</th>
                  <th className="p-4">Điểm AI trung bình</th>
                  <th className="p-4">Tỷ lệ PASS lần 1</th>
                  <th className="p-4">Số bài REWRITE</th>
                </tr>
              </thead>
              <tbody>
                {s.writers.map(w => (
                  <tr key={w.name} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#1B4DB1] text-white text-xs font-bold mr-2">
                        {w.name.split(' ').pop()?.[0] ?? '?'}
                      </span>
                      {w.name}
                    </td>
                    <td className="p-4">{w.count}</td>
                    <td className={`p-4 font-semibold ${w.avgScore >= 85 ? 'text-green-600' : w.avgScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{w.avgScore}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${w.pass1Rate >= 70 ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${w.pass1Rate}%` }} />
                        </div>
                        {w.pass1Rate}%
                      </div>
                    </td>
                    <td className={`p-4 ${w.rewriteCount > 0 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>{w.rewriteCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
