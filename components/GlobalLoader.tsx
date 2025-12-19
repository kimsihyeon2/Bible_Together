
'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useLoading } from '@/lib/loading-context';

export function GlobalLoader({ children }: { children: React.ReactNode }) {
    const { loading: authLoading } = useAuth();
    const { isLoading: globalLoading, message } = useLoading();

    // Show if either auth is initializing OR manual global load is requested
    const shouldShow = authLoading || globalLoading;

    return (
        <>
            <LoadingScreen isLoading={shouldShow} message={message} />
            {children}
        </>
    );
}
