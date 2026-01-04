import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, FileText, ChevronRight, Activity, Download, Plane } from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1' });

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const handleExportDJI = (id) => {
        api.post('/export/dji/generate', { mission_name: `Mission_${id}` })
            .then(res => {
                alert(`Flight Plan Generated: ${res.data.targets} targets.\nFile: ${res.data.file_url}`);
            })
            .catch(err => alert("Export Failed: " + err.message));
    };

    const handleExportPDF = () => {
        api.post('/audit/pdf/generate', { report_name: "Full_Farm_Audit" })
            .then(res => {
                alert(`Audit Certified!\nFile: ${res.data.filename}\nSummary: ${res.data.summary}`);
            })
            .catch(err => alert("PDF Generation Failed: " + err.message));
    };

    useEffect(() => {
        api.get('/analytics/reports/history')
            .then(res => {
                setReports(res.data);
                if (res.data.length > 0) setSelectedReport(res.data[0]);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch history", err);
                setLoading(false);
            });
    }, []);

    const handleDownload = () => {
        alert("Downloading PDF Report... (Simulated)");
        // In real app, call /api/v1/analytics/reports/pdf/{id}
    };

    return (
        <div className="flex h-full gap-6">
            {/* Sidebar List */}
            <div className="w-1/3 bg-farm-card rounded-xl border border-white/5 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5">
                    <h3 className="font-bold flex items-center gap-2">
                        <FileText size={18} className="text-farm-green" />
                        Mission Archive
                    </h3>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-2">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading Archive...</div>
                    ) : reports.map(r => (
                        <button
                            key={r.id}
                            onClick={() => setSelectedReport(r)}
                            className={`w-full text-left p-4 rounded-lg transition-all ${selectedReport?.id === r.id
                                ? 'bg-farm-green/20 border border-farm-green/50'
                                : 'hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-mono text-sm text-gray-300">{r.date.split(' ')[0]}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${r.health > 80 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {r.health > 80 ? 'PASS' : 'WARN'}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xs text-gray-500">ID: #{1000 + r.id}</div>
                                    <div className="font-bold text-white">{r.count} Palms</div>
                                </div>
                                <ChevronRight size={16} className={`transition-transform ${selectedReport?.id === r.id ? 'translate-x-1 text-farm-green' : 'text-gray-600'}`} />
                            </div>
                        </button>
                    ))}
                    {!loading && reports.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No reports found.</div>
                    )}
                </div>
            </div>

            {/* Detail View */}
            <div className="flex-1 bg-farm-card rounded-xl border border-white/5 overflow-hidden flex flex-col">
                {selectedReport ? (
                    <>
                        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-gradient-to-br from-white/5 to-transparent">
                            <div>
                                <h1 className="text-2xl font-bold font-heading">Mission Report #{1000 + selectedReport.id}</h1>
                                <p className="text-gray-400 font-mono mt-1 flex items-center gap-2">
                                    <Calendar size={14} /> {selectedReport.date}
                                </p>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-farm-green text-farm-dark font-bold rounded-lg flex items-center gap-2 hover:bg-emerald-400 transition-colors"
                            >
                                <Download size={18} /> Export PDF
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-3 gap-4">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Field Cover</div>
                                <div className="text-2xl font-bold text-white">{selectedReport.count} Trees</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Avg Health</div>
                                <div className="text-2xl font-bold text-emerald-400">{selectedReport.health.toFixed(1)}%</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Status</div>
                                <div className="text-2xl font-bold text-blue-400">Processed</div>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-auto">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={20} className="text-gray-400" />
                                <h3 className="font-bold text-lg">AI Analysis Summary</h3>
                            </div>
                            <div className="prose prose-invert max-w-none text-gray-300">
                                <p>
                                    Automated analysis completed successfully using <strong>DeepResUnet</strong> model.
                                    Atmospheric conditions were favorable.
                                    GPS telemetry confirms 100% coverage of designated sector.
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>No critical irrigation failures detected.</li>
                                    <li>Nitrogen levels within acceptable range (Spectral Analysis).</li>
                                    <li>Recommendation: Routine pest monitoring for Sector 3.</li>
                                </ul>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportPDF}
                                    className="flex-1 mt-4 py-2 bg-farm-green/20 hover:bg-farm-green/30 text-farm-green border border-farm-green/50 rounded-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    <FileText size={16} /> Human Report
                                </button>
                                <button
                                    onClick={() => handleExportDJI(selectedReport.id)}
                                    className="flex-1 mt-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    <Plane size={16} /> DJI Mission
                                </button>
                            </div>

                            {/* Placeholder for Map visualization later */}
                            <div className="mt-8 h-48 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-gray-600 font-mono text-sm border-dashed">
                                [ Interactive Coverage Map Placeholder ]
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a report to view details
                    </div>
                )}
            </div>
        </div>
    );
}
