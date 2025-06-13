-- 初期会社データの作成
INSERT INTO companies (id, name, slug, description)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'UBE Corporation', 'ube', 'UBE Corporation')
ON CONFLICT (id) DO NOTHING;
