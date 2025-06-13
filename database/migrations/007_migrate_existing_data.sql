-- 既存データの移行（既存のデータがある場合のみ実行）
-- 注意: 実際の環境では適切な会社IDを設定してください

-- 既存のテーマデータにデフォルト会社IDを設定
UPDATE themes 
SET company_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE company_id IS NULL;

-- 既存の参加者データにデフォルト会社IDを設定
UPDATE participants 
SET company_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE company_id IS NULL;

-- 既存の議事録データにデフォルト会社IDを設定
UPDATE minutes 
SET company_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE company_id IS NULL;

-- 既存の発言データにデフォルト会社IDを設定
UPDATE minute_sentences 
SET company_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE company_id IS NULL;

-- 既存のエスカレーションデータにデフォルト会社IDを設定
UPDATE escalations 
SET company_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE company_id IS NULL;

-- 既存のToDoデータにデフォルト会社IDを設定
UPDATE todos 
SET company_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE company_id IS NULL;

-- 既存の辞書データにデフォルト会社IDを設定
UPDATE custom_dictionary 
SET company_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE company_id IS NULL;
