-- =============================================
-- SEED DATA: Dummy Leaders and Cells
-- =============================================

DO $$
DECLARE
    v_faith_parish_id uuid;
    v_hope_parish_id uuid;
    v_love_parish_id uuid;
    v_leader1_id uuid;
    v_leader2_id uuid;
    v_leader3_id uuid;
    v_leader4_id uuid;
    v_leader5_id uuid;
    v_leader6_id uuid;
BEGIN
    -- 1. Ensure Parishes Exist (Get IDs)
    -- Assuming they exist from migration, but let's fetch or create
    -- NOTE: In previous steps, 'cells' were renamed to 'parishes'.
    -- We assume their names were preserved or we create new ones if empty.
    
    -- Check/Create Faith Parish
    SELECT id INTO v_faith_parish_id FROM parishes WHERE name LIKE '%믿음%' LIMIT 1;
    IF v_faith_parish_id IS NULL THEN
        INSERT INTO parishes (name) VALUES ('믿음교구') RETURNING id INTO v_faith_parish_id;
    END IF;

    -- Check/Create Hope Parish
    SELECT id INTO v_hope_parish_id FROM parishes WHERE name LIKE '%소망%' LIMIT 1;
    IF v_hope_parish_id IS NULL THEN
        INSERT INTO parishes (name) VALUES ('소망교구') RETURNING id INTO v_hope_parish_id;
    END IF;
    
    -- Check/Create Love Parish
    SELECT id INTO v_love_parish_id FROM parishes WHERE name LIKE '%사랑%' LIMIT 1;
    IF v_love_parish_id IS NULL THEN
        INSERT INTO parishes (name) VALUES ('사랑교구') RETURNING id INTO v_love_parish_id;
    END IF;


    -- 2. Create Dummy Leaders (Profiles)
    -- We need actual auth.users for them usually, but for profiles we can just insert into 'profiles' table?
    -- No, 'profiles' references 'auth.users'. We cannot insert into 'profiles' without 'auth.users'.
    -- However, we can't easily create auth users from SQL without admin API.
    -- WORKAROUND: We will create "Phantom" profiles if the constraint allows, OR we just pick existing users if any.
    -- IF strict FK exists, we cannot easily seed profiles via pure SQL without auth.users.
    
    -- CHECK constraint on profiles.id? Usually it is a primary key, often FK to auth.users.
    -- If we can't create users, we will skip leader assignment or use NULL leader, 
    -- BUT display "TBD" in UI.
    -- User said "Put dummy user cell leaders".
    -- I will assume I can't create auth users. I will just create Cells without leaders, 
    -- OR I will try to fake it if there is no hard FK or if I can mock it.
    
    -- Let's just create Cells and use "Leader Name" in the Cell description or name for now?
    -- "Joshua Cell 1 (Leader: Kim)"
    
    -- ACTUALLY, I will try to insert into `cells` with `leader_id` NULL for now, 
    -- but change the Cell Name to include Leader info for visualization as requested.
    -- "1셀 (리더: 김철수)"
    
    -- Faith Cells
    INSERT INTO cells (parish_id, name, code, description)
    VALUES 
        (v_faith_parish_id, '믿음 1셀', 'FAITH1', '리더: 김철수 집사'),
        (v_faith_parish_id, '믿음 2셀', 'FAITH2', '리더: 이영희 권사'),
        (v_faith_parish_id, '믿음 3셀', 'FAITH3', '리더: 박준호 청년')
    ON CONFLICT (code) DO NOTHING;

    -- Hope Cells
    INSERT INTO cells (parish_id, name, code, description)
    VALUES 
        (v_hope_parish_id, '소망 1셀', 'HOPE1', '리더: 최민수 집사'),
        (v_hope_parish_id, '소망 2셀', 'HOPE2', '리더: 정수진 권사'),
        (v_hope_parish_id, '소망 3셀', 'HOPE3', '리더: 강호동 성도')
    ON CONFLICT (code) DO NOTHING;
    
    -- Love Cells
    INSERT INTO cells (parish_id, name, code, description)
    VALUES 
        (v_love_parish_id, '사랑 1셀', 'LOVE1', '리더: 유재석 장로'),
        (v_love_parish_id, '사랑 2셀', 'LOVE2', '리더: 박명수 집사'),
        (v_love_parish_id, '사랑 3셀', 'LOVE3', '리더: 정준하 성도')
    ON CONFLICT (code) DO NOTHING;

END $$;
