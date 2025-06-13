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
