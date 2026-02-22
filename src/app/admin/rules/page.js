'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Activity, Plus, RefreshCw, Edit2, Trash2, Search, X, ChevronLeft, ChevronRight, AlertTriangle, ShieldAlert, Info, Power, MapPin, Filter } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const WEATHER_CONDITIONS = [
    { value: 'rain_sum', label: 'Rain (mm)', unit: 'mm' },
    { value: 'wind_speed', label: 'Wind Speed (km/h)', unit: 'km/h' },
    { value: 'temperature', label: 'Temperature (°C)', unit: '°C' },
    { value: 'humidity', label: 'Humidity (%)', unit: '%' },
    { value: 'aqi', label: 'Air Quality Index (US AQI)', unit: 'AQI' },
    { value: 'earthquake_magnitude', label: 'Earthquake Magnitude (Richter)', unit: 'Mag' }
];

const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export default function RulesPage() {
    const [rules, setRules] = useState([]);
    const [locations, setLocations] = useState([]);
    const [disasters, setDisasters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterDisaster, setFilterDisaster] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedDetailsRule, setSelectedDetailsRule] = useState(null);
    const [modalMode, setModalMode] = useState('add');
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState('');

    const emptyForm = {
        location_id: '',
        disaster_id: '',
        weather_condition: 'rain_sum',
        operator: '>',
        threshold_value: '',
        message_template: '',
        severity_level: 'Medium'
    };

    const [formData, setFormData] = useState(emptyForm);

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDanger: false, confirmText: 'Confirm'
    });

    useEffect(() => { refreshDropdowns(); }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => { fetchRules(); }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filterLocation, filterDisaster, page, limit]);

    const refreshDropdowns = async () => {
        try {
            const [l, d] = await Promise.all([
                api.get('/admin/locations?limit=all'),
                api.get('/admin/disasters?limit=all&activeOnly=true')
            ]);
            setLocations(l.data || []);
            setDisasters(d.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchRules = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (filterLocation) params.append('location_id', filterLocation);
            if (filterDisaster) params.append('disaster_id', filterDisaster);
            params.append('page', page);
            params.append('limit', limit);
            const data = await api.get(`/admin/rules?${params.toString()}`);
            setRules(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.total || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleSearchChange = (e) => { setSearchQuery(e.target.value); setPage(1); };
    const handleLimitChange = (e) => {
        setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value));
        setPage(1);
    };

    const clearFilters = () => { setSearchQuery(''); setFilterLocation(''); setFilterDisaster(''); setPage(1); };
    const hasActiveFilters = searchQuery || filterLocation || filterDisaster;

    const [deleteAllLoading, setDeleteAllLoading] = useState(false);
    const handleDeleteAll = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete All Rules',
            message: `Are you sure you want to delete ALL ${totalItems} rule records? This cannot be undone.`,
            confirmText: 'Delete All',
            isDanger: true,
            onConfirm: async () => {
                setDeleteAllLoading(true);
                try {
                    await api.delete('/admin/rules/all');
                    fetchRules();
                    clearFilters();
                } catch (e) {
                    console.error(e);
                    alert('Failed to delete all rules: ' + (e.message || 'Unknown error'));
                }
                setDeleteAllLoading(false);
                setConfirmModal({ ...confirmModal, isOpen: false });
            }
        });
    };

    const openModal = (mode, rule = null) => {
        setModalMode(mode);
        setFormError('');
        if (mode === 'edit' && rule) {
            setFormData({
                location_id: rule.location_id ?? '',
                disaster_id: rule.disaster_id,
                weather_condition: rule.weather_condition,
                operator: rule.operator,
                threshold_value: rule.threshold_value,
                message_template: rule.message_template || '',
                severity_level: rule.severity_level || 'Medium'
            });
            setEditingId(rule.id);
        } else {
            setFormData(emptyForm);
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.disaster_id || formData.threshold_value === '') {
            setFormError('Please fill in all required fields.');
            return;
        }

        const threshold = parseFloat(formData.threshold_value);

        if (isNaN(threshold)) {
            setFormError('Threshold must be a valid number.');
            return;
        }
        if (formData.weather_condition === 'humidity' && (threshold < 0 || threshold > 100)) {
            setFormError('Humidity must be between 0 and 100%.');
            return;
        }
        if (formData.weather_condition !== 'temperature' && threshold < 0) {
            setFormError(`Threshold for ${WEATHER_CONDITIONS.find(c => c.value === formData.weather_condition)?.label || 'this metric'} cannot be negative.`);
            return;
        }
        if (formData.weather_condition === 'aqi' && threshold > 5000) {
            setFormError('AQI value seems unusually high (max 5000). Please verify.');
            return;
        }
        if (formData.weather_condition === 'earthquake_magnitude' && threshold > 15) {
            setFormError('Earthquake magnitude seems unusually high (max 15.0). Please verify.');
            return;
        }

        if (modalMode === 'add') {
            await executeSave();
        } else {
            setConfirmModal({
                isOpen: true,
                title: 'Update Alert Rule',
                message: 'Modifying this rule will immediately affect how future alerts are generated. Proceed?',
                confirmText: 'Update Rule',
                isDanger: false,
                onConfirm: async () => executeSave()
            });
        }
    };

    const executeSave = async () => {
        try {
            const payload = {
                ...formData,
                location_id: formData.location_id === '' ? null : formData.location_id
            };
            if (modalMode === 'edit') {
                await api.put(`/admin/rules/${editingId}`, payload);
            } else {
                await api.post('/admin/rules', payload);
            }
            closeModal();
            fetchRules();
        } catch (e) {
            setFormError('Failed to save rule. Please try again.');
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Alert Rule',
            message: `Are you sure? This will stop automatic alerts for this mapped logic.`,
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/rules/${id}`);
                    if (rules.length === 1 && page > 1) setPage(page - 1);
                    fetchRules();
                } catch (e) { alert('Failed to delete rule'); }
            }
        });
    };

    const handleToggle = async (id) => {
        try {
            await api.put(`/admin/rules/${id}/toggle`);
            setRules(rules.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
        } catch (e) { alert('Failed to toggle rule status'); }
    };

    const getSeverityColor = (level) => {
        switch (level) {
            case 'Critical': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-indigo-600" /> Automation Rules
                </h1>
                <div className="flex items-center gap-3 w-full md:w-auto">
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
                    <button
                        onClick={() => openModal('add')}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Rule
                    </button>
                    <button onClick={fetchRules} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition text-gray-600">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col">
                <div className="p-5 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-800">Logic Mapping</h3>
                        <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">{totalItems} total</span>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold transition">
                                <X className="w-3 h-3" /> Clear filters
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search rules…"
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                        {/* Location filter */}
                        <div className="relative min-w-[140px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
                                value={filterLocation}
                                onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }}
                            >
                                <option value="">All Locations</option>
                                <option value="global">Global (All Locations)</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                        {/* Disaster filter */}
                        <div className="relative min-w-[140px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select
                                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
                                value={filterDisaster}
                                onChange={(e) => { setFilterDisaster(e.target.value); setPage(1); }}
                            >
                                <option value="">All Disasters</option>
                                {disasters.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <select
                            className="p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={limit}
                            onChange={handleLimitChange}
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value="all">All</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Rule Scope</th>
                                <th className="p-4">Trigger Logic</th>
                                <th className="p-4">Severity</th>
                                <th className="p-4">Monitoring Status</th>
                                <th className="p-4 text-right pr-6">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {rules?.map((rule) => {
                                const condition = WEATHER_CONDITIONS.find(c => c.value === rule.weather_condition);
                                const isGlobal = rule.location_id === null;
                                return (
                                    <tr key={rule.id} className="hover:bg-indigo-50/50 transition group">
                                        <td className="p-4 pl-6 font-semibold text-slate-800 flex items-center gap-3">
                                            <div className={`p-2 rounded-lg flex-shrink-0 ${rule.is_active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {isGlobal ? <MapPin className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                                    {isGlobal
                                                        ? <span className="text-indigo-600">All Locations</span>
                                                        : rule.location_name}
                                                    {isGlobal && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">GLOBAL</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                                                    <ShieldAlert className="w-3 h-3 text-orange-500" /> {rule.disaster_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs border border-slate-200">
                                                {condition?.label || rule.weather_condition}
                                            </span>
                                            <span className="font-bold text-slate-400 mx-1">{rule.operator}</span>
                                            <span className="font-bold text-indigo-600">{rule.threshold_value} {condition?.unit}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getSeverityColor(rule.severity_level || 'Medium')}`}>
                                                {rule.severity_level || 'Medium'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleToggle(rule.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition border ${rule.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}
                                                title="Click to toggle status"
                                            >
                                                <Power className="w-3 h-3" />
                                                {rule.is_active ? 'ACTIVE' : 'PAUSED'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                                <button
                                                    onClick={() => { setSelectedDetailsRule(rule); setIsDetailsModalOpen(true); }}
                                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                                    title="View Details"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openModal('edit', rule)}
                                                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                                    title="Edit Rule"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                                                    title="Delete Rule"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {rules?.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center text-slate-400 text-sm bg-slate-50/50">
                                        No automation rules configured yet. Click &quot;Add Rule&quot; to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {limit !== 'all' && (
                    <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-sm">
                        <p className="text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{totalItems === 0 ? 0 : ((page - 1) * limit) + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(page * limit, totalItems)}</span> of <span className="font-semibold text-slate-700">{totalItems}</span> rules
                        </p>
                        <div className="flex items-center gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 font-semibold text-slate-700 border bg-white rounded-lg">{page} / {totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {modalMode === 'add' ? <Plus className="w-5 h-5 text-indigo-600" /> : <Edit2 className="w-5 h-5 text-indigo-600" />}
                                {modalMode === 'add' ? 'Create New Rule' : 'Edit Rule'}
                            </h2>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {formError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2 text-sm">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Target Location</label>
                                    <select
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                        value={formData.location_id}
                                        onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                    >
                                        <option value="">All Locations (Global)</option>
                                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                    {formData.location_id === '' && (
                                        <p className="text-xs text-slate-500 mt-1">This rule will apply to all monitored locations.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Associated Disaster <span className="text-rose-500">*</span></label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                        value={formData.disaster_id}
                                        onChange={(e) => setFormData({ ...formData, disaster_id: e.target.value })}
                                    >
                                        <option value="" disabled>Select Active Disaster…</option>
                                        {disasters.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Target Metric</label>
                                    <select
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                                        value={formData.weather_condition}
                                        onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}
                                    >
                                        {WEATHER_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Operator</label>
                                    <select
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition font-mono text-center"
                                        value={formData.operator}
                                        onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                                    >
                                        <option value=">">&gt; (Greater Than)</option>
                                        <option value=">=">&gt;= (Greater or Equal)</option>
                                        <option value="<">&lt; (Less Than)</option>
                                        <option value="<=">&lt;= (Less or Equal)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Threshold <span className="text-rose-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        step="0.1"
                                        placeholder="Value…"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition focus:bg-white"
                                        value={formData.threshold_value}
                                        onChange={(e) => setFormData({ ...formData, threshold_value: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Severity / Threat Level</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                    value={formData.severity_level}
                                    onChange={(e) => setFormData({ ...formData, severity_level: e.target.value })}
                                >
                                    {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Automated Message Prefix <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Critical Threshold Breached!"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                                    value={formData.message_template}
                                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-1">Appended before sensor data in alert notifications.</p>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    {modalMode === 'add' ? 'Save Rule' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsModalOpen && selectedDetailsRule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-600" /> Rule Details
                            </h2>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Target Location</h4>
                                {selectedDetailsRule.location_id === null
                                    ? <span className="font-semibold text-indigo-600 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> All Locations (Global Rule)</span>
                                    : <p className="font-semibold text-gray-800">{selectedDetailsRule.location_name}</p>}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Associated Disaster</h4>
                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-orange-500" /> {selectedDetailsRule.disaster_name}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Trigger Logic</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-800 bg-gray-50 p-3 border border-gray-100 rounded-lg">
                                    <span className="font-mono text-indigo-600 font-semibold">{WEATHER_CONDITIONS.find(c => c.value === selectedDetailsRule.weather_condition)?.label || selectedDetailsRule.weather_condition}</span>
                                    <span className="font-bold text-gray-500">{selectedDetailsRule.operator}</span>
                                    <span className="font-bold">{selectedDetailsRule.threshold_value} {WEATHER_CONDITIONS.find(c => c.value === selectedDetailsRule.weather_condition)?.unit}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Severity Level</h4>
                                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getSeverityColor(selectedDetailsRule.severity_level || 'Medium')}`}>
                                    {selectedDetailsRule.severity_level || 'Medium'}
                                </span>
                            </div>
                            {selectedDetailsRule.message_template && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Message Template</h4>
                                    <p className="text-sm text-gray-600 italic">&quot;{selectedDetailsRule.message_template}&quot;</p>
                                </div>
                            )}
                        </div>
                        <div className="p-5 border-t bg-gray-50/50 flex justify-end">
                            <button onClick={() => setIsDetailsModalOpen(false)} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition">
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
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDanger={confirmModal.isDanger}
            />
        </div>
    );
}
