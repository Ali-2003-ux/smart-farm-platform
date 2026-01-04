import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Droplets, Sun, AlertTriangle, ArrowUp, ArrowDown, Wifi, Database, Cpu } from 'lucide-react';
import { CyberCard } from '../components/CyberCard';
import { HealthTrendChart, YieldProjectionsChart } from '../components/Charts';

// Configure Axios base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
});

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // DEBUG: Log the API URL being used
        console.log("Using API URL:", api.defaults.baseURL);

        const fetchData = async () => {
            try {
                const [statsRes, forecastRes] = await Promise.all([
                    api.get('/analytics/stats'),
                    api.get('/analytics/forecast?months=6')
                ]);
                setStats(statsRes.data);

                // Format forecast for chart
                const chartData = forecastRes.data.dates.map((date, i) => ({
                    date: date.substring(0, 7), // YYYY-MM
                    health: forecastRes.data.health_values[i]
                }));
                // Format yield for bar chart
                const yieldData = forecastRes.data.dates.map((date, i) => ({
                    month: date.substring(5, 7),
                    yield: forecastRes.data.yield_values[i]
                }));

                setForecast({ chartData, yieldData });
                setLoading(false);
            } catch (err) {
                console.error("API Error", err);
                setLoading(false);
                // We keep stats null so UI shows error state
            }
        };
        fetchData();
        // Poll every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-10 text-farm-green animate-pulse">Initializing Command Center...</div>;

    if (!stats) return (
        <div className="p-10 text-red-500 border border-red-500/30 bg-red-500/10 rounded-xl">
            <h3 className="text-xl font-bold mb-2">Connection Error</h3>
            <p>Could not connect to Field Server.</p>
            <p className="text-xs font-mono mt-2 text-gray-400">Target: {api.defaults.baseURL}</p>
        </div>
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-heading font-bold text-white mb-1">FIELD COMMAND</h2>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                        <span className="flex items-center gap-1 text-farm-green"><Wifi size={12} /> ONLINE</span>
                        <span className="flex items-center gap-1 text-blue-400"><Database size={12} /> DB CONNECTED</span>
                        <span className="flex items-center gap-1 text-amber-400"><Cpu size={12} /> AI ACTIVE</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 font-mono tracking-widest">LAST SCAN</p>
                    <p className="text-xl font-mono text-emerald-400 text-glow">{stats.last_scan}</p>
                </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <CyberCard title="TOTAL PALMS" icon={<Sun size={16} />}>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-white">{stats.total_palms}</span>
                        <span className="text-xs text-gray-500 mb-1">VERIFIED</span>
                    </div>
                </CyberCard>

                <CyberCard title="CRITICAL" icon={<AlertTriangle size={16} />}>
                    <div className="flex items-end justify-between">
                        <span className={`text-4xl font-bold ${stats.infected_palms > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {stats.infected_palms}
                        </span>
                        <span className="text-xs text-gray-500 mb-1">TREES INFECTED</span>
                    </div>
                </CyberCard>

                <CyberCard title="AVG. HEALTH" icon={<Activity size={16} />}>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-emerald-400">{stats.avg_health}%</span>
                        <span className="text-xs text-farm-green mb-1 flex items-center">
                            <ArrowUp size={12} /> OPTIMAL
                        </span>
                    </div>
                </CyberCard>

                <CyberCard title="EST. YIELD" icon={<Droplets size={16} />}>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-blue-400">{stats.yield_est}</span>
                        <span className="text-xs text-blue-300 mb-1">TONS/SEASON</span>
                    </div>
                </CyberCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-[400px]">
                {/* Map Section (8 Cols) */}
                <div className="col-span-12 lg:col-span-8 relative group">
                    <div className="absolute inset-0 bg-farm-card rounded-xl overflow-hidden border border-slate-700/50">
                        {/* Simulated Map */}
                        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/46.6753,24.7136,16,0/1200x800?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2xsZ...')] bg-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-farm-dark/90 via-transparent to-transparent"></div>

                        {/* Map HUD Overlay */}
                        <div className="absolute top-4 left-4 font-mono text-xs text-emerald-500 bg-black/50 px-2 py-1 rounded border border-emerald-500/30">
                            LAT: 46.6753 N | LON: 24.7136 E
                        </div>
                    </div>
                </div>

                {/* Right Panel - Charts (4 Cols) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <CyberCard title="HEALTH FORECAST" className="flex-1 min-h-[200px]">
                        {forecast && <HealthTrendChart data={forecast.chartData} />}
                    </CyberCard>
                    <CyberCard title="YIELD PROJECTION" className="flex-1 min-h-[200px]">
                        {forecast && <YieldProjectionsChart data={forecast.yieldData} />}
                    </CyberCard>
                </div>
            </div>
        </div>
    );
}
