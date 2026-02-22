'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Activity, RefreshCw, Clock, Thermometer, Wind, CloudRain, Droplets, MapPin, X, Info, Search, ChevronLeft, ChevronRight, Calendar, Filter, Trash2 } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function WeatherLogsPage() {
    const [logs, setLogs] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    const [searchLocation, setSearchLocation] = useState('');
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
    useEffect(() => { fetchLogs(); }, [searchLocation, dateFrom, dateTo, page, limit]);

    // Lock body scroll when modal is open
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
            if (searchLocation) params.append('location_id', searchLocation);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);
            const data = await api.get(`/admin/weather-logs?${params}`);
            setLogs(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.total || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const clearFilters = () => {
        setSearchLocation('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const hasActiveFilters = searchLocation || dateFrom || dateTo;

    const [deleteAllLoading, setDeleteAllLoading] = useState(false);
    const handleDeleteAll = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete All Weather Logs',
            message: `Are you sure you want to delete ALL ${totalItems} weather log records? This cannot be undone.`,
            confirmText: 'Delete All',
            isDanger: true,
            onConfirm: async () => {
                setDeleteAllLoading(true);
                try {
                    await api.delete('/admin/weather-logs/all');
                    fetchLogs();
                    clearFilters();
                } catch (e) {
                    console.error(e);
                    alert('Failed to delete all weather logs: ' + (e.message || 'Unknown error'));
                }
                setDeleteAllLoading(false);
                setConfirmModal({ ...confirmModal, isOpen: false });
            }
        });
    };

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

    const getAqiLabel = (aqi) => {
        if (aqi === null || aqi === undefined) return null;
        if (aqi <= 50) return { label: 'Good', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        if (aqi <= 100) return { label: 'Moderate', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        if (aqi <= 150) return { label: 'Sensitive', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        return { label: 'Unhealthy', color: 'bg-rose-100 text-rose-700 border-rose-200' };
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-indigo-600" /> Weather &amp; Environment Logs
                </h1>
                <div className="flex items-center gap-2">
                    {totalItems > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={deleteAllLoading}
                            className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg border border-red-200 transition text-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleteAllLoading ? 'Deleting...' : 'Delete All'}
                        </button>
                    )}
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
                        <h3 className="font-bold text-gray-800">Observation Records</h3>
                        <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">{totalItems} total</span>
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
                                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
                                value={searchLocation}
                                onChange={(e) => { setSearchLocation(e.target.value); setPage(1); }}
                            >
                                <option value="">All Locations</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>

                        {/* Date From */}
                        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 cursor-pointer">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input
                                type="date"
                                className="text-sm outline-none bg-transparent cursor-pointer"
                                value={dateFrom}
                                max={dateTo || undefined}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                placeholder="From"
                            />
                        </label>

                        <span className="text-slate-400 text-sm font-medium">to</span>

                        {/* Date To */}
                        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 cursor-pointer">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input
                                type="date"
                                className="text-sm outline-none bg-transparent cursor-pointer"
                                value={dateTo}
                                min={dateFrom || undefined}
                                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                                placeholder="To"
                            />
                        </label>

                        {/* Per page */}
                        <select
                            className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                        >
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
                                <th className="p-4">Key Readings</th>
                                <th className="p-4 text-right pr-6">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-indigo-50/50 transition group cursor-pointer" onClick={() => setSelectedLog(log)}>
                                    <td className="p-4 pl-6 text-slate-600 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition flex-shrink-0">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-700">{new Date(log.fetched_at || log.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</div>
                                                <div className="text-xs text-slate-400">{new Date(log.fetched_at || log.created_at).toLocaleTimeString([], { timeStyle: 'short' })}</div>
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
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100 text-xs font-medium">
                                                <Thermometer className="w-3 h-3" /> {log.temperature}°C
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 text-xs font-medium">
                                                <CloudRain className="w-3 h-3" /> {log.rain_sum}mm
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded border border-cyan-100 text-xs font-medium">
                                                <Wind className="w-3 h-3" /> {log.wind_speed}km/h
                                            </span>
                                            {log.aqi != null && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100 text-xs font-medium">
                                                    AQI {log.aqi}
                                                </span>
                                            )}
                                            {log.earthquake_magnitude != null && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-100 text-xs font-bold">
                                                    <Activity className="w-3 h-3" /> Mag {parseFloat(log.earthquake_magnitude).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <Info className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" className="p-16 text-center text-slate-400 text-sm bg-slate-50/50">
                                        {hasActiveFilters ? 'No records found for the selected filters.' : 'No environmental data logged yet.'}
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan="4" className="p-16 text-center text-slate-400 text-sm">
                                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-400" />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-sm">
                    <p className="text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{totalItems === 0 ? 0 : ((page - 1) * limit) + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(page * limit, totalItems)}</span> of <span className="font-semibold text-slate-700">{totalItems}</span> records
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 font-semibold text-slate-700 border bg-white rounded-lg">{page} / {totalPages}</span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-600" />
                                    {selectedLog.location_name}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(selectedLog.fetched_at || selectedLog.created_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Metric Grid */}
                        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Core Measurements</p>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Temperature */}
                                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Thermometer className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-xs text-amber-700 font-medium">Temperature</div>
                                        <div className="text-xl font-bold text-amber-900">{parseFloat(selectedLog.temperature).toFixed(2)}°C</div>
                                    </div>
                                </div>
                                {/* Humidity */}
                                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Droplets className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-xs text-blue-700 font-medium">Humidity</div>
                                        <div className="text-xl font-bold text-blue-900">{parseFloat(selectedLog.humidity).toFixed(2)}%</div>
                                    </div>
                                </div>
                                {/* Rain */}
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><CloudRain className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-xs text-indigo-700 font-medium">Rainfall</div>
                                        <div className="text-xl font-bold text-indigo-900">{parseFloat(selectedLog.rain_sum).toFixed(2)} mm</div>
                                    </div>
                                </div>
                                {/* Wind */}
                                <div className="flex items-center gap-3 p-3 bg-cyan-50 border border-cyan-100 rounded-xl">
                                    <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg"><Wind className="w-4 h-4" /></div>
                                    <div>
                                        <div className="text-xs text-cyan-700 font-medium">Wind Speed</div>
                                        <div className="text-xl font-bold text-cyan-900">{parseFloat(selectedLog.wind_speed).toFixed(2)} km/h</div>
                                    </div>
                                </div>

                                {/* AQI (conditional) */}
                                {selectedLog.aqi != null && (() => {
                                    const aqiInfo = getAqiLabel(selectedLog.aqi);
                                    return (
                                        <div className={`flex items-center gap-3 p-3 rounded-xl border col-span-1 ${aqiInfo.color}`}>
                                            <div className="p-2 rounded-lg bg-white/60"><Activity className="w-4 h-4" /></div>
                                            <div>
                                                <div className="text-xs font-medium">Air Quality (US AQI)</div>
                                                <div className="text-xl font-bold">{parseFloat(selectedLog.aqi).toFixed(2)} <span className="text-sm font-semibold">· {aqiInfo.label}</span></div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Earthquake (conditional) */}
                                {selectedLog.earthquake_magnitude != null && (
                                    <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl col-span-1">
                                        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Activity className="w-4 h-4" /></div>
                                        <div>
                                            <div className="text-xs text-rose-700 font-medium">Earthquake</div>
                                            <div className="text-xl font-bold text-rose-900">Mag {parseFloat(selectedLog.earthquake_magnitude).toFixed(1)}</div>
                                            {selectedLog.earthquake_id && (
                                                <div className="text-[10px] text-rose-400 font-mono truncate max-w-[120px]" title={selectedLog.earthquake_id}>{selectedLog.earthquake_id}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t bg-gray-50/50 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition"
                            >
                                Close
                            </button>
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
