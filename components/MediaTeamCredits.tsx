
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Layout, PenTool, Video, Share2,
    Crown, Mail, ChevronRight, ExternalLink,
    Sparkles, MessageSquare, Heart
} from 'lucide-react';

// --- Types ---
interface Member {
    id: string;
    name: string;
    role: string;
    icon: React.ElementType;
    color: string;
    tags?: string[];
    description: string;
    email: string;
    stats?: { projects: number; impact: string };
}

interface TeamData {
    leader: Member;
    members: Member[];
}

// --- Data ---
const teamData: TeamData = {
    leader: {
        id: 'leader',
        name: '김시현',
        role: '미디어 홍보팀 팀장',
        icon: Crown,
        color: 'from-indigo-600 to-violet-700',
        description: '팀 전체 비전 수립 및 총괄 리딩. 창의적인 사역의 방향성을 제시합니다.',
        email: 'leader@greencity.ch',
        stats: { projects: 12, impact: 'High' }
    },
    members: [
        {
            id: 'm1',
            name: '임용호',
            role: '웹/앱 UI UX',
            icon: Layout,
            color: 'from-blue-500 to-cyan-500',
            tags: ['Design', 'Next.js'],
            description: '사용자 중심의 인터페이스 설계 및 디지털 경험 최적화 전문',
            email: 'yongho@greencity.ch'
        },
        {
            id: 'm2',
            name: '조석희',
            role: '전체 컨텐츠 기획',
            icon: PenTool,
            color: 'from-emerald-500 to-teal-600',
            tags: ['Creative', 'Story'],
            description: '메시지의 본질을 꿰뚫는 스토리텔링과 브랜딩 전략 수립',
            email: 'seokhee@greencity.ch'
        },
        {
            id: 'm3',
            name: '윤정민',
            role: '숏폼 컨텐츠 기획',
            icon: Video,
            color: 'from-rose-500 to-orange-500',
            tags: ['Motion', 'Viral'],
            description: 'MZ세대를 겨냥한 감각적인 영상미와 트렌디한 숏폼 제작',
            email: 'jungmin@greencity.ch'
        },
        {
            id: 'm4',
            name: '연서',
            role: 'SNS 피드 관리',
            icon: Share2,
            color: 'from-fuchsia-500 to-pink-600',
            tags: ['Growth', 'Ads'],
            description: '데이터 기반의 채널 성장 전략 및 커뮤니티 활성화 관리',
            email: 'yeonseo@greencity.ch'
        },
    ],
};

interface MemberCardProps {
    member: Member;
    isLeader?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isLeader = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const Icon = member.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`relative group ${isLeader ? 'w-full max-w-lg' : 'w-full'}`}
        >
            {/* Premium Glow Effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${member.color} rounded-3xl blur-md opacity-20 group-hover:opacity-40 transition duration-500`} />

            <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden">
                {/* Background Pattern */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${member.color} opacity-5 rounded-bl-[100px] transition-transform duration-700 group-hover:scale-110`} />

                <div className="flex flex-col items-center">
                    {/* Avatar Section */}
                    <div className="relative mb-6">
                        <motion.div
                            animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className={`absolute -inset-2 bg-gradient-to-tr ${member.color} rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500`}
                        />
                        <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${member.color} p-1 shadow-inner`}>
                            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                                <Icon className="w-10 h-10 text-slate-800 dark:text-slate-200" />
                            </div>
                        </div>
                        {isLeader && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 bg-amber-400 text-white p-2 rounded-full shadow-xl"
                            >
                                <Crown size={18} fill="currentColor" />
                            </motion.div>
                        )}
                    </div>

                    {/* Text Content */}
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{member.name}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white bg-gradient-to-r ${member.color}`}>
                            {member.role}
                        </span>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[200px] mx-auto mt-2">
                            {member.description}
                        </p>
                    </div>

                    {/* Interactive Elements (Footer of Card) */}
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={isHovered || isLeader ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                        className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 w-full overflow-hidden"
                    >
                        <div className="flex justify-center gap-3 mb-4">
                            {member.tags?.map((tag) => (
                                <span key={tag} className="text-[10px] font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        {/* 
            <div className="flex justify-around items-center">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-indigo-600" aria-label="Email">
                <Mail size={18} />
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-indigo-600" aria-label="Message">
                <MessageSquare size={18} />
              </button>
            </div>
            */}
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export const MediaTeamCredits: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-indigo-100 overflow-x-hidden py-10 px-4">

            {/* Advanced Animated Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header Section */}
                <header className="text-center mb-16 mt-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-tighter uppercase"
                    >
                        <Sparkles size={14} className="animate-spin-slow" />
                        Innovative Future Ministry
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-[1000] tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400"
                    >
                        Media Strategy <span className="text-indigo-600 dark:text-indigo-400">Team</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium"
                    >
                        그린시티교회의 가치를 미디어로 디자인하는 창의적인 사역자들을 소개합니다.
                    </motion.p>
                </header>

                {/* Chart Layout */}
                <div className="flex flex-col items-center">

                    {/* Level 1: Leader */}
                    <div className="mb-20 w-full flex justify-center relative">
                        <MemberCard member={teamData.leader} isLeader={true} />
                        {/* Connector Line to Bottom */}
                        <div className="absolute -bottom-20 left-1/2 w-px h-20 bg-gradient-to-b from-indigo-500 to-transparent hidden md:block" />
                    </div>

                    {/* Level 2: Grid Members */}
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{
                            show: { transition: { staggerChildren: 0.15 } }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full"
                    >
                        {teamData.members.map((member) => (
                            <MemberCard key={member.id} member={member} />
                        ))}
                    </motion.div>

                </div>

                {/* Premium Footer */}
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
        </div>
    );
};
