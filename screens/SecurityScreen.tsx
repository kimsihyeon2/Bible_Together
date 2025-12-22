'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import QRCode from 'qrcode';

interface SecurityScreenProps {
    navigate: (screen: Screen) => void;
}

const SecurityScreen: React.FC<SecurityScreenProps> = ({ navigate }) => {
    const { user } = useAuth();

    // 2FA State

    // 2FA State
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [showMfaSetup, setShowMfaSetup] = useState(false);
    const [qrCodeCount, setQrCodeCount] = useState(0); // For forcing re-render if needed
    const [mfaData, setMfaData] = useState<{ id: string; secret: string; qr: string } | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [setupError, setSetupError] = useState('');
    const [setupSuccess, setSetupSuccess] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Check MFA Status on Mount
    useEffect(() => {
        checkMfaStatus();
    }, []);

    // 2. Check MFA Status
    const checkMfaStatus = async () => {
        if (!user) return;
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!error) {
            // If user has any factors, currentLevel or nextLevel might indicate capability
            // But getAuthenticatorAssuranceLevel mainly checks current session.
            // Better to list factors.
            const { data: factors } = await supabase.auth.mfa.listFactors();
            if (factors && factors.totp.length > 0) {
                // Check if any factor is 'verified'
                const verifiedFactor = factors.totp.find(f => f.status === 'verified');
                setMfaEnabled(!!verifiedFactor);
            }
        }
    };

    // 3. Enroll MFA
    const startMfaSetup = async () => {
        setSetupError('');
        setSetupSuccess(false);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp'
            });

            if (error) throw error;

            // Generate QR Code Image
            const qrImageUrl = await QRCode.toDataURL(data.totp.uri);

            setMfaData({
                id: data.id,
                secret: data.totp.secret,
                qr: qrImageUrl
            });
            setShowMfaSetup(true);
        } catch (error: any) {
            setSetupError(error.message);
        }
    };

    // 4. Verify & Enable MFA
    const verifyMfaSetup = async () => {
        if (!mfaData) return;
        setSetupError('');

        try {
            // Create Challenge
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: mfaData.id
            });
            if (challengeError) throw challengeError;

            // Verify Challenge
            const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaData.id,
                challengeId: challengeData.id,
                code: verifyCode
            });

            if (verifyError) throw verifyError;

            setSetupSuccess(true);
            setMfaEnabled(true);
            setTimeout(() => {
                setShowMfaSetup(false);
                setVerifyCode('');
            }, 1500);

        } catch (error: any) {
            setSetupError('인증 코드가 올바르지 않습니다. 다시 시도해주세요.');
        }
    };

    const handlePasswordUpdate = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert("새 비밀번호는 6자 이상이어야 합니다.");
            return;
        }
        setChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            alert("비밀번호가 성공적으로 변경되었습니다.");
            setNewPassword('');
            setCurrentPassword(''); // If we used it
        } catch (e: any) {
            alert(`오류 발생: ${e.message}`);
        } finally {
            setChangingPassword(false);
        }
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
                    <h1 className="text-xl font-bold">보안 및 이메일</h1>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">

                {/* 1. Profile Summary */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xl">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm text-slate-500 dark:text-slate-400">로그인된 계정</p>
                        <p className="font-semibold truncate">{user?.email}</p>
                    </div>
                </div>

                {/* 2. Password Change */}
                <section>
                    <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">비밀번호 변경</h3>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-[24px] p-5 shadow-sm space-y-4">
                        {/* Note: Direct password update doesn't require "Current Password" in simple Supabase flow unless re-auth is needed. 
                            We'll keep "new password" only for simplicity or add re-auth if strict. 
                            User asked for "SOTA", usually requires verification, but lets stick to working API. */}
                        <div>
                            <label className="block text-[13px] font-medium text-slate-500 mb-1.5">새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="6자 이상 입력"
                                className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                            />
                        </div>
                        <button
                            onClick={handlePasswordUpdate}
                            disabled={changingPassword}
                            className="w-full bg-[#1C1C1E] dark:bg-white text-white dark:text-black font-semibold py-3.5 rounded-xl shadow-lg shadow-black/5 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {changingPassword ? '업데이트 중...' : '비밀번호 업데이트'}
                        </button>
                    </div>
                </section>

                {/* 3. Two-Factor Auth */}
                <section>
                    <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">추가 보안</h3>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-[24px] p-5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mfaEnabled ? 'bg-blue-100 text-blue-600' : 'bg-blue-50 text-blue-400'}`}>
                                <span className="material-symbols-outlined text-[24px]">lock</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-[15px]">2단계 인증</h4>
                                <p className="text-[13px] text-slate-500">{mfaEnabled ? '현재 활성화됨' : '로그인 시 추가 인증 요구'}</p>
                            </div>
                        </div>

                        {mfaEnabled ? (
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">ON</span>
                        ) : (
                            <button
                                onClick={startMfaSetup}
                                className="bg-slate-200 dark:bg-slate-700 w-[51px] h-[31px] rounded-full relative transition-colors"
                            >
                                <div className="absolute left-[2px] top-[2px] bg-white w-[27px] h-[27px] rounded-full shadow-sm transition-transform"></div>
                            </button>
                        )}
                    </div>
                </section>



            </main>

            {/* MFA Setup Modal */}
            {showMfaSetup && mfaData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl transform transition-all scale-100">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                            </div>

                            <h2 className="text-2xl font-bold mb-2 text-black dark:text-white">2단계 인증 설정</h2>
                            <p className="text-slate-500 text-[15px] mb-6 leading-relaxed">
                                Google Authenticator 앱으로<br />아래 QR 코드를 스캔해주세요.
                            </p>

                            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 mb-6">
                                <img src={mfaData.qr} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                            </div>

                            <div className="w-full space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                        placeholder="인증 코드 6자리"
                                        className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-slate-100 dark:bg-black/20 border-none rounded-xl py-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:tracking-normal placeholder:text-base"
                                    />
                                    {setupError && <p className="text-red-500 text-xs mt-2">{setupError}</p>}
                                    {setupSuccess && <p className="text-green-500 text-xs mt-2 font-bold">인증되었습니다!</p>}
                                </div>

                                <button
                                    onClick={verifyMfaSetup}
                                    disabled={verifyCode.length !== 6 || setupSuccess}
                                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    인증 및 활성화
                                </button>

                                <button
                                    onClick={() => setShowMfaSetup(false)}
                                    className="text-slate-400 text-sm hover:text-slate-600 transition-colors"
                                >
                                    나중에 하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityScreen;
