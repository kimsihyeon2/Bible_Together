'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from './supabase';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, name: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from database
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (!data) {
                // Profile doesn't exist, create one
                const { data: userData } = await supabase.auth.getUser();
                if (userData.user) {
                    const newProfile = {
                        id: userId,
                        email: userData.user.email || '',
                        name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
                        role: 'MEMBER' as const,
                    };
                    await supabase.from('profiles').insert(newProfile);
                    setProfile(newProfile as Profile);
                }
            } else {
                setProfile(data as Profile);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Continue without profile rather than blocking
        }
    };

    useEffect(() => {
        // Get initial session with timeout
        const initializeAuth = async () => {
            console.log('[Auth] initializeAuth started');
            let session: Session | null = null;
            try {
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth check timeout')), 15000)
                );

                // Race between session check and timeout
                const { data } = await Promise.race([sessionPromise, timeoutPromise]) as any;
                session = data?.session;

                setSession(session);
                setUser(session?.user ?? null);
                console.log('[Auth] initializeAuth found session:', session?.user?.email);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error('Session check failed or timed out:', err);
                // Fail gracefully
                setSession(null);
                setUser(null);
            } finally {
                if (session) {
                    setLoading(false);
                } else {
                    // Slight delay to allow any pending auth state changes to fire
                    console.log('[Auth] No session found in getSession, waiting 2000ms...');
                    setTimeout(() => {
                        console.log('[Auth] Setting loading=false after delay');
                        setLoading(false);
                    }, 2000);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] onAuthStateChange:', event, session?.user?.email);
                // Ignore null sessions during initial load to prevent race conditions with getSession
                if (loading && !session) {
                    console.log('[Auth] Ignoring null session because loading=true');
                    return;
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }

                // Do not set loading(false) here. Let initializeAuth handle the initial load completion.
                // This prevents race conditions where the listener fires before the profile fetch or initial check is fully done.
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Sign in with email/password
    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    // Sign up with email/password
    const signUp = async (email: string, password: string, name: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });
        return { data, error };
    };

    // Sign in with Google
    const signInWithGoogle = async () => {
        // Use environment variable or fallback to Vercel URL
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bible-together-49b1.vercel.app';
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${siteUrl}/auth/callback`,
            },
        });
        return { error };
    };

    // Sign out
    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    // Update profile
    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return { error: new Error('Not authenticated') };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (!error) {
            setProfile(prev => prev ? { ...prev, ...updates } : null);
        }

        return { error: error ? new Error(error.message) : null };
    };

    const isAdmin = profile?.role === 'PASTOR' || profile?.role === 'LEADER';

    const value = {
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        isAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
