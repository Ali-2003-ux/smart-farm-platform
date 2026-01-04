import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const HealthTrendChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-xs text-gray-500 font-mono">
                [NO HEALTH DATA AVAILABLE]
            </div>
        );
    }
    console.log("Rendering HealthChart with:", data.length, "points");
    return (
        <AreaChart width={450} height={180} data={data}>
            <defs>
                <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                itemStyle={{ color: '#10B981' }}
            />
            <Area
                type="monotone"
                dataKey="health"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorHealth)"
            />
        </AreaChart>
    );
};

export const YieldProjectionsChart = ({ data }) => {
    return (
        <BarChart width={450} height={180} data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
            <XAxis type="number" stroke="#64748b" fontSize={10} hide />
            <YAxis dataKey="month" type="category" stroke="#94a3b8" fontSize={10} width={30} tickLine={false} axisLine={false} />
            <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
            />
            <Bar dataKey="yield" fill="#0EA5E9" barSize={10} radius={[0, 4, 4, 0]} />
        </BarChart>
    );
};
