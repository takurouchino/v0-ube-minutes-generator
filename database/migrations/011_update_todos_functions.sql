-- 更新日時の自動更新トリガーを更新して company_id のチェックを追加
CREATE OR REPLACE FUNCTION update_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- ステータスが完了に変更された場合、完了日時を設定
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- company_id が変更されていないことを確認
    IF OLD.company_id != NEW.company_id THEN
        RAISE EXCEPTION 'company_id cannot be changed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ToDo統計用のビューを更新して company_id でフィルタリング
CREATE OR REPLACE VIEW todo_stats AS
SELECT 
    company_id,
    COUNT(*) as total_todos,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_todos,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_todos,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_todos,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_todos,
    COUNT(CASE WHEN status != 'completed' AND due_date < CURRENT_DATE THEN 1 END) as overdue_todos,
    COUNT(CASE WHEN due_date = CURRENT_DATE AND status != 'completed' THEN 1 END) as due_today_todos
FROM todos
GROUP BY company_id;
