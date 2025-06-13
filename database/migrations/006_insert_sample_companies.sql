-- サンプル会社データの挿入
INSERT INTO companies (id, name, slug, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'UBE Corporation', 'ube-corp', 'UBE Corporation - 議事録管理システム'),
    ('550e8400-e29b-41d4-a716-446655440002', 'サンプル製造株式会社', 'sample-manufacturing', '製造業のサンプル会社'),
    ('550e8400-e29b-41d4-a716-446655440003', 'テスト工業株式会社', 'test-industry', '工業系のテスト会社')
ON CONFLICT (slug) DO NOTHING;
