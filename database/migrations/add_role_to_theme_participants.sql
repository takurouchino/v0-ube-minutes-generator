-- テーマ参加者テーブルに役割フィールドを追加
ALTER TABLE theme_participants 
ADD COLUMN role VARCHAR(100);

-- 既存のデータに対してデフォルトの役割を設定（必要に応じて）
UPDATE theme_participants 
SET role = '一般参加者' 
WHERE role IS NULL;

-- インデックスを追加（検索性能向上のため）
CREATE INDEX idx_theme_participants_role ON theme_participants(role);

-- 役割フィールドにコメントを追加
COMMENT ON COLUMN theme_participants.role IS 'テーマ内での参加者の役割（例：司会、書記、一般参加者など）';
