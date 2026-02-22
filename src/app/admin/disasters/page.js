'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Flame, Plus, RefreshCw, Edit2, Trash2, Search, X, ChevronLeft, ChevronRight, AlertTriangle, Power } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function DisastersPage() {
    const [disasters, setDisasters] = useState([]);
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
    const [formData, setFormData] = useState({ id: null, name: '', description: '' });
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
            fetchDisasters();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, limit, searchQuery]);

    const fetchDisasters = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/admin/disasters?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`);
            setDisasters(data.data);
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

    const openModal = (mode, disaster = null) => {
        setModalMode(mode);
        setFormError('');
        if (mode === 'edit' && disaster) {
            setFormData({
                id: disaster.id,
                name: disaster.name,
                description: disaster.description || ''
            });
        } else {
            setFormData({ id: null, name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSaving(true);
        try {
            if (modalMode === 'add') {
                await api.post('/admin/disasters', { name: formData.name, description: formData.description });
            } else {
                await api.put(`/admin/disasters/${formData.id}`, { name: formData.name, description: formData.description });
            }
            closeModal();
            fetchDisasters();
        } catch (e) {
            setFormError(e.response?.data?.error || 'Failed to save disaster type.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await api.put(`/admin/disasters/${id}/toggle`);
            fetchDisasters();
        } catch (e) { alert('Failed to update status'); }
    };

    const handleDelete = (id, name) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Disaster Type',
            message: `Are you sure you want to completely remove "${name}"? This action will cascades and delete all associated Logic Rules mapping to this disaster.`,
            isDanger: true,
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/disasters/${id}`);
                    fetchDisasters();
                } catch (e) { alert('Failed to delete disaster'); }
            }
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Flame className="w-6 h-6 text-orange-600" /> Monitored Disasters
                </h1>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => openModal('add')}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Disaster Type
                    </button>

                    <button onClick={fetchDisasters} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition text-gray-600">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col">
                <div className="p-5 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-gray-800">Disaster Classifications</h3>
                        <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">{totalItems} total</span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search types..."
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
                                <th className="p-4 pl-6">Disaster Map</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Monitoring Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {disasters?.map((disaster) => (
                                <tr key={disaster.id} className="hover:bg-indigo-50/50 transition group">
                                    <td className="p-4 pl-6 font-semibold text-slate-800 flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${disaster.is_active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Flame className="w-4 h-4" />
                                        </div>
                                        {disaster.name}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-slate-600 line-clamp-1">{disaster.description || 'No description provided.'}</span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggle(disaster.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition border ${disaster.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}
                                            title="Click to toggle status"
                                        >
                                            <Power className="w-3 h-3" />
                                            {disaster.is_active ? 'ACTIVE' : 'PAUSED'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                            <button
                                                onClick={() => openModal('edit', disaster)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                                                title="Edit Disaster"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(disaster.id, disaster.name)}
                                                className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                                                title="Delete Disaster"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {disasters?.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-500">
                                        <AlertTriangle className="w-8 h-8 mx-auto -mb-2 opacity-20" />
                                        <br />
                                        No disaster types found matching your query.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {limit !== 'all' && (
                    <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-sm">
                        <p className="text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{totalItems === 0 ? 0 : ((page - 1) * limit) + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(page * limit, totalItems)}</span> of <span className="font-semibold text-slate-700">{totalItems}</span> types
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 font-semibold text-slate-700 border bg-white rounded-lg">
                                {page} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="p-2 border rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {modalMode === 'add' ? <Plus className="w-5 h-5 text-indigo-600" /> : <Edit2 className="w-5 h-5 text-indigo-600" />}
                                {modalMode === 'add' ? 'Define New Disaster' : 'Edit Disaster'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
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
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Disaster Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Cyclone"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-slate-800"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
                                <textarea
                                    rows="3"
                                    placeholder="Brief details about the hazard classification..."
                                    className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none text-slate-800 resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
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
                                    {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Save Disaster'}
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
