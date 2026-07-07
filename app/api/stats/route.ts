import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/stats — số liệu cho Tổng quan + Nhân sự
export async function GET() {
  const { data, error } = await db
    .from('mos_submissions')
    .select('writer, score, decision, status, created_at, brand')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const byStatus: Record<string, number> = {};
  const writers: Record<string, { count: number; totalScore: number; pass1: number; redflag: number }> = {};
  let redFlagTotal = 0;

  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    const w = (writers[r.writer] ??= { count: 0, totalScore: 0, pass1: 0, redflag: 0 });
    w.count++;
    w.totalScore += r.score ?? 0;
    if (r.decision === 'PASS') w.pass1++;
    if (r.decision === 'REWRITE') { w.redflag++; redFlagTotal++; }
  }

  const avgScore = rows.length
    ? Math.round(rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.length)
    : 0;
  const passRate = rows.length
    ? Math.round((rows.filter(r => r.decision === 'PASS').length / rows.length) * 100)
    : 0;

  return NextResponse.json({
    total: rows.length,
    byStatus,
    avgScore,
    passRate,
    redFlagTotal,
    writers: Object.entries(writers).map(([name, w]) => ({
      name,
      count: w.count,
      avgScore: Math.round(w.totalScore / w.count),
      pass1Rate: Math.round((w.pass1 / w.count) * 100),
      rewriteCount: w.redflag,
    })).sort((a, b) => b.count - a.count),
    recent: rows.slice(0, 8),
  });
}
