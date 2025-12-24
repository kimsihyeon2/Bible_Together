'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MediaTeamMember, Skill, WorkItem } from '../types';
import { getIcon, IconMap } from '../lib/icon-map';
import { X, Plus, Trash2, Save, Upload, RotateCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MediaMemberFormModalProps {
    member?: MediaTeamMember; // If null, create mode
    onClose: () => void;
    onSuccess: () => void;
}

const DEFAULT_GRADIENTS = [
    'from-slate-500 to-slate-700',
    'from-indigo-600 to-violet-700',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-orange-500',
    'from-fuchsia-500 to-pink-600',
    'from-amber-400 to-orange-500'
];

export const MediaMemberFormModal: React.FC<MediaMemberFormModalProps> = ({ member, onClose, onSuccess }) => {
    const isEdit = !!member;
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState(member?.name || '');
    const [role, setRole] = useState(member?.role || '');
    const [email, setEmail] = useState(member?.email || '');
    const [isLeader, setIsLeader] = useState(member?.is_leader || false);
    const [iconName, setIconName] = useState(member?.icon_name || 'Users');
    const [gradientClass, setGradientClass] = useState(member?.gradient_class || DEFAULT_GRADIENTS[0]);
    const [shortDesc, setShortDesc] = useState(member?.short_description || '');
    const [tags, setTags] = useState(member?.tags?.join(', ') || '');

    // Complex JSON Data
    const [longDesc, setLongDesc] = useState(member?.detailed_info?.longDescription || '');
    const [quote, setQuote] = useState(member?.detailed_info?.quote || '');
    const [vision, setVision] = useState(member?.detailed_info?.vision || '');
    const [projectsCount, setProjectsCount] = useState(member?.detailed_info?.stats?.projects || 0);
    const [impactLvl, setImpactLvl] = useState(member?.detailed_info?.stats?.impact || 'Medium');

    const [skills, setSkills] = useState<Skill[]>(member?.detailed_info?.skills || []);
    const [recentWork, setRecentWork] = useState<WorkItem[]>(member?.detailed_info?.recentWork || []);

    // Temp inputs for arrays
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillLevel, setNewSkillLevel] = useState(80);
    const [newWorkTitle, setNewWorkTitle] = useState('');
    const [newWorkCategory, setNewWorkCategory] = useState('');

    const handleSubmit = async () => {
        if (!name || !role) {
            alert('Name and Role are required.');
            return;
        }

        setLoading(true);

        const detailedInfo = {
            longDescription: longDesc,
            quote,
            vision,
            skills,
            recentWork,
            stats: {
                projects: projectsCount,
                impact: impactLvl
            }
        };

        const payload = {
            name,
            role,
            email,
            is_leader: isLeader,
            icon_name: iconName,
            gradient_class: gradientClass,
            short_description: shortDesc,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            detailed_info: detailedInfo
        };

        try {
            if (isEdit && member) {
                const { error } = await supabase
                    .from('media_team_members')
                    .update(payload)
                    .eq('id', member.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('media_team_members')
                    .insert(payload);
                if (error) throw error;
            }
            onSuccess();
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const addSkill = () => {
        if (newSkillName) {
            setSkills([...skills, { name: newSkillName, level: newSkillLevel }]);
            setNewSkillName('');
        }
    };

    const removeSkill = (idx: number) => {
        setSkills(skills.filter((_, i) => i !== idx));
    };

    const addWork = () => {
        if (newWorkTitle) {
            setRecentWork([...recentWork, { title: newWorkTitle, category: newWorkCategory || 'General' }]);
            setNewWorkTitle('');
            setNewWorkCategory('');
        }
    };

    const removeWork = (idx: number) => {
        setRecentWork(recentWork.filter((_, i) => i !== idx));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
                    <h2 className="text-xl font-bold dark:text-white">{isEdit ? 'Edit Member' : 'Add New Member'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto flex-1 space-y-8">

                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase text-slate-400">Basic Info</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Role</label>
                                <input value={role} onChange={e => setRole(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Email</label>
                                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={isLeader} onChange={e => setIsLeader(e.target.checked)} className="w-4 h-4" />
                                    <span className="text-sm font-bold dark:text-white">Is Leader?</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Appearance */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase text-slate-400">Appearance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Icon</label>
                                <select value={iconName} onChange={e => setIconName(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                    {Object.keys(IconMap).map(icon => (
                                        <option key={icon} value={icon}>{icon}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Gradient Theme</label>
                                <select value={gradientClass} onChange={e => setGradientClass(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                    {DEFAULT_GRADIENTS.map(g => (
                                        <option key={g} value={g}>{g.replace('from-', '').replace('to-', ' -> ')}</option>
                                    ))}
                                </select>
                                <div className={`h-4 w-full rounded mt-2 bg-gradient-to-r ${gradientClass}`} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 dark:text-slate-300">Short Description (Card)</label>
                            <input value={shortDesc} onChange={e => setShortDesc(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 dark:text-slate-300">Tags (comma separated)</label>
                            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Design, Tech, Vision" className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                        </div>
                    </section>

                    {/* Detailed Info */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase text-slate-400">Rich Details</h3>
                        <div>
                            <label className="block text-xs font-bold mb-1 dark:text-slate-300">Quote</label>
                            <input value={quote} onChange={e => setQuote(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 dark:text-slate-300">Long Description</label>
                            <textarea value={longDesc} onChange={e => setLongDesc(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white h-24" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 dark:text-slate-300">Vision</label>
                            <textarea value={vision} onChange={e => setVision(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white h-16" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Projects Count</label>
                                <input type="number" value={projectsCount} onChange={e => setProjectsCount(Number(e.target.value))} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Impact Level</label>
                                <input value={impactLvl} onChange={e => setImpactLvl(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                        </div>
                    </section>

                    {/* Skills Array */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase text-slate-400">Skills</h3>
                        <div className="space-y-2">
                            {skills.map((skill, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                    <span className="flex-1 text-sm font-bold dark:text-white">{skill.name}</span>
                                    <span className="text-xs dark:text-slate-400">{skill.level}%</span>
                                    <button onClick={() => removeSkill(idx)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Skill Name</label>
                                <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                            <div className="w-20">
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Level</label>
                                <input type="number" value={newSkillLevel} onChange={e => setNewSkillLevel(Number(e.target.value))} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                            <button onClick={addSkill} className="bg-indigo-600 text-white p-2.5 rounded-lg mb-[1px]"><Plus size={18} /></button>
                        </div>
                    </section>

                    {/* Recent Work Array */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase text-slate-400">Recent Work</h3>
                        <div className="space-y-2">
                            {recentWork.map((work, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                    <span className="flex-1 text-sm font-bold dark:text-white">{work.title}</span>
                                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded dark:text-white">{work.category}</span>
                                    <button onClick={() => removeWork(idx)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Title</label>
                                <input value={newWorkTitle} onChange={e => setNewWorkTitle(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold mb-1 dark:text-slate-300">Category</label>
                                <input value={newWorkCategory} onChange={e => setNewWorkCategory(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                            </div>
                            <button onClick={addWork} className="bg-indigo-600 text-white p-2.5 rounded-lg mb-[1px]"><Plus size={18} /></button>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                        {loading && <RotateCw size={18} className="animate-spin" />}
                        {isEdit ? 'Update Member' : 'Create Member'}
                    </button>
                </div>
            </div>
        </div>
    );
};
