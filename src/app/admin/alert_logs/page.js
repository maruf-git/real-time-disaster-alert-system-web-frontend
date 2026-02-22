'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { FileText, RefreshCw, Clock, AlertTriangle, MapPin, X, ChevronLeft, ChevronRight, Calendar, Filter, CheckCircle, Trash2 } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const SEVERITY_STYLES = {
    Critical: 'bg-red-100 text-red-800 border-red-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Low: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function AlertHistoryPage() {
    const [alerts, setAlerts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [disasters, setDisasters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterLocation, setFilterLocation] = useState('');
    const [filterDisaster, setFilterDisaster] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDanger: false, confirmText: 'Confirm'
    });

    useEffect(() => { fetchLocations(); fetchDisasters(); }, []);
    useEffect(() => { fetchAlerts(); }, [filterLocation, filterDisaster, dateFrom, dateTo, page, limit]);

    const fetchLocations = async () => {
        try {
            const data = await api.get('/admin/locations?limit=all');
            setLocations(data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchDisasters = async () => {
        try {
            const data = await api.get('/admin/disasters');
            setDisasters(Array.isArray(data) ? data : (data.data || []));
        } catch (e) { console.error(e); }
    };

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit });
            if (filterLocation) params.append('location_id', filterLocation);
            if (filterDisaster) params.append('disaster_id', filterDisaster);
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);
            const data = await api.get(`/admin/alert-logs?${params}`);
            setAlerts(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.total || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const clearFilters = () => { setFilterLocation(''); setFilterDisaster(''); setDateFrom(''); setDateTo(''); setPage(1); };
    const hasActiveFilters = filterLocation || filterDisaster || dateFrom || dateTo;

    const [deleteAllLoading, setDeleteAllLoading] = useState(false);
    const handleDeleteAll = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete All Alerts',
            message: `Are you sure you want to delete ALL ${totalItems} alert records? This cannot be undone.`,
            confirmText: 'Delete All',
            isDanger: true,
            onConfirm: async () => {
                setDeleteAllLoading(true);
                try {
                    await api.delete('/admin/alert-logs');
                    fetchAlerts();
                } catch (e) {
                    console.error(e);
                    alert('Failed to delete all alerts: ' + (e.message || 'Unknown error'));
                }
                setDeleteAllLoading(false);
                setConfirmModal({ ...confirmModal, isOpen: false });
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-red-600" /> Alert History
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
                    <button onClick={fetchAlerts} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition text-gray-600">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col">
                {/* Toolbar */}
                <div className="p-5 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-800">Generated Alerts</h3>
                        <span className="text-xs font-semibold px-3 py-1 bg-red-50 text-red-700 rounded-full">{totalItems} total</span>
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
                                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white appearance-none cursor-pointer"
                                value={filterLocation}
                                onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }}
                            >
                                <option value="">All Locations</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                        {/* Disaster filter */}
                        <div className="relative min-w-[160px]">
                            <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white appearance-none cursor-pointer"
                                value={filterDisaster}
                                onChange={(e) => { setFilterDisaster(e.target.value); setPage(1); }}
                            >
                                <option value="">All Disasters</option>
                                {disasters.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        {/* Date From */}
                        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-red-500 cursor-pointer">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input type="date" className="text-sm outline-none bg-transparent cursor-pointer" value={dateFrom} max={dateTo || undefined} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                        </label>
                        <span className="text-slate-400 text-sm font-medium">to</span>
                        {/* Date To */}
                        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white focus-within:ring-2 focus-within:ring-red-500 cursor-pointer">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <input type="date" className="text-sm outline-none bg-transparent cursor-pointer" value={dateTo} min={dateFrom || undefined} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
                        </label>
                        {/* Per page */}
                        <select className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
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
                                <th className="p-4">Disaster Type</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Severity</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {alerts.map(alert => (
                                <tr key={alert.id} className="hover:bg-red-50/40 transition group">
                                    <td className="p-4 pl-6 text-slate-600 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-red-500 transition flex-shrink-0">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-700">{new Date(alert.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</div>
                                                <div className="text-xs text-slate-400">{new Date(alert.created_at).toLocaleTimeString([], { timeStyle: 'short' })}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-semibold text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                            {alert.disaster_name}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            {alert.location_name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded border ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.Low}`}>
                                            {alert.severity}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {alert.is_active ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                                                <CheckCircle className="w-3 h-3" /> Resolved
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {alerts.length === 0 && !loading && (
                                <tr><td colSpan="5" className="p-16 text-center text-slate-400 text-sm bg-slate-50/50">
                                    {hasActiveFilters ? 'No alerts found for the selected filters.' : 'No alerts have been generated yet.'}
                                </td></tr>
                            )}
                            {loading && (
                                <tr><td colSpan="5" className="p-16 text-center">
                                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-red-400" />
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
