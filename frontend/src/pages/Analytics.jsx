import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/forecast')
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: 'white' } },
            title: { display: true, text: '6-Month Health Forecast', color: 'white' },
        },
        scales: {
            y: { grid: { color: '#333' }, ticks: { color: 'gray' } },
            x: { grid: { color: '#333' }, ticks: { color: 'gray' } }
        }
    };

    const chartData = data ? {
        labels: data.dates,
        datasets: [
            {
                label: 'Health Index',
                data: data.health_values,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3
            },
            {
                label: 'Projected Yield (Tons)',
                data: data.yield_values,
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                yAxisID: 'y1',
                tension: 0.3
            },
        ],
    } : null;

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold">Predictive Analytics</h2>
                <p className="text-gray-400">AI-driven insights for future planning</p>
            </header>

            {!loading && data ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-farm-card p-6 rounded-xl border border-gray-800">
                        <Line options={chartOptions} data={chartData} />
                    </div>

                    {/* Stats */}
                    <div className="space-y-6">
                        <div className="bg-farm-card p-6 rounded-xl border border-gray-800">
                            <h3 className="text-gray-400 mb-2">Trend Analysis</h3>
                            <div className="flex items-center gap-3">
                                {data.trend.includes("Improving") && <TrendingUp className="text-green-500" size={32} />}
                                {data.trend.includes("Declining") && <TrendingDown className="text-red-500" size={32} />}
                                {data.trend.includes("Stable") && <Minus className="text-yellow-500" size={32} />}
                                <span className="text-2xl font-bold">{data.trend}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Based on linear regression of last 12 months.</p>
                        </div>

                        <div className="bg-farm-card p-6 rounded-xl border border-gray-800">
                            <h3 className="text-gray-400 mb-2">Next Month Yield</h3>
                            <span className="text-4xl font-bold text-blue-400">{data.yield_values[0] || 0} T</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center h-64 bg-farm-card rounded-xl">
                    {loading ? "Loading Model Data..." : "Insufficient Data for Prediction"}
                </div>
            )}
        </div>
    );
}
