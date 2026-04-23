"use client";
import { useState, useEffect, useRef } from "react";
import AlertCard from "@/components/AlertCard";
import AlertDetailsModal from "@/components/AlertDetailsModal";
import {
  ShieldCheck,
  Activity,
  RefreshCw,
  Volume2,
  VolumeX,
  MapPin,
  Droplets,
  Wind,
  Thermometer,
  CloudRain,
  Search,
  Filter,
} from "lucide-react";

export default function Home() {
  const [alerts, setAlerts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isLocationLoaded, setIsLocationLoaded] = useState(false);
  const [weather, setWeather] = useState(null);
  const [earthquake, setEarthquake] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filter State
  const [selectedDisasterId, setSelectedDisasterId] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [disasters, setDisasters] = useState([]);

  // Audio State
  const [sirenEnabled, setSirenEnabled] = useState(true); // User preference toggle
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [sirenMuted, setSirenMuted] = useState(false); // Temporary mute for current session/alert
  const [emergencyDismissed, setEmergencyDismissed] = useState(false); // Dismiss overlay until alerts change

  // Refs
  const audioRef = useRef(null);
  const processedAlertIds = useRef(new Set()); // Track alerts we've already "announced"

  // Load Preferences on Mount (Audio & Location)
  useEffect(() => {
    // Audio Toggle
    const storedToggle = localStorage.getItem("alert_siren_enabled");
    if (storedToggle !== null) {
      setSirenEnabled(JSON.parse(storedToggle));
    }

    // Location
    const storedLocation = localStorage.getItem("alert_location_id");
    if (storedLocation) {
      setSelectedLocationId(storedLocation);
    }
    setIsLocationLoaded(true);
  }, []);

  const handleLocationChange = (e) => {
    const newId = e.target.value;
    setSelectedLocationId(newId);
    localStorage.setItem("alert_location_id", newId);
    processedAlertIds.current.clear();
    setSirenMuted(false);
  };

  // Fetch weather when location changes
  useEffect(() => {
    if (selectedLocationId === "all") {
      setWeather(null);
      setEarthquake(null);
      return;
    }
    setWeatherLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/weather/current?location_id=${selectedLocationId}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.weather) {
          setWeather(data.weather);
        } else {
          setWeather(null);
        }
        if (data.earthquake) {
          setEarthquake(data.earthquake);
        } else {
          setEarthquake(null);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch weather", err);
        setWeather(null);
        setEarthquake(null);
      })
      .finally(() => setWeatherLoading(false));
  }, [selectedLocationId]);

  const fetchLocations = () => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/locations?limit=all&activeOnly=true`,
    )
      .then((res) => res.json())
      .then((data) => setLocations(data.data || []))
      .catch(console.error);
  };

  const fetchDisasters = () => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/disasters?limit=all&activeOnly=true`,
    )
      .then((res) => res.json())
      .then((data) => setDisasters(data.data || []))
      .catch(console.error);
  };

  const fetchAlerts = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/alerts`)
      .then((res) => res.json())
      .then((data) => {
        setAlerts(Array.isArray(data) ? data : []);
        setLoading(false);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // Reset pagination when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedLocationId,
    selectedDisasterId,
    selectedSeverity,
    selectedStatus,
    searchQuery,
  ]);

  useEffect(() => {
    fetchLocations();
    fetchDisasters();
    fetchAlerts();
    // Poll every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter Alerts based on selection
  const filteredAlerts = alerts.filter((alert) => {
    // 1. Location Filter
    if (selectedLocationId !== "all" && alert.location_id != selectedLocationId)
      return false;

    // 2. Disaster Filter
    const disasterIdStr = alert.disaster_id?.toString() || "";
    if (selectedDisasterId !== "all" && disasterIdStr !== selectedDisasterId)
      return false;

    // 3. Severity Filter
    const severity = alert.severity_level || alert.severity || "Alert";
    if (selectedSeverity !== "all" && severity !== selectedSeverity)
      return false;

    // 4. Status Filter
    if (selectedStatus === "Active" && alert.is_active !== 1) return false;
    if (selectedStatus === "Archived" && alert.is_active !== 0) return false;

    // 5. Search Filter (Title, Disaster Name, Description)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const titleMatch = (alert.title || "").toLowerCase().includes(query);
      const disasterMatch = (alert.disaster_name || "")
        .toLowerCase()
        .includes(query);
      const descMatch = (alert.description || "").toLowerCase().includes(query);
      if (!titleMatch && !disasterMatch && !descMatch) return false;
    }

    return true;
  });

  // Separate active alerts for modal and counts
  const activeAlerts = filteredAlerts.filter((alert) => alert.is_active === 1);

  // Pagination logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAlerts.length / itemsPerPage),
  );
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Check for any active alert in the filtered list
  const hasActiveAlert = activeAlerts.length > 0;

  // Only show "Danger" visual theme if there are active alerts AND a specific location is selected
  const showDangerTheme =
    hasActiveAlert && !emergencyDismissed && selectedLocationId !== "all";

  // Auto-open emergency overlay when new alerts arrive that weren't yet dismissed
  // (Only if a specific location is selected)
  useEffect(() => {
    if (!isLocationLoaded || selectedLocationId === "all") return;

    if (activeAlerts.length > 0) {
      const newestAlert = activeAlerts[0];
      if (!processedAlertIds.current.has(newestAlert.id)) {
        processedAlertIds.current.add(newestAlert.id);
        setEmergencyDismissed(false); // re-show overlay for new alert
        setSirenMuted(false);
      }
    }
  }, [activeAlerts, isLocationLoaded, selectedLocationId]);

  // Audio Logic — play siren whenever there are active alerts, overlay is visible, and a specific location is selected
  useEffect(() => {
    if (
      hasActiveAlert &&
      sirenEnabled &&
      !sirenMuted &&
      !emergencyDismissed &&
      selectedLocationId !== "all"
    ) {
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setAudioPlaying(true))
            .catch((e) => {
              console.warn(
                "Audio autoplay blocked by browser policy. User interaction needed.",
                e,
              );
              setAudioPlaying(false);
            });
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioPlaying(false);
      }
    }
  }, [
    hasActiveAlert,
    sirenEnabled,
    sirenMuted,
    emergencyDismissed,
    selectedLocationId,
  ]);

  const handleCloseModal = () => {
    setSelectedAlert(null);
    setSirenMuted(true);
  };

  const handleDismissEmergency = () => {
    setEmergencyDismissed(true);
    setSirenMuted(true);
  };

  const toggleSiren = () => {
    const newState = !sirenEnabled;
    setSirenEnabled(newState);
    localStorage.setItem("alert_siren_enabled", JSON.stringify(newState));

    // If turning ON, play a short silent sound (or just play/pause) to unlock audio context
    if (newState && audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          // If no actual alert, pause immediately. We just wanted the interaction.
          if (!hasActiveAlert) {
            setTimeout(() => audioRef.current.pause(), 100);
          }
        })
        .catch((e) => console.error("Could not unlock audio:", e));
    }
  };

  return (
    <main className="min-h-screen pb-20 relative">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        loop
      />

      {/* ── EMERGENCY ALERT OVERLAY ── */}
      {hasActiveAlert &&
        !emergencyDismissed &&
        selectedLocationId !== "all" && (
          <>
            {/* Full-screen red pulsing backdrop */}
            <div
              className="fixed inset-0 z-[90] pointer-events-none"
              style={{
                background: "rgba(220,38,38,0.18)",
                animation: "emergencyFlash 1s ease-in-out infinite alternate",
              }}
            />
            <style>{`
                        @keyframes emergencyFlash {
                            from { background: rgba(220,38,38,0.10); box-shadow: inset 0 0 120px rgba(220,38,38,0.25); }
                            to   { background: rgba(220,38,38,0.32); box-shadow: inset 0 0 120px rgba(220,38,38,0.55); }
                        }
                    `}</style>

            {/* Emergency modal */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="bg-gray-950 border-2 border-red-500 rounded-2xl shadow-2xl shadow-red-900/60 w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-white animate-ping absolute" />
                    <Activity className="w-6 h-6 text-white relative" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-black text-lg uppercase tracking-widest">
                      ⚠ ACTIVE DISASTER ALERT
                    </p>
                    <p className="text-red-100 text-xs">
                      {activeAlerts.length} active alert
                      {activeAlerts.length !== 1 ? "s" : ""} detected ·{" "}
                      {lastUpdated?.toLocaleTimeString()}
                    </p>
                  </div>
                  {audioPlaying && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg text-white text-xs font-bold animate-pulse">
                      <Volume2 className="w-3.5 h-3.5" /> Siren
                    </div>
                  )}
                </div>

                {/* Alert list (up to 3) */}
                <div className="p-5 space-y-3 max-h-64 overflow-y-auto">
                  {activeAlerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 bg-red-950/60 border border-red-800 rounded-xl"
                    >
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">
                          {alert.title || alert.disaster_name}
                        </p>
                        <p className="text-red-300 text-xs">
                          {alert.location_name} ·{" "}
                          {alert.severity_level || alert.severity || "Alert"}
                        </p>
                        {alert.description && (
                          <p className="text-red-200/70 text-xs mt-0.5 line-clamp-2">
                            {alert.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="text-xs text-red-300 hover:text-white border border-red-700 hover:border-red-400 px-2 py-1 rounded-lg transition flex-shrink-0"
                      >
                        Details
                      </button>
                    </div>
                  ))}
                  {activeAlerts.length > 3 && (
                    <p className="text-red-400 text-xs text-center">
                      +{activeAlerts.length - 3} more alert
                      {activeAlerts.length - 3 !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex items-center gap-3">
                  <button
                    onClick={toggleSiren}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition ${
                      sirenEnabled
                        ? "bg-red-700 border-red-600 text-white hover:bg-red-800"
                        : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {sirenEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                    {sirenEnabled ? "Mute Siren" : "Unmute Siren"}
                  </button>
                  <button
                    onClick={handleDismissEmergency}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg border border-white/20 transition text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      {/* Hero Section */}
      <div className="text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-900">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 w-96 h-96 bg-red-600 rounded-full blur-3xl mix-blend-screen transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-0 bottom-0 w-72 h-72 bg-blue-600 rounded-full blur-3xl mix-blend-screen transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="md:flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                Real-time Disaster <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                  Alert System
                </span>
              </h1>
              <p className="max-w-xl text-lg text-slate-400">
                Real-time weather analysis and automated alert dispatch for
                Bangladesh.
              </p>
            </div>

            <div className="mt-6 md:mt-0 flex flex-col items-end gap-4">
              {/* Controls: Location Filter & Siren Toggle */}
              <div className="flex items-center gap-3">
                {/* Siren Toggle */}
                <button
                  onClick={toggleSiren}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
                    sirenEnabled
                      ? "bg-red-500/20 border-red-400/50 text-red-100 hover:bg-red-500/30"
                      : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700"
                  }`}
                  title={sirenEnabled ? "Disable Siren" : "Enable Siren"}
                >
                  {sirenEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">
                    Siren {sirenEnabled ? "ON" : "OFF"}
                  </span>
                </button>

                {/* Location Filter */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg border border-white/20">
                  <MapPin className="w-5 h-5 text-white ml-2" />
                  <select
                    value={selectedLocationId}
                    onChange={handleLocationChange}
                    className="bg-transparent text-white border-none focus:ring-0 cursor-pointer py-1 pr-8 font-medium placeholder-white/50"
                  >
                    <option value="all" className="text-slate-900">
                      All Locations
                    </option>
                    {locations.map((loc) => (
                      <option
                        key={loc.id}
                        value={loc.id}
                        className="text-slate-900"
                      >
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-sm mb-1">
                  {showDangerTheme ? (
                    <>
                      <Activity className="w-4 h-4 text-white animate-bounce" />
                      <span className="text-white font-bold uppercase tracking-wider">
                        Active Threat Detected
                      </span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                      <span className="text-green-400 font-medium">
                        System Operational
                      </span>
                    </>
                  )}
                </div>
                <div className={`text-xs text-slate-500`}>
                  Last Updated:{" "}
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : "Just now"}
                </div>
              </div>
            </div>
          </div>

          {/* Stats or Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              {
                label: "Active Alerts",
                value: activeAlerts.length,
                color: "text-red-400",
              },
              {
                label: "Monitored Regions",
                value: locations.length || "8",
                color: "text-blue-400",
              },
              {
                label: "System Uptime",
                value: "99.9%",
                color: "text-green-400",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="backdrop-blur border p-4 rounded-xl bg-slate-800/50 border-slate-700"
              >
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-wider font-medium text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {/* Weather Widget */}
        {selectedLocationId !== "all" && (
          <div className="mb-6">
            {weatherLoading ? (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-100 p-5 animate-pulse h-28" />
            ) : weather ? (
              <div
                className={`rounded-2xl shadow-lg border p-5 text-white ${
                  showDangerTheme
                    ? "bg-gradient-to-r from-red-800 to-red-700 border-red-700"
                    : "bg-gradient-to-r from-slate-700 to-slate-600 border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-5 h-5 opacity-70" />
                    <span className="text-sm font-semibold uppercase tracking-wider opacity-80">
                      Live Weather —{" "}
                      {locations.find((l) => l.id == selectedLocationId)?.name}
                    </span>
                  </div>
                  <span className="text-xs opacity-50">
                    {weather.time
                      ? new Date(weather.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Now"}
                  </span>
                </div>
                {/* Row 1: Weather Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {weather.temperature ?? "—"}°C
                      </div>
                      <div className="text-xs opacity-60">Temperature</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {weather.humidity ?? "—"}%
                      </div>
                      <div className="text-xs opacity-60">Humidity</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <CloudRain className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {weather.rain ?? "—"} mm
                      </div>
                      <div className="text-xs opacity-60">Rainfall</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Wind className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {weather.wind_speed ?? "—"} km/h
                      </div>
                      <div className="text-xs opacity-60">Wind Speed</div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Air Quality and Earthquakes (Divider) */}
                <div className="border-t border-white/10 pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Wind className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">
                        {weather.aqi !== undefined ? weather.aqi : "—"}
                      </div>
                      <div className="text-xs opacity-60">
                        Air Quality Index (US)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">
                        {earthquake
                          ? `${earthquake.magnitude.toFixed(1)} Mag`
                          : "None Recently"}
                      </div>
                      <div className="text-xs opacity-60 mt-1">
                        {earthquake
                          ? `${earthquake.distance != null ? Math.round(earthquake.distance) + "km away • " : ""}${new Date(earthquake.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Local Seismic Activity"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center text-slate-400 text-sm">
                Could not fetch weather data for this location.
              </div>
            )}
          </div>
        )}

        {selectedLocationId === "all" && (
          <div className="mb-6 bg-white rounded-2xl shadow-sm border border-dashed border-slate-200 p-5 text-center text-slate-400">
            <MapPin className="w-5 h-5 mx-auto mb-1 opacity-40" />
            <p className="text-sm">
              Select a specific location to view real-time weather conditions.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 min-h-[500px]">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                {selectedLocationId === "all"
                  ? "Live Alert Feed"
                  : "Regional Alerts"}
              </h2>
              {/* Audio Indicator */}
              {audioPlaying && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold animate-pulse">
                  <Volume2 className="w-3 h-3" /> Siren Active
                </div>
              )}
            </div>

            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition text-sm font-medium"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6 md:px-5">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 w-full relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search alerts by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-slate-400"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 flex-1 md:flex-none">
                  <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                  <select
                    value={selectedDisasterId}
                    onChange={(e) => setSelectedDisasterId(e.target.value)}
                    className="w-full md:w-auto text-sm border-slate-300 rounded-lg py-2.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 text-slate-700 font-medium bg-white"
                  >
                    <option value="all">All Disasters</option>
                    {disasters.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="flex-1 md:flex-none w-full md:w-auto text-sm border-slate-300 rounded-lg py-2.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 text-slate-700 font-medium bg-white"
                >
                  <option value="all">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex-1 md:flex-none w-full md:w-auto text-sm border-slate-300 rounded-lg py-2.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 text-slate-700 font-medium bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {loading && alerts.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-slate-100 rounded-xl animate-pulse"
                ></div>
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {selectedLocationId === "all"
                  ? "All Clear"
                  : "No Alerts in this Region"}
              </h3>
              <p className="text-slate-500 max-w-sm">
                No disaster alerts are currently active
                {selectedLocationId !== "all" && " for the selected location"}.
                The system is continuously monitoring weather conditions.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {paginatedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onViewDetails={setSelectedAlert}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {filteredAlerts.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">
                      Show:
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-sm border-slate-200 rounded-lg py-1.5 pl-3 pr-8 text-slate-700 font-medium focus:ring-red-500 focus:border-red-500 cursor-pointer shadow-sm"
                    >
                      <option value={12}>12 cards</option>
                      <option value={24}>24 cards</option>
                      <option value={36}>36 cards</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition shadow-sm"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-bold text-slate-700 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm min-w-[5rem] text-center">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AlertDetailsModal alert={selectedAlert} onClose={handleCloseModal} />
    </main>
  );
}
