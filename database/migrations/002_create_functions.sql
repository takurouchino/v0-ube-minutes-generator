-- ユーザープロファイル作成関数
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- 新しいユーザーが作成された時に、デフォルトのプロファイルを作成
    -- 実際の実装では、サインアップ時に会社IDを指定する必要があります
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 現在のユーザーの会社IDを取得する関数
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 現在のユーザーの情報を取得する関数
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
    id UUID,
    company_id UUID,
    email VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    company_name VARCHAR,
    company_slug VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.company_id,
        up.email,
        up.full_name,
        up.role,
        c.name as company_name,
        c.slug as company_slug
    FROM user_profiles up
    JOIN companies c ON up.company_id = c.id
    WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新時刻を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新トリガーの作成
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_minutes_updated_at BEFORE UPDATE ON minutes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
