-- =============================================
-- 역할 기반 권한을 위한 프로필 업데이트
-- =============================================

-- 1. profiles 테이블에 parish_id와 cell_id 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS parish_id UUID REFERENCES parishes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cell_id UUID REFERENCES cells(id) ON DELETE SET NULL;

-- 2. 모든 사용자의 cell_id를 cell_members에서 자동 설정
-- (셀에 가입한 모든 사용자에게 자동 적용)
UPDATE profiles p
SET cell_id = cm.cell_id
FROM cell_members cm
WHERE p.id = cm.user_id
AND p.cell_id IS NULL;

-- 3. cell_id가 설정된 모든 사용자의 parish_id도 자동 설정
UPDATE profiles p
SET parish_id = c.parish_id
FROM cells c
WHERE p.cell_id = c.id
AND p.parish_id IS NULL;

-- 4. 확인: 모든 LEADER의 소속 확인
SELECT p.name, p.role, c.name as cell_name, pa.name as parish_name
FROM profiles p
LEFT JOIN cells c ON p.cell_id = c.id
LEFT JOIN parishes pa ON c.parish_id = pa.id
WHERE p.role = 'LEADER';

-- 5. 확인: 모든 SUB_ADMIN의 소속 확인
SELECT p.name, p.role, pa.name as parish_name
FROM profiles p
LEFT JOIN parishes pa ON p.parish_id = pa.id
WHERE p.role = 'SUB_ADMIN';
