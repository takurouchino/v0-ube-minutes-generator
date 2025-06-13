-- todos テーブルに company_id カラムを追加
ALTER TABLE todos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 既存のデータに company_id を設定
-- 各 ToDo の minute_id から関連する議事録を見つけ、その company_id を設定
UPDATE todos
SET company_id = minutes.company_id
FROM minutes
WHERE todos.minute_id = minutes.id AND todos.company_id IS NULL;

-- company_id に NOT NULL 制約を追加
ALTER TABLE todos ALTER COLUMN company_id SET NOT NULL;

-- company_id にインデックスを作成
CREATE INDEX IF NOT EXISTS idx_todos_company_id ON todos(company_id);

-- RLS ポリシーの更新
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Enable read access for all users" ON todos;
DROP POLICY IF EXISTS "Enable insert access for all users" ON todos;
DROP POLICY IF EXISTS "Enable update access for all users" ON todos;
DROP POLICY IF EXISTS "Enable delete access for all users" ON todos;
DROP POLICY IF EXISTS "Users can access todos in their company" ON todos;

-- 新しいポリシーを作成
-- 同じ会社の ToDo のみアクセス可能
CREATE POLICY "Users can access todos in their company" ON todos
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- 同じ会社の ToDo のみ挿入可能
CREATE POLICY "Users can insert todos in their company" ON todos
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- トリガー関数を更新して company_id を自動設定
CREATE OR REPLACE FUNCTION set_todo_company_id()
RETURNS TRIGGER AS $$
BEGIN
    -- minute_id から company_id を取得
    IF NEW.minute_id IS NOT NULL AND NEW.company_id IS NULL THEN
        SELECT company_id INTO NEW.company_id
        FROM minutes
        WHERE id = NEW.minute_id;
    END IF;
    
    -- company_id が設定されていない場合、ユーザーの company_id を設定
    IF NEW.company_id IS NULL THEN
        SELECT company_id INTO NEW.company_id
        FROM user_profiles
        WHERE id = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
DROP TRIGGER IF EXISTS trigger_set_todo_company_id ON todos;
CREATE TRIGGER trigger_set_todo_company_id
    BEFORE INSERT ON todos
    FOR EACH ROW
    EXECUTE FUNCTION set_todo_company_id();
