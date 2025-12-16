-- =============================================
-- 프로필 자동 생성 수정 스크립트
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. profiles 테이블 INSERT 정책 추가 (중요!)
CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. 모든 인증된 사용자가 프로필 삽입 가능하도록 대체 정책
-- (위 정책이 안될 경우를 대비)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
CREATE POLICY "Enable insert for authenticated users only" ON profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 3. 자동 프로필 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'MEMBER'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. 기존 Auth 사용자들의 프로필 수동 생성
-- (이미 가입한 사용자들을 위해)
INSERT INTO profiles (id, email, name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  'MEMBER'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 6. 첫 번째 사용자를 PASTOR로 설정 (관리자 권한)
UPDATE profiles 
SET role = 'PASTOR' 
WHERE email = (SELECT email FROM auth.users ORDER BY created_at ASC LIMIT 1);

-- 완료 확인
SELECT * FROM profiles;
