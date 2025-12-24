'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MediaTeamMember } from '../types';
import { getIcon } from '../lib/icon-map';
import { X, Mail, Sparkles, TrendingUp, Zap, Award, CheckCircle2 } from 'lucide-react';

interface MediaMemberDetailModalProps {
    member: MediaTeamMember;
    onClose: () => void;
}

export const MediaMemberDetailModal: React.FC<MediaMemberDetailModalProps> = ({ member, onClose }) => {
    const Icon = getIcon(member.icon_name);
    const { detailed_info } = member;

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            <motion.div
                layoutId={`card-container-${member.id}`}
                className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-auto z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-full text-white md:text-slate-500 dark:text-slate-400 md:hover:bg-slate-100 dark:md:hover:bg-slate-800 transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Left Column: Visual & Core Info */}
                <div className={`relative w-full md:w-2/5 p-8 md:p-12 bg-gradient-to-br ${member.gradient_class} text-white flex flex-col items-center md:items-start text-center md:text-left justify-between overflow-hidden`}>
                    {/* Decorative Circles */}
                    <div className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square rounded-full bg-white opacity-10 blur-3xl" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square rounded-full bg-black opacity-10 blur-3xl" />

                    <div className="relative z-10 w-full flex flex-col items-center md:items-start">
                        <motion.div
                            layoutId={`card-avatar-container-${member.id}`}
                            className="w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-slate-800 p-1 rounded-full shadow-2xl mb-6 md:mb-10"
                        >
                            <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                <Icon className="w-16 h-16 md:w-20 md:h-20" />
                            </div>
                        </motion.div>

                        <motion.h2
                            layoutId={`card-name-${member.id}`}
                            className="text-4xl md:text-5xl font-black tracking-tight mb-2"
                        >
                            {member.name}
                        </motion.h2>

                        <motion.div
                            layoutId={`card-role-${member.id}`}
                            className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-sm font-bold uppercase tracking-wider mb-8"
                        >
                            {member.role}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4 w-full"
                        >
                            {member.email && (
                                <div className="flex items-center justify-center md:justify-start gap-3 text-white/90 text-sm font-medium p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                                    <Mail size={18} /> {member.email}
                                </div>
                            )}
                            <div className="flex gap-2 justify-center md:justify-start flex-wrap">
                                {member.tags?.map((tag) => (
                                    <span key={tag} className="px-3 py-1 rounded-lg bg-black/20 text-xs font-semibold backdrop-blur-sm">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="relative z-10 mt-12 md:mt-0 text-white/80 text-xs font-medium flex items-center gap-2"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Online & Active
                    </motion.div>
                </div>

                {/* Right Column: Detailed Content */}
                <div className="w-full md:w-3/5 bg-white dark:bg-slate-900 p-8 md:p-12 overflow-y-auto max-h-[50vh] md:max-h-[85vh] scrollbar-hide">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-10"
                    >
                        {/* Vision / Quote */}
                        {detailed_info?.quote && (
                            <div className="relative">
                                <Sparkles className={`absolute -top-4 -left-2 w-6 h-6 text-slate-300 dark:text-slate-600`} />
                                <blockquote className="text-2xl font-bold text-slate-800 dark:text-white leading-snug italic">
                                    "{detailed_info.quote}"
                                </blockquote>
                                <p className="mt-4 text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                                    {detailed_info.longDescription || member.short_description}
                                </p>
                            </div>
                        )}

                        <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

                        {/* Stats & Vision Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {detailed_info?.vision && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-bold">
                                        <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
                                        <h4>Vision & Goals</h4>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {detailed_info.vision}
                                    </p>
                                </div>
                            )}

                            {detailed_info?.stats && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-bold">
                                        <Zap size={18} className="text-amber-500" />
                                        <h4>Impact Stats</h4>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <div className="text-2xl font-black text-slate-800 dark:text-white">{detailed_info.stats.projects}</div>
                                            <div className="text-xs text-slate-400 font-medium">Projects</div>
                                        </div>
                                        <div className="w-px h-full bg-slate-200 dark:bg-slate-700" />
                                        <div>
                                            <div className="text-2xl font-black text-slate-800 dark:text-white">{detailed_info.stats.impact}</div>
                                            <div className="text-xs text-slate-400 font-medium">Impact Lvl</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Skills */}
                        {detailed_info?.skills && detailed_info.skills.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                    Core Competencies
                                </h3>
                                <div className="space-y-4">
                                    {detailed_info.skills.map((skill, index) => (
                                        <div key={skill.name}>
                                            <div className="flex justify-between text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                <span>{skill.name}</span>
                                                <span>{skill.level}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${skill.level}%` }}
                                                    transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                                                    className={`h-full rounded-full bg-gradient-to-r ${member.gradient_class}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Work */}
                        {detailed_info?.recentWork && detailed_info.recentWork.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                    <Award size={16} /> Recent Achievements
                                </h3>
                                <div className="space-y-3">
                                    {detailed_info.recentWork.map((work, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + (idx * 0.1) }}
                                            key={idx}
                                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group/item"
                                        >
                                            <div className={`mt-1 p-1 rounded-full bg-gradient-to-br ${member.gradient_class} bg-opacity-10`}>
                                                <CheckCircle2 size={14} className="text-white" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-800 dark:text-white group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">
                                                    {work.title}
                                                </h5>
                                                <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                    {work.category}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};
