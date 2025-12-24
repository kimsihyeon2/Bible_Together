-- V1 Production Readiness: Database Indexes
-- 500 DAU 최적화를 위한 인덱스 추가

-- reading_activities: 사용자별 읽기 기록 조회 최적화
CREATE INDEX IF NOT EXISTS idx_reading_activities_user_id 
ON reading_activities(user_id);

CREATE INDEX IF NOT EXISTS idx_reading_activities_user_created 
ON reading_activities(user_id, created_at DESC);

-- personal_prayers: 사용자별 기도제목 조회 최적화
CREATE INDEX IF NOT EXISTS idx_personal_prayers_user_id 
ON personal_prayers(user_id);

CREATE INDEX IF NOT EXISTS idx_personal_prayers_user_answered 
ON personal_prayers(user_id, is_answered);

-- cell_activities: 셀 활동 피드 조회 최적화
CREATE INDEX IF NOT EXISTS idx_cell_activities_cell_id 
ON cell_activities(cell_id);

CREATE INDEX IF NOT EXISTS idx_cell_activities_cell_created 
ON cell_activities(cell_id, created_at DESC);

-- daily_readings: 일일 읽기 통계 조회 최적화
CREATE INDEX IF NOT EXISTS idx_daily_readings_user_date 
ON daily_readings(user_id, reading_date);

-- (profiles.cell_id 컬럼이 없어서 제거됨)

-- cell_members: 사용자-셀 관계 조회 최적화
CREATE INDEX IF NOT EXISTS idx_cell_members_user_id 
ON cell_members(user_id);

CREATE INDEX IF NOT EXISTS idx_cell_members_cell_id 
ON cell_members(cell_id);
