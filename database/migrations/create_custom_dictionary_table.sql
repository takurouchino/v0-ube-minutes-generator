-- カスタム辞書テーブルの作成
CREATE TABLE IF NOT EXISTS custom_dictionary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  incorrect_term TEXT NOT NULL, -- 誤変換される可能性のある表記
  correct_term TEXT NOT NULL, -- 正しい表記
  category TEXT NOT NULL, -- 'person', 'company', 'product', 'technical', 'department' など
  pronunciation TEXT, -- 読み方（ひらがな・カタカナ）
  description TEXT, -- 説明・備考
  usage_count INTEGER DEFAULT 0, -- 使用回数
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_custom_dictionary_incorrect_term ON custom_dictionary(incorrect_term);
CREATE INDEX IF NOT EXISTS idx_custom_dictionary_correct_term ON custom_dictionary(correct_term);
CREATE INDEX IF NOT EXISTS idx_custom_dictionary_category ON custom_dictionary(category);

-- 重複防止のためのユニーク制約
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_dictionary_unique_pair 
ON custom_dictionary(incorrect_term, correct_term);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_custom_dictionary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_dictionary_updated_at
  BEFORE UPDATE ON custom_dictionary
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_dictionary_updated_at();

-- 初期データの挿入
INSERT INTO custom_dictionary (incorrect_term, correct_term, category, pronunciation, description) VALUES
('阿部じゃ', 'ABEJA', 'company', 'アベジャ', 'AI企業名'),
('あべじゃ', 'ABEJA', 'company', 'アベジャ', 'AI企業名'),
('Ops B', 'Opsbee', 'product', 'オプスビー', 'LLMOpsツール'),
('オプスビー', 'Opsbee', 'product', 'オプスビー', 'LLMOpsツール'),
('色を llm', '医療LLM', 'technical', 'イリョウエルエルエム', '医療分野のLLM'),
('いろをエルエルエム', '医療LLM', 'technical', 'イリョウエルエルエム', '医療分野のLLM'),
('pg', 'PAG', 'department', 'パグ', 'プラットフォームアプリケーショングループ'),
('ピージー', 'PAG', 'department', 'パグ', 'プラットフォームアプリケーショングループ'),
('わんわん', '1-on-1', 'meeting', 'ワンオンワン', '1対1の面談'),
('ワンワン', '1-on-1', 'meeting', 'ワンオンワン', '1対1の面談')
ON CONFLICT (incorrect_term, correct_term) DO NOTHING;
