-- ToDo管理用テーブルの作成
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  minute_id UUID REFERENCES minutes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES participants(id),
  assignee_name TEXT,
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  category TEXT DEFAULT 'action_item',
  extracted_from_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES participants(id),
  estimated_hours INTEGER,
  actual_hours INTEGER,
  notes TEXT
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_todos_minute_id ON todos(minute_id);
CREATE INDEX IF NOT EXISTS idx_todos_assignee_id ON todos(assignee_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_todos_updated_at();

-- Row Level Security (RLS) の設定
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "Enable read access for all users" ON todos
  FOR SELECT USING (true);

-- 全ユーザーが挿入可能
CREATE POLICY "Enable insert access for all users" ON todos
  FOR INSERT WITH CHECK (true);

-- 全ユーザーが更新可能
CREATE POLICY "Enable update access for all users" ON todos
  FOR UPDATE USING (true);

-- 全ユーザーが削除可能
CREATE POLICY "Enable delete access for all users" ON todos
  FOR DELETE USING (true);

-- ToDo統計用のビューを作成
CREATE OR REPLACE VIEW todo_stats AS
SELECT 
  COUNT(*) as total_todos,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_todos,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_todos,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_todos,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_todos,
  COUNT(CASE WHEN status != 'completed' AND due_date < CURRENT_DATE THEN 1 END) as overdue_todos,
  COUNT(CASE WHEN due_date = CURRENT_DATE AND status != 'completed' THEN 1 END) as due_today_todos
FROM todos;
