'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, MediaTeamMember } from '../types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { MediaMemberCard } from '@/components/MediaMemberCard';
import { MediaMemberDetailModal } from '@/components/MediaMemberDetailModal';
import { MediaMemberFormModal } from '@/components/MediaMemberFormModal';
import { Sparkles, Settings, Plus } from 'lucide-react';

interface MediaTeamScreenProps {
    navigate: (screen: Screen) => void;
}

const MediaTeamScreen: React.FC<MediaTeamScreenProps> = ({ navigate }) => {
    const { isAdmin } = useAuth();
    const [members, setMembers] = useState<MediaTeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<MediaTeamMember | null>(null);
    const [isManageMode, setIsManageMode] = useState(false);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState<MediaTeamMember | undefined>(undefined);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('media_team_members')
                .select('*')
                .order('is_leader', { ascending: false })
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching members:', error);
            } else if (data) {
                setMembers(data as MediaTeamMember[]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (member: MediaTeamMember) => {
        if (isManageMode) {
            setEditingMember(member);
            setShowForm(true);
        } else {
            setSelectedMember(member);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingMember(undefined);
        fetchMembers(); // Refresh data
    };

    const leader = members.find(m => m.is_leader);
    const otherMembers = members.filter(m => !m.is_leader);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-indigo-100 overflow-x-hidden relative">
            {/* Advanced Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {/* Header Section */}
                <header className="relative mb-16 flex flex-col items-center">
                    <button
                        onClick={() => navigate(Screen.SETTINGS)}
                        className="absolute left-0 top-0 p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors z-50"
                    >
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>

                    {/* Debug Toggle - Hidden but click center to toggle admin if needed for testing */}
                    <div
                        className="absolute top-0 w-20 h-10 z-40 cursor-auto"
                        onDoubleClick={() => setIsManageMode(!isManageMode)}
                        title="Double Click for Debug Admin Mode"
                    />

                    {(isAdmin || isManageMode) && (
                        <div className="absolute right-0 top-0 flex gap-2 z-50">
                            <button
                                onClick={() => setIsManageMode(!isManageMode)}
                                className={`p-2 rounded-full transition-colors flex items-center gap-2 px-3 ${isManageMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 shadow-sm'}`}
                            >
                                <Settings size={18} className={isManageMode ? 'animate-spin-slow' : ''} />
                                <span className="text-xs font-bold">{isManageMode ? 'Done' : 'Manage'}</span>
                            </button>
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-12 inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-tighter uppercase"
                    >
                        <Sparkles size={14} className="animate-spin-slow" />
                        Innovative Future Ministry
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-[1000] tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 text-center"
                    >
                        Media Strategy <span className="text-indigo-600 dark:text-indigo-400">Team</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium text-center"
                    >
                        그린시티교회의 가치를 미디어로 디자인하는 창의적인 사역자들을 소개합니다.
                    </motion.p>
                </header>

                {/* Admin Controls */}
                <AnimatePresence>
                    {isManageMode && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 mb-8 flex justify-center"
                        >
                            <button
                                onClick={() => { setEditingMember(undefined); setShowForm(true); }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                            >
                                <Plus size={20} /> Add New Member
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        {/* Level 1: Leader */}
                        {leader && (
                            <div className="mb-20 w-full flex justify-center relative">
                                <MediaMemberCard
                                    member={leader}
                                    onClick={handleCardClick}
                                    isSelected={selectedMember?.id === leader.id}
                                />
                                {/* Connector Line to Bottom */}
                                <div className="absolute -bottom-20 left-1/2 w-px h-20 bg-gradient-to-b from-indigo-500 to-transparent hidden md:block" />
                            </div>
                        )}

                        {/* Level 2: Grid Members */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
                            {otherMembers.map((member) => (
                                <MediaMemberCard
                                    key={member.id}
                                    member={member}
                                    onClick={handleCardClick}
                                    isSelected={selectedMember?.id === member.id}
                                />
                            ))}
                        </div>

                        {members.length === 0 && !loading && (
                            <div className="text-slate-400 mt-10">
                                아직 등록된 멤버가 없습니다. <br />
                                {isAdmin ? '상단의 "Manage" 버튼을 눌러 멤버를 추가하세요.' : ''}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-24 pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">G</div>
                        Green City Media Group
                    </div>
                    <div className="text-xs font-medium">
                        © 2025 Creative Core. All rights reserved.
                    </div>
                </footer>
            </div>

            {/* Detail View Modal Overlay */}
            <AnimatePresence>
                {selectedMember && (
                    <MediaMemberDetailModal
                        member={selectedMember}
                        onClose={() => {
                            setSelectedMember(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <MediaMemberFormModal
                        member={editingMember}
                        onClose={() => setShowForm(false)}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MediaTeamScreen;
