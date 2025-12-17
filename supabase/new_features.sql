-- =============================================
-- 🔔 알림 및 성경 밑줄 기능 추가 SQL (수정됨)
-- 기존 테이블이 잘못 생성되었을 경우를 대비해 삭제 후 재생성
-- =============================================

-- 기존 테이블 삭제 (데이터가 초기화됩니다)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bible_highlights CASCADE;

-- 1. notifications 테이블 생성
CREATE TABLE notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE, -- 수신자
    sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL, -- 발신자
    type text NOT NULL, -- 'PRAYER_RESPONSE', 'BIBLE_HIGHLIGHT'
    title text NOT NULL,
    message text,
    is_read boolean DEFAULT false,
    data jsonb, -- { "prayer_id": "...", "verse": "..." }
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. bible_highlights 테이블 생성
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

-- 3. RLS 정책 설정
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_highlights ENABLE ROW LEVEL SECURITY;

-- Notifications: 내 알림만 조회/수정 가능, 삽입은 누구나 가능
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Highlights: 모두 조회 가능 (셀 공유용), 내 것만 수정/삭제
CREATE POLICY "Highlights viewable by everyone" ON bible_highlights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own highlights" ON bible_highlights FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 4. Realtime 설정
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bible_highlights') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bible_highlights;
  END IF;
END $$;
