'use client';

import { ReactNode } from 'react';

interface DashboardContainerProps {
    children: ReactNode;
    className?: string;
}

export default function DashboardContainer({ children, className = '' }: DashboardContainerProps) {
    return (
        <div className={`mx-auto w-full max-w-[1180px] px-4 sm:px-5 lg:px-6 overflow-x-clip ${className}`}>
            {children}
        </div>
    );
}
