'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client for client-side use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface Profile {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: 'MEMBER' | 'LEADER' | 'PASTOR';
    avatar_url?: string;
    created_at: string;
}

export interface Cell {
    id: string;
    name: string;
    invite_code: string;
    created_at: string;
}

export interface Notification {
    id: string;
    title: string;
    body: string;
    target: 'ALL' | 'LEADER' | 'CELL';
    created_by?: string;
    cell_id?: string;
    created_at: string;
}

export interface UrgentPrayer {
    id: string;
    title: string;
    content: string;
    requester_name?: string;
    created_by?: string;
    is_active: boolean;
    created_at: string;
}

export interface PushSubscription {
    id: string;
    user_id: string;
    fcm_token: string;
    device_info?: string;
    created_at: string;
}

// Helper functions for common operations
export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
}

export async function getCells() {
    const { data, error } = await supabase
        .from('cells')
        .select('*')
        .order('name');
    return { data, error };
}

export async function getUrgentPrayers() {
    const { data, error } = await supabase
        .from('urgent_prayers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    return { data, error };
}

export async function createUrgentPrayer(prayer: {
    title: string;
    content: string;
    requester_name?: string;
}) {
    const { data, error } = await supabase
        .from('urgent_prayers')
        .insert(prayer)
        .select()
        .single();
    return { data, error };
}
