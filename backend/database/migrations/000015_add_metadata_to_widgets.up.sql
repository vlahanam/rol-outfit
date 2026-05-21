ALTER TABLE widgets
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN widgets.metadata IS 'Nội dung thực tế của widget: ảnh, tiêu đề, mô tả, liên kết';
