'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { MapPin, Plus, Power, Trash2 } from 'lucide-react';

export default function LocationTab({ locations, refresh }) {
    const [newLocation, setNewLocation] = useState({ name: '', latitude: '', longitude: '' });

    const handleAdd = async (e) => {
        e.preventDefault();
        await api.post('/admin/locations', newLocation);
        setNewLocation({ name: '', latitude: '', longitude: '' });
        refresh();
    };

    const handleToggle = async (id) => {
        await api.put(`/admin/locations/${id}/toggle`);
        refresh();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" /> Add New Location
                </h3>
                <form onSubmit={handleAdd} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-sm text-gray-600 block mb-1">Name</label>
                        <input className="w-full p-2 border rounded" required
                            value={newLocation.name} onChange={e => setNewLocation({ ...newLocation, name: e.target.value })} />
                    </div>
                    <div className="w-32">
                        <label className="text-sm text-gray-600 block mb-1">Latitude</label>
                        <input className="w-full p-2 border rounded" required type="number" step="any"
                            value={newLocation.latitude} onChange={e => setNewLocation({ ...newLocation, latitude: e.target.value })} />
                    </div>
                    <div className="w-32">
                        <label className="text-sm text-gray-600 block mb-1">Longitude</label>
                        <input className="w-full p-2 border rounded" required type="number" step="any"
                            value={newLocation.longitude} onChange={e => setNewLocation({ ...newLocation, longitude: e.target.value })} />
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                        <tr>
                            <th className="p-4">Location</th>
                            <th className="p-4">Coordinates</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {locations.map(loc => (
                            <tr key={loc.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{loc.name}</td>
                                <td className="p-4 text-gray-500 font-mono text-xs">{loc.latitude}, {loc.longitude}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${loc.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {loc.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleToggle(loc.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        {loc.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
