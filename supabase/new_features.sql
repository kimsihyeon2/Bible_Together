-- =============================================
-- 🔔 알림, 성경 밑줄, 커뮤니티 피드 기능 추가 SQL
-- =============================================

-- 기존 테이블 삭제 (재생성)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bible_highlights CASCADE;
DROP TABLE IF EXISTS cell_activities CASCADE;

-- 1. notifications 테이블 (개인 알림)
CREATE TABLE notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE, -- 수신자
    sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL, -- 발신자
    type text NOT NULL,
    title text NOT NULL,
    message text,
    is_read boolean DEFAULT false,
    data jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. bible_highlights 테이블 (성경 밑줄)
CREATE TABLE bible_highlights (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    book text NOT NULL,
    chapter integer NOT NULL,
    verse integer NOT NULL,
    color text NOT NULL DEFAULT '#FFEB3B',
    content text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, book, chapter, verse)
);

-- 3. cell_activities 테이블 (커뮤니티 피드)
CREATE TABLE cell_activities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    cell_id uuid REFERENCES cells(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'READING', 'PRAYER', 'HIGHLIGHT'
    title text NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. RLS 정책 설정
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_activities ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Highlights Policies
CREATE POLICY "Highlights viewable by everyone" ON bible_highlights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own highlights" ON bible_highlights FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Cell Activities Policies
CREATE POLICY "Activities viewable by cell members" ON cell_activities FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM cell_members WHERE cell_id = cell_activities.cell_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert activities" ON cell_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. Realtime 설정
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bible_highlights') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bible_highlights;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cell_activities') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cell_activities;
  END IF;
END $$;

-- 6. 데이터 마이그레이션 (기존 읽기 기록 -> 활동 피드)
INSERT INTO cell_activities (cell_id, user_id, type, title, created_at)
SELECT cell_id, user_id, 'READING', book || ' ' || chapter || '장을 읽었습니다', created_at
FROM reading_activities
ON CONFLICT DO NOTHING;
