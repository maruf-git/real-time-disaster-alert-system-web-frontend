'use client';
import { Fragment } from 'react';
import { X, MapPin, Calendar, Clock, AlertTriangle, CloudRain, Wind, Thermometer, Info } from 'lucide-react';

export default function AlertDetailsModal({ alert, onClose }) {
    if (!alert) return null;

    const getIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'flood': return <CloudRain className="w-10 h-10 text-blue-600" />;
            case 'cyclone': return <Wind className="w-10 h-10 text-cyan-600" />;
            case 'heatwave': return <Thermometer className="w-10 h-10 text-orange-600" />;
            default: return <AlertTriangle className="w-10 h-10 text-red-600" />;
        }
    };

    const getSeverityColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="relative p-6 border-b border-gray-100 bg-gray-50/50">

                    {/* Critical Alert Warning Banner */}
                    {['critical', 'high'].includes(alert.severity?.toLowerCase()) && (
                        <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-center py-1 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
                            ⚠️ Danger: Active Threat ⚠️
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-8 right-4 p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shadow-sm z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4 mt-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                            {getIcon(alert.disaster_name)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {alert.title || alert.disaster_name || 'System Alert'}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getSeverityColor(alert.severity)}`}>
                                    {alert.severity} Severity
                                </span>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(alert.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Location */}
                    <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900">Affected Location</h4>
                            <p className="text-blue-700 font-medium">{alert.location_name}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Description
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 leading-relaxed">
                            {alert.description}
                        </div>
                    </div>

                    {/* Guidelines / Action (Static for now, could be dynamic per disaster type) */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Recommended Actions</h4>
                        <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
                            <li>Stay tuned to local radio or TV for updates.</li>
                            <li>Keep your emergency kit ready.</li>
                            <li>Follow instructions from local authorities immediately.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium shadow-lg shadow-gray-200"
                    >
                        Close Details
                    </button>
                </div>

            </div>
        </div>
    );
}
