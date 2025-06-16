-- todosテーブルにminute_sentence_idカラムを追加
ALTER TABLE todos ADD COLUMN IF NOT EXISTS minute_sentence_id UUID REFERENCES minute_sentences(id);

-- 既存ToDoにはNULLが入る（必要に応じてUPDATEで紐付け可能）
-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_todos_minute_sentence_id ON todos(minute_sentence_id); 