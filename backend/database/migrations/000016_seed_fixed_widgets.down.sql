DELETE FROM widgets
WHERE parent_id IS NULL
  AND name IN ('Banner Slider', 'Bộ Sưu Tập Đặc Biệt', 'Hàng Mới Về', 'Xu Hướng Hot')
  AND display_order IN (1, 2, 3, 4);
