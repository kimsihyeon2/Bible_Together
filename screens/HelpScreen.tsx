'use client';

import React, { useState } from 'react';
import { Screen } from '../types';
import { useAuth } from '@/lib/auth-context';

interface HelpScreenProps {
    navigate: (screen: Screen) => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ navigate }) => {
    const { user, profile } = useAuth();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    // Determine role (simplified for now, ideally strictly typed)
    const isAdmin = profile?.role === 'PASTOR' || profile?.role === 'SUB_ADMIN';
    const isLeader = profile?.role === 'LEADER';

    // Help Content Data
    const commonHelp = [
        {
            q: "📖 성경 통독은 어떻게 진행하나요?",
            a: "하단 '성경' 탭에서 원하는 책과 장을 선택하여 읽을 수 있습니다. 읽기가 끝나면 '다음' 버튼을 눌러주세요. 자동으로 진행 상황이 저장되며, 셀 활동 피드에도 공유되어 서로 격려할 수 있습니다."
        },
        {
            q: "🎧 오디오 성경 사용법",
            a: "성경 읽기 화면 우측 상단의 헤드폰 아이콘을 누르면 오디오가 재생됩니다. 오디오에 맞춰 텍스트가 자동으로 스크롤되어 편리하게 통독할 수 있습니다. 설정에서 배속 조절(0.8x ~ 2.0x)도 가능합니다."
        },
        {
            q: "🖍️ 하이라이트와 메모는 어떻게 하나요?",
            a: "마음에 와닿는 구절을 길게 터치하면 밑줄(하이라이트) 메뉴가 나타납니다. 5가지 색상 중 하나를 선택할 수 있으며, 밑줄 친 구절은 '내 활동'에서 모아볼 수 있습니다."
        }
    ];

    const leaderHelp = [
        {
            q: "👥 셀원 관리는 어디서 하나요?",
            a: "앱 하단 '커뮤니티' 탭 → '우리 셀' 탭으로 이동하면 소속된 셀원 목록을 볼 수 있습니다. 셀장의 경우 각 셀원의 최근 통독 현황을 한눈에 파악하고 격려 메시지를 보낼 수 있는 권한이 있습니다."
        },
        {
            q: "📊 출석 체크 및 보고서",
            a: "매주 주일 셀 모임 후, 커뮤니티 화면의 [출석 체크] 버튼을 눌러 모임 현황을 기록해주세요. 기록된 데이터는 교구 전체 통계에 반영됩니다."
        }
    ];

    const adminHelp = [
        {
            q: "🛠️ 교구 및 셀 조직 구성 방법",
            a: "관리자 메뉴(Admin) → [교구 관리] 탭에서 새로운 교구를 생성하거나 기존 교구를 수정할 수 있습니다. 각 교구 하위에 셀을 생성하고 셀리더를 임명할 수 있습니다."
        },
        {
            q: "📈 전체 통계 확인",
            a: "관리자 메뉴 메인 화면에서 전체 성도들의 통독 진도율, 참여율, 주간 활성 사용자(WAU) 등의 핵심 지표를 대시보드 형태로 실시간 확인할 수 있습니다."
        },
        {
            q: "🛡️ 권한 관리",
            a: "[성도 관리] 탭에서 특정 회원을 검색한 후, '상세 보기'에서 역할을 변경(성도 ↔ 셀리더 ↔ 부관리자)할 수 있습니다."
        }
    ];

    // Combine content based on role
    let helpItems = [...commonHelp];
    if (isLeader) helpItems = [...leaderHelp, ...helpItems];
    if (isAdmin) helpItems = [...adminHelp, ...helpItems]; // Admin sees everything plus admin specifics

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="bg-ios-bg-light dark:bg-ios-bg-dark min-h-screen pb-12 font-sans text-slate-900 dark:text-white">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-ios-bg-light/90 dark:bg-ios-bg-dark/90 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={() => navigate(Screen.SETTINGS)}
                        className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold">도움말 센터</h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4">
                {/* User Role Badge */}
                <div className="flex items-center gap-2 mb-6 px-2">
                    <span className="text-sm text-slate-500">현재 보고 있는 도움말:</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isAdmin ? 'bg-red-100 text-red-600' :
                        isLeader ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                        }`}>
                        {isAdmin ? '관리자용' : isLeader ? '셀리더용' : '성도용'}
                    </span>
                </div>

                {/* FAQ List */}
                <div className="space-y-3">
                    {helpItems.map((item, index) => (
                        <div key={index} className="bg-surface-light dark:bg-surface-dark rounded-[18px] overflow-hidden shadow-sm transition-all">
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full flex items-center justify-between p-4 text-left"
                            >
                                <span className="font-semibold text-[15px]">{item.q}</span>
                                <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>

                            <div className={`grid transition-all duration-300 ease-in-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <div className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-black/5 dark:border-white/5 mt-2">
                                        {item.a}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Contact */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-slate-500 mb-2">원하는 답변을 찾지 못하셨나요?</p>
                    <a href="mailto:kimsi539816@mju.ac.kr" className="inline-block bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-300 transition-colors">
                        1:1 문의하기
                    </a>
                </div>
            </main>
        </div>
    );
};

export default HelpScreen;
