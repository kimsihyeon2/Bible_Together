-- =============================================
-- Bible Together: 완전한 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 0. uuid-ossp 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles 테이블 (사용자 프로필)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE,
    name text NOT NULL,
    phone text,
    role text DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'LEADER', 'PASTOR')),
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. cells 테이블 (셀/교구)
CREATE TABLE IF NOT EXISTS cells (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    invite_code text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. cell_members 테이블 (셀 멤버 연결)
CREATE TABLE IF NOT EXISTS cell_members (
    cell_id uuid REFERENCES cells(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (cell_id, user_id)
);

-- 4. reading_activities 테이블 (성경 읽기 기록)
CREATE TABLE IF NOT EXISTS reading_activities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    cell_id uuid REFERENCES cells(id),
    user_id uuid REFERENCES profiles(id),
    user_name text,
    book text NOT NULL,
    chapter integer NOT NULL,
    verse integer,
    translation text DEFAULT 'KRV',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 5. notifications 테이블 (알림)
CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    body text NOT NULL,
    target text DEFAULT 'ALL' CHECK (target IN ('ALL', 'LEADER', 'CELL')),
    created_by uuid REFERENCES profiles(id),
    cell_id uuid REFERENCES cells(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 6. notification_reads 테이블 (알림 읽음 표시)
CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    read_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (notification_id, user_id)
);

-- 7. urgent_prayers 테이블 (긴급 기도 요청) - NEW!
CREATE TABLE IF NOT EXISTS urgent_prayers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    requester_name text,
    created_by uuid REFERENCES profiles(id),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 8. push_subscriptions 테이블 (FCM 토큰 저장) - NEW!
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    fcm_token text NOT NULL UNIQUE,
    device_info text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 9. reading_plans 테이블 (성경 읽기 플랜) - NEW!
CREATE TABLE IF NOT EXISTS reading_plans (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    total_days integer NOT NULL,
    cover_image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 10. user_reading_progress 테이블 (사용자 읽기 진행) - NEW!
CREATE TABLE IF NOT EXISTS user_reading_progress (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES reading_plans(id) ON DELETE CASCADE,
    current_day integer DEFAULT 1,
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    last_read_at timestamp with time zone,
    completed boolean DEFAULT false,
    UNIQUE(user_id, plan_id)
);

-- =============================================
-- Row Level Security (RLS) 정책
-- =============================================

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Cells are viewable by everyone" ON cells FOR SELECT USING (true);
CREATE POLICY "Notifications are viewable by everyone" ON notifications FOR SELECT USING (true);
CREATE POLICY "Urgent prayers are viewable by everyone" ON urgent_prayers FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 기본 데이터 삽입
-- =============================================

-- 기본 셀/교구 데이터
INSERT INTO cells (name, invite_code) VALUES
  ('믿음 교구', 'FAITH'),
  ('소망 교구', 'HOPE'),
  ('사랑 교구', 'LOVE')
ON CONFLICT (invite_code) DO NOTHING;

-- 기본 읽기 플랜
INSERT INTO reading_plans (name, description, total_days) VALUES
  ('요한복음 30일', '30일 동안 요한복음을 함께 읽습니다', 30),
  ('시편 30일', '매일 시편 5편씩 읽는 플랜', 30),
  ('예수님과 함께 걷기', '복음서를 통해 예수님의 발자취를 따라갑니다', 21)
ON CONFLICT DO NOTHING;

-- =============================================
-- 인덱스 생성
-- =============================================

CREATE INDEX IF NOT EXISTS idx_reading_activities_user ON reading_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_activities_cell ON reading_activities(cell_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_urgent_prayers_active ON urgent_prayers(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_token ON push_subscriptions(fcm_token);
