'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/tong-quan', label: '📊 Tổng quan' },
  { href: '/', label: '⚡ Nộp bài' },
  { href: '/duyet', label: '📋 Hàng chờ' },
  { href: '/kho', label: '📚 Kho copy' },
  { href: '/claims', label: '📜 Sổ Claims' },
  { href: '/tai-lieu', label: '📦 Tài liệu SP' },
  { href: '/nhan-su', label: '👥 Nhân sự' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="bg-[#0f2a5c] text-white px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold">
          MOS – Đại Việt <span className="font-normal text-blue-200 text-sm">· Duyệt content bằng AI</span>
        </h1>
        <nav className="flex gap-1">
          {TABS.map(t => (
            <Link key={t.href} href={t.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                path === t.href ? 'bg-white/15 font-semibold' : 'text-blue-100 hover:bg-white/10'
              }`}>
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
