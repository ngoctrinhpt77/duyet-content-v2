'use client';

import { useState } from 'react';
import Nav from '../nav';
import { CLAIMS, DISCLAIMER } from '@/lib/claims-data';
import { REGULATIONS, CORE_GATES, VOICE_TIERS, JOURNEY_TONES, EVIDENCE, PRECEDENTS, SCORING } from '@/lib/rules-data';
import { CHANNELS, JOURNEY_CHANNEL } from '@/lib/channel-standards';

const SECTIONS = [
  { id: 'claims', label: '📜 Sổ Claims' },
  { id: 'phap-luat', label: '⚖️ Pháp luật' },
  { id: 'cong-chan', label: '⛔ Cổng chặn' },
  { id: 'chuan-kenh', label: '📱 Chuẩn kênh' },
  { id: 'tong-giong', label: '🗣️ Tông giọng' },
  { id: 'bang-chung', label: '🔬 Bằng chứng' },
  { id: 'an-le', label: '📚 Án lệ duyệt' },
];

export default function Claims() {
  const [q, setQ] = useState('');
  const [sec, setSec] = useState('claims');
  const groups = [...new Set(CLAIMS.map(c => c.group))];
  const filtered = CLAIMS.filter(c =>
    !q || (c.code + c.allowed + c.banned + c.group).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-slate-800">Quy tắc & Claims — chuẩn duyệt của toàn hệ thống</h2>
          {sec === 'claims' && (
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Tìm mã claim, từ khóa…"
              className="rounded-lg border border-slate-300 text-sm p-2 w-64" />
          )}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSec(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${sec === s.id ? 'bg-[#1B4DB1] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {sec === 'phap-luat' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr className="text-xs text-slate-400 text-left border-b border-slate-100">
                <th className="p-4">Văn bản</th><th className="p-4">Nội dung liên quan</th><th className="p-4">Áp dụng khi viết</th>
              </tr></thead>
              <tbody>
                {REGULATIONS.map(r => (
                  <tr key={r.doc} className="border-b border-slate-50 align-top">
                    <td className="p-4 font-semibold text-slate-800 whitespace-nowrap">{r.doc}</td>
                    <td className="p-4 text-slate-600">{r.scope}</td>
                    <td className="p-4 text-slate-600">{r.apply}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sec === 'cong-chan' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Dính 1 trong 6 cổng = REWRITE ngay, bất kể bài hay đến đâu. AI chấm cũng theo đúng danh sách này.</p>
            {CORE_GATES.map(g => (
              <div key={g.code} className="bg-white rounded-xl border border-red-200 p-4">
                <p className="font-semibold text-red-800 text-sm">⛔ ({g.code}) {g.rule}</p>
                <p className="text-xs text-slate-500 mt-1">VD thực tế: {g.example}</p>
              </div>
            ))}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="font-semibold text-sm text-slate-700 mb-2">Thang điểm quyết định</h4>
              {SCORING.map(s => (
                <div key={s.range} className="flex gap-3 text-sm border-t border-slate-50 py-1.5 first:border-0">
                  <span className="w-44 font-mono text-slate-500">{s.range}</span>
                  <span className="w-24 font-semibold">{s.label}</span>
                  <span className="text-slate-600">{s.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sec === 'chuan-kenh' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Cùng một nội dung nhưng sai kênh vẫn bị trừ điểm nặng. AI chấm theo đúng bảng này.</p>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead><tr className="text-xs text-slate-400 text-left border-b border-slate-100">
                  <th className="p-3">Bậc phễu</th><th className="p-3">Kênh HỢP</th><th className="p-3">Kênh KHÔNG hợp</th><th className="p-3">Lưu ý</th>
                </tr></thead>
                <tbody>
                  {JOURNEY_CHANNEL.map(j => (
                    <tr key={j.stage} className="border-b border-slate-50 align-top">
                      <td className="p-3 font-semibold whitespace-nowrap">{j.stage}</td>
                      <td className="p-3 text-green-700">{j.best}</td>
                      <td className="p-3 text-red-600">{j.weak}</td>
                      <td className="p-3 text-slate-600">{j.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {CHANNELS.map(c => (
              <div key={c.channel} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h4 className="font-semibold text-slate-800">{c.channel}</h4>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{c.group}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{c.journey}</span>
                </div>
                <div className="grid gap-1.5 text-sm md:grid-cols-2">
                  <p><b>Độ dài:</b> <span className="text-slate-600">{c.length}</span></p>
                  <p><b>Tông:</b> <span className="text-slate-600">{c.tone}</span></p>
                  <p className="md:col-span-2"><b>Hook:</b> <span className="text-slate-600">{c.hook}</span></p>
                  <p className="md:col-span-2"><b>CTA:</b> <span className="text-slate-600">{c.cta}</span></p>
                </div>
                <div className="grid gap-2 md:grid-cols-2 mt-3 text-xs">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="font-semibold text-green-700 mb-1">✅ Bắt buộc có</p>
                    <ul className="list-disc list-inside text-green-900 space-y-0.5">{c.must.map((x,i)=><li key={i}>{x}</li>)}</ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-semibold text-red-700 mb-1">⛔ Tránh</p>
                    <ul className="list-disc list-inside text-red-900 space-y-0.5">{c.avoid.map((x,i)=><li key={i}>{x}</li>)}</ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sec === 'tong-giong' && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {VOICE_TIERS.map(v => (
                <div key={v.tier} className="bg-white rounded-xl border border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-800">{v.tier === 'Cao cấp' ? '👑' : '🏠'} {v.tier}</h4>
                  <p className="text-xs text-amber-700 mt-1">{v.brands}</p>
                  <p className="text-sm text-slate-600 mt-2"><b>Tông:</b> {v.tone}</p>
                  <p className="text-sm text-slate-600"><b>Lời hứa:</b> {v.promise}</p>
                  <p className="text-sm text-red-600"><b>Tránh:</b> {v.avoid}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead><tr className="text-xs text-slate-400 text-left border-b border-slate-100">
                  <th className="p-3">Bậc phễu</th><th className="p-3">Tông</th><th className="p-3">CTA chuẩn</th>
                </tr></thead>
                <tbody>
                  {JOURNEY_TONES.map(j => (
                    <tr key={j.stage} className="border-b border-slate-50">
                      <td className="p-3 font-semibold">{j.stage}</td>
                      <td className="p-3 text-slate-600">{j.tone}</td>
                      <td className="p-3 text-slate-600">{j.cta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">Quy tắc bất di: kênh brand ≠ kênh bán (không trộn tông) · nội dung nhóm kín NPP-ĐL không ra public.</p>
          </div>
        )}

        {sec === 'bang-chung' && (
          <div className="space-y-3">
            {EVIDENCE.map(e => (
              <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#1B4DB1]">{e.id}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{e.type}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 mt-1">{e.title}</p>
                <p className="text-xs text-orange-600 mt-1">Độ mạnh: {e.strength}</p>
                <div className="grid gap-2 md:grid-cols-2 text-sm mt-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3"><p className="text-xs font-semibold text-green-700 mb-1">✅ ĐƯỢC dùng</p><p className="text-green-900 text-xs">{e.allowed}</p></div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-xs font-semibold text-red-700 mb-1">⛔ CẤM</p><p className="text-red-900 text-xs">{e.banned}</p></div>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-500">Bằng chứng chờ nạp số hiệu: Bằng độc quyền Cục SHTT · ISO 13485:2016 · Phiếu kiểm nghiệm QCVN · Kiểm định an toàn điện · Tech Awards/VNR500 (ghi năm). Nạp qua tab Tài liệu SP (đính link) hoặc gửi Admin.</p>
          </div>
        )}

        {sec === 'an-le' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Phán quyết từ các phiên duyệt thật — đọc để không lặp lỗi cũ. Hệ thống chấm tự động theo đúng các án lệ này.</p>
            {PRECEDENTS.map((p, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-800"><span className="text-xs text-slate-400 mr-2">{p.date}</span><b>{p.case}</b></p>
                <p className="text-sm text-slate-600 mt-1">→ {p.ruling}</p>
              </div>
            ))}
          </div>
        )}

        {sec === 'claims' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm text-amber-800">
          📌 Miễn trừ chuẩn (bắt buộc kèm khi nói công dụng sức khỏe): <em>“{DISCLAIMER}”</em>
        </div>
        )}

        {sec === 'claims' && groups.map(g => {
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
