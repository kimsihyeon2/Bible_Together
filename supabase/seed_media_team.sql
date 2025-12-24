-- Seed Media Team Data (Updated based on user feedback)

-- 1. Clear existing data to avoid duplicates
-- DELETE FROM media_team_members;

-- 2. Insert Leader (Kim Si-hyeon)
INSERT INTO media_team_members (name, role, icon_name, gradient_class, short_description, is_leader, email, tags, detailed_info)
VALUES (
    '김시현',
    '미디어 홍보팀 팀장',
    'Crown',
    'from-indigo-600 to-violet-700',
    'AI/정보통신 기술을 접목한 스마트 미디어 사역 리딩',
    true,
    'leader@greencity.ch',
    ARRAY['Leadership', 'AI/Tech', 'Strategy'],
    '{
        "longDescription": "명지대학교 정보통신공학과 AI를 전공한 기술적 배경을 바탕으로, 미디어 사역의 디지털 전환을 이끕니다. 단순한 홍보를 넘어 데이터와 기술이 접목된 새로운 차원의 사역 방향성을 제시하며, 팀원들의 창의성이 기술 위에서 꽃피울 수 있도록 지원합니다.",
        "quote": "기술은 복음을 전하는 가장 현대적인 도구입니다.",
        "vision": "AI와 미디어 기술을 활용한 스마트 처치(Smart Church) 및 미래지향적 사역 모델 구축",
        "skills": [
            { "name": "Tech Leadership", "level": 95 },
            { "name": "AI Application", "level": 90 },
            { "name": "Strategic Planning", "level": 92 },
            { "name": "System Arch", "level": 85 }
        ],
        "recentWork": [
            { "title": "교회 미디어 인프라 고도화", "category": "Tech" },
            { "title": "미디어 사역 팀 빌딩 및 비전 수립", "category": "Leadership" },
            { "title": "온라인 사역 플랫폼 전략 기획", "category": "Strategy" }
        ],
        "stats": { "projects": 12, "impact": "High" }
    }'::jsonb
);

-- 3. Insert Member 1 (Im Yong-ho)
INSERT INTO media_team_members (name, role, icon_name, gradient_class, short_description, is_leader, email, tags, detailed_info)
VALUES (
    '임용호',
    '모션그래픽 / 디자인',
    'Zap',
    'from-blue-500 to-cyan-500',
    '역동적인 모션그래픽과 시선을 사로잡는 썸네일 아트워크',
    false,
    'yongho@greencity.ch',
    ARRAY['Motion', 'Thumbnails', 'Design'],
    '{
        "longDescription": "정적인 이미지에 생명을 불어넣는 모션그래픽 작업을 담당합니다. 유튜브 채널 ''Green Media''의 썸네일과 영상 소스를 제작하여 클릭을 부르는 매력적인 비주얼을 완성합니다. 감각적인 타이포그래피와 모션으로 메시지의 전달력을 극대화합니다.",
        "quote": "움직임 속에 메시지의 생동감을 담습니다.",
        "vision": "모든 세대가 직관적으로 이해하고 감동할 수 있는 비주얼 언어 창조",
        "skills": [
            { "name": "Motion Graphics", "level": 92 },
            { "name": "Thumbnail Design", "level": 95 },
            { "name": "Video Effects", "level": 88 },
            { "name": "Visual Compositing", "level": 85 }
        ],
        "recentWork": [
            { "title": "유튜브 ''Green Media'' 썸네일 리뉴얼", "category": "Design" },
            { "title": "예배 인트로 모션그래픽 제작", "category": "Motion" },
            { "title": "행사 홍보 영상 타이틀 시퀀스", "category": "Video" }
        ],
        "stats": { "projects": 15, "impact": "High" }
    }'::jsonb
);

-- 4. Insert Member 2 (Cho Seok-hee)
INSERT INTO media_team_members (name, role, icon_name, gradient_class, short_description, is_leader, email, tags, detailed_info)
VALUES (
    '조석희',
    '전체 콘텐츠 기획',
    'Layout',
    'from-emerald-500 to-teal-600',
    '카드뉴스와 캠페인을 아우르는 종합 콘텐츠 기획',
    false,
    'seokhee@greencity.ch',
    ARRAY['Planning', 'CardNews', 'YouTube'],
    '{
        "longDescription": "교회의 소식을 가장 효과적으로 전달하는 카드뉴스와 캠페인 슬로건을 기획합니다. 유튜브 채널의 프로그램 개편부터 절기별 특별 콘텐츠까지, 미디어 사역의 뼈대가 되는 기획안을 작성하고 실행합니다.",
        "quote": "기획은 사역의 방향을 결정하는 나침반입니다.",
        "vision": "성도들이 기다리고 찾아보는 킬러 콘텐츠 라인업 구축",
        "skills": [
            { "name": "Content Planning", "level": 94 },
            { "name": "Copywriting", "level": 90 },
            { "name": "Campaign Mgmt", "level": 88 },
            { "name": "YouTube Strategy", "level": 85 }
        ],
        "recentWork": [
            { "title": "주간 카드뉴스 기획 및 발행", "category": "Content" },
            { "title": "특별 사역 캠페인 슬로건 개발", "category": "Copywriting" },
            { "title": "유튜브 채널 프로그램 개편안", "category": "Strategy" }
        ],
        "stats": { "projects": 18, "impact": "High" }
    }'::jsonb
);

-- 5. Insert Member 3 (Yun Jeong-min)
INSERT INTO media_team_members (name, role, icon_name, gradient_class, short_description, is_leader, email, tags, detailed_info)
VALUES (
    '윤정민',
    '숏폼 기획 / 스크립트',
    'MessageSquare',
    'from-rose-500 to-orange-500',
    '기독교 심리학 기반의 공감형 숏폼 및 Q&A 콘텐츠 기획',
    false,
    'jungmin@greencity.ch',
    ARRAY['Psychology', 'ShortForm', 'Script'],
    '{
        "longDescription": "기독교 심리학 전공을 살려 성사들의 실제적인 신앙 고민과 질문들을 콘텐츠로 풀어냅니다. 목사님께 드리는 질문과 답변(Q&A) 형식의 숏폼 스크립트를 기획하며, 깊이 있는 신학적 내용을 짧고 트렌디한 언어로 재해석합니다.",
        "quote": "마음을 읽는 공감으로 복음의 접점을 넓힙니다.",
        "vision": "신앙의 궁금증을 해소하고 마음을 치유하는 힐링 콘텐츠 허브",
        "skills": [
            { "name": "Script Writing", "level": 95 },
            { "name": "Counseling Base", "level": 90 },
            { "name": "Short-form Planning", "level": 92 },
            { "name": "Empathy", "level": 100 }
        ],
        "recentWork": [
            { "title": "목사님 질문있어요! Q&A 시리즈", "category": "Series" },
            { "title": "신앙 고민 상담 숏폼 기획", "category": "Shorts" },
            { "title": "위로와 공감의 묵상 스크립트", "category": "Writing" }
        ],
        "stats": { "projects": 10, "impact": "Medium" }
    }'::jsonb
);

-- 6. Insert Member 4 (Yeonseo)
INSERT INTO media_team_members (name, role, icon_name, gradient_class, short_description, is_leader, email, tags, detailed_info)
VALUES (
    '연서',
    'SNS 운영 / 소통',
    'Share2',
    'from-fuchsia-500 to-pink-600',
    '교회 공식 인스타그램 운영 및 소통형 캠페인 진행',
    false,
    'yeonseo@greencity.ch',
    ARRAY['Instagram', 'Communication', 'Events'],
    '{
        "longDescription": "그린시티교회의 공식 인스타그램 피드를 관리하며 교회의 따뜻한 일상을 공유합니다. 전도용 소통 캠페인과 다양한 교회 행사 이벤트를 기획하여, 온라인 공간을 성도들과 세상이 소통하는 열린 광장으로 만들어갑니다.",
        "quote": "숫자보다 사람에게 집중하는 따뜻한 소통을 지향합니다.",
        "vision": "세상과 교회를 잇는 가장 친근한 디지털 창구",
        "skills": [
            { "name": "Instagram Ops", "level": 95 },
            { "name": "Event Planning", "level": 90 },
            { "name": "Communication", "level": 98 },
            { "name": "Trend Catching", "level": 88 }
        ],
        "recentWork": [
            { "title": "교회 행사 홍보 릴레이 피드", "category": "Event" },
            { "title": "전도용 해시태그 캠페인 기획", "category": "Outreach" },
            { "title": "성도 참여형 댓글 이벤트", "category": "Community" }
        ],
        "stats": { "projects": 8, "impact": "High" }
    }'::jsonb
);
