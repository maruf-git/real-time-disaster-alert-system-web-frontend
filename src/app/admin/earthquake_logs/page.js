'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Activity, RefreshCw, Clock, MapPin, X, Info, ChevronLeft, ChevronRight, Calendar, Filter, FlaskConical, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function EarthquakeLogsPage() {
    const [logs, setLogs] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    const [filterLocation, setFilterLocation] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDanger: false, confirmText: 'Confirm'
    });

    useEffect(() => { fetchLocations(); }, []);
    useEffect(() => { fetchLogs(); }, [filterLocation, dateFrom, dateTo, page, limit]);

    useEffect(() => {
        if (selectedLog) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [selectedLog]);

    const fetchLocations = async () => {
        try {
            const data = await api.get('/admin/locations?limit=all');
            setLocations(data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit });
            if (filterLocation) params.append('location_id', filterLocation);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);
            const data = await api.get(`/admin/earthquake-logs?${params}`);
            setLogs(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.total || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const clearFilters = () => { setFilterLocation(''); setDateFrom(''); setDateTo(''); setPage(1); };
    const hasActiveFilters = filterLocation || dateFrom || dateTo;

    const [deleteAllLoading, setDeleteAllLoading] = useState(false);
    const handleDeleteAll = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete All Earthquake Logs',
            message: `Are you sure you want to delete ALL ${totalItems} earthquake log records? This cannot be undone.`,
            confirmText: 'Delete All',
            isDanger: true,
            onConfirm: async () => {
                setDeleteAllLoading(true);
                try {
                    await api.delete('/admin/earthquake-logs/all');
                    fetchLogs();
                    clearFilters();
                } catch (e) {
                    console.error(e);
                    alert('Failed to delete all earthquake logs: ' + (e.message || 'Unknown error'));
                }
                setDeleteAllLoading(false);
                setConfirmModal({ ...confirmModal, isOpen: false });
            }
        });
    };


    const getMagnitudeColor = (m) => {
        if (m >= 7) return 'bg-red-100 text-red-800 border-red-200';
        if (m >= 5) return 'bg-orange-100 text-orange-800 border-orange-200';
        if (m >= 3) return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-rose-600" /> Seismic Activity Logs
                </h1>
                <div className="flex items-center gap-2">
                    {totalItems > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={deleteAllLoading}
                            className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg border border-red-200 transition text-sm mr-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleteAllLoading ? 'Deleting...' : 'Delete All'}
                        </button>
                    )}
                    <Link
                        href="/admin/simulate"
                        className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg shadow-sm hover:bg-rose-700 transition flex items-center gap-2 text-sm"
                    >
                        <FlaskConical className="w-4 h-4" /> Simulate Test
                    </Link>
                    <button onClick={fetchLogs} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition text-gray-600">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col">
                {/* Toolbar */}
                <div className="p-5 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-800">Seismic Records</h3>
                        <span className="text-xs font-semibold px-3 py-1 bg-rose-50 text-rose-700 rounded-full">{totalItems} total</span>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold transition">
                                <X className="w-3 h-3" /> Clear filters
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Location filter */}
                        <div className="relative min-w-[160px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500 bg-white appearance-none cursor-pointer"
                                value={filterLocation}
                                onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }}
                            >
                                <option value="">All Locations</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                        {/* Date From */}
                        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-rose-500 cursor-pointer">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input type="date" className="text-sm outline-none bg-transparent cursor-pointer" value={dateFrom} max={dateTo || undefined} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                        </label>
                        <span className="text-slate-400 text-sm font-medium">to</span>
                        {/* Date To */}
                        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-rose-500 cursor-pointer">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input type="date" className="text-sm outline-none bg-transparent cursor-pointer" value={dateTo} min={dateFrom || undefined} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
                        </label>
                        {/* Per page */}
                        <select className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500 bg-white" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Timestamp</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Magnitude</th>
                                <th className="p-4">Event ID</th>
                                <th className="p-4 text-right pr-6">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-rose-50/40 transition group cursor-pointer" onClick={() => setSelectedLog(log)}>
                                    <td className="p-4 pl-6 text-slate-600 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition flex-shrink-0">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-700">{new Date(log.fetched_at).toLocaleDateString([], { dateStyle: 'medium' })}</div>
                                                <div className="text-xs text-slate-400">{new Date(log.fetched_at).toLocaleTimeString([], { timeStyle: 'short' })}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-semibold text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            {log.location_name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 border rounded-md text-xs font-bold ${getMagnitudeColor(log.magnitude)}`}>
                                            <Activity className="w-3 h-3" /> {parseFloat(log.magnitude).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate max-w-[180px]">{log.usgs_id}</span>
                                            {log.is_manual && (
                                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase rounded border border-yellow-200 flex-shrink-0">Test</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                                                className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <Info className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr><td colSpan="5" className="p-16 text-center text-slate-400 text-sm bg-slate-50/50">
                                    {hasActiveFilters ? 'No records found for the selected filters.' : 'No seismic data logged yet.'}
                                </td></tr>
                            )}
                            {loading && (
                                <tr><td colSpan="5" className="p-16 text-center">
                                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-rose-400" />
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-sm">
                    <p className="text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{totalItems === 0 ? 0 : ((page - 1) * limit) + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(page * limit, totalItems)}</span> of <span className="font-semibold text-slate-700">{totalItems}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="px-4 py-2 font-semibold text-slate-700 border bg-white rounded-lg">{page} / {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-rose-600" /> Earthquake Event
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Near {selectedLog.location_name}
                                </p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Magnitude hero */}
                            <div className="flex flex-col items-center justify-center p-6 bg-rose-50 rounded-xl border border-rose-100">
                                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Magnitude</span>
                                <span className="text-6xl font-black text-rose-700">{parseFloat(selectedLog.magnitude).toFixed(2)}</span>
                                <span className="text-xs text-rose-400 mt-1">Richter Scale</span>
                            </div>
                            {/* Info rows */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="text-xs text-slate-400 font-medium uppercase">Detection Time</div>
                                        <div className="text-sm font-semibold text-slate-700 mt-0.5">{new Date(selectedLog.fetched_at).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <Activity className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-xs text-slate-400 font-medium uppercase flex items-center gap-2">
                                            USGS / Event ID
                                            {selectedLog.is_manual && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">MANUAL TEST</span>}
                                        </div>
                                        <div className="text-sm font-mono text-slate-600 mt-0.5 break-all">{selectedLog.usgs_id}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t bg-gray-50/50 flex justify-end">
                            <button onClick={() => setSelectedLog(null)} className="px-6 py-2 bg-rose-600 text-white font-semibold rounded-lg shadow-sm hover:bg-rose-700 transition">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={() => {
                    confirmModal.onConfirm();
                }}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDanger={confirmModal.isDanger}
            />
        </div>
    );
}
