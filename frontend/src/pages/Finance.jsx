import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { DollarSign, Droplets, Leaf } from 'lucide-react';
import { CyberCard } from '../components/CyberCard';

export default function Finance() {
    const [metrics, setMetrics] = useState(null);
    const [config, setConfig] = useState({
        oil_price: 850,
        fertilizer_cost: 1.5,
        labor_cost: 12
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = () => {
        api.get('/analytics/finance/roi')
            .then(res => {
                setMetrics(res.data);
                // Update config form with real values
                setConfig({
                    oil_price: res.data.config.oil_price_per_ton || 850,
                    fertilizer_cost: res.data.config.fertilizer_cost_per_kg || 1.5,
                    labor_cost: res.data.config.labor_cost_per_hour || 12
                });
            })
            .catch(err => console.error(err));
    };

    const handleSave = () => {
        setSaving(true);
        api.post('/analytics/finance/config', config)
            .then(() => {
                setSaving(false);
                fetchMetrics(); // Refresh ROI with new calcs
            })
            .catch(() => setSaving(false));
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold mb-1">Financial Intelligence</h2>
                    <p className="text-gray-400">Real-time ROI & Carbon Credit Accounting</p>
                </div>
            </header>

            {/* Config & Metrics Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT: Config Panel */}
                <div className="lg:col-span-1 bg-farm-card p-6 rounded-xl border border-white/5">
                    <h3 className="font-bold flex items-center gap-2 mb-6">
                        <SettingsIcon /> Market Configuration
                    </h3>

                    <div className="space-y-4">
                        <InputGroup
                            label="Palm Oil Price ($/ton)"
                            value={config.oil_price}
                            onChange={v => setConfig({ ...config, oil_price: v })}
                        />
                        <InputGroup
                            label="Fertilizer Cost ($/kg)"
                            value={config.fertilizer_cost}
                            onChange={v => setConfig({ ...config, fertilizer_cost: v })}
                        />
                        <InputGroup
                            label="Labor Cost ($/hr)"
                            value={config.labor_cost}
                            onChange={v => setConfig({ ...config, labor_cost: v })}
                        />

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
                        >
                            {saving ? "Updating..." : "Recalculate ROI"}
                        </button>
                    </div>
                </div>

                {/* RIGHT: ROI Dashboard */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <CyberCard title="PROJECTED REVENUE" icon={<DollarSign size={20} />}>
                        <div className="text-4xl font-bold text-emerald-400">
                            ${metrics?.revenue?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Based on {metrics?.yield_tons?.toFixed(1)} tons yield</div>
                    </CyberCard>

                    <CyberCard title="ROI INDEX" icon={<ActivityIcon />}>
                        <div className={`text-4xl font-bold ${metrics?.roi_percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {metrics?.roi_percentage?.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Return on Input Costs</div>
                    </CyberCard>

                    <div className="col-span-2 bg-gradient-to-br from-emerald-900/20 to-farm-card border border-emerald-500/20 p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Leaf size={120} />
                        </div>
                        <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                            <Leaf size={18} /> CARBON CREDIT WALLET
                        </h3>
                        <div className="flex items-end gap-4">
                            <span className="text-5xl font-bold text-white tracking-tighter">
                                {metrics?.carbon_credits || 0}
                            </span>
                            <span className="mb-2 text-emerald-500 font-mono">CREDITS EARNED</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2 max-w-md">
                            Your farm has sequestered approx {metrics?.carbon_credits} tons of CO2 this season.
                            Estimated Value: <span className="text-white font-bold">${(metrics?.carbon_credits * 30).toFixed(0)}</span> (at $30/ton).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const InputGroup = ({ label, value, onChange }) => (
    <div>
        <label className="block text-xs text-gray-400 mb-1 font-mono">{label}</label>
        <input
            type="number"
            value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none transition-colors"
        />
    </div>
);

const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
