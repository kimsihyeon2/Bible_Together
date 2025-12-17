-- =============================================
-- 🔥 Bible Together 앱 종합 수정 SQL
-- 모든 RLS 정책 + 기본 데이터 추가
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- ============================================
-- 1. 테이블 존재 확인 및 생성
-- ============================================

-- messages 테이블

CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    cell_id uuid REFERENCES cells(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    user_name text NOT NULL,
    user_avatar text,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- daily_readings 테이블
CREATE TABLE IF NOT EXISTS daily_readings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    reading_date date NOT NULL DEFAULT CURRENT_DATE,
    chapters_read integer DEFAULT 1,
    minutes_read integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, reading_date)
);

-- ============================================
-- 2. RLS 활성화
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_readings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. profiles 테이블 정책
-- ============================================

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- ============================================
-- 4. cells 테이블 정책
-- ============================================

DROP POLICY IF EXISTS "Cells are viewable by everyone" ON cells;
CREATE POLICY "Cells are viewable by everyone" 
  ON cells FOR SELECT 
  USING (true);

-- ============================================
-- 5. cell_members 테이블 정책
-- ============================================

DROP POLICY IF EXISTS "Cell members are viewable by everyone" ON cell_members;
CREATE POLICY "Cell members are viewable by everyone" 
  ON cell_members FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can join cells" ON cell_members;
CREATE POLICY "Users can join cells" 
  ON cell_members FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave cells" ON cell_members;
CREATE POLICY "Users can leave cells" 
  ON cell_members FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- ============================================
-- 6. reading_activities 테이블 정책
-- ============================================

DROP POLICY IF EXISTS "Reading activities are viewable by everyone" ON reading_activities;
CREATE POLICY "Reading activities are viewable by everyone" 
  ON reading_activities FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own reading activities" ON reading_activities;
CREATE POLICY "Users can insert own reading activities" 
  ON reading_activities FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. reading_plans 테이블 정책
-- ============================================

DROP POLICY IF EXISTS "Reading plans are viewable by everyone" ON reading_plans;
CREATE POLICY "Reading plans are viewable by everyone" 
  ON reading_plans FOR SELECT 
  USING (true);

-- ============================================
-- 8. user_reading_progress 테이블 정책
-- ============================================

DROP POLICY IF EXISTS "Progress is viewable by everyone" ON user_reading_progress;
CREATE POLICY "Progress is viewable by everyone" 
  ON user_reading_progress FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage own progress" ON user_reading_progress;
CREATE POLICY "Users can manage own progress" 
  ON user_reading_progress FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON user_reading_progress;
CREATE POLICY "Users can update own progress" 
  ON user_reading_progress FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- ============================================
-- 9. urgent_prayers 테이블 정책
-- ============================================

DROP POLICY IF EXISTS "Urgent prayers are viewable by everyone" ON urgent_prayers;
CREATE POLICY "Urgent prayers are viewable by everyone" 
  ON urgent_prayers FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create prayers" ON urgent_prayers;
CREATE POLICY "Authenticated users can create prayers" 
  ON urgent_prayers FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own prayers" ON urgent_prayers;
CREATE POLICY "Users can update own prayers" 
  ON urgent_prayers FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prayers" ON urgent_prayers;
CREATE POLICY "Users can delete own prayers" 
  ON urgent_prayers FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- ============================================
-- 10. messages 테이블 정책
-- ============================================

DROP POLICY IF EXISTS "Messages are viewable by cell members" ON messages;
CREATE POLICY "Messages are viewable by cell members" 
  ON messages FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can send messages" ON messages;
CREATE POLICY "Authenticated users can send messages" 
  ON messages FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" 
  ON messages FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- ============================================
-- 11. daily_readings 테이블 정책
-- ============================================

DROP POLICY IF EXISTS "Daily readings are viewable by everyone" ON daily_readings;
CREATE POLICY "Daily readings are viewable by everyone" 
  ON daily_readings FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own daily readings" ON daily_readings;
CREATE POLICY "Users can insert own daily readings" 
  ON daily_readings FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily readings" ON daily_readings;
CREATE POLICY "Users can update own daily readings" 
  ON daily_readings FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- ============================================
-- 12. 기본 읽기 플랜 추가
-- ============================================

-- 기존 플랜 삭제 후 새로 추가
DELETE FROM reading_plans WHERE name IN ('요한복음 21일', '시편 30일');

INSERT INTO reading_plans (name, description, total_days, cover_image_url, created_at)
VALUES 
  ('요한복음 21일', '예수님의 삶과 가르침을 따라가는 21일간의 여정', 21, 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=400', now()),
  ('시편 30일', '시편을 통해 하나님과 깊은 교제를 나누는 30일', 30, 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400', now());

-- ============================================
-- 13. 기본 셀 추가 (없는 경우)
-- ============================================

INSERT INTO cells (name, description, invite_code, created_at)
SELECT '다윗셀', '함께 성경을 읽는 다윗셀입니다', 'DAVID001', now()
WHERE NOT EXISTS (SELECT 1 FROM cells LIMIT 1);

-- ============================================
-- 14. Realtime 활성화
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- ============================================
-- 15. 완료 확인
-- ============================================

SELECT 
  'RLS 정책 및 기본 데이터 설정 완료' as status,
  (SELECT count(*) FROM reading_plans) as reading_plans_count,
  (SELECT count(*) FROM cells) as cells_count;
