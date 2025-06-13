-- takuro.uchino@abejainc.comをUBE社員として登録するためのスクリプト

-- 1. UBE会社IDを取得（既存のUBE会社IDを使用）
DO $$
DECLARE
    ube_company_id uuid;
    user_id uuid;
BEGIN
    -- UBE会社IDを取得
    SELECT id INTO ube_company_id FROM companies WHERE name = 'UBE Corporation' OR slug = 'ube' LIMIT 1;
    
    -- UBE会社IDが存在しない場合は作成
    IF ube_company_id IS NULL THEN
        ube_company_id := '550e8400-e29b-41d4-a716-446655440001';
        INSERT INTO companies (id, name, slug, description)
        VALUES (ube_company_id, 'UBE Corporation', 'ube', 'UBE Corporation')
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- 2. ユーザーが既に存在するか確認
    SELECT id INTO user_id FROM auth.users WHERE email = 'takuro.uchino@abejainc.com' LIMIT 1;
    
    -- 3. ユーザーが存在する場合は、user_profilesテーブルを更新
    IF user_id IS NOT NULL THEN
        UPDATE user_profiles
        SET company_id = ube_company_id
        WHERE id = user_id;
        
        RAISE NOTICE 'ユーザー % のcompany_idを % に更新しました', user_id, ube_company_id;
    ELSE
        RAISE NOTICE 'ユーザー takuro.uchino@abejainc.com は存在しません。新規登録が必要です。';
    END IF;
END $$;

-- 注意: このスクリプトはユーザーが既に存在する場合のみ機能します。
-- 新規ユーザー登録はアプリケーションのサインアップ機能を使用してください。
-- パスワードはハッシュ化されているため、SQLで直接設定することはできません。
