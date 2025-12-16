'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface LoginScreenProps {
  navigate: (screen: Screen) => void;
  t: Translations;
}

interface Cell {
  id: string;
  name: string;
  invite_code: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigate, t }) => {
  const { signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedCellId, setSelectedCellId] = useState('');
  const [cells, setCells] = useState<Cell[]>([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch cells on mount
  useEffect(() => {
    const fetchCells = async () => {
      const { data } = await supabase.from('cells').select('*').order('name');
      if (data) {
        setCells(data);
        if (data.length > 0) {
          setSelectedCellId(data[0].id);
        }
      }
    };
    fetchCells();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setError('이름을 입력해주세요.');
        setLoading(false);
        return;
      }
      if (!selectedCellId) {
        setError('소속 셀을 선택해주세요.');
        setLoading(false);
        return;
      }
      const { error, data } = await signUp(email, password, name);
      if (error) {
        setError(getErrorMessage(error.message));
      } else {
        // Join the selected cell
        if (data?.user) {
          await supabase.from('cell_members').insert({
            cell_id: selectedCellId,
            user_id: data.user.id
          });
        }
        setError('');
        alert('회원가입 성공! 로그인해주세요.');
        setIsSignUp(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(getErrorMessage(error.message));
      } else {
        navigate(Screen.DASHBOARD);
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError('Google 로그인에 실패했습니다.');
    }
  };

  const getErrorMessage = (message: string) => {
    console.log('Auth error message:', message);

    if (message.includes('Invalid login credentials')) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    if (message.includes('User already registered')) {
      return '이미 가입된 이메일입니다.';
    }
    if (message.includes('Password should be') || message.includes('password')) {
      return '비밀번호는 6자 이상이어야 합니다.';
    }
    if (message.includes('Email not confirmed')) {
      return '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
    }
    if (message.includes('Signup is disabled')) {
      return '현재 회원가입이 비활성화되어 있습니다.';
    }
    if (message.includes('rate limit') || message.includes('too many')) {
      return '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    }
    return `오류: ${message}`;
  };

  return (
    <div className="font-sans bg-background-light dark:bg-background-dark text-text-main dark:text-white min-h-screen flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-white transition-colors duration-300">
      <div className="w-full max-w-[380px] mx-auto flex flex-col h-full justify-center relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary rounded-[28px] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <div className="relative w-[88px] h-[88px] bg-surface-light dark:bg-surface-dark rounded-[28px] shadow-card flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[44px]">menu_book</span>
            </div>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-text-main dark:text-white mb-2">
            {isSignUp ? '회원가입' : t.login.title}
          </h1>
          <p className="text-text-muted text-[15px] font-medium leading-relaxed whitespace-pre-line">
            {isSignUp ? '셀과 함께 성경을 읽어보세요' : t.login.subtitle}
          </p>
        </div>

        <form className="w-full space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isSignUp && (
              <>
                {/* Name input */}
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[22px]">person</span>
                  </div>
                  <input
                    className="block w-full rounded-2xl border-none bg-surface-light dark:bg-surface-dark py-[18px] pl-12 pr-4 text-[16px] text-text-main dark:text-white placeholder:text-gray-400 shadow-card ring-0 focus:ring-2 focus:ring-primary/20 focus:shadow-lg transition-all duration-300 ease-out"
                    placeholder="이름"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Cell selection */}
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[22px]">groups</span>
                  </div>
                  <select
                    className="block w-full rounded-2xl border-none bg-surface-light dark:bg-surface-dark py-[18px] pl-12 pr-4 text-[16px] text-text-main dark:text-white shadow-card ring-0 focus:ring-2 focus:ring-primary/20 focus:shadow-lg transition-all duration-300 ease-out appearance-none cursor-pointer"
                    value={selectedCellId}
                    onChange={(e) => setSelectedCellId(e.target.value)}
                  >
                    <option value="" disabled>소속 셀 선택</option>
                    {cells.map((cell) => (
                      <option key={cell.id} value={cell.id}>
                        {cell.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-[22px]">expand_more</span>
                  </div>
                </div>
              </>
            )}

            {/* Email input */}
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[22px]">mail</span>
              </div>
              <input
                className="block w-full rounded-2xl border-none bg-surface-light dark:bg-surface-dark py-[18px] pl-12 pr-4 text-[16px] text-text-main dark:text-white placeholder:text-gray-400 shadow-card ring-0 focus:ring-2 focus:ring-primary/20 focus:shadow-lg transition-all duration-300 ease-out"
                id="email"
                placeholder={t.login.emailPlaceholder}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password input */}
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[22px]">lock</span>
              </div>
              <input
                className="block w-full rounded-2xl border-none bg-surface-light dark:bg-surface-dark py-[18px] pl-12 pr-12 text-[16px] text-text-main dark:text-white placeholder:text-gray-400 shadow-card ring-0 focus:ring-2 focus:ring-primary/20 focus:shadow-lg transition-all duration-300 ease-out"
                id="password"
                placeholder={t.login.passwordPlaceholder}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-text-secondary dark:hover:text-gray-200 transition-colors"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => alert(t.login.forgotPasswordAlert)}
                  className="text-[13px] font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  {t.login.forgotPassword}
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-[16px] rounded-2xl text-[16px] font-semibold shadow-button hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                처리 중...
              </span>
            ) : (
              isSignUp ? '회원가입' : t.login.loginButton
            )}
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-divider"></div>
            <span className="text-text-muted text-[13px] font-medium">{t.login.or}</span>
            <div className="flex-1 h-px bg-divider"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => alert(t.login.appleLoginAlert)}
              className="flex items-center justify-center gap-2 py-[14px] rounded-2xl bg-surface-light dark:bg-surface-dark shadow-card hover:shadow-md active:scale-[0.98] transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span className="font-semibold text-[14px]">{t.login.apple}</span>
            </button>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 py-[14px] rounded-2xl bg-surface-light dark:bg-surface-dark shadow-card hover:shadow-md active:scale-[0.98] transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-semibold text-[14px]">{t.login.google}</span>
            </button>
          </div>
        </form>

        <p className="text-center text-text-muted text-[14px] mt-8">
          {isSignUp ? '이미 계정이 있으신가요?' : t.login.noAccount}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-primary font-semibold hover:text-primary-hover transition-colors"
          >
            {isSignUp ? '로그인' : t.login.signUp}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;