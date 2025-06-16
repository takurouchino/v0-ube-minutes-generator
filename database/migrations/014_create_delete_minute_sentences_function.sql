-- 議事録ID・会社IDでminute_sentencesを一括削除する関数
CREATE OR REPLACE FUNCTION delete_minute_sentences(
  p_minute_id UUID,
  p_company_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM minute_sentences
  WHERE minute_id = p_minute_id
    AND company_id = p_company_id;
END;
$$; 