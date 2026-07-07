'use client';

import { useEffect, useState, useCallback } from 'react';
import Nav from '../nav';

type Note = {
  id: string; created_at: string; product: string; brand: string | null;
  note_type: string; note: string; effective_from: string | null;
  effective_to: string | null; warn_on_review: boolean; created_by: string | null;
};

const TYPE_LABEL: Record<string, [string, string]> = {
  doi_gia: ['💰 Đổi giá', 'bg-amber-100 text-amber-700'],
  ngung_ban: ['⛔ Ngừng bán', 'bg-red-100 text-red-700'],
  claim_moi: ['📜 Claim mới', 'bg-green-100 text-green-700'],
  khuyen_mai: ['🎁 Khuyến mãi', 'bg-blue-100 text-blue-700'],
  luu_y: ['📌 Lưu ý viết bài', 'bg-slate-100 text-slate-700'],
};

export default function TaiLieu() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ product: '', brand: '', note_type: 'luu_y', note: '', effective_from: '', effective_to: '', created_by: '' });

  const load = useCallback(() => {
    fetch('/api/notes').then(r => r.json())
      .then(d => Array.isArray(d) ? setNotes(d) : setError(d.error ?? 'Lỗi tải'))
      .catch(() => setError('Không kết nối được'));
  }, []);
  useEffect(load, [load]);

  async function add() {
    const res = await fetch('/api/notes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
    });
    const d = await res.json();
    if (!res.ok) { alert(d.error); return; }
    setShowForm(false);
    setF({ product: '', brand: '', note_type: 'luu_y', note: '', effective_from: '', effective_to: '', created_by: '' });
    load();
  }

  async function remove(id: string) {
    if (!confirm('Gỡ ghi chú này?')) return;
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
    load();
  }

  const missingTable = error.includes('mos_product_notes');

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-slate-800">Tài liệu sản phẩm — ghi chú theo thời gian</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#1B4DB1] text-white text-sm font-semibold px-4 py-2 rounded-lg">
            {showForm ? 'Đóng' : '+ Thêm ghi chú'}
          </button>
        </div>

        {missingTable && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-sm text-amber-800 mb-4">
            ⚠️ Chưa tạo bảng ghi chú. Mở Supabase → SQL Editor → chạy file <code className="bg-amber-100 px-1 rounded">supabase-setup-2.sql</code> trong thư mục app (1 phút) rồi tải lại trang.
          </div>
        )}
        {error && !missingTable && <p className="text-red-600 text-sm mb-3">{error}</p>}

        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 grid gap-3 md:grid-cols-2">
            <input value={f.product} onChange={e => setF({ ...f, product: e.target.value })}
              placeholder="Sản phẩm/model * (VD: Makano MN205)" className="rounded-lg border border-slate-300 text-sm p-2" />
            <input value={f.brand} onChange={e => setF({ ...f, brand: e.target.value })}
              placeholder="Thương hiệu (VD: Makano)" className="rounded-lg border border-slate-300 text-sm p-2" />
            <select value={f.note_type} onChange={e => setF({ ...f, note_type: e.target.value })}
              className="rounded-lg border border-slate-300 text-sm p-2">
              {Object.entries(TYPE_LABEL).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <input value={f.created_by} onChange={e => setF({ ...f, created_by: e.target.value })}
              placeholder="Người tạo ghi chú" className="rounded-lg border border-slate-300 text-sm p-2" />
            <div className="flex gap-2 items-center text-sm text-slate-500">
              Hiệu lực: <input type="date" value={f.effective_from} onChange={e => setF({ ...f, effective_from: e.target.value })} className="rounded-lg border border-slate-300 text-sm p-1.5" />
              → <input type="date" value={f.effective_to} onChange={e => setF({ ...f, effective_to: e.target.value })} className="rounded-lg border border-slate-300 text-sm p-1.5" />
            </div>
            <textarea value={f.note} onChange={e => setF({ ...f, note: e.target.value })} rows={2}
              placeholder="Nội dung * (VD: Áp dụng giá mới 19.500.000đ từ 01/08 — bài viết dùng giá cũ phải sửa)"
              className="rounded-lg border border-slate-300 text-sm p-2 md:col-span-2" />
            <button onClick={add} disabled={!f.product.trim() || !f.note.trim()}
              className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 md:col-span-2">
              Lưu ghi chú
            </button>
          </div>
        )}

        {!error && notes.length === 0 && (
          <p className="text-slate-400 text-sm">Chưa có ghi chú nào. Thêm ghi chú (đổi giá, ngừng bán, claim mới…) — AI sẽ cảnh báo khi duyệt bài nhắc tới sản phẩm đó.</p>
        )}

        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-800">{n.product}</span>
                  {n.brand && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{n.brand}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_LABEL[n.note_type]?.[1] ?? 'bg-slate-100'}`}>
                    {TYPE_LABEL[n.note_type]?.[0] ?? n.note_type}
                  </span>
                  {n.warn_on_review && <span className="text-xs text-orange-500">⚠️ cảnh báo khi duyệt</span>}
                </div>
                <p className="text-sm text-slate-700">{n.note}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {n.effective_from ? `Hiệu lực ${n.effective_from}${n.effective_to ? ` → ${n.effective_to}` : ''}` : `Tạo ${new Date(n.created_at).toLocaleDateString('vi-VN')}`}
                  {n.created_by ? ` · bởi ${n.created_by}` : ''}
                </p>
              </div>
              <button onClick={() => remove(n.id)} className="text-slate-300 hover:text-red-500 text-sm shrink-0">✕</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
