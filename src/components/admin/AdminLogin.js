'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Lock, Mail, Activity, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/admin/login', { email, password });
            if (res && res.authenticated) {
                // Store simple auth flag and the email
                localStorage.setItem('isAdminAuthenticated', 'true');
                localStorage.setItem('adminEmail', res.email);
                onLoginSuccess();
            } else {
                setError('Authentication failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login error:', err);
            // api.js throws new Error(error.message) directly
            setError(err.message || 'Failed to connect to authentication server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-red-500/30">
            {/* Logo/Header above the form */}
            <div className="mb-8 flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
                    <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">11th Hour <span className="text-red-500">Alert</span></h1>
                    <p className="text-slate-500 text-sm font-medium">Administration Portal</p>
                </div>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative z-10 transition-all">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Secure Sign In</h2>
                        <p className="text-slate-500 text-sm">Enter your administrative credentials</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all sm:text-sm"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        Authorized personnel only
                    </p>
                </div>
            </div>
        </div>
    );
}
