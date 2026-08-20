// Chuẩn nội dung theo từng kênh — dùng chung cho AI chấm & trang Quy tắc
export type ChannelStd = {
  channel: string; group: string;
  journey: string; length: string; hook: string; tone: string; cta: string;
  must: string[]; avoid: string[];
};

export const CHANNELS: ChannelStd[] = [
  {
    channel: 'TikTok (video/caption)', group: 'Social',
    journey: 'TOFU chủ yếu · BOFU khi livestream',
    length: 'Caption ≤150 ký tự; video 15–60s',
    hook: 'BẮT BUỘC hook trong 3 giây đầu — câu hỏi/tình huống/con số gây tò mò',
    tone: 'Đời thường, nhanh, gần gũi; nói như người thật, không đọc thông cáo',
    cta: 'Xem giỏ hàng / Vào live 15h — CTA ngắn, 1 hành động',
    must: ['Hook 3 giây đầu', 'Câu ngắn, dễ đọc lướt', '3–5 hashtag đúng ngành', 'Có gợi ý hình ảnh/kịch bản quay'],
    avoid: ['Văn phong SEO/báo chí dài dòng', 'Meta title/description (không dùng cho TikTok)', 'Đoạn văn quá 3 dòng', 'Thuật ngữ kỹ thuật khô khan không giải thích'],
  },
  {
    channel: 'Facebook (post)', group: 'Social',
    journey: 'TOFU → MOFU · BOFU cho bài khuyến mãi',
    length: '80–300 chữ; 2 dòng đầu quyết định',
    hook: 'Hook nằm trong ~125 ký tự đầu (trước nút Xem thêm)',
    tone: 'Thân thiện, kể chuyện, chạm nỗi đau đời thường',
    cta: 'Inbox tư vấn / Xem chi tiết tại web / Tìm đại lý gần nhất',
    must: ['Hook trước nút Xem thêm', 'Xuống dòng thoáng', 'Ảnh hoặc video kèm', 'CTA rõ 1 hành động'],
    avoid: ['Nhồi từ khóa SEO', 'Viết như bài báo/blog', 'Emoji dày đặc ở bài brand cao cấp', 'Giá sỉ/chiết khấu đại lý'],
  },
  {
    channel: 'Zalo OA', group: 'CRM',
    journey: 'MOFU · Retention (chăm sóc sau mua)',
    length: 'Rất ngắn: 40–120 chữ',
    hook: 'Câu đầu nêu ngay lợi ích hoặc việc khách cần làm',
    tone: 'Lịch sự, cá nhân hóa, như nhắn tin riêng',
    cta: 'ĐÚNG 1 CTA: Đặt lịch thay lõi / Nhận báo giá / Xem hướng dẫn',
    must: ['Xưng hô đúng đối tượng', 'Đúng thời điểm (chu kỳ thay lõi, bảo trì)', 'Một CTA duy nhất'],
    avoid: ['Spam bán hàng', 'Nhiều CTA', 'Nội dung dài như blog', 'Gửi đại trà không phân nhóm'],
  },
  {
    channel: 'Website – SEO Blog', group: 'Website',
    journey: 'TOFU → MOFU',
    length: '≥800 từ (bài chủ đề), ≥400 từ (tin tức)',
    hook: 'Mở bài nêu vấn đề người đọc đang tìm; từ khóa chính trong 100 từ đầu',
    tone: 'Chuyên gia, điềm đạm, có dẫn chứng',
    cta: 'CTA mềm: Nhận tư vấn / So sánh model + link nội bộ về PDP',
    must: ['Meta title ≤60 ký tự', 'Meta description ≤155 ký tự', 'Cấu trúc H1/H2/H3', 'Internal link về trang sản phẩm', 'Gắn về thương hiệu Đại Việt/Daikiosan'],
    avoid: ['Marker biên tập sót', 'Viết chung chung không nhắc brand', 'Hô hào bán hàng kiểu social', 'Tiêu đề viết hoa toàn bộ'],
  },
  {
    channel: 'Website – PDP (trang sản phẩm)', group: 'Website',
    journey: 'MOFU → BOFU',
    length: 'Đủ 10 khối chuẩn',
    hook: 'Tên chuẩn: [Loại] [Thương hiệu] [Mã] – [đặc điểm nổi bật]',
    tone: 'Theo phân khúc brand (cao cấp/phổ thông)',
    cta: 'Mua ngay / Trả góp 0% / Tìm cửa hàng gần nhất / hotline 1900 63 60 98',
    must: ['Thông số ĐÚNG theo CSDL sản phẩm', 'Bảng thông số của đúng model', 'Thứ tự lõi lọc đánh số (máy lọc nước)', 'FAQ xử lý nghi ngại', 'Chính sách bảo hành', 'Chứng nhận/uy tín'],
    avoid: ['Dán bảng thông số của model khác', 'Thông số mâu thuẫn giữa các phần', 'Quảng cáo tính năng không có trong CSDL'],
  },
  {
    channel: 'Website – Tin trúng thầu/Dự án', group: 'Website',
    journey: 'TOFU → BOFU (B2B)',
    length: '400–800 từ',
    hook: 'Nêu ngay dự án, chủ đầu tư, vai trò Đại Việt',
    tone: 'B2B điềm đạm, khách quan, số liệu — KHÔNG hô hào bán lẻ',
    cta: 'Nhận tư vấn giải pháp / Yêu cầu hồ sơ năng lực / Đặt khảo sát công trình',
    must: ['Đúng tên gói thầu, chủ đầu tư, mốc thời gian', 'Ghi rõ Công ty TNHH SX Tập đoàn Đại Việt', 'Nêu năng lực và tiêu chuẩn đạt'],
    avoid: ['Emoji, giọng hô hào', 'Thổi phồng quy mô hoặc vai trò', 'Lộ thông tin đấu thầu bảo mật'],
  },
  {
    channel: 'Shopee / TikTok Shop / Lazada', group: 'E-commerce',
    journey: 'BOFU',
    length: 'Tên ≤120 ký tự; mô tả gạch đầu dòng',
    hook: 'Tên sản phẩm chứa từ khóa tìm kiếm sàn + mã model',
    tone: 'Ngắn gọn, lợi ích trước, thông số sau',
    cta: 'Thêm vào giỏ / Nhận voucher / Mua kèm deal',
    must: ['Tên, giá, ảnh KHỚP trang PDP chính thức', '≥5 ảnh thể hiện USP', 'Thông số đúng CSDL', 'Chính sách bảo hành'],
    avoid: ['Lệch giá so với web chính hãng', 'Ảnh model khác', 'Claim vượt Sổ Claims'],
  },
  {
    channel: 'PR báo chí', group: 'PR',
    journey: 'TOFU',
    length: '600–1200 từ',
    hook: 'Góc tin tức/sự kiện, không phải quảng cáo trực tiếp',
    tone: 'Khách quan, dẫn nguồn, tư cách doanh nghiệp',
    cta: 'Nhẹ: thông tin liên hệ/website ở cuối',
    must: ['Trích chứng nhận kèm cơ quan + năm', 'Số liệu có nguồn', 'Nêu đúng pháp nhân'],
    avoid: ['Claim công dụng vượt Sổ Claims (PR là nơi hay vi phạm nhất)', 'Giọng bán hàng lộ liễu', 'Số 1/duy nhất không dẫn nguồn'],
  },
  {
    channel: 'Group NPP / Đại lý (nhóm kín)', group: 'Kênh phân phối',
    journey: 'Enablement → BOFU',
    length: 'Ngắn, dạng gạch đầu dòng',
    hook: 'Nêu ngay chương trình/chính sách và thời hạn',
    tone: 'Đồng đội, hỗ trợ bán hàng',
    cta: 'Tải bộ content tháng / Đăng ký chương trình / Báo cáo kết quả',
    must: ['Ghi rõ thời hạn hiệu lực chính sách', 'Có mục ĐIỀU CẤM (phá giá, lộ giá sỉ, tự chế claim)', 'Bài đăng mẫu dùng GIÁ NIÊM YẾT'],
    avoid: ['Đăng nội dung nhóm kín ra kênh public', 'Chính sách hết hạn', 'Thiếu điều kiện áp dụng'],
  },
];

// Ma trận Kênh × Bậc phễu — dùng khi duyệt plan
export const JOURNEY_CHANNEL = [
  { stage: 'TOFU – Nhận biết', best: 'TikTok, Facebook, PR báo chí, SEO Blog', weak: 'Shopee, Zalo OA', note: 'Nội dung giáo dục/cảm xúc; CTA mềm, KHÔNG chốt đơn' },
  { stage: 'MOFU – Cân nhắc', best: 'SEO Blog (so sánh), Facebook, Zalo OA, YouTube', weak: 'TikTok trend ngắn', note: 'So sánh model, chứng nhận, giải đáp nghi ngại' },
  { stage: 'BOFU – Chốt', best: 'PDP website, Shopee/TikTok Shop, Livestream, Group đại lý', weak: 'PR báo chí', note: 'Giá, khuyến mãi, bảo hành, CTA mua rõ ràng' },
  { stage: 'Retention – Sau mua', best: 'Zalo OA, Email, Blog hướng dẫn', weak: 'PR, TikTok', note: 'Thay lõi định kỳ, bảo dưỡng, hướng dẫn dùng' },
  { stage: 'Referral – Giới thiệu', best: 'Zalo OA, Facebook, UGC/KOC', weak: 'PR', note: 'Ưu đãi giới thiệu, thu thập review thật' },
];
