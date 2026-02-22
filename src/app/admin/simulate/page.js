'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { FlaskConical, Activity, Thermometer, CloudRain, Wind, Droplets, RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';

function ResultToast({ result, onClose }) {
    if (!result) return null;
    const isSuccess = result.ok;
    return (
        <div className={`fixed top-6 right-6 z-50 w-80 rounded-xl shadow-xl border p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${isSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isSuccess ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${isSuccess ? 'text-emerald-800' : 'text-red-800'}`}>{isSuccess ? 'Simulation Ran Successfully' : 'Simulation Failed'}</p>
                <p className="text-xs mt-0.5 text-slate-500">{result.message}</p>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded"><X className="w-4 h-4" /></button>
        </div>
    );
}

export default function SimulatePage() {
    const [locations, setLocations] = useState([]);
    const [result, setResult] = useState(null);

    // Earthquake state
    const [eqCoords, setEqCoords] = useState('');
    const [eqCoordsError, setEqCoordsError] = useState('');
    const [eqMagnitude, setEqMagnitude] = useState('');
    const [eqLoading, setEqLoading] = useState(false);

    // Weather state
    const [wxLocationId, setWxLocationId] = useState('');
    const [wxFields, setWxFields] = useState({ temperature: '', rain_sum: '', wind_speed: '', humidity: '', aqi: '' });
    const [wxLoading, setWxLoading] = useState(false);

    useEffect(() => {
        api.get('/admin/locations?limit=all').then(d => setLocations(d.data || [])).catch(console.error);
    }, []);

    const showResult = (ok, message) => {
        setResult({ ok, message });
        setTimeout(() => setResult(null), 5000);
    };

    // Parse "23.8041° N, 90.4152° E" → { lat, lon } or null
    const parseDMS = (str) => {
        const m = str.trim().match(/([\d.]+)\s*°?\s*([NS]),?\s*([\d.]+)\s*°?\s*([EW])/i);
        if (!m) return null;
        const lat = parseFloat(m[1]) * (m[2].toUpperCase() === 'S' ? -1 : 1);
        const lon = parseFloat(m[3]) * (m[4].toUpperCase() === 'W' ? -1 : 1);
        if (isNaN(lat) || isNaN(lon)) return null;
        return { lat, lon };
    };

    const handleEarthquake = async (e) => {
        e.preventDefault();
        setEqCoordsError('');
        const coords = parseDMS(eqCoords);
        if (!coords) { setEqCoordsError('Use format: 23.8041° N, 90.4152° E'); return; }
        if (!eqMagnitude) return;
        setEqLoading(true);
        try {
            const data = await api.post('/admin/simulate-earthquake', { latitude: coords.lat, longitude: coords.lon, magnitude: eqMagnitude });
            const locations = data.affected_locations?.map(l => `${l.name} (${l.distanceKm} km)`).join(', ') || 'none';
            showResult(true, `Mag ${parseFloat(eqMagnitude).toFixed(1)} — ${data.affected_locations?.length || 0} location(s) within 500 km: ${locations}`);
            setEqCoords(''); setEqMagnitude('');
        } catch (err) {
            showResult(false, err?.message || 'Earthquake simulation failed.');
        } finally { setEqLoading(false); }
    };

    const handleWeather = async (e) => {
        e.preventDefault();
        if (!wxLocationId) return;
        setWxLoading(true);
        try {
            const data = await api.post('/admin/simulate-weather', { location_id: wxLocationId, ...wxFields });
            showResult(true, `Weather simulation ran for ${data.location || 'location'}. Alert rules evaluated.`);
            setWxFields({ temperature: '', rain_sum: '', wind_speed: '', humidity: '', aqi: '' });
        } catch (err) {
            showResult(false, err?.message || 'Weather simulation failed.');
        } finally { setWxLoading(false); }
    };

    const wxUpdate = (key, val) => setWxFields(f => ({ ...f, [key]: val }));

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <ResultToast result={result} onClose={() => setResult(null)} />

            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FlaskConical className="w-6 h-6 text-indigo-600" /> Simulate Tests
                </h1>
                <p className="text-sm text-slate-500 mt-1">Manually trigger disaster scenarios to validate active alert rules without waiting for real data.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── Earthquake Card ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 p-5 border-b bg-rose-50/50">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-lg flex-shrink-0"><Activity className="w-5 h-5" /></div>
                        <div>
                            <h2 className="font-bold text-gray-800">Earthquake Simulator</h2>
                            <p className="text-xs text-slate-500">Inject a seismic event and evaluate magnitude-based rules.</p>
                        </div>
                    </div>
                    <form onSubmit={handleEarthquake} className="p-5 space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Epicenter Coordinates</label>
                            <input
                                type="text"
                                placeholder="23.8041° N, 90.4152° E"
                                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500 font-mono ${eqCoordsError ? 'border-red-400' : ''}`}
                                value={eqCoords}
                                onChange={e => { setEqCoords(e.target.value); setEqCoordsError(''); }}
                            />
                            {eqCoordsError
                                ? <p className="text-xs text-red-500 mt-1">{eqCoordsError}</p>
                                : <p className="text-xs text-slate-400 mt-1">The nearest active monitored location will be matched automatically.</p>
                            }
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Magnitude (Richter)</label>
                            <input
                                required type="number" step="0.1" min="0" max="10" placeholder="e.g. 7.5"
                                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500"
                                value={eqMagnitude}
                                onChange={e => setEqMagnitude(e.target.value)}
                            />
                            <p className="text-xs text-slate-400 mt-1">Must exceed an active rule threshold to trigger an alert.</p>
                        </div>
                        <div className="flex-1" />
                        <button
                            type="submit" disabled={eqLoading}
                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
                        >
                            {eqLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Activity className="w-4 h-4" /> Fire Earthquake</>}
                        </button>
                    </form>
                </div>

                {/* ── Weather Card ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 p-5 border-b bg-indigo-50/50">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg flex-shrink-0"><CloudRain className="w-5 h-5" /></div>
                        <div>
                            <h2 className="font-bold text-gray-800">Weather / AQI Simulator</h2>
                            <p className="text-xs text-slate-500">Override weather values and evaluate weather-based rules.</p>
                        </div>
                    </div>
                    <form onSubmit={handleWeather} className="p-5 space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Location</label>
                            <select
                                required
                                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                value={wxLocationId}
                                onChange={e => setWxLocationId(e.target.value)}
                            >
                                <option value="" disabled>Select a location</option>
                                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Weather Values (leave blank to use 0)</p>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Temperature */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1">
                                    <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Temperature (°C)
                                </label>
                                <input type="number" step="0.1" placeholder="e.g. 42" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={wxFields.temperature} onChange={e => wxUpdate('temperature', e.target.value)} />
                            </div>
                            {/* Humidity */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1">
                                    <Droplets className="w-3.5 h-3.5 text-blue-500" /> Humidity (%)
                                </label>
                                <input type="number" step="1" min="0" max="100" placeholder="e.g. 85" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={wxFields.humidity} onChange={e => wxUpdate('humidity', e.target.value)} />
                            </div>
                            {/* Rain */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1">
                                    <CloudRain className="w-3.5 h-3.5 text-indigo-500" /> Rainfall (mm)
                                </label>
                                <input type="number" step="0.1" placeholder="e.g. 120" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={wxFields.rain_sum} onChange={e => wxUpdate('rain_sum', e.target.value)} />
                            </div>
                            {/* Wind */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1">
                                    <Wind className="w-3.5 h-3.5 text-cyan-500" /> Wind Speed (km/h)
                                </label>
                                <input type="number" step="0.1" placeholder="e.g. 90" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={wxFields.wind_speed} onChange={e => wxUpdate('wind_speed', e.target.value)} />
                            </div>
                            {/* AQI */}
                            <div className="col-span-2">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1">
                                    <FlaskConical className="w-3.5 h-3.5 text-purple-500" /> Air Quality Index (US AQI)
                                </label>
                                <input type="number" step="1" min="0" placeholder="e.g. 200" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={wxFields.aqi} onChange={e => wxUpdate('aqi', e.target.value)} />
                            </div>
                        </div>

                        <div className="flex-1" />
                        <button
                            type="submit" disabled={wxLoading}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
                        >
                            {wxLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><CloudRain className="w-4 h-4" /> Run Weather Simulation</>}
                        </button>
                    </form>
                </div>
            </div>

            {/* Info note */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold">How simulations work</p>
                    <p className="text-xs mt-0.5 text-amber-700">Values are passed directly to the rules engine — no real weather is fetched. Any active rule whose condition is met will generate a real alert entry and may trigger notifications. Check <strong>Alert History</strong> to see results.</p>
                </div>
            </div>
        </div>
    );
}
