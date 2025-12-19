
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    message: string;
    showLoading: (message?: string) => void;
    hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const showLoading = (msg: string = '말씀을 불러오고 있어요...') => {
        setMessage(msg);
        setIsLoading(true);
    };

    const hideLoading = () => {
        setIsLoading(false);
    };

    return (
        <LoadingContext.Provider value={{ isLoading, message, showLoading, hideLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
