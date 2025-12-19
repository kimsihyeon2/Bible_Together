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
            version: 'Green Bible v2.4.1',
            language: 'Language',
        },

        // Progress Screen
        progress: {
            title: 'Progress',
            readingStreak: 'Reading Streak',
            totalChapters: 'Total Chapters',
            avgTimePerDay: 'Avg. Time/Day',
            achievements: 'Achievements',
        },

        // Chat Screen
        chat: {
            title: 'Cell Chat',
            typeMessage: 'Type a message...',
            send: 'Send',
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
            version: '그린 바이블 v2.4.1',
            language: '언어',
        },

        // Progress Screen
        progress: {
            title: '나의 진행',
            readingStreak: '연속 읽기',
            totalChapters: '총 읽은 장',
            avgTimePerDay: '일 평균 시간',
            achievements: '달성 업적',
        },

        // Chat Screen
        chat: {
            title: '셀 대화방',
            typeMessage: '메시지를 입력하세요...',
            send: '전송',
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
