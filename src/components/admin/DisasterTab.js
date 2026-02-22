'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Flame, Plus, Trash2 } from 'lucide-react';

export default function DisasterTab({ disasters, refresh }) {
    const [newDisaster, setNewDisaster] = useState({ name: '', severity_level: 'Medium' });

    const handleAdd = async (e) => {
        e.preventDefault();
        await api.post('/admin/disasters', newDisaster);
        setNewDisaster({ name: '', severity_level: 'Medium' });
        refresh();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-red-600" /> Create Disaster Type
                </h3>
                <form onSubmit={handleAdd} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-sm text-gray-600 block mb-1">Disaster Name</label>
                        <input className="w-full p-2 border rounded" required placeholder="e.g. Tsunami"
                            value={newDisaster.name} onChange={e => setNewDisaster({ ...newDisaster, name: e.target.value })} />
                    </div>
                    <div className="w-48">
                        <label className="text-sm text-gray-600 block mb-1">Default Severity</label>
                        <select className="w-full p-2 border rounded"
                            value={newDisaster.severity_level} onChange={e => setNewDisaster({ ...newDisaster, severity_level: e.target.value })}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-medium">Create</button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Severity</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {disasters.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-orange-500 opacity-50" />
                                    {d.name}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full 
                                        ${d.severity_level === 'Critical' ? 'bg-red-100 text-red-800' :
                                            d.severity_level === 'High' ? 'bg-orange-100 text-orange-800' :
                                                'bg-blue-100 text-blue-800'}`}>
                                        {d.severity_level}
                                    </span>
                                </td>
                                <td className="p-4 text-right text-gray-400">
                                    {/* Delete not implemented in backend for disasters safely yet */}
                                    <span className="text-xs italic">System Defined</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
