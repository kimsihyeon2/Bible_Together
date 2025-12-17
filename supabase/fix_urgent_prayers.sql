-- =============================================
-- urgent_prayers RLS 정책 수정
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. urgent_prayers SELECT 정책 (이미 있으면 스킵)
DROP POLICY IF EXISTS "Urgent prayers are viewable by everyone" ON urgent_prayers;
CREATE POLICY "Urgent prayers are viewable by everyone" 
  ON urgent_prayers FOR SELECT 
  USING (true);

-- 2. urgent_prayers INSERT 정책 추가 (중요!)
DROP POLICY IF EXISTS "Authenticated users can create urgent prayers" ON urgent_prayers;
CREATE POLICY "Authenticated users can create urgent prayers" 
  ON urgent_prayers FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 3. urgent_prayers UPDATE 정책 추가 (활성/비활성 토글용)
DROP POLICY IF EXISTS "Users can update their own urgent prayers" ON urgent_prayers;
CREATE POLICY "Users can update their own urgent prayers" 
  ON urgent_prayers FOR UPDATE 
  TO authenticated 
  USING (true);

-- 4. urgent_prayers DELETE 정책 추가
DROP POLICY IF EXISTS "Users can delete their own urgent prayers" ON urgent_prayers;
CREATE POLICY "Users can delete their own urgent prayers" 
  ON urgent_prayers FOR DELETE 
  TO authenticated 
  USING (true);

-- 완료 확인
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'urgent_prayers';
