'use client';

import React from 'react';
import { Screen } from '../types';

interface PrivacyPolicyScreenProps {
    navigate: (screen: Screen) => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigate }) => {
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
                    <h1 className="text-xl font-bold">개인정보 처리방침</h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-6 space-y-8 prose dark:prose-invert">
                <div className="text-slate-500 text-sm mb-8">
                    시행일: 2024년 12월 22일
                </div>

                <section>
                    <h2 className="text-lg font-bold mb-3">1. 총칙</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        '성경통독' (이하 '서비스')은 회원의 개인정보를 매우 중요시하며, '개인정보 보호법' 등 관련 법령을 준수하고 있습니다.
                        본 개인정보 처리방침은 귀하가 서비스를 이용함에 있어 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
                        개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold mb-3">2. 수집하는 개인정보 항목</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-none">
                        서비스 제공을 위해 아래와 같은 최소한의 개인정보를 수집하고 있습니다.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <li><strong>필수항목:</strong> 이메일 주소, 비밀번호, 닉네임, 소속 교회/교구 정보</li>
                        <li><strong>선택항목:</strong> 프로필 이미지, 기도제목 관련 정보</li>
                        <li><strong>자동수집:</strong> 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-bold mb-3">3. 개인정보의 처리 및 보유기간</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 일정 기간 동안 정보를 보관합니다.
                    </p>
                    <div className="mt-3 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between">
                            <span>계약 또는 청약철회 등에 관한 기록</span>
                            <span className="font-bold">5년</span>
                        </div>
                        <div className="flex justify-between">
                            <span>소비자의 불만 또는 분쟁처리에 관한 기록</span>
                            <span className="font-bold">3년</span>
                        </div>
                        <div className="flex justify-between">
                            <span>로그인 기록</span>
                            <span className="font-bold">3개월</span>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-bold mb-3">4. 이용자의 권리</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수 있습니다.
                        설정 메뉴의 '회원 탈퇴' 기능을 통해 직접 처리가 가능하며, 개인정보보호책임자에게 서면, 전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-bold mb-3">5. 개인정보의 안전성 확보조치</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        서비스는 이용자의 개인정보보호를 위해 다음과 같은 기술적/관리적 대책을 강구하고 있습니다.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <li>비밀번호의 암호화 저장</li>
                        <li>해킹 등에 대비한 기술적 대책 (방화벽, 암호화 통신 등)</li>
                        <li>개인정보 취급 직원의 최소화 및 교육</li>
                    </ul>
                </section>

                <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400 text-center">
                        본 방침은 2024년 12월 22일부터 시행됩니다.<br />
                        문의: privacy@greenbible.com
                    </p>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicyScreen;
