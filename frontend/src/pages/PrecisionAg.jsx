
import React, { useState } from 'react';
import axios from 'axios';
import { Pipette, Save, Activity } from 'lucide-react';
import { CyberCard } from '../components/CyberCard';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1' });

export default function PrecisionAg() {
    const [config, setConfig] = useState({
        chemical_name: 'PalmSaver-X',
        base_dosage_ml: 100,
        concentration_factor: 1.0
    });
    const [result, setResult] = useState(null);

    const calculate = () => {
        api.post('/vra/calculate', config)
            .then(res => setResult(res.data))
            .catch(err => alert(err.message));
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold flex items-center gap-2">
                    <Pipette className="text-purple-400" /> Precision Agriculture
                </h2>
                <p className="text-gray-400">Variable Rate Application (VRA) Calculator</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-farm-card p-6 rounded-xl border border-white/5 space-y-4">
                    <h3 className="font-bold text-lg">Treatment Config</h3>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Chemical Name</label>
                        <input
                            type="text"
                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                            value={config.chemical_name}
                            onChange={e => setConfig({ ...config, chemical_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Base Dosage (ml/tree)</label>
                        <input
                            type="number"
                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                            value={config.base_dosage_ml}
                            onChange={e => setConfig({ ...config, base_dosage_ml: parseFloat(e.target.value) })}
                        />
                    </div>
                    <button
                        onClick={calculate}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white transition-all shadow-lg shadow-purple-900/20"
                    >
                        Calculate VRA Map
                    </button>
                </div>

                {result && (
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <CyberCard title="TOTAL VOLUME" icon={<Pipette size={16} />}>
                                <div className="text-2xl font-bold text-purple-400">{result.total_volume_liters} L</div>
                            </CyberCard>
                            <CyberCard title="TARGET TREES" icon={<Activity size={16} />}>
                                <div className="text-2xl font-bold">{result.total_palms}</div>
                            </CyberCard>
                        </div>

                        <div className="bg-farm-card p-4 rounded-xl border border-white/5 h-64 overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500 border-b border-white/10">
                                    <tr>
                                        <th className="p-2">Palm ID</th>
                                        <th className="p-2">Health</th>
                                        <th className="p-2">Dosage (ml)</th>
                                        <th className="p-2">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.treatments.map((t) => (
                                        <tr key={t.palm_id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-2 font-mono text-gray-300">#{t.palm_id}</td>
                                            <td className={`p-2 font-bold ${t.health_score < 50 ? 'text-red-400' : 'text-yellow-400'}`}>
                                                {t.health_score}%
                                            </td>
                                            <td className="p-2 text-purple-300">{t.dosage_ml} ml</td>
                                            <td className="p-2 text-xs text-gray-400">{t.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
