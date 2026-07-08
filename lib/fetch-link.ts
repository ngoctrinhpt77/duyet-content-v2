// Đọc nội dung text từ link tài liệu (Google Docs/Sheets/Drive, OneDrive, web)
// Chỉ đọc được file đã mở quyền "Anyone with the link can view".

const MAX_CHARS = 6000;

function transformUrl(url: string): string {
  // Google Docs → export txt
  let m = url.match(/docs\.google\.com\/document\/d\/([\w-]+)/);
  if (m) return `https://docs.google.com/document/d/${m[1]}/export?format=txt`;
  // Google Sheets → export csv
  m = url.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
  if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv`;
  // Google Drive file → direct download
  m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  return url;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchLinkContent(url: string): Promise<{ content: string | null; error?: string }> {
  try {
    const res = await fetch(transformUrl(url), {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (MOS-DaiViet content-reader)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { content: null, error: `HTTP ${res.status} — link chưa mở quyền xem công khai?` };

    const type = res.headers.get('content-type') ?? '';
    if (!/text|csv|json|xml/.test(type)) {
      return { content: null, error: `Định dạng ${type.split(';')[0]} chưa đọc được — dùng Google Docs/Sheets hoặc link web` };
    }
    const raw = await res.text();
    const text = type.includes('html') ? stripHtml(raw) : raw.trim();
    if (!text) return { content: null, error: 'File rỗng hoặc không trích xuất được chữ' };
    return { content: text.slice(0, MAX_CHARS) };
  } catch {
    return { content: null, error: 'Không kết nối được link (timeout/chặn truy cập)' };
  }
}
