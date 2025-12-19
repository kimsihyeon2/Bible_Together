
'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoadingScreen } from '@/components/LoadingScreen';

export function GlobalLoader({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth();

    return (
        <>
            <LoadingScreen isLoading={loading} />
            {children}
        </>
    );
}
