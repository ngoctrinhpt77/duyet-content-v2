// Lớp HIỂN THỊ cho Director — biến kết quả AI (đang giống một bản báo cáo)
// thành DỮ LIỆU QUYẾT ĐỊNH: badge, issue có phân loại, top 3 việc, diff.
// Thuần hàm, không gọi API, KHÔNG đụng lib/quality-gate.ts (luật gate giữ nguyên).

export type Gates = {
  fact?: { status?: string; contradicted?: number; unverified_critical?: number };
  journey?: { status?: string; declared?: string; detected?: string; match?: boolean };
  conversion?: { status?: string; score?: number; threshold?: number };
  legal?: { status?: string; highest?: string };
  generic?: { risk?: string };
} | null;

export type PlanItem = {
  no?: number | string; topic?: string; product?: string; journey?: string;
  channel?: string; gate?: string; score?: number; issue?: string;
};

export type ReviewJson = {
  summary?: string;
  red_flags?: { quote?: string; rule?: string; fix?: string }[];
  required_edits?: string[];
  fact_checks?: { claim?: string; status?: string; database?: string; source?: string; critical?: boolean; explanation?: string }[];
  legal_issues?: { issue?: string; severity?: string; rule?: string; fix?: string }[];
  journey?: { declared?: string; detected?: string; match?: boolean; explanation?: string };
  conversion?: { score?: number; top3?: string[]; missing?: string[] };
  generic_risk?: string;
  generic_reason?: string;
  // --- plan ---
  plan_title?: string;
  total_items?: number;
  blocking_issues?: string[];
  recommendations?: string[];
  plan_issues?: string[];
  items?: PlanItem[];
  dimensions?: Record<string, { score?: number; issues?: string[]; sai_kenh?: string[]; ty_le_phieu?: string; phu_song?: string; best_hook?: string; weakest_hook?: string }>;
} | null;

export type Row = {
  id: string; created_at: string; content: string;
  channel: string | null; brand: string | null; writer: string;
  score: number | null; decision: string | null; status: string;
  review: ReviewJson;
  gate_status?: 'PASS' | 'WARN' | 'FAIL' | null;
  gates?: Gates;
  override_requested?: string | null;
  version?: number | null;
  parent_id?: string | null;
  declared_journey?: string | null;
  objective?: string | null;
  audience?: string | null;
  final_note?: string | null;
};

export type Category = 'FACT' | 'LEGAL' | 'JOURNEY' | 'CONVERSION' | 'GENERIC' | 'BRAND' | 'CTA' | 'OTHER';
export type Severity = 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW';

export type Issue = {
  category: Category;
  severity: Severity;
  quote?: string;    // trích nguyên văn / vị trí trong plan
  finding: string;   // AI phát hiện gì
  source?: string;   // căn cứ
  action?: string;   // phải làm gì
};

const SEV_RANK: Record<Severity, number> = { BLOCKER: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const CAT_UI: Record<Category, { label: string; cls: string }> = {
  FACT:       { label: 'FACT',       cls: 'bg-red-50 text-red-700 border-red-200' },
  LEGAL:      { label: 'LEGAL',      cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  JOURNEY:    { label: 'JOURNEY',    cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  CONVERSION: { label: 'CONVERSION', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  GENERIC:    { label: 'GENERIC',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  BRAND:      { label: 'BRAND',      cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  CTA:        { label: 'CTA',        cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  OTHER:      { label: 'KHÁC',       cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export const SEV_UI: Record<Severity, { label: string; cls: string }> = {
  BLOCKER: { label: 'BLOCKER', cls: 'bg-red-600 text-white' },
  HIGH:    { label: 'HIGH',    cls: 'bg-orange-500 text-white' },
  MEDIUM:  { label: 'MEDIUM',  cls: 'bg-yellow-400 text-yellow-900' },
  LOW:     { label: 'LOW',     cls: 'bg-slate-200 text-slate-600' },
};

// ---------------------------------------------------------------- loại item
export function kindOf(r: Row): 'PLAN' | 'CONTENT' {
  return r.channel === 'Content Plan' || r.content?.startsWith('[PLAN]') ? 'PLAN' : 'CONTENT';
}

// Mã model xuất hiện trong bài: DN304, DC-300, MN205, DT400B…
const MODEL_RE = /\b([A-Z]{2,3})[-\s]?(\d{3,4}[A-Z]?)\b/g;
export function productsOf(r: Row, max = 3): string[] {
  const src = (r.content ?? '').slice(0, 6000).toUpperCase();
  const seen: string[] = [];
  for (const m of src.matchAll(MODEL_RE)) {
    const code = `${m[1]}${m[2]}`;
    if (!seen.includes(code)) seen.push(code);
    if (seen.length >= max) break;
  }
  return seen;
}

// ------------------------------------------------------- báo cáo → issue[]
export function toIssues(r: Row): Issue[] {
  const v = r.review ?? {};
  const out: Issue[] = [];

  // --- FACT (chỉ lấy claim có vấn đề, bỏ VERIFIED) ---
  for (const f of v.fact_checks ?? []) {
    if (f.status === 'CONTRADICTED') {
      // claim nằm ngay trong finding để Director đọc 1 dòng là hiểu, không phải mở chi tiết
      out.push({
        category: 'FACT', severity: 'BLOCKER',
        finding: `Sai dữ liệu: “${f.claim}”${f.database ? ` — chuẩn: ${f.database}` : ''}`,
        source: f.source ?? f.explanation, action: 'Sửa đúng số liệu chuẩn rồi chấm lại',
      });
    } else if (f.status === 'UNVERIFIED') {
      out.push({
        category: 'FACT', severity: f.critical ? 'HIGH' : 'LOW',
        finding: `Chưa xác minh được: “${f.claim}” (không tìm thấy cơ sở — chưa kết luận là sai)`,
        source: f.source ?? f.explanation,
        action: f.critical ? 'Bổ sung nguồn hoặc bỏ claim' : 'Rà lại nguồn khi có thời gian',
      });
    }
  }

  // --- LEGAL ---
  for (const l of v.legal_issues ?? []) {
    const sev: Severity = l.severity === 'CRITICAL' ? 'BLOCKER'
      : l.severity === 'HIGH' ? 'HIGH' : l.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';
    out.push({ category: 'LEGAL', severity: sev, finding: l.issue ?? '', source: l.rule, action: l.fix });
  }

  // --- CỜ ĐỎ: phân loại theo bản chất quy tắc (pháp lý / sai dữ liệu / brand) ---
  for (const f of v.red_flags ?? []) {
    const cat = catOfText(`${f.rule ?? ''} ${f.quote ?? ''}`, 'BRAND');
    out.push({ category: cat, severity: 'HIGH', quote: f.quote, finding: f.rule ?? 'Vi phạm quy tắc thương hiệu', action: f.fix });
  }

  // --- JOURNEY ---
  const g = r.gates ?? undefined;
  const jd = g?.journey?.declared ?? v.journey?.declared ?? r.declared_journey ?? undefined;
  const jt = g?.journey?.detected ?? v.journey?.detected;
  if (jd && jt && g?.journey?.match === false) {
    out.push({
      category: 'JOURNEY', severity: g.journey?.status === 'FAIL' ? 'BLOCKER' : 'MEDIUM',
      finding: `Khai "${jd}" nhưng bài đang làm nhiệm vụ "${jt}"`,
      source: v.journey?.explanation, action: `Viết đúng nhiệm vụ ${jd} hoặc đổi lại journey khai báo`,
    });
  }

  // --- CONVERSION ---
  const cs = g?.conversion?.score ?? v.conversion?.score;
  const th = g?.conversion?.threshold;
  if (typeof cs === 'number' && typeof th === 'number' && cs < th) {
    out.push({
      category: 'CONVERSION', severity: g?.conversion?.status === 'NOT_READY' ? 'HIGH' : 'MEDIUM',
      finding: `Conversion Readiness ${cs}/${th} — chưa đủ sức bán hàng ở bậc "${jd ?? '—'}"`,
      action: (v.conversion?.top3 ?? [])[0],
    });
  }
  for (const t of (v.conversion?.top3 ?? []).slice(0, 3)) {
    out.push({ category: 'CONVERSION', severity: 'MEDIUM', finding: t, action: '' });
  }

  // --- GENERIC ---
  const risk = v.generic_risk ?? g?.generic?.risk;
  if (risk === 'HIGH' || risk === 'MEDIUM') {
    out.push({
      category: 'GENERIC', severity: risk === 'HIGH' ? 'HIGH' : 'MEDIUM',
      finding: v.generic_reason ?? 'Nội dung generic — thay tên thương hiệu khác vẫn đúng',
      action: 'Thêm insight cụ thể, lý do tin, điểm khác biệt',
    });
  }

  // --- PLAN: lỗi chặn cấp plan + vấn đề chiến lược ---
  for (const b of v.blocking_issues ?? []) {
    out.push({ category: catOfText(b), severity: 'BLOCKER', finding: b, action: 'Sửa trước khi cho viết' });
  }
  for (const p of v.plan_issues ?? []) {
    out.push({ category: catOfText(p), severity: 'HIGH', finding: p });
  }
  for (const [k, d] of Object.entries(v.dimensions ?? {})) {
    const cat = DIM_CAT[k] ?? 'OTHER';
    for (const s of d.issues ?? []) out.push({ category: cat, severity: 'MEDIUM', finding: s });
    for (const s of d.sai_kenh ?? []) out.push({ category: 'JOURNEY', severity: 'HIGH', finding: `Sai kênh theo bậc phễu: ${s}` });
  }

  // --- việc cần sửa còn lại ---
  for (const e of v.required_edits ?? []) {
    out.push({ category: 'OTHER', severity: 'LOW', finding: e });
  }

  return dedupe(out).sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
}

const DIM_CAT: Record<string, Category> = {
  journey: 'JOURNEY', product: 'FACT', legal: 'LEGAL',
  attractiveness: 'GENERIC', structure: 'CTA',
};

function catOfText(s: string, fallback: Category = 'OTHER'): Category {
  const t = (s ?? '').toLowerCase();
  // tiền tố AI hay dùng — chính xác hơn từ khóa rời
  if (/thông tin sản phẩm|nhầm model|sai model|sai mã/.test(t)) return 'FACT';
  if (/pháp lý|legal|claim|chữa|điều trị|thiết bị y tế|miễn trừ|giá sỉ|chiết khấu|qcvn|quảng cáo|tuyệt đối|cam kết/.test(t)) return 'LEGAL';
  if (/cấu trúc|số học|tỷ trọng|cta|kêu gọi hành động/.test(t)) return 'CTA';
  if (/chinh_xac|chính xác|thông số|nhầm lẫn|mâu thuẫn|dung tích|công suất|bảo hành|tính năng của|xác minh/.test(t)) return 'FACT';
  if (/journey|phễu|tofu|mofu|bofu|retention|referral|kênh|hành trình/.test(t)) return 'JOURNEY';
  if (/hook|insight|generic|hấp dẫn|trùng lặp|lặp lại|angle/.test(t)) return 'GENERIC';
  return fallback;
}

function dedupe(list: Issue[]): Issue[] {
  const seen = new Set<string>();
  return list.filter(i => {
    const k = `${i.category}|${(i.finding ?? '').slice(0, 90)}`;
    if (!i.finding || seen.has(k)) return false;
    seen.add(k); return true;
  });
}

export function topIssues(list: Issue[], n = 3): Issue[] {
  return list.filter(i => i.severity === 'BLOCKER' || i.severity === 'HIGH').slice(0, n);
}

// ------------------------------------------------------------------ badges
export type Badge = { text: string; cls: string };
export function badgesOf(r: Row, issues: Issue[]): Badge[] {
  const b: Badge[] = [];
  const g = r.gates ?? undefined;

  const fact = (g?.fact?.contradicted ?? 0) || issues.filter(i => i.category === 'FACT' && i.severity === 'BLOCKER').length;
  if (fact) b.push({ text: `${fact} FACT`, cls: 'bg-red-100 text-red-700' });

  const legal = issues.filter(i => i.category === 'LEGAL' && (i.severity === 'BLOCKER' || i.severity === 'HIGH')).length;
  if (legal) b.push({ text: `${legal} LEGAL`, cls: 'bg-rose-100 text-rose-700' });

  if (g?.journey?.match === false) b.push({ text: 'JOURNEY MISMATCH', cls: 'bg-purple-100 text-purple-700' });

  const cs = g?.conversion?.score ?? r.review?.conversion?.score;
  if (typeof cs === 'number') {
    const th = g?.conversion?.threshold ?? 55;
    b.push({ text: `CONVERSION ${cs}`, cls: cs >= th ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700' });
  }

  const risk = r.review?.generic_risk ?? g?.generic?.risk;
  if (risk === 'HIGH') b.push({ text: 'GENERIC', cls: 'bg-amber-100 text-amber-800' });

  return b;
}

// -------------------------------------------------------------- sort & lọc
// Ưu tiên: rủi ro cao → FAIL → WARN → PASS → mới nhất
export function riskRank(r: Row, issues: Issue[]): number {
  const hasBlocker = issues.some(i => i.severity === 'BLOCKER' && (i.category === 'FACT' || i.category === 'LEGAL'));
  if (hasBlocker) return 0;
  if (issues.some(i => i.severity === 'BLOCKER')) return 1;
  if (r.gate_status === 'FAIL') return 2;
  if (r.gate_status === 'WARN') return 3;
  if (r.gate_status === 'PASS') return 4;
  return 5; // bài cũ chưa qua Gate
}

export type FilterKey = 'BLOCKER' | 'FACT' | 'LEGAL' | 'CONVERSION' | 'PLAN' | 'CONTENT';
export function matchFilter(r: Row, issues: Issue[], f: FilterKey): boolean {
  switch (f) {
    case 'BLOCKER': return issues.some(i => i.severity === 'BLOCKER');
    case 'FACT': return issues.some(i => i.category === 'FACT' && i.severity !== 'LOW');
    case 'LEGAL': return issues.some(i => i.category === 'LEGAL' && i.severity !== 'LOW');
    case 'CONVERSION': {
      const g = r.gates?.conversion;
      return !!g && typeof g.score === 'number' && typeof g.threshold === 'number' && g.score < g.threshold;
    }
    case 'PLAN': return kindOf(r) === 'PLAN';
    case 'CONTENT': return kindOf(r) === 'CONTENT';
  }
}

// ------------------------------------------------------------- PLAN HEALTH
export type PlanHealth = {
  total?: number;
  pass?: number; warn?: number; fail?: number;
  awareness?: number; consideration?: number; conversion?: number; retention?: number;
  generic?: number; weakCta?: number; unverified?: number;
};

const J_MAP: Record<string, keyof PlanHealth> = {
  tofu: 'awareness', awareness: 'awareness',
  mofu: 'consideration', consideration: 'consideration',
  bofu: 'conversion', conversion: 'conversion',
  retention: 'retention', referral: 'retention',
};

// Đếm bằng CODE từ items[] AI trả về — không để AI tự khai số, không bịa metric.
export function planHealth(r: Row): PlanHealth | null {
  const v = r.review ?? {};
  const items = v.items ?? [];
  if (!items.length) return v.total_items ? { total: v.total_items } : null;
  return healthFromItems(items);
}

export function healthFromItems(items: PlanItem[]): PlanHealth | null {
  if (!items.length) return null;
  const h: PlanHealth = { total: items.length, pass: 0, warn: 0, fail: 0 };
  let anyGate = false, anyJourney = false;
  for (const it of items) {
    const gt = (it.gate ?? '').toUpperCase();
    if (gt === 'PASS' || gt === 'WARN' || gt === 'FAIL') {
      anyGate = true;
      h[gt.toLowerCase() as 'pass' | 'warn' | 'fail'] = (h[gt.toLowerCase() as 'pass' | 'warn' | 'fail'] ?? 0) + 1;
    }
    const jk = J_MAP[(it.journey ?? '').toLowerCase().trim()];
    if (jk) { anyJourney = true; h[jk] = ((h[jk] as number) ?? 0) + 1; }
  }
  if (!anyGate) { delete h.pass; delete h.warn; delete h.fail; }
  if (!anyJourney) { delete h.awareness; delete h.consideration; delete h.conversion; delete h.retention; }
  return h;
}

// ------------------------------------------------------------------- DIFF
export type DiffLine = { type: 'same' | 'add' | 'del'; text: string };

// Diff theo DÒNG (LCS). Đủ nhẹ, không cần thư viện ngoài.
export function diffLines(a: string, b: string, maxLines = 600): DiffLine[] {
  const A = (a ?? '').split('\n').slice(0, maxLines);
  const B = (b ?? '').split('\n').slice(0, maxLines);
  const n = A.length, m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: 'same', text: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: A[i] }); i++; }
    else { out.push({ type: 'add', text: B[j] }); j++; }
  }
  while (i < n) out.push({ type: 'del', text: A[i++] });
  while (j < m) out.push({ type: 'add', text: B[j++] });
  return out.filter(l => l.text.trim() !== '' || l.type !== 'same');
}

// Chỉ giữ vùng thay đổi + 1 dòng ngữ cảnh mỗi bên → Director không đọc lại toàn bài.
export function compactDiff(lines: DiffLine[]): (DiffLine | { type: 'skip'; text: string })[] {
  const keep = new Set<number>();
  lines.forEach((l, i) => {
    if (l.type !== 'same') { keep.add(i - 1); keep.add(i); keep.add(i + 1); }
  });
  const out: (DiffLine | { type: 'skip'; text: string })[] = [];
  let skipped = 0;
  lines.forEach((l, i) => {
    if (keep.has(i)) {
      if (skipped) { out.push({ type: 'skip', text: `… ${skipped} dòng không đổi` }); skipped = 0; }
      out.push(l);
    } else skipped++;
  });
  if (skipped) out.push({ type: 'skip', text: `… ${skipped} dòng không đổi` });
  return out;
}

// So sánh chỉ số giữa bản gốc và bản sửa — chỉ trả metric CÓ dữ liệu ở cả 2 bản.
export type Delta = { label: string; from: string; to: string; better: boolean };
export function gateDelta(prev: Row, cur: Row): { deltas: Delta[]; resolved: { fixed: number; total: number } | null } {
  const deltas: Delta[] = [];
  const p = prev.gates ?? undefined, c = cur.gates ?? undefined;

  const pair = (label: string, from?: string, to?: string, betterWhen?: string) => {
    if (!from || !to || from === to) return;
    deltas.push({ label, from, to, better: to === (betterWhen ?? 'PASS') });
  };
  pair('Fact', p?.fact?.status, c?.fact?.status);
  pair('Journey', p?.journey?.status, c?.journey?.status);
  pair('Legal', p?.legal?.status, c?.legal?.status);

  const ps = p?.conversion?.score, cs = c?.conversion?.score;
  if (typeof ps === 'number' && typeof cs === 'number' && ps !== cs)
    deltas.push({ label: 'Conversion', from: String(ps), to: String(cs), better: cs > ps });

  if (prev.score != null && cur.score != null && prev.score !== cur.score)
    deltas.push({ label: 'Điểm', from: String(prev.score), to: String(cur.score), better: cur.score > prev.score });

  const pb = toIssues(prev).filter(i => i.severity === 'BLOCKER');
  const cb = toIssues(cur).filter(i => i.severity === 'BLOCKER');
  const resolved = pb.length ? { fixed: Math.max(0, pb.length - cb.length), total: pb.length } : null;

  return { deltas, resolved };
}
