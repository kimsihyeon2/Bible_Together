// Internationalization (i18n) for Bible Together App
export type Language = 'en' | 'ko';

export const translations = {
    en: {
        // App general
        appName: 'Green Bible',

        // Login Screen
        login: {
            title: 'Green Bible',
            subtitle: 'Join your community in daily\nreading and reflection.',
            emailPlaceholder: 'Email Address',
            passwordPlaceholder: 'Password',
            forgotPassword: 'Forgot password?',
            forgotPasswordAlert: 'Password reset email will be sent. (Coming soon)',
            loginButton: 'Log In',
            or: 'Or',
            apple: 'Apple',
            google: 'Google',
            appleLoginAlert: 'Apple login is coming soon.',
            googleLoginAlert: 'Google login is coming soon.',
            noAccount: "Don't have an account?",
            signUp: 'Sign Up',
        },

        // Dashboard Screen
        dashboard: {
            cellName: 'Downtown Cell',
            communityTitle: 'Community',
            greeting: 'Good Morning,',
            userName: 'Alex',
            readyMessage: 'Ready to continue your journey?',
            todaysReading: "Today's Reading",
            day: 'Day',
            goal: 'Goal',
            groupProgress: 'Group Progress',
            streak: 'Streak',
            days: 'Days',
            personalBest: 'Personal Best!',
            activePlans: 'Active Plans',
            seeAll: 'See All',
            daysLeft: 'Days Left',
            findPlan: 'Find Plan',
            quickActions: 'Quick Actions',
            prayer: 'Prayer',
            chat: 'Chat',
            calendar: 'Calendar',
            settings: 'Settings',
            latestActivity: 'Latest Activity',
            finished: 'Finished',
            of: 'of',
        },

        // Bottom Nav
        nav: {
            home: 'Home',
            bible: 'Bible',
            community: 'Community',
            profile: 'Profile',
        },

        // Settings Screen
        settings: {
            title: 'Settings',
            search: 'Search',
            editProfile: 'Edit profile',
            dayStreak: 'Day Streak',
            chaptersRead: 'Chapters Read',
            securityEmail: 'Security & Email',
            community: 'Community',
            translation: 'Translation',
            fontSize: 'Font Size',
            audioSpeed: 'Audio Speed',
            dailyReminder: 'Daily Reminder',
            groupActivity: 'Group Activity',
            helpCenter: 'Help Center',
            privacyPolicy: 'Privacy Policy',
            logOut: 'Log Out',
            logoutConfirm: 'Are you sure you want to log out?',
            version: 'Green Bible v2.4.1',
            language: 'Language',
        },

        // Progress Screen
        progress: {
            title: 'Progress',
            overview: 'Overview',
            currentStreak: 'Current Streak',
            streakMessage: ' day streak! Keep it up! 🔥',
            startStreak: 'Start your streak today!',
            bibleReading: 'Bible Reading',
            totalChapters: 'Total Chapters',
            chapters: 'Chaps',
            totalTime: 'Total Time',
            weeklyActivity: 'Weekly Activity',
            last7Days: 'Last 7 Days',
            cellLeaderboard: 'Cell Leaderboard 🏆',
            consistency: 'Consistency',
            days: 'Days',
            dailyGoal: 'Daily Goal',
            edit: 'Edit',
            target: 'Target',
            today: 'Today',
            done: 'Done! ✅',
            setDailyGoalTitle: 'Set Daily Goal',
            howManyChapters: 'How many chapters per day?',
            saveGoal: 'Save Goal',
            avgTimePerDay: 'Avg. Time/Day',
            achievements: 'Achievements',
            you: '(You)',
            anonymous: 'Anonymous',
            statusStart: 'Start your journey today!',
            statusKeepGoing: 'Great start! Keep going.',
            statusAmazing: 'You are doing amazing!',
            statusHalfway: 'More than halfway there!',
            statusAlmost: 'Almost there!',
            statusCompleted: 'Bible Completed! 🎉',
        },

        // Chat Screen
        chat: {
            title: 'Cell Chat',
            typeMessage: 'Type a message...',
            send: 'Send',
        },

        // Prayer Wall Screen
        prayer: {
            title: 'Prayer Wall',
            myPrayers: 'My Prayers',
            subtitle: '"Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God."',
            addNew: 'Add New Prayer',
            ongoing: 'Ongoing',
            answered: 'Answered',
            shared: 'Shared',
            addedDaysAgo: 'Added {days} days ago',
            addedToday: 'Today, {time}',
            prayedCount: 'Prayed {count}x',
            family: 'Family',
            guidance: 'Guidance',
            community: 'Community',
            placeholderTitle: 'Prayer Title',
            placeholderContent: 'Prayer Content...',
            save: 'Save Prayer',
            cancel: 'Cancel',
            successAdd: 'Prayer added successfully!',
            prayerGoal: 'Prayer Goal',
        },
    },

    ko: {
        // App general
        appName: '그린 바이블',

        // Login Screen
        login: {
            title: '그린 바이블',
            subtitle: '매일 말씀 읽기와 묵상을\n함께하는 커뮤니티입니다.',
            emailPlaceholder: '이메일 주소',
            passwordPlaceholder: '비밀번호',
            forgotPassword: '비밀번호를 잊으셨나요?',
            forgotPasswordAlert: '비밀번호 재설정 이메일이 발송됩니다. (준비 중)',
            loginButton: '로그인',
            or: '또는',
            apple: 'Apple',
            google: 'Google',
            appleLoginAlert: 'Apple 로그인은 현재 준비 중입니다.',
            googleLoginAlert: 'Google 로그인은 현재 준비 중입니다.',
            noAccount: '계정이 없으신가요?',
            signUp: '회원가입',
        },

        // Dashboard Screen
        dashboard: {
            cellName: '다운타운 셀',
            communityTitle: '우리 모임',
            greeting: '좋은 아침이에요,',
            userName: '민준',
            readyMessage: '오늘도 말씀과 함께해요!',
            todaysReading: '오늘의 말씀',
            day: '일차',
            goal: '목표',
            groupProgress: '그룹 진행률',
            streak: '연속',
            days: '일',
            personalBest: '최고 기록!',
            activePlans: '진행 중인 플랜',
            seeAll: '전체보기',
            daysLeft: '일 남음',
            findPlan: '플랜 찾기',
            quickActions: '빠른 메뉴',
            prayer: '기도',
            chat: '대화',
            calendar: '일정',
            settings: '설정',
            latestActivity: '최근 활동',
            finished: '완료',
            of: '',
        },

        // Bottom Nav
        nav: {
            home: '홈',
            bible: '성경',
            community: '커뮤니티',
            profile: '프로필',
        },

        // Settings Screen
        settings: {
            title: '설정',
            search: '검색',
            editProfile: '프로필 편집',
            dayStreak: '연속 읽기',
            chaptersRead: '읽은 장수',
            securityEmail: '보안 및 이메일',
            community: '커뮤니티',
            translation: '성경 번역',
            fontSize: '글자 크기',
            audioSpeed: '오디오 속도',
            dailyReminder: '매일 알림',
            groupActivity: '그룹 활동',
            helpCenter: '도움말',
            privacyPolicy: '개인정보 처리방침',
            logOut: '로그아웃',
            logoutConfirm: '정말 로그아웃 하시겠습니까?',
            version: '그린 바이블 v2.4.1',
            language: '언어',
        },

        // Progress Screen
        progress: {
            title: '나의 진도',
            overview: '개요',
            currentStreak: '현재 연속 기록',
            streakMessage: '일 연속 달성! 계속 화이팅! 🔥',
            startStreak: '오늘 연속 기록을 시작해보세요!',
            bibleReading: '성경 통독',
            totalChapters: '총 읽은 장',
            chapters: '장',
            totalTime: '총 시간',
            weeklyActivity: '주간 활동',
            last7Days: '최근 7일',
            cellLeaderboard: '우리 셀 랭킹 🏆',
            consistency: '꾸준함',
            days: '일',
            dailyGoal: '일일 목표',
            edit: '편집',
            target: '목표',
            today: '오늘',
            done: '달성! ✅',
            setDailyGoalTitle: '일일 목표 설정',
            howManyChapters: '하루에 몇 장을 읽을까요?',
            saveGoal: '목표 저장',
            avgTimePerDay: '일 평균 시간',
            achievements: '달성 업적',
            you: '(나)',
            anonymous: '익명',
            statusStart: '여정을 시작해보세요!',
            statusKeepGoing: '좋은 시작이에요! 계속해보세요.',
            statusAmazing: '매우 잘하고 계십니다!',
            statusHalfway: '절반 이상 왔어요!',
            statusAlmost: '거의 다 왔습니다!',
            statusCompleted: '성경 통독 완료! 🎉',
        },

        // Chat Screen
        chat: {
            title: '셀 대화방',
            typeMessage: '메시지를 입력하세요...',
            send: '전송',
        },

        // Prayer Wall Screen
        prayer: {
            title: '기도노트',
            myPrayers: '나의 기도',
            subtitle: '"아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라"',
            addNew: '새 기도 제목 추가',
            ongoing: '진행 중',
            answered: '응답 완료',
            shared: '공유됨',
            addedDaysAgo: '{days}일 전 추가됨',
            addedToday: '오늘, {time}',
            prayedCount: '{count}번 기도함',
            family: '가족',
            guidance: '인도하심',
            community: '공동체',
            placeholderTitle: '기도 제목',
            placeholderContent: '기도 내용...',
            save: '기도 저장하기',
            cancel: '취소',
            successAdd: '기도 제목이 추가되었습니다!',
            prayerGoal: '기도 목표',
        },
    },
} as const;

export type Translations = typeof translations.en | typeof translations.ko;

// Helper function to get nested translation
export const getTranslation = (lang: Language, key: string): string => {
    const keys = key.split('.');
    let result: any = translations[lang];

    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            return key; // Return key if translation not found
        }
    }

    return typeof result === 'string' ? result : key;
};
