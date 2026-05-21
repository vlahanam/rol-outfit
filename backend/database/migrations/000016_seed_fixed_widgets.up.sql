INSERT INTO widgets (id, parent_id, name, type, display_order, depth, status, settings, metadata)
VALUES
  (gen_random_uuid(), NULL, 'Banner Slider',          'banner-slider',     1, 0, 2, '{}'::jsonb, '{}'::jsonb),
  (gen_random_uuid(), NULL, 'Bộ Sưu Tập Đặc Biệt',  'image-scroll-list', 2, 0, 2, '{}'::jsonb, '{}'::jsonb),
  (gen_random_uuid(), NULL, 'Hàng Mới Về',            'image-scroll-list', 3, 0, 2, '{}'::jsonb, '{}'::jsonb),
  (gen_random_uuid(), NULL, 'Xu Hướng Hot',           'image-scroll-list', 4, 0, 2, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT DO NOTHING;
