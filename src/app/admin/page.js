'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { RefreshCw, RotateCcw, AlertTriangle, MapPin, Activity, ShieldCheck, Database, ServerCrash } from 'lucide-react';

export default function AdminDashboard() {
    const [alertStats, setAlertStats] = useState([]);
    const [locationCount, setLocationCount] = useState(0);
    const [ruleCount, setRuleCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetLog, setResetLog] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => { refreshData(); }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [al, loc, r, timeRes] = await Promise.all([
                api.get('/alerts/stats').catch(() => null),
                api.get('/admin/locations').catch(() => null),
                api.get('/admin/rules').catch(() => null),
                api.get('/admin/latest-fetch-time').catch(() => null)
            ]);
            setAlertStats(al?.data || al || []);
            setLocationCount(loc?.total || loc?.data?.length || 0);
            setRuleCount(r?.total || r?.data?.length || 0);

            if (timeRes?.latest_fetch_time) {
                setLastUpdated(new Date(timeRes.latest_fetch_time));
            } else {
                setLastUpdated(null);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };


    const handleReset = async () => {
        setShowConfirm(false);
        setResetLoading(true);
        setResetLog('Initializing core reset protocols...');
        try {
            const data = await api.post('/admin/reset');
            setResetLog(data.output || data.message || 'System reset successfully completed.');
            await refreshData();

            // Ensure master admin persists securely
            localStorage.setItem('isAdminAuthenticated', 'true');
            localStorage.setItem('adminEmail', 'hstu@gmail.com');

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (e) {
            setResetLog('❌ Reset command failed: ' + (e?.message || 'Unknown kernel error'));
        }
        setResetLoading(false);
    };

    const totalAlerts = Array.isArray(alertStats) ? alertStats.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Overview</h1>
                    </div>
                    <p className="text-slate-500 text-sm md:text-base font-medium">
                        Monitoring {locationCount} regions across the country in real-time.
                    </p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">System Status</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-bold shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        Online & Active
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 font-medium">
                            {lastUpdated ? `Last checked: ${lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}` : 'Syncing...'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Top Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition">
                    <div className="absolute -right-6 -top-6 text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
                        <Database className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">LIFETIME</span>
                    </div>
                    <div className="relative z-10 font-bold text-slate-900 text-4xl mb-1">{totalAlerts}</div>
                    <p className="relative z-10 text-sm font-medium text-slate-500">Total Alerts Processed</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition">
                    <div className="absolute -right-6 -top-6 text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
                        <MapPin className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">ACTIVE</span>
                    </div>
                    <div className="relative z-10 font-bold text-slate-900 text-4xl mb-1">{locationCount}</div>
                    <p className="relative z-10 text-sm font-medium text-slate-500">Monitored Locations</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition">
                    <div className="absolute -right-6 -top-6 text-slate-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between mb-4">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-teal-500 bg-teal-50 px-2 py-1 rounded-lg">ACTIVE</span>
                    </div>
                    <div className="relative z-10 font-bold text-slate-900 text-4xl mb-1">{ruleCount}</div>
                    <p className="relative z-10 text-sm font-medium text-slate-500">Automated Alert Rules</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Threat Statistics */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900">Historical Threat Distribution</h2>
                            <button onClick={refreshData} disabled={loading} className="text-slate-400 hover:text-slate-700 transition flex items-center gap-2 text-sm font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-800' : ''}`} />
                                Sync Stats
                            </button>
                        </div>

                        {Array.isArray(alertStats) && alertStats.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {alertStats.map((stat, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center items-center text-center">
                                        <div className="text-2xl font-black text-slate-800 tracking-tight mb-1">{stat.total}</div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{stat.disaster_type}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <ShieldCheck className="w-10 h-10 mb-3 opacity-50" />
                                <p className="text-sm font-medium">No alerts generated yet. System is clear.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Controls / Danger Zone */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <ServerCrash className="w-5 h-5 text-red-500" />
                            Danger Zone
                        </h2>
                        <div className="border border-red-100 bg-red-50/50 rounded-xl p-5 relative overflow-hidden">
                            <h3 className="text-red-900 font-bold text-sm mb-2">Master System Reset</h3>
                            <p className="text-xs text-red-700/80 mb-5 leading-relaxed font-medium">
                                Erase all logs, alerts, locations, and rules. The database will be rebuilt with default geographical seeds and core disaster tracking nodes. <strong className="font-bold underline">This action is irreversible.</strong>
                            </p>
                            <button
                                onClick={() => setShowConfirm(true)}
                                disabled={resetLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm shadow-red-600/30 transition shadow-sm text-sm"
                            >
                                <RotateCcw className={`w-4 h-4 ${resetLoading ? 'animate-spin' : ''}`} />
                                {resetLoading ? 'Authorizing Reset...' : 'Initiate Factory Reset'}
                            </button>
                        </div>

                        {resetLog && (
                            <div className="mt-4 bg-slate-900 rounded-xl p-4 border border-slate-800">
                                <p className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">{resetLog}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 leading-tight">Authorize Hard Reset?</h2>
                                <p className="text-sm text-slate-500 font-medium">Critical system action required.</p>
                            </div>
                        </div>
                        <div className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 leading-relaxed">
                            <p className="mb-2">This command will unconditionally wipe the mainframe data:</p>
                            <ul className="list-disc pl-5 space-y-1 font-medium text-slate-700">
                                <li>All Disasters and Rules</li>
                                <li>All Location Datapoints</li>
                                <li>Historical Alert & Weather Logs</li>
                            </ul>
                            <p className="mt-3 text-red-600 font-bold text-xs uppercase tracking-widest">Base protocols will then be reseeded.</p>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-bold transition text-sm shadow-sm"
                            >
                                Abort
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition text-sm shadow-lg shadow-red-600/30 flex items-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Execute Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
