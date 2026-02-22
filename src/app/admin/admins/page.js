'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Users, Loader2, Plus, Trash2, Mail, Lock, X } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function AdminsPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDanger: false, confirmText: 'Confirm'
    });

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/admins');
            // Safely set admins to an array, defaulting to [] if undefined
            setAdmins(res?.data?.data || res?.data || []);
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitLoading(true);

        try {
            await api.post('/admin/admins', newAdmin);
            setIsAddModalOpen(false);
            setNewAdmin({ email: '', password: '' });
            fetchAdmins();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add admin');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = (id, email) => {
        if (email === 'hstu@gmail.com') return; // Extra frontend protection just in case

        setConfirmModal({
            isOpen: true,
            title: 'Delete Admin',
            message: `Are you sure you want to completely remove access for ${email}?`,
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/admins/${id}`);
                    fetchAdmins();
                } catch (e) {
                    console.error(e);
                    alert(e.response?.data?.error || 'Failed to delete admin');
                }
                setConfirmModal({ ...confirmModal, isOpen: false });
            }
        });
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-xl">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Management</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage system administrators</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Admin
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="py-4 px-6 text-slate-500 font-semibold text-sm">ID</th>
                                    <th className="py-4 px-6 text-slate-500 font-semibold text-sm">Email</th>
                                    <th className="py-4 px-6 text-slate-500 font-semibold text-sm">Created At</th>
                                    <th className="py-4 px-6 text-slate-500 font-semibold text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin) => (
                                    <tr key={admin.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                                        <td className="py-4 px-6 text-slate-600 font-medium">#{admin.id}</td>
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-slate-900">{admin.email}</div>
                                            {admin.email === 'hstu@gmail.com' && (
                                                <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    Master Admin
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 text-sm">
                                            {new Date(admin.created_at).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {admin.email !== 'hstu@gmail.com' ? (
                                                <button
                                                    onClick={() => handleDelete(admin.id, admin.email)}
                                                    className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
                                                    title="Delete Admin"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <span className="text-slate-300 text-sm italic pr-2">Protected</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {admins.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-slate-500">
                                            No administrators found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">Add New Admin</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={newAdmin.email}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        value={newAdmin.password}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitLoading} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition flex items-center disabled:opacity-50">
                                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Add Admin
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
                confirmText={confirmModal.confirmText}
                isDanger={confirmModal.isDanger}
            />
        </div>
    );
}
