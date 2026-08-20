// AI Quality Gate — quyết định PASS/WARN/FAIL bằng CODE (deterministic).
// AI chỉ phân tích & phân loại evidence; luật chốt nằm ở đây.

export type FactCheck = {
  claim: string;
  status: 'VERIFIED' | 'UNVERIFIED' | 'CONTRADICTED';
  database?: string;   // dữ liệu chuẩn
  source?: string;     // Product Document / Claims Register / ...
  critical?: boolean;  // claim trọng yếu (thông số, giá, model, chứng nhận, bảo hành)
  explanation?: string;
};

export type LegalIssue = {
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  rule?: string;
  fix?: string;
};

export type AiReview = {
  fact_checks?: FactCheck[];
  legal_issues?: LegalIssue[];
  journey?: { declared?: string; detected?: string; match?: boolean; explanation?: string };
  conversion?: { score?: number; status?: string; top3?: string[]; missing?: string[] };
  generic_risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  generic_reason?: string;
  score?: number;
  decision?: string;
};

export type GateResult = {
  gate_status: 'PASS' | 'WARN' | 'FAIL';
  gates: {
    fact: { status: 'PASS' | 'WARN' | 'FAIL'; contradicted: number; unverified_critical: number };
    journey: { status: 'PASS' | 'WARN' | 'FAIL'; declared?: string; detected?: string; match: boolean };
    conversion: { status: 'READY' | 'NEEDS_IMPROVEMENT' | 'NOT_READY'; score: number; threshold: number };
    legal: { status: 'PASS' | 'WARN' | 'FAIL'; highest: string };
    generic: { risk: string };
  };
  blockers: string[];       // lý do FAIL — hiển thị cho người viết
  warnings: string[];       // WARN — gửi được nhưng lưu lại
  can_request_exception: boolean; // FACT CONTRADICTED / LEGAL CRITICAL → false (không cho bypass)
};

// Ngưỡng Conversion Readiness theo Journey khai báo:
// Awareness không bị ép có Offer/CTA mạnh; Conversion thì bắt buộc.
const CONV_THRESHOLD: Record<string, number> = {
  Awareness: 45,
  Consideration: 55,
  Conversion: 70,
  Retention: 50,
};

const SEV_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function evaluateGate(r: AiReview, declaredJourney?: string): GateResult {
  const facts = r.fact_checks ?? [];
  const legal = r.legal_issues ?? [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  // ---- GATE 1: FACT ----
  const contradicted = facts.filter(f => f.status === 'CONTRADICTED');
  const unverifiedCritical = facts.filter(f => f.status === 'UNVERIFIED' && f.critical);
  let factStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  if (contradicted.length) {
    factStatus = 'FAIL';
    contradicted.forEach(f =>
      blockers.push(`Sai dữ liệu: "${f.claim}"${f.database ? ` — chuẩn: ${f.database}` : ''}${f.source ? ` (${f.source})` : ''}`)
    );
  } else if (unverifiedCritical.length) {
    // Không tìm thấy nguồn ≠ sai, NHƯNG claim trọng yếu chưa xác minh thì không được khẳng định
    factStatus = 'FAIL';
    unverifiedCritical.forEach(f =>
      blockers.push(`Chưa xác minh được (claim trọng yếu): "${f.claim}" — cần kiểm nguồn trước khi dùng`)
    );
  } else {
    const unverified = facts.filter(f => f.status === 'UNVERIFIED');
    if (unverified.length) {
      factStatus = 'WARN';
      warnings.push(`${unverified.length} thông tin chưa xác minh được trong Knowledge Base`);
    }
  }

  // ---- GATE 4: BRAND / LEGAL ----
  const highest = legal.reduce((acc, l) =>
    SEV_ORDER.indexOf(l.severity) > SEV_ORDER.indexOf(acc) ? l.severity : acc, 'LOW');
  let legalStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  const critical = legal.filter(l => l.severity === 'CRITICAL');
  const high = legal.filter(l => l.severity === 'HIGH');
  if (critical.length) {
    legalStatus = 'FAIL';
    critical.forEach(l => blockers.push(`Rủi ro pháp lý NGHIÊM TRỌNG: ${l.issue}${l.rule ? ` (${l.rule})` : ''}`));
  } else if (high.length) {
    legalStatus = 'FAIL';
    high.forEach(l => blockers.push(`Rủi ro pháp lý cao: ${l.issue}${l.rule ? ` (${l.rule})` : ''}`));
  } else if (legal.some(l => l.severity === 'MEDIUM')) {
    legalStatus = 'WARN';
    warnings.push('Có vấn đề brand/pháp lý mức trung bình cần rà lại');
  }

  // ---- GATE 2: JOURNEY ----
  const declared = declaredJourney || r.journey?.declared;
  const detected = r.journey?.detected;
  const match = declared && detected ? normJ(declared) === normJ(detected) : true;
  let journeyStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  if (declared && detected && !match) {
    // Lệch 1 bậc = WARN; lệch xa (vd khai Conversion nhưng viết Awareness) = FAIL
    const gap = Math.abs(rank(declared) - rank(detected));
    if (gap >= 2 || normJ(declared) === 'conversion') {
      journeyStatus = 'FAIL';
      blockers.push(`Sai nhiệm vụ content: khai "${declared}" nhưng bài đang viết ở mức "${detected}"${r.journey?.explanation ? ` — ${r.journey.explanation}` : ''}`);
    } else {
      journeyStatus = 'WARN';
      warnings.push(`Journey lệch nhẹ: khai "${declared}", bài nghiêng về "${detected}"`);
    }
  }

  // ---- GATE 3: CONVERSION READINESS ----
  const convScore = typeof r.conversion?.score === 'number' ? r.conversion.score : 0;
  const threshold = CONV_THRESHOLD[normLabel(declared)] ?? 55;
  let convStatus: 'READY' | 'NEEDS_IMPROVEMENT' | 'NOT_READY';
  if (convScore >= threshold) convStatus = 'READY';
  else if (convScore >= threshold - 15) convStatus = 'NEEDS_IMPROVEMENT';
  else convStatus = 'NOT_READY';

  if (convStatus === 'NOT_READY' && normJ(declared || '') === 'conversion') {
    blockers.push(`Bài Conversion nhưng thiếu cấu trúc bán hàng cơ bản (${convScore}/${threshold} điểm)`);
  } else if (convStatus !== 'READY') {
    warnings.push(`Conversion Readiness ${convScore}/${threshold} — còn cải thiện được`);
  }

  // ---- GENERIC ----
  const generic = r.generic_risk ?? 'LOW';
  if (generic === 'HIGH') warnings.push('Nội dung generic — thay tên thương hiệu khác vẫn đúng');

  // ---- TỔNG HỢP ----
  const gate_status: 'PASS' | 'WARN' | 'FAIL' =
    blockers.length ? 'FAIL' : warnings.length ? 'WARN' : 'PASS';

  // Không cho xin ngoại lệ nếu sai fact hoặc pháp lý CRITICAL
  const can_request_exception = !(contradicted.length > 0 || critical.length > 0);

  return {
    gate_status,
    gates: {
      fact: { status: factStatus, contradicted: contradicted.length, unverified_critical: unverifiedCritical.length },
      journey: { status: journeyStatus, declared, detected, match },
      conversion: { status: convStatus, score: convScore, threshold },
      legal: { status: legalStatus, highest },
      generic: { risk: generic },
    },
    blockers,
    warnings,
    can_request_exception,
  };
}

const MAP: Record<string, string> = {
  tofu: 'awareness', mofu: 'consideration', bofu: 'conversion',
  awareness: 'awareness', consideration: 'consideration',
  conversion: 'conversion', retention: 'retention', referral: 'retention',
};
function normJ(s: string) { return MAP[(s || '').toLowerCase().trim()] ?? (s || '').toLowerCase().trim(); }
function rank(s: string) {
  const order = ['awareness', 'consideration', 'conversion', 'retention'];
  const i = order.indexOf(normJ(s));
  return i < 0 ? 0 : i;
}
function normLabel(s?: string) {
  const n = normJ(s || '');
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
}
