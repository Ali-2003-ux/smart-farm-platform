import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Plane, MapPin, Download, CheckCircle, AlertOctagon } from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1' });

export default function DroneOps() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [missionLink, setMissionLink] = useState(null);

    // Settings
    const [settings, setSettings] = useState({
        lat: 24.7136,
        lon: 46.6753,
        gsd: 5.0,
        alt: 15.0,
        speed: 5.0
    });

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/ai/predict', formData);
            setResult(res.data);

            // Auto-Generate Mission if infected found
            if (res.data.infected_count > 0) {
                generateMission(res.data.infected_count); // In real app, pass coordinates
            }
        } catch (err) {
            console.error(err);
            alert("Analysis Failed");
        } finally {
            setLoading(false);
        }
    };

    const generateMission = async () => {
        // Mocking the coordinate extraction from result for demo
        // In real impl, backend should return list of points
        try {
            // This is a stub for the frontend-backend connection
            // We would need to pass the actual infected targets array here
            // For now, we simulate a successful generation
            const fakeTargets = [{ x: 100, y: 100 }, { x: 200, y: 200 }];

            const res = await api.post('/drone/generate_mission', {
                targets: fakeTargets,
                anchor_lat: settings.lat,
                anchor_lon: settings.lon,
                gsd_cm: settings.gsd,
                altitude: settings.alt,
                speed: settings.speed
            });

            const blob = new Blob([res.data.mission_file], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            setMissionLink(url);
        } catch (err) {
            console.error("Mission Gen Error", err);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold">Drone Operations</h2>
                <p className="text-gray-400">Upload survey imagery and generate flight plans</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Upload & Settings */}
                <div className="bg-farm-card p-6 rounded-xl border border-gray-800 space-y-6">
                    <div>
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            1. Image Upload
                        </h3>
                        <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-farm-green transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                            <Upload className="mx-auto mb-2 text-gray-500" />
                            <p className="text-sm text-gray-400">{file ? file.name : "Drop GeoTIFF or JPG here"}</p>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className={`w-full mt-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${loading ? 'bg-gray-700' : 'bg-farm-green hover:bg-green-600'}`}
                        >
                            {loading ? "Scanning..." : "Start Analysis"}
                        </button>
                    </div>

                    <div className="border-t border-gray-800 pt-6">
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            2. Flight Calibration
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500">Anchor GPS (Lat, Lon)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="number" className="bg-black/20 border border-gray-700 rounded px-2 py-1 text-sm" value={settings.lat} onChange={e => setSettings({ ...settings, lat: parseFloat(e.target.value) })} />
                                    <input type="number" className="bg-black/20 border border-gray-700 rounded px-2 py-1 text-sm" value={settings.lon} onChange={e => setSettings({ ...settings, lon: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">GSD (cm/px)</label>
                                <input type="number" className="w-full bg-black/20 border border-gray-700 rounded px-2 py-1 text-sm" value={settings.gsd} onChange={e => setSettings({ ...settings, gsd: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="lg:col-span-2 bg-farm-card p-6 rounded-xl border border-gray-800 flex flex-col items-center justify-center min-h-[500px]">
                    {result ? (
                        <div className="w-full space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm text-gray-500 mb-2">Original Feed</h4>
                                    <img src={`data:image/jpeg;base64,${result.processed_image_base64}`} className="rounded-lg w-full" />
                                </div>
                                <div>
                                    <h4 className="text-sm text-gray-500 mb-2">AI Segmentation Mask</h4>
                                    <img src={`data:image/png;base64,${result.mask_base64}`} className="rounded-lg w-full" />
                                </div>
                            </div>

                            <div className="bg-gray-900/50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-lg">Analysis Report</h4>
                                    <div className="flex gap-4 text-sm mt-1">
                                        <span className="text-green-400">Healthy: {result.palm_count - result.infected_count}</span>
                                        <span className="text-red-400">Infected: {result.infected_count}</span>
                                    </div>
                                </div>

                                {missionLink && (
                                    <a href={missionLink} download="mission.waypoints" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                        <Download size={18} /> Download Mission
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <Plane size={64} className="mx-auto mb-4 opacity-20" />
                            <p>Waiting for drone data...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
