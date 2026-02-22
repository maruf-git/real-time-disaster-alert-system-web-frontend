import { AlertTriangle, CloudRain, Wind, Thermometer, MapPin, Calendar } from 'lucide-react';

export default function AlertCard({ alert, onViewDetails }) {
    const getIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'flood': return <CloudRain className="w-6 h-6" />;
            case 'cyclone': return <Wind className="w-6 h-6" />;
            case 'heatwave': return <Thermometer className="w-6 h-6" />;
            default: return <AlertTriangle className="w-6 h-6" />;
        }
    };

    const getSeverityColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'critical': return 'bg-red-500 shadow-red-200';
            case 'high': return 'bg-orange-500 shadow-orange-200';
            case 'medium': return 'bg-yellow-500 shadow-yellow-200';
            default: return 'bg-blue-500 shadow-blue-200';
        }
    };

    // Use correct props from API: disaster_name, location_name, severity
    const disasterType = alert.disaster_name || alert.disaster_type;
    const locationName = alert.location_name || alert.location;
    const severity = alert.severity || alert.severity_level;

    return (
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 group flex flex-col h-full">
            <div className={`h-2 w-full ${getSeverityColor(severity)}`}></div>
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg text-white ${getSeverityColor(severity)} shadow-lg`}>
                            {getIcon(disasterType)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 leading-tight">
                                {disasterType || 'System Alert'}
                            </h3>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {severity || 'General'} Severity
                            </span>
                        </div>
                    </div>
                    {/* Status Badge */}
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${alert.is_active
                            ? 'bg-red-50 text-red-600 border-red-200 animate-pulse shadow-sm shadow-red-200/50'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                        {alert.is_active ? 'Active' : 'Archived'}
                    </div>
                </div>

                <div className="space-y-3 flex-1">
                    <div className="flex items-center text-slate-600 text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                        <span className="font-medium">{locationName || 'Unknown Location'}</span>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-3">
                        {alert.description || alert.message || 'No description available.'}
                    </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div className="flex flex-col gap-1 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(alert.created_at).toLocaleDateString()}
                        </div>
                        <div className="pl-4">
                            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <button
                        onClick={() => onViewDetails(alert)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 transition flex items-center gap-1 group-hover:translate-x-1 duration-300"
                    >
                        View Details &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
}
