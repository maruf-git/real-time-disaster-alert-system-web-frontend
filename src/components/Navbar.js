'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Siren, ShieldAlert, Activity } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/50">
                            <Siren className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <Link href="/" className="text-xl font-bold text-white tracking-tight">
                            11th Hour <span className="text-red-500">Alert</span>
                        </Link>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
                                Live Dashboard
                            </Link>

                            <Link href="/admin" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-medium transition border border-slate-700">
                                Admin Access
                            </Link>
                        </div>
                    </div>

                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                        >
                            {isOpen ? <X className="block w-6 h-6" /> : <Menu className="block w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-slate-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link href="/" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>

                        <Link href="/admin" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Admin</Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
