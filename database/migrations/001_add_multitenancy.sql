-- 会社テーブルの作成
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザープロファイルテーブルの作成
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 既存テーブルにcompany_idを追加
ALTER TABLE themes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE minute_sentences ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE escalations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE custom_dictionary ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_themes_company_id ON themes(company_id);
CREATE INDEX IF NOT EXISTS idx_participants_company_id ON participants(company_id);
CREATE INDEX IF NOT EXISTS idx_minutes_company_id ON minutes(company_id);
CREATE INDEX IF NOT EXISTS idx_minute_sentences_company_id ON minute_sentences(company_id);
CREATE INDEX IF NOT EXISTS idx_escalations_company_id ON escalations(company_id);
CREATE INDEX IF NOT EXISTS idx_todos_company_id ON todos(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_dictionary_company_id ON custom_dictionary(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);

-- RLS (Row Level Security) の有効化
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE minute_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_dictionary ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- Companies: ユーザーは自分の会社のみ閲覧可能
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- User profiles: ユーザーは自分のプロファイルと同じ会社のユーザーを閲覧可能
CREATE POLICY "Users can view profiles in their company" ON user_profiles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Themes: 同じ会社のテーマのみアクセス可能
CREATE POLICY "Users can access themes in their company" ON themes
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Participants: 同じ会社の参加者のみアクセス可能
CREATE POLICY "Users can access participants in their company" ON participants
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Minutes: 同じ会社の議事録のみアクセス可能
CREATE POLICY "Users can access minutes in their company" ON minutes
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Minute sentences: 同じ会社の発言データのみアクセス可能
CREATE POLICY "Users can access minute sentences in their company" ON minute_sentences
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Escalations: 同じ会社のエスカレーション情報のみアクセス可能
CREATE POLICY "Users can access escalations in their company" ON escalations
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Todos: 同じ会社のToDoのみアクセス可能
CREATE POLICY "Users can access todos in their company" ON todos
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Custom dictionary: 同じ会社の辞書のみアクセス可能
CREATE POLICY "Users can access dictionary in their company" ON custom_dictionary
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
    );
