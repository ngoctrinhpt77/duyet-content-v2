// Sổ Claims — nguồn: Marketing Knowledge Base / Claims Register
export type Claim = {
  code: string;
  group: string;
  allowed: string;
  banned: string;
  evidence: string;
  note: string;
  status: 'co_bang_chung' | 'cho_so_hieu';
};

export const CLAIMS: Claim[] = [
  { code: 'WTR-01', group: 'Máy lọc nước ion kiềm', allowed: 'Nước pH kiềm 8.5–9.5, công nghệ điện phân Magie (bằng độc quyền Cục SHTT)', banned: 'Chữa/khỏi bệnh dạ dày, ung thư', evidence: 'Bằng độc quyền Cục SHTT (chờ số hiệu)', note: 'Kèm miễn trừ y tế', status: 'cho_so_hieu' },
  { code: 'WTR-02', group: 'Máy lọc nước ion kiềm', allowed: 'Lọc sạch đạt QCVN 6-1:2010/BYT, QCVN 01-1:2018/BYT', banned: '"Nước chữa bệnh", "nước thuốc"', evidence: 'Phiếu kiểm nghiệm (chờ số hiệu)', note: 'Ghi điều kiện nước đầu vào', status: 'cho_so_hieu' },
  { code: 'WTR-03', group: 'Máy lọc nước ion kiềm', allowed: 'Chỉ số ORP âm / hydrogen hòa tan (nêu số đo)', banned: 'Trẻ hóa tế bào, phòng ung thư', evidence: 'Kết quả đo (chờ nguồn)', note: 'Chỉ nói như thông số kỹ thuật', status: 'cho_so_hieu' },
  { code: 'WTR-04', group: 'Máy lọc nước ion kiềm', allowed: 'Sản xuất theo hệ quản lý chất lượng ISO 13485:2016', banned: '"Là thiết bị y tế chữa bệnh"', evidence: 'Chứng nhận ISO (chờ số hiệu)', note: 'ISO là chuẩn quản lý SX', status: 'cho_so_hieu' },
  { code: 'WTR-05', group: 'Máy lọc nước ion kiềm', allowed: 'Một nghiên cứu tiến cứu 134 người (Tạp chí YHCD) ghi nhận XU HƯỚNG giảm chỉ số đường/mỡ máu/acid uric sau 2 tháng', banned: 'Chữa tiểu đường/mỡ máu/gout; dùng % như cam kết', evidence: 'EV-001 – Tạp chí Y học Cộng đồng, bài 2525', note: 'BẮT BUỘC kèm "không thay thế chẩn đoán/điều trị y tế"; chỉ dùng bài giáo dục/PR', status: 'co_bang_chung' },
  { code: 'ELE-01', group: 'Thiết bị chống giật', allowed: 'Đạt kiểm định an toàn điện; ngắt điện khi phát hiện rò theo ngưỡng', banned: 'An toàn tuyệt đối 100%, "không bao giờ giật"', evidence: 'Giấy kiểm định (chờ số hiệu)', note: 'Nêu điều kiện & phạm vi bảo vệ', status: 'cho_so_hieu' },
  { code: 'MSG-01', group: 'Ghế massage', allowed: 'Massage 3D hỗ trợ thư giãn cơ, giảm mỏi', banned: 'Chữa thoát vị, chữa xương khớp', evidence: 'Thông số máy', note: 'Kèm miễn trừ y tế', status: 'co_bang_chung' },
  { code: 'MSG-02', group: 'Ghế massage', allowed: 'Đo nhịp tim/SpO2 (tính năng tham khảo)', banned: 'Thiết bị y tế chẩn đoán bệnh', evidence: 'Thông số cảm biến', note: '"Chỉ mang tính tham khảo"', status: 'co_bang_chung' },
  { code: 'SUP-01', group: 'Tuyên bố tối cao', allowed: '"Thương hiệu máy lọc nước ion kiềm duy nhất tại VN được cấp bằng độc quyền công nghệ điện phân Magie"', banned: 'Dùng không kèm trích dẫn', evidence: 'Bằng độc quyền (chờ số hiệu)', note: 'BẮT BUỘC trích số bằng + cơ quan + ngày cấp', status: 'cho_so_hieu' },
  { code: 'SUP-02', group: 'Tuyên bố tối cao', allowed: '"Top 500 DN tư nhân lớn nhất VN (VNR500)"', banned: 'Dùng không ghi năm', evidence: 'Vietnam Report', note: 'Ghi năm xếp hạng', status: 'co_bang_chung' },
  { code: 'SUP-03', group: 'Tuyên bố tối cao', allowed: 'Giải "Máy lọc nước ion kiềm được yêu thích nhất" Tech Awards', banned: 'Dùng không ghi năm/đơn vị trao', evidence: 'Tech Awards', note: 'Ghi năm + đơn vị trao', status: 'co_bang_chung' },
];

export const DISCLAIMER = 'Sản phẩm hỗ trợ chăm sóc sức khỏe, không thay thế tư vấn hoặc điều trị y tế.';
