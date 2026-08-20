// Kho quy tắc MOS — nguồn: Marketing Knowledge Base (Obsidian) + án lệ từ các phiên duyệt thực tế
// Đây là bản CHO NGƯỜI ĐỌC; bản cho AI nằm trong mos-prompt.ts & mos-plan-prompt.ts — sửa 2 nơi cùng lúc.

export const REGULATIONS = [
  { doc: 'Luật Quảng cáo 2012', scope: 'Cấm QC gây nhầm lẫn công dụng, QC sai sự thật, so sánh trực tiếp', apply: 'Mọi claim công dụng & so sánh' },
  { doc: 'Nghị định 38/2021/NĐ-CP', scope: 'Xử phạt vi phạm quảng cáo — nặng nhất là QC như thuốc chữa bệnh', apply: 'Claims sức khỏe: nước ion kiềm, massage, chống giật' },
  { doc: 'QCVN 6-1:2010/BYT', scope: 'Quy chuẩn nước uống trực tiếp (đóng chai) — CÒN HIỆU LỰC', apply: 'Claim "đạt chuẩn nước uống trực tiếp" (WTR-02)' },
  { doc: 'QCVN 01-1:2018/BYT', scope: 'Chất lượng nước sạch sinh hoạt — THAY THẾ QCVN 01:2009/BYT từ 2019', apply: '⚠️ Tuyệt đối không trích "QCVN 01:2009/BYT" trong bài mới; đối chiếu phiếu kiểm nghiệm' },
  { doc: 'TCVN 11978:2017', scope: 'Tiêu chuẩn máy lọc nước', apply: 'Trích được khi có chứng nhận kèm số hiệu' },
  { doc: 'Luật Bảo vệ quyền lợi NTD', scope: 'Không gây hiểu nhầm, minh bạch thông tin', apply: 'Toàn bộ nội dung, đặc biệt giá & khuyến mãi' },
  { doc: 'Luật Cạnh tranh', scope: '"Duy nhất / số 1 / tốt nhất" phải có căn cứ chứng minh', apply: 'Mọi tuyên bố tối cao (SUP-01→03)' },
  { doc: 'NĐ về khuyến mại (81/2018)', scope: 'KM phải ghi rõ điều kiện, thời hạn, mức giảm', apply: 'Landing/post khuyến mãi, POSM in ấn' },
];

export const CORE_GATES = [
  { code: 'a', rule: 'Claim chữa / khỏi / điều trị / dứt điểm bệnh, "thần dược", ám chỉ thay thế thuốc-y tế', example: '"Nước ion kiềm chữa dứt điểm đau dạ dày" · "BÁC SĨ TẠI GIA"' },
  { code: 'b', rule: 'Cam kết an toàn tuyệt đối: "100%", "không bao giờ giật", "hoàn toàn không đau"', example: '"Tắm trong điện vẫn an toàn" · FAQ trả lời "Hoàn toàn không."' },
  { code: 'c', rule: '"Duy nhất / đầu tiên / số 1 / tốt nhất / rẻ nhất" KHÔNG kèm chứng cứ (số bằng, giải thưởng, năm)', example: '"Ghế massage số 1 Việt Nam!" — không nguồn' },
  { code: 'd', rule: 'Lộ giá sỉ / giá NPP / chiết khấu đại lý trên kênh public', example: '"Riêng đại lý lấy sỉ 38 triệu" đăng Facebook' },
  { code: 'e', rule: 'Sai brand, sai mã model, gán nhầm sản phẩm giữa các dòng', example: 'Bài DT300 dán bảng thông số DT400 · dòng DN304 viết nội dung DN303' },
  { code: 'f', rule: 'Gây nhầm với pháp nhân "Đại Việt" khác (cầu đường, sơn, máy nghiền đá)', example: 'Lưu ý: Đại Việt CÓ mảng dự án B2B nước/không khí — tin trúng thầu lĩnh vực này là HỢP LỆ' },
];

export const VOICE_TIERS = [
  { tier: 'Cao cấp', brands: 'Daikiosan (flagship) · Makano · Daikio · Nakami', tone: 'Tinh tế, đẳng cấp, "có cốt cách"', promise: 'Công nghệ tiên phong, trải nghiệm', avoid: 'Hô hào giảm giá sốc, chợ búa' },
  { tier: 'Phổ thông', brands: 'Takasa · Kasuto · Achisa', tone: 'Gần gũi, thực dụng', promise: 'Bền, hợp túi tiền, giá trị thực', avoid: 'Giọng "thượng lưu, vị thế" không hợp tệp' },
];

export const JOURNEY_TONES = [
  { stage: 'TOFU', tone: 'Điềm đạm, giáo dục, dẫn chứng', cta: 'Tìm hiểu / Theo dõi' },
  { stage: 'MOFU', tone: 'Tư vấn, so sánh minh bạch', cta: 'Nhận tư vấn / So sánh model' },
  { stage: 'BOFU', tone: 'Năng lượng, khẩn (không phóng đại)', cta: 'Mua ngay / Trải nghiệm tại đại lý / Hotline 1900 63 60 98 / Shopee' },
  { stage: 'Retention', tone: 'Thân thiện, hữu ích', cta: 'Thay lõi đúng hạn / Đặt bảo trì' },
  { stage: 'Referral', tone: 'Biết ơn, khích lệ', cta: 'Giới thiệu nhận quà' },
];

export const EVIDENCE = [
  {
    id: 'EV-001', type: 'Nghiên cứu lâm sàng',
    title: 'Nước ion kiềm Magie & chỉ số lipid/đường/acid uric máu — Tạp chí Y học Cộng đồng (bài 2525)',
    strength: 'Trung bình–yếu: tiến cứu 134 người, 2 tháng, KHÔNG nhóm chứng',
    allowed: 'Một nghiên cứu trên 134 người ghi nhận XU HƯỚNG giảm chỉ số đường/mỡ máu/acid uric sau 2 tháng — bắt buộc kèm "kết quả tham khảo, không thay thế chẩn đoán/điều trị y tế"',
    banned: 'Chữa tiểu đường / mỡ máu / gout; dùng % làm cam kết; gán cho model cụ thể khi chưa xác minh thiết bị nghiên cứu là máy Đại Việt',
    source: 'https://tapchiyhcd.vn/index.php/yhcd/article/view/2525',
  },
  {
    id: 'EV-002', type: 'Kỷ lục quốc gia',
    title: 'Kỷ lục Việt Nam (VietKings) — xác lập ngày 27/05/2024 cho 2 dòng máy Daikiosan & Makano',
    strength: 'Mạnh cho claim TIÊN PHONG (có tổ chức xác lập, ngày rõ) — KHÔNG phải bằng chứng về chất lượng hay công dụng',
    allowed: 'Trích NGUYÊN VĂN nội dung kỷ lục: "Đơn vị đầu tiên sản xuất các dòng máy lọc nước Ion kiềm tươi (gồm Daikiosan và Makano), áp dụng công nghệ độc quyền điện phân nước bằng điện cực tan Magie và tích hợp nhiều công nghệ hiện đại nhất" — bắt buộc ghi kèm "Tổ chức Kỷ lục Việt Nam (VietKings) xác lập ngày 27/05/2024"',
    banned: 'Rút gọn thành "máy lọc nước số 1/tốt nhất Việt Nam"; suy diễn kỷ lục = chất lượng nước tốt nhất hay công dụng vượt trội; dùng cho model/ngành hàng KHÁC (ghế massage, chống giật, gia dụng); bỏ tên tổ chức hoặc năm xác lập',
    source: 'https://kyluc.vn/tin-tuc/ky-luc/hai-dong-may-loc-nuoc-ion-kiem-tuoi-cua-tap-doan-dai-viet-lap-ky-luc-voi-cong-nghe-doc-quyen-va-hien-dai',
  },
];

export const PRECEDENTS = [
  { date: '07/2026', case: 'Bài DT300 dán nhầm bảng thông số DT400', ruling: 'REWRITE — sai model là lỗi chặn, kể cả khi bài viết hay. Luôn đối chiếu tên model ở MỌI vị trí trong bài.' },
  { date: '07/2026', case: 'Plan trích "QCVN 01:2009/BYT"', ruling: 'Chuẩn đã bị thay thế bởi QCVN 01-1:2018/BYT — kiểm phiếu kiểm nghiệm thật trước khi trích số hiệu.' },
  { date: '07/2026', case: 'Ghế DC300 claim "đo huyết áp một chạm"', ruling: 'Chỉ được nói nhịp tim/SpO2 mức "tham khảo". Huyết áp = claim thiết bị y tế, cần tài liệu kỹ thuật + miễn trừ, không thì bỏ.' },
  { date: '07/2026', case: 'TBCG "bảo hành chống giật trọn đời"', ruling: 'Hợp lệ CHỈ khi viết dạng chính sách bảo hành có điều kiện — không được trượt thành cam kết an toàn trọn đời.' },
  { date: '07/2026', case: 'Claim "bảo hiểm trách nhiệm sản phẩm 10 tỷ đồng"', ruling: 'Phải kèm nguồn: số hợp đồng, tên công ty bảo hiểm, hiệu lực — không có thì không đăng.' },
  { date: '07/2026', case: 'Bài SEO Sonic Wave sót marker [1.1], thiếu meta, không nhắc brand', ruling: 'Bài web bắt buộc: sạch marker biên tập, có meta title ≤60 & description ≤155, gắn về brand + internal link, có miễn trừ y tế nếu nói sức khỏe.' },
  { date: '07/2026', case: 'Tin trúng thầu bị chặn nhầm "Đại Việt không làm xây dựng"', ruling: 'Đại Việt CÓ mảng tổng thầu/liên danh hệ thống nước & không khí — tin trúng thầu lĩnh vực này hợp lệ (module project).' },
  { date: '07/2026', case: 'Bài trúng thầu ĐH Luật ghi sai vai trò & ngày bàn giao', ruling: 'Dự án B2B: mọi dữ kiện (vai trò, chủ đầu tư, mốc thời gian) phải khớp tài liệu gốc đính kèm trong Tài liệu SP.' },
];

export const SCORING = [
  { range: '90–100', label: 'PASS', action: 'Đăng ngay (100 là ngoại lệ hiếm)' },
  { range: '80–89', label: 'MINOR FIX', action: 'Sửa nhẹ theo danh sách rồi đăng' },
  { range: '70–79', label: 'MAJOR FIX', action: 'Sửa lớn, chấm lại' },
  { range: '<70 hoặc dính cổng chặn', label: 'REWRITE', action: 'Viết lại — cờ đỏ đè mọi điểm số' },
];
