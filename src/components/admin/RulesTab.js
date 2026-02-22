'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Trash2, Plus } from 'lucide-react';

export default function RulesTab({ rules, locations, disasters, refresh }) {
    const [newRule, setNewRule] = useState({
        location_id: '',
        disaster_id: '',
        weather_condition: 'rain_sum',
        operator: '>',
        threshold_value: '',
        message_template: '' // Optional
    });

    const handleAdd = async (e) => {
        e.preventDefault();
        await api.post('/admin/rules', newRule);
        setNewRule({ ...newRule, threshold_value: '', message_template: '' });
        refresh();
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this rule?')) {
            await api.delete(`/admin/rules/${id}`);
            refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-600" /> Create Alert Rule
                </h3>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">If Location is</label>
                        <select className="w-full p-2 border rounded mt-1" required
                            value={newRule.location_id} onChange={e => setNewRule({ ...newRule, location_id: e.target.value })}>
                            <option value="">Select Location</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">And Weather is</label>
                        <div className="flex gap-2 mt-1">
                            <select className="w-1/2 p-2 border rounded"
                                value={newRule.weather_condition} onChange={e => setNewRule({ ...newRule, weather_condition: e.target.value })}>
                                <option value="rain_sum">Rain (mm)</option>
                                <option value="wind_speed">Wind (km/h)</option>
                                <option value="temperature">Temp (°C)</option>
                            </select>
                            <select className="w-1/4 p-2 border rounded"
                                value={newRule.operator} onChange={e => setNewRule({ ...newRule, operator: e.target.value })}>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                            </select>
                            <input className="w-1/4 p-2 border rounded" type="number" step="any" placeholder="Val" required
                                value={newRule.threshold_value} onChange={e => setNewRule({ ...newRule, threshold_value: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Then Trigger</label>
                        <select className="w-full p-2 border rounded mt-1" required
                            value={newRule.disaster_id} onChange={e => setNewRule({ ...newRule, disaster_id: e.target.value })}>
                            <option value="">Select Disaster</option>
                            {disasters.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <button className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-medium">Create Rule</button>
                    </div>
                </form>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rules.map(rule => (
                    <div key={rule.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative group">
                        <button onClick={() => handleDelete(rule.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{rule.location_name}</div>
                        <div className="text-lg font-bold text-gray-800 mb-1">
                            If {rule.weather_condition} {rule.operator} {rule.threshold_value}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                            <span>➔ Triggers {rule.disaster_name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
