-- 会社テーブルに対する公開読み取りポリシーを追加
CREATE POLICY "会社データの公開読み取りを許可" ON companies
FOR SELECT
TO public
USING (true);

-- 既存のポリシーを確認し、必要に応じて調整
-- 注意: 既存のポリシーがある場合は、それらと競合しないように注意してください
