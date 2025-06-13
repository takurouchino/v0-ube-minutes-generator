-- サンプル会社データの挿入
INSERT INTO companies (id, name, slug, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'サンプル製造株式会社', 'sample-manufacturing', '製造業のサンプル会社'),
    ('550e8400-e29b-41d4-a716-446655440002', 'テスト工業株式会社', 'test-industry', '工業系のテスト会社')
ON CONFLICT (slug) DO NOTHING;

-- 注意: 実際のユーザープロファイルは認証後に作成されます
-- このサンプルデータは開発・テスト用途のみです
