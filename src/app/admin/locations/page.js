'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Plus, Power, MapPin, RefreshCw, Trash2, Edit2, X, AlertTriangle, Monitor, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function LocationsPage() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'

    // Form State
    const [formData, setFormData] = useState({ id: null, name: '', coordinates: '' });
    const [formError, setFormError] = useState('');
    const [isSaving, setIsSaving] = useState(false);


    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDanger: false,
        confirmText: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLocations();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, limit, searchQuery]);

    // Format lat/lon to "23.8041° N, 90.4152° E"
    const formatCoordinates = (lat, lon) => {
        const latStr = `${Math.abs(lat)}° ${lat >= 0 ? 'N' : 'S'}`;
        const lonStr = `${Math.abs(lon)}° ${lon >= 0 ? 'E' : 'W'}`;
        return `${latStr}, ${lonStr}`;
    };

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/admin/locations?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`);
            setLocations(data.data);
            setTotalPages(data.totalPages);
            setTotalItems(data.total);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handleLimitChange = (e) => {
        setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value));
        setPage(1);
    };

    const openModal = (mode, location = null) => {
        setModalMode(mode);
        setFormError('');
        if (mode === 'edit' && location) {
            setFormData({
                id: location.id,
                name: location.name,
                coordinates: formatCoordinates(location.latitude, location.longitude)
            });
        } else {
            setFormData({ id: null, name: '', coordinates: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const validateCoordinates = (coord) => {
        const regex = /^(\d+(\.\d+)?)°\s*([NS]),\s*(\d+(\.\d+)?)°\s*([EW])$/i;
        return regex.test(coord.trim());
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!validateCoordinates(formData.coordinates)) {
            setFormError('Invalid format. Please use: 23.8041° N, 90.4152° E');
            return;
        }

        setIsSaving(true);
        try {
            if (modalMode === 'add') {
                await api.post('/admin/locations', { name: formData.name, coordinates: formData.coordinates });
            } else {
                await api.put(`/admin/locations/${formData.id}`, { name: formData.name, coordinates: formData.coordinates });
            }
            closeModal();
            fetchLocations();
        } catch (e) {
            setFormError(e.response?.data?.error || 'Failed to save location.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await api.put(`/admin/locations/${id}/toggle`);
            fetchLocations();
        } catch (e) { alert('Failed to update status'); }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Location',
            message: 'Are you sure you want to completely remove this location? This will delete all associated logs and rules.',
            isDanger: true,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/locations/${id}`);
                    fetchLocations();
                } catch (e) { alert('Failed to delete location'); }
            }
        });
    };

    const handleDeleteAll = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete ALL Locations',
            message: 'Are you absolutely sure you want to completely remove ALL locations? This will delete ALL associated logs, alerts, and rules system-wide. This action cannot be undone.',
            isDanger: true,
            confirmText: 'Yes, Delete Everything',
            onConfirm: async () => {
                try {
                    await api.delete('/admin/locations');
                    setPage(1);
                    fetchLocations();
                } catch (e) { alert('Failed to delete all locations'); }
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-indigo-600" /> Monitored Locations
                </h1>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {locations.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="px-4 py-2 bg-rose-50 text-rose-600 font-semibold rounded-lg shadow-sm hover:bg-rose-100 hover:text-rose-700 transition flex items-center gap-2 border border-rose-200"
                            title="Delete All Locations"
                        >
                            <Trash2 className="w-4 h-4" /> Delete All
                        </button>
                    )}

                    <button
                        onClick={() => openModal('add')}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Location
                    </button>

                    <button onClick={fetchLocations} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition text-gray-600">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col">
                <div className="p-5 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-800">Geographic Regions</h3>
                        <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">{totalItems} total</span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search regions..."
                                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
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
                                <th className="p-4 pl-6">Region Name</th>
                                <th className="p-4">Coordinates (Lat, Lon)</th>
                                <th className="p-4">Monitoring Status</th>
                                <th className="p-4 text-right pr-6">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {locations.map(loc => (
                                <tr key={loc.id} className="hover:bg-indigo-50/50 transition group">
                                    <td className="p-4 pl-6 font-semibold text-slate-800 flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${loc.is_active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Monitor className="w-4 h-4" />
                                        </div>
                                        {loc.name}
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                                            {formatCoordinates(loc.latitude, loc.longitude)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggle(loc.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition border ${loc.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}
                                            title="Click to toggle status"
                                        >
                                            <Power className="w-3 h-3" />
                                            {loc.is_active ? 'ACTIVE' : 'PAUSED'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                            <button
                                                onClick={() => openModal('edit', loc)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                                title="Edit Location"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(loc.id)}
                                                className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                                                title="Delete Location"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {locations.length === 0 && !loading && (
                                <tr><td colSpan="4" className="p-16 text-center text-slate-400 text-sm bg-slate-50/50">No locations configured yet. Click "Add Location" to start monitoring.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {limit !== 'all' && (
                    <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-sm">
                        <p className="text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{((page - 1) * limit) + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(page * limit, totalItems)}</span> of <span className="font-semibold text-slate-700">{totalItems}</span> locations
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 font-semibold text-slate-700 border bg-white rounded-lg">
                                {page} / {totalPages}
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-indigo-100 flex justify-between items-start bg-indigo-50">
                            <div>
                                <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-600" />
                                    {modalMode === 'add' ? 'Add New Location' : 'Edit Location'}
                                </h2>
                                <p className="text-sm text-indigo-700 mt-1">
                                    Configure regional bounds for weather & seismic monitoring.
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-200 rounded-full transition-colors"
                            >
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

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Region/City Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Dhaka"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-slate-800"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Precise Coordinates</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. 23.8041° N, 90.4152° E"
                                    className="w-full px-4 py-2 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-slate-800"
                                    value={formData.coordinates}
                                    onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-2 font-medium">Must strictly match format: <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">23.8041° N, 90.4152° E</span></p>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 transition flex items-center justify-center min-w-[120px]"
                                >
                                    {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Save Region'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isDanger={confirmModal.isDanger}
                confirmText={confirmModal.confirmText}
            />

        </div>
    );
}
