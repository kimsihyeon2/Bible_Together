'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MediaTeamMember } from '../types';
import { getIcon } from '../lib/icon-map';
import { Crown, ChevronRight } from 'lucide-react';

interface MediaMemberCardProps {
    member: MediaTeamMember;
    onClick: (member: MediaTeamMember) => void;
    isSelected: boolean;
}

export const MediaMemberCard: React.FC<MediaMemberCardProps> = ({ member, onClick, isSelected }) => {
    const [isHovered, setIsHovered] = useState(false);
    const Icon = getIcon(member.icon_name);

    return (
        <motion.div
            layoutId={`card-container-${member.id}`}
            onClick={() => onClick(member)}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`relative group cursor-pointer ${member.is_leader ? 'w-full max-w-lg' : 'w-full'} ${isSelected ? 'opacity-0' : 'opacity-100'}`}
        >
            {/* Premium Glow Effect - Only visible when NOT expanding/selected */}
            <motion.div
                layoutId={`card-glow-${member.id}`}
                className={`absolute -inset-0.5 bg-gradient-to-r ${member.gradient_class} rounded-3xl blur-md opacity-20 group-hover:opacity-40 transition duration-500`}
            />

            <motion.div
                className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden h-full"
            >
                {/* Background Pattern */}
                <motion.div
                    layoutId={`card-bg-pattern-${member.id}`}
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${member.gradient_class} opacity-5 rounded-bl-[100px] transition-transform duration-700 group-hover:scale-110`}
                />

                <div className="flex flex-col items-center">
                    {/* Avatar Section */}
                    <div className="relative mb-6">
                        <motion.div
                            animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className={`absolute -inset-2 bg-gradient-to-tr ${member.gradient_class} rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500`}
                        />
                        <motion.div
                            layoutId={`card-avatar-container-${member.id}`}
                            className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${member.gradient_class} p-1 shadow-inner`}
                        >
                            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                                <Icon className="w-10 h-10 text-slate-800 dark:text-slate-200" />
                            </div>
                        </motion.div>
                        {member.is_leader && (
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
                        <motion.h3
                            layoutId={`card-name-${member.id}`}
                            className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
                        >
                            {member.name}
                        </motion.h3>
                        <motion.span
                            layoutId={`card-role-${member.id}`}
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white bg-gradient-to-r ${member.gradient_class}`}
                        >
                            {member.role}
                        </motion.span>
                        <motion.p
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[200px] mx-auto mt-2 line-clamp-2"
                        >
                            {member.short_description}
                        </motion.p>
                    </div>

                    {/* Interactive Elements (Footer of Card) */}
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={isHovered || member.is_leader ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                        className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 w-full overflow-hidden"
                    >
                        <div className="flex justify-center gap-3 mb-4 flex-wrap">
                            {member.tags?.map((tag) => (
                                <span key={tag} className="text-[10px] font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex justify-center items-center text-xs text-slate-400 font-medium group-hover:text-indigo-500 transition-colors">
                            View Details <ChevronRight size={14} className="ml-1" />
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};
