-- =============================================
-- cell_members 테이블 RLS 정책 추가
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- cell_members INSERT 정책 추가 (사용자가 스스로 셀에 가입 가능)
DROP POLICY IF EXISTS "Users can join cells" ON cell_members;
CREATE POLICY "Users can join cells" 
  ON cell_members FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- cell_members SELECT 정책
DROP POLICY IF EXISTS "Cell members are viewable by everyone" ON cell_members;
CREATE POLICY "Cell members are viewable by everyone" 
  ON cell_members FOR SELECT 
  TO authenticated
  USING (true);

-- cell_members DELETE 정책 (본인만 탈퇴 가능)
DROP POLICY IF EXISTS "Users can leave cells" ON cell_members;
CREATE POLICY "Users can leave cells" 
  ON cell_members FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 확인
SELECT 'cell_members RLS 정책 추가 완료' as status;
