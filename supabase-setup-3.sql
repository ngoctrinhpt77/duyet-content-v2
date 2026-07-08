-- MOS Đại Việt — BƯỚC 3: cột đính kèm link tài liệu cho ghi chú sản phẩm
alter table mos_product_notes add column if not exists link text;
alter table mos_product_notes add column if not exists link_content text;
