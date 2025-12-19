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

const LoginScreen: React.FC<LoginScreenProps> = ({ navigate, t }) => {
  const { signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parish & Cell Selection
  const [parishes, setParishes] = useState<any[]>([]);
  const [selectedParishId, setSelectedParishId] = useState<string | null>(null);
  const [cells, setCells] = useState<any[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  // Fetch Parishes on Mount
  useEffect(() => {
    const fetchParishes = async () => {
      const { data } = await supabase.from('parishes').select('*').order('name');
      if (data) setParishes(data);
    };
    fetchParishes();
  }, []);

  // Fetch Cells when Parish Selected
  useEffect(() => {
    if (selectedParishId) {
      const fetchCells = async () => {
        const { data } = await supabase.from('cells').select('*').eq('parish_id', selectedParishId).order('name');
        if (data) setCells(data);
      };
      fetchCells();
    } else {
      setCells([]);
      setSelectedCellId(null);
    }
  }, [selectedParishId]);

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
      const { error: signUpError, data } = await signUp(email, password, name);
      if (signUpError) {
        setError(getErrorMessage(signUpError.message));
      } else {
        if (data?.user) {
          await supabase.from('cell_members').insert({
            parish_id: selectedParishId,
            cell_id: selectedCellId,
            user_id: data.user.id
          });
        }
        alert('회원가입 성공! 로그인해주세요.');
        setIsSignUp(false);
      }
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(getErrorMessage(signInError.message));
      } else {
        navigate(Screen.DASHBOARD);
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError('Google 로그인에 실패했습니다.');
    }
  };

  const getErrorMessage = (message: string) => {
    if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (message.includes('User already registered')) return '이미 가입된 이메일입니다.';
    if (message.includes('Password should be')) return '비밀번호는 6자 이상이어야 합니다.';
    return `오류: ${message}`;
  };

  return (
    <div className="font-sans bg-background-light dark:bg-background-dark text-text-main dark:text-white min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[380px] mx-auto flex flex-col items-center justify-center">

        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary rounded-[28px] blur-xl opacity-20"></div>
            <div className="relative w-[88px] h-[88px] bg-surface-light dark:bg-surface-dark rounded-[28px] shadow-card flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[44px]">menu_book</span>
            </div>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight mb-2">
            {isSignUp ? '회원가입' : t.login.title}
          </h1>
          <p className="text-text-muted text-[15px] font-medium">
            {isSignUp ? '소속된 교구와 셀을 선택해주세요' : t.login.subtitle}
          </p>
        </div>

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* Sign Up Fields */}
          {isSignUp && (
            <div className="space-y-4">
              {/* Name Input */}
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 bg-surface-light dark:bg-surface-dark rounded-2xl px-12 text-[15px] font-medium placeholder:text-text-muted/50 focus:ring-2 focus:ring-primary/20 transition-all border-none"
                  placeholder="이름"
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">person</span>
              </div>

              {/* Parish Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1 text-slate-500">교구 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {parishes.map(parish => (
                    <div
                      key={parish.id}
                      onClick={() => { setSelectedParishId(parish.id); setSelectedCellId(null); }}
                      className={`p-3 rounded-xl cursor-pointer border-2 transition-all text-center font-bold text-sm
                        ${selectedParishId === parish.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-transparent bg-surface-light dark:bg-surface-dark text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {parish.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cell Selection */}
              {selectedParishId && (
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1 text-slate-500">셀 선택 (리더 확인)</label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {cells.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">등록된 셀이 없습니다.</p>
                    ) : (
                      cells.map(cell => (
                        <div
                          key={cell.id}
                          onClick={() => setSelectedCellId(cell.id)}
                          className={`p-3 rounded-xl cursor-pointer border-2 transition-all flex items-center justify-between
                            ${selectedCellId === cell.id
                              ? 'border-primary bg-primary/5'
                              : 'border-transparent bg-surface-light dark:bg-surface-dark hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                          <div>
                            <div className={`font-bold text-sm ${selectedCellId === cell.id ? 'text-primary' : ''}`}>{cell.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{cell.description || '리더 정보 없음'}</div>
                          </div>
                          {selectedCellId === cell.id && (
                            <span className="material-symbols-outlined text-primary">check_circle</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email & Password */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-surface-light dark:bg-surface-dark rounded-2xl px-12 text-[15px] font-medium placeholder:text-text-muted/50 focus:ring-2 focus:ring-primary/20 transition-all border-none"
                placeholder="이메일"
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">mail</span>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-surface-light dark:bg-surface-dark rounded-2xl px-12 text-[15px] font-medium placeholder:text-text-muted/50 focus:ring-2 focus:ring-primary/20 transition-all border-none"
                placeholder="비밀번호"
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">lock</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isSignUp ? '가입하기' : '로그인'}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-8 text-center">
          <p className="text-text-muted text-sm cursor-pointer hover:text-primary transition-colors" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </p>
        </div>

        {/* Google Login */}
        {!isSignUp && (
          <div className="mt-6 w-full">
            <div className="relative w-full text-center mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/5 dark:border-white/5"></div></div>
              <span className="relative bg-background-light dark:bg-background-dark px-2 text-xs text-text-muted uppercase tracking-wider">Or continue with</span>
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white dark:bg-surface-dark border border-black/5 dark:border-white/10 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="font-medium text-[15px]">Google</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginScreen;