'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Settings, Save, AlertCircle, Clock } from 'lucide-react';

export default function SettingsDashboard() {
    const [settings, setSettings] = useState({
        weather_fetch_interval: '300',
        earthquake_fetch_interval: '60'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await api.get('/admin/settings');
            setSettings({
                weather_fetch_interval: data.weather_fetch_interval || '300',
                earthquake_fetch_interval: data.earthquake_fetch_interval || '60'
            });
        } catch (e) {
            console.error('Failed to load settings:', e);
            showNotification('Failed to load configuration.', 'error');
        }
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/admin/settings', settings);
            showNotification('Settings updated successfully. Timers will adjust on their next loop.', 'success');
        } catch (e) {
            console.error('Failed to save settings:', e);
            showNotification(e.response?.data?.error || 'Failed to save configuration.', 'error');
        }
        setSaving(false);
    };

    const showNotification = (msg, type) => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleChange = (e) => {
        setSettings({
            ...settings,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Settings className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Settings</h1>
                    </div>
                    <p className="text-slate-500 text-sm md:text-base font-medium">
                        Configure core architecture behaviors and API polling intervals.
                    </p>
                </div>
            </header>

            {notification && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold border transition-all ${notification.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {notification.msg}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        API Polling Intervals
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Control how frequently the backend scheduler fetches external data. Changes apply immediately upon saving.
                    </p>

                    {/* Safety Warning requested by user */}
                    <div className="mt-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <h3 className="text-amber-800 font-bold text-sm">Rate Limit Warning</h3>
                                <p className="text-amber-700 text-sm mt-1">
                                    Setting intervals to extreme values (e.g., under 30 seconds) can trigger API rate limits or IP bans from Open-Meteo and USGS. The system restricts values lower than 30s as a safety precaution. Recommended safe minimums: Weather (300s), Earthquakes (60s).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">Weather & AQI Fetch Interval (Seconds)</label>
                            <input
                                type="number"
                                name="weather_fetch_interval"
                                min="30"
                                value={settings.weather_fetch_interval}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium"
                                placeholder="300"
                            />
                            <p className="text-xs text-slate-400 font-medium">Default: 300 seconds (5 minutes)</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">Earthquake Fetch Interval (Seconds)</label>
                            <input
                                type="number"
                                name="earthquake_fetch_interval"
                                min="30"
                                value={settings.earthquake_fetch_interval}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium"
                                placeholder="60"
                            />
                            <p className="text-xs text-slate-400 font-medium">Default: 60 seconds (1 minute)</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
