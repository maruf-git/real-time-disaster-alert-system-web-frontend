'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminLogin from '@/components/admin/AdminLogin';

export default function AdminLayout({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const authStatus = localStorage.getItem('isAdminAuthenticated');
            setIsAuthenticated(authStatus === 'true');
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <AdminSidebar />
            <main className="flex-1 md:ml-64 p-4 sm:p-6 md:p-8 mt-16 md:mt-0 max-w-[100vw] overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
