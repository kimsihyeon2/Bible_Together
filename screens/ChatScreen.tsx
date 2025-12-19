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
      const { data: membership } = await supabase
        .from('cell_members')
        .select('cell_id, cells(id, name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership && membership.cells) {
        const cell = membership.cells as unknown as CellInfo;
        setCellInfo(cell);

        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('cell_id', cell.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (messagesData) {
          setMessages(messagesData);
        }

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
        setNewMessage(messageContent);
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
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    }
  };

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pasture-sky to-pasture-green dark:from-slate-900 dark:to-slate-800">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!cellInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4">
        <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">group_off</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">셀 그룹이 없습니다</h2>
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
    <div className="bg-gradient-to-b from-[#e0f7fa] via-[#e8f5e9] to-[#dcedc8] dark:from-slate-900 dark:to-slate-800 font-sans min-h-[100dvh] flex flex-col relative text-slate-800 dark:text-white antialiased selection:bg-primary/30">
      <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-multiply bg-repeat z-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBP7GnKpLhzPcoLqR3baowWcP2ure8_eWRORYP3V3Q_dfAogk42n3x1RPkpeoWvuotEuC8YQGUcnwRqGzfpobs7M_gvjq2NAvBEYUGfAdJFj-CctqvDaWLoc4kvewFfdosbOXJ_RL9Q54bQ0Y1f79cly8rlf2RQMFP1gBnEcJDtStNzAtOpTMEzEgTrEAOh6k7aky5223tQ6Qr9bwBTXuvLf6fF5VnjiXuIbRX5aCku3iJEaVMW_4WeKol09T7vqfzAU9CnI7SKteGB")', backgroundSize: '400px' }}></div>

      {/* Header - Fixed Top with Safe Area */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-gray-900/70 backdrop-blur-md border-b border-white/40 dark:border-gray-800 pt-[max(env(safe-area-inset-top),1.5rem)] pb-3 px-2 flex items-center justify-between transition-all duration-300">
        <button
          onClick={() => navigate(Screen.DASHBOARD)}
          className="flex items-center text-slate-700 dark:text-gray-200 hover:text-primary px-2 py-1 rounded-full hover:bg-white/40 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[26px]">chevron_left</span>
          <span className="text-[17px] font-medium leading-none pb-0.5 -ml-1">Back</span>
        </button>
        <div className="flex flex-col items-center justify-center -ml-4">
          <h2 className="text-[16px] font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-1">
            {cellInfo.name}
            <span className="material-symbols-outlined text-[16px] text-green-500 filled">spa</span>
          </h2>
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">Online</span>
          </div>
        </div>
        <button className="flex items-center justify-center size-10 rounded-full text-slate-700 dark:text-gray-200 hover:text-primary hover:bg-white/40 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined text-[22px]">info</span>
        </button>
      </header>

      {/* Main Messages Area */}
      <main className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3 scroll-smooth relative z-10 no-scrollbar pt-24 pb-24">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[50vh] text-slate-400">
            <p>No messages yet.</p>
          </div>
        ) : (
          messageGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <div className="flex w-full justify-center py-6">
                <span className="bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full text-slate-500 dark:text-gray-400 text-[11px] font-semibold tracking-wide backdrop-blur-sm shadow-sm border border-white/40">
                  {formatDate(group.date)}
                </span>
              </div>
              {group.messages.map((msg) => {
                const isOwnMessage = msg.user_id === user?.id;
                return isOwnMessage ? (
                  <div key={msg.id} className="flex flex-col items-end gap-1 mb-2 animate-pop">
                    <div className="flex items-end gap-2 max-w-[80%] flex-row-reverse">
                      <div className="px-5 py-3 bg-gradient-to-br from-blue-400 to-teal-400 text-white rounded-[1.5rem] rounded-br-[4px] text-[16px] leading-[1.5] tracking-tight shadow-md shadow-teal-500/10 border border-white/10">
                        {msg.content}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mr-1">
                      <span className="text-[10px] text-slate-400 font-medium">{formatTime(msg.created_at)}</span>
                      <span className="material-symbols-outlined text-[14px] text-primary">done_all</span>
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex items-end gap-2 mb-1 group animate-pop">
                    <div className="size-[34px] rounded-full bg-gray-200 flex items-center justify-center shrink-0 mb-1 border-2 border-white dark:border-gray-700 shadow-sm text-xs font-bold text-gray-500">
                      {msg.user_name.charAt(0)}
                    </div>
                    <div className="flex flex-col gap-1 max-w-[80%] items-start">
                      <span className="text-[11px] text-slate-500 dark:text-gray-400 ml-3 hidden group-hover:block transition-all">{msg.user_name}</span>
                      <div className="px-5 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-[1.5rem] rounded-bl-[4px] text-[16px] text-slate-800 dark:text-white leading-[1.5] tracking-tight shadow-soft border border-white/50 dark:border-gray-600">
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 ml-3 hidden group-hover:block">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-2" />
      </main>

      {/* Footer Input - Fixed Bottom with Safe Area */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-t border-white/50 dark:border-gray-800 p-2 pb-[max(env(safe-area-inset-bottom),2rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.03)]">
        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full px-1">
          <button className="shrink-0 size-10 rounded-full bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors mb-[2px] active:scale-95 shadow-sm border border-slate-100">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
          <div className="flex-1 min-h-[44px] border border-slate-200/60 dark:border-gray-700 rounded-[22px] px-4 py-2 bg-white/80 dark:bg-gray-800 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all flex items-center shadow-sm">
            <input
              ref={inputRef}
              className="w-full bg-transparent border-none p-0 text-[16px] text-slate-800 dark:text-white placeholder-slate-400 focus:ring-0 leading-normal"
              placeholder="Message..."
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
            />
            <button className="shrink-0 ml-2 text-slate-400 hover:text-primary dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
              <span className="material-symbols-outlined text-[24px] filled" style={{ fontVariationSettings: "'FILL' 0" }}>sentiment_satisfied</span>
            </button>
          </div>
          <button
            onClick={sendMessage}
            className="shrink-0 size-10 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 text-white flex items-center justify-center hover:shadow-lg hover:shadow-teal-500/30 transition-all shadow-md shadow-blue-500/20 mb-[2px] active:scale-90 border border-white/20"
          >
            {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[20px] font-bold">arrow_upward</span>}
          </button>
        </div>
      </footer>
    </div>
  );
};


export default ChatScreen;