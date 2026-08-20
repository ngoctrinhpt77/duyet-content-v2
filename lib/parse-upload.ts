import * as XLSX from 'xlsx';

export type Upload = { name: string; mime: string; data: string }; // data = base64 (không kèm prefix)

export type ParsedUpload =
  | { kind: 'text'; text: string; note: string }
  | { kind: 'media'; mime: string; data: string; note: string }   // gửi thẳng cho Gemini (ảnh/PDF)
  | { kind: 'error'; error: string };

const MAX_MB = 15;

export function parseUpload(f: Upload): ParsedUpload {
  const bytes = Math.ceil((f.data.length * 3) / 4);
  if (bytes > MAX_MB * 1024 * 1024) {
    return { kind: 'error', error: `File quá lớn (>${MAX_MB}MB). Hãy tách nhỏ hoặc dán link Google Sheet.` };
  }
  const name = (f.name || '').toLowerCase();
  const mime = f.mime || '';

  // Ảnh & PDF → để Gemini đọc trực tiếp (vision)
  if (mime.startsWith('image/') || mime === 'application/pdf' || /\.(png|jpe?g|webp|heic|pdf)$/.test(name)) {
    return {
      kind: 'media',
      mime: mime.startsWith('image/') || mime === 'application/pdf' ? mime : (name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
      data: f.data,
      note: name.endsWith('.pdf') ? 'Đọc trực tiếp từ file PDF' : 'Đọc trực tiếp từ ảnh chụp bảng plan',
    };
  }

  // Excel → chuyển mọi sheet thành CSV
  if (/\.(xlsx|xlsm|xlsb|xls)$/.test(name) || mime.includes('spreadsheet') || mime.includes('excel')) {
    try {
      const wb = XLSX.read(Buffer.from(f.data, 'base64'), { type: 'buffer' });
      const parts: string[] = [];
      for (const sheet of wb.SheetNames) {
        const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheet]);
        if (csv.trim()) parts.push(`### SHEET: ${sheet}\n${csv}`);
      }
      if (!parts.length) return { kind: 'error', error: 'File Excel không có dữ liệu đọc được.' };
      return { kind: 'text', text: parts.join('\n\n'), note: `Excel ${wb.SheetNames.length} sheet` };
    } catch {
      return { kind: 'error', error: 'Không đọc được file Excel (có thể bị mã hoá hoặc hỏng).' };
    }
  }

  // Word .docx → rút text từ XML bên trong
  if (/\.docx$/.test(name) || mime.includes('wordprocessingml')) {
    try {
      const buf = Buffer.from(f.data, 'base64').toString('latin1');
      const xml = buf.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (xml && xml.length) {
        const text = xml.map(t => t.replace(/<[^>]+>/g, '')).join(' ').replace(/\s+/g, ' ');
        if (text.trim().length > 30) return { kind: 'text', text, note: 'Word (.docx)' };
      }
      return { kind: 'error', error: 'Không rút được nội dung từ file Word. Hãy lưu sang PDF hoặc dán nội dung trực tiếp.' };
    } catch {
      return { kind: 'error', error: 'Không đọc được file Word.' };
    }
  }

  // CSV / TXT / MD
  if (/\.(csv|txt|md|tsv)$/.test(name) || mime.startsWith('text/')) {
    try {
      const text = Buffer.from(f.data, 'base64').toString('utf-8');
      if (!text.trim()) return { kind: 'error', error: 'File rỗng.' };
      return { kind: 'text', text, note: 'Tệp văn bản' };
    } catch {
      return { kind: 'error', error: 'Không đọc được tệp văn bản.' };
    }
  }

  return { kind: 'error', error: `Định dạng chưa hỗ trợ (${f.name}). Dùng: Excel, CSV, Word, PDF, ảnh, hoặc dán link/nội dung.` };
}
