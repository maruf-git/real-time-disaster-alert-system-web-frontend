'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map, Flame, Ruler, Activity, FileText, FlaskConical, Users, Settings, LogOut, Menu, X } from 'lucide-react';

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path) => pathname === path;

    const navItems = [
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/locations', icon: Map, label: 'Locations' },
        { href: '/admin/disasters', icon: Flame, label: 'Disasters' },
        { href: '/admin/rules', icon: Ruler, label: 'Alert Rules' },
        { href: '/admin/weather_logs', icon: Activity, label: 'Weather History' },
        { href: '/admin/earthquake_logs', icon: Activity, label: 'Earthquake Logs' },
        { href: '/admin/alert_logs', icon: FileText, label: 'Alert History' },
        { href: '/admin/simulate', icon: FlaskConical, label: 'Simulate Tests' },
        { href: '/admin/admins', icon: Users, label: 'Manage Admins' },
        { href: '/admin/settings', icon: Settings, label: 'System Settings' },
    ];

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('adminEmail');
        window.location.href = '/'; // Redirect to home page
    };

    return (
        <>
            {/* Mobile Header Toggle */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 flex items-center justify-between px-4 z-50 shadow-md">
                <Link href="/admin" className="text-xl font-bold flex items-center gap-2 text-white">
                    <Activity className="w-6 h-6 text-indigo-400" />
                    Admin Panel
                </Link>
                <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-white p-2">
                    {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed h-full z-50 top-0 left-0 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-6">
                    <Link href="/admin" className="text-xl font-bold flex items-center gap-2 hover:text-indigo-400 transition">
                        <Activity className="w-6 h-6 text-indigo-400" />
                        Admin Panel
                    </Link>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${isActive(item.href)
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors font-medium text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Secure Logout
                    </button>
                    <div className="mt-4 text-xs text-slate-600 text-center">
                        Next.js 15 Admin Console
                    </div>
                </div>
            </aside>
        </>
    );
}
