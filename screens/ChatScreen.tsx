'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface ChatScreenProps {
  navigate: (screen: Screen) => void;
  t: Translations;
}

interface Message {
  id: string;
  cell_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
}

interface CellInfo {
  id: string;
  name: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigate, t }) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cellInfo, setCellInfo] = useState<CellInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchCellAndMessages();
    }
  }, [user]);

  // 메시지 끝으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchCellAndMessages = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. 사용자의 셀 정보 조회
      const { data: membership } = await supabase
        .from('cell_members')
        .select('cell_id, cells(id, name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership && membership.cells) {
        const cell = membership.cells as unknown as CellInfo;
        setCellInfo(cell);

        // 2. 셀의 메시지 조회
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('cell_id', cell.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (messagesData) {
          setMessages(messagesData);
        }

        // 3. Realtime 구독 설정
        setupRealtimeSubscription(cell.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = (cellId: string) => {
    const channel = supabase
      .channel(`messages:${cellId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `cell_id=eq.${cellId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !cellInfo || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase.from('messages').insert({
        cell_id: cellInfo.id,
        user_id: user.id,
        user_name: profile?.name || user.email?.split('@')[0] || '익명',
        user_avatar: profile?.avatar_url || null,
        content: messageContent,
      });

      if (error) {
        console.error('Error sending message:', error);
        setNewMessage(messageContent); // 실패 시 메시지 복원
      }
    } catch (error) {
      console.error('Error:', error);
      setNewMessage(messageContent);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    }
  };

  // 날짜 구분선을 위한 그룹화
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.created_at, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!cellInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4">
        <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">group_off</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">셀 그룹이 없습니다</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
          셀 그룹에 가입하면 멤버들과 채팅할 수 있습니다.
        </p>
        <button
          onClick={() => navigate(Screen.DASHBOARD)}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans h-[100dvh] flex flex-col overflow-hidden text-gray-900 dark:text-white antialiased selection:bg-primary/30">
      {/* Header */}
      <header className="flex-none bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 pt-12 pb-2 px-2 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => navigate(Screen.DASHBOARD)}
          className="flex items-center text-primary px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[26px]">chevron_left</span>
          <span className="text-[17px] font-normal leading-none pb-0.5 -ml-1">뒤로</span>
        </button>
        <div className="flex flex-col items-center justify-center -ml-4">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">{cellInfo.name}</h2>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            {messages.length}개의 메시지
          </span>
        </div>
        <button
          className="flex items-center justify-center size-9 rounded-full text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={fetchCellAndMessages}
        >
          <span className="material-symbols-outlined text-[22px]">refresh</span>
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 scroll-smooth bg-white dark:bg-background-dark">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-2">chat_bubble</span>
            <p className="text-center">아직 메시지가 없습니다.<br />첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          messageGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              {/* Date Separator */}
              <div className="flex w-full justify-center py-4">
                <span className="text-gray-400 dark:text-gray-500 text-[11px] font-medium tracking-wide bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  {formatDate(group.date)}
                </span>
              </div>

              {/* Messages for this date */}
              {group.messages.map((msg) => {
                const isOwnMessage = msg.user_id === user?.id;

                return isOwnMessage ? (
                  // Sent Message
                  <div key={msg.id} className="flex flex-col items-end gap-1 mb-2 animate-pop">
                    <div className="flex items-end gap-2 max-w-[75%] flex-row-reverse">
                      <div className="px-4 py-2 bg-primary text-white rounded-bubble rounded-br-[4px] text-[16px] leading-[1.35] tracking-tight shadow-subtle">
                        {msg.content}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mr-1">
                      <span className="text-[10px] text-gray-400 font-medium">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                ) : (
                  // Received Message
                  <div key={msg.id} className="flex items-end gap-2 mb-3 group animate-pop">
                    <div className="size-[30px] rounded-full bg-primary/20 flex items-center justify-center shrink-0 mb-0.5 shadow-sm text-primary font-bold text-sm">
                      {msg.user_name.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-1 max-w-[75%] items-start">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-3">{msg.user_name}</span>
                      <div className="px-4 py-2 bg-bubble-rec-light dark:bg-bubble-rec-dark rounded-bubble rounded-bl-[4px] text-[16px] text-gray-900 dark:text-white leading-[1.35] tracking-tight">
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 ml-3">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-2" />
      </main>

      {/* Input */}
      <footer className="flex-none bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 p-2 pb-8 z-40">
        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full px-1">
          <div className="flex-1 min-h-[38px] border border-gray-300 dark:border-gray-700 rounded-full px-4 py-1.5 bg-white dark:bg-background-dark focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center shadow-sm">
            <input
              ref={inputRef}
              className="w-full bg-transparent border-none p-0 text-[16px] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 leading-normal"
              placeholder="메시지를 입력하세요..."
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`shrink-0 size-8 rounded-full flex items-center justify-center transition-all shadow-md mb-[4px] active:scale-90 ${newMessage.trim() && !sending
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px] font-bold">arrow_upward</span>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatScreen;