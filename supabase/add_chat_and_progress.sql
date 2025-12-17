-- =============================================
-- Chat 및 Progress 기능을 위한 추가 테이블
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. messages 테이블 (셀별 채팅)
CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    cell_id uuid REFERENCES cells(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    user_name text NOT NULL,
    user_avatar text,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. daily_readings 테이블 (일일 읽기 기록 - streak 계산용)
CREATE TABLE IF NOT EXISTS daily_readings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    reading_date date NOT NULL DEFAULT CURRENT_DATE,
    chapters_read integer DEFAULT 1,
    minutes_read integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, reading_date)
);

-- =============================================
-- RLS 활성화 및 정책
-- =============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_readings ENABLE ROW LEVEL SECURITY;

-- messages 정책
CREATE POLICY "Messages are viewable by cell members" 
  ON messages FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can send messages" 
  ON messages FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" 
  ON messages FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- daily_readings 정책
CREATE POLICY "Users can view all daily readings" 
  ON daily_readings FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own daily readings" 
  ON daily_readings FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily readings" 
  ON daily_readings FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- reading_activities 정책 추가
DROP POLICY IF EXISTS "Users can view all reading activities" ON reading_activities;
CREATE POLICY "Users can view all reading activities" 
  ON reading_activities FOR SELECT 
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own reading activities" ON reading_activities;
CREATE POLICY "Users can insert own reading activities" 
  ON reading_activities FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- user_reading_progress 정책 추가
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reading plans are viewable by everyone" 
  ON reading_plans FOR SELECT 
  USING (true);

CREATE POLICY "Users can view all reading progress" 
  ON user_reading_progress FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own reading progress" 
  ON user_reading_progress FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id);

-- =============================================
-- 인덱스
-- =============================================

CREATE INDEX IF NOT EXISTS idx_messages_cell ON messages(cell_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_readings_user_date ON daily_readings(user_id, reading_date DESC);

-- =============================================
-- Realtime 활성화 (채팅용)
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 완료 확인
SELECT 'messages' as table_name, count(*) FROM messages
UNION ALL
SELECT 'daily_readings', count(*) FROM daily_readings;
