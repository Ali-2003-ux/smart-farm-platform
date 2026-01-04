
import React, { useState } from 'react';
import { LayoutDashboard, Plane, Activity, ScanLine, Settings, Menu, Bell, FileText, DollarSign, ClipboardList } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import DroneOps from './pages/DroneOps';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Finance from './pages/Finance';
import Tasks from './pages/Tasks';
import PrecisionAg from './pages/PrecisionAg';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'drone': return <DroneOps />;
            case 'analytics': return <Analytics />;
            case 'reports': return <Reports />;
            case 'finance': return <Finance />;
            case 'tasks': return <Tasks />;
            case 'vra': return <PrecisionAg />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-farm-dark text-white font-sans overflow-hidden">
            {/* Glass Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-farm-green/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-farm-accent/10 rounded-full blur-[120px]" />
            </div>

            {/* Sidebar */}
            <aside className={`relative z - 20 bg - farm - card / 80 backdrop - blur - xl border - r border - white / 5 flex flex - col transition - all duration - 300 ${isSidebarOpen ? 'w-72' : 'w-20'} `}>
                <div className="p-6 border-b border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-farm-green to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <ScanLine className="text-white" size={24} />
                    </div>
                    {isSidebarOpen && (
                        <div className="animate-slide-in">
                            <h1 className="font-heading font-bold text-xl tracking-wide text-white">Smart<span className="text-farm-green">Farm</span></h1>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Enterprise Command</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem
                        icon={<LayoutDashboard size={22} />}
                        label="Field Overview"
                        active={activeTab === 'dashboard'}
                        compact={!isSidebarOpen}
                        onClick={() => setActiveTab('dashboard')}
                    />
                    <SidebarItem
                        icon={<ScanLine size={22} />}
                        label="Drone Operations"
                        active={activeTab === 'drone'}
                        compact={!isSidebarOpen}
                        onClick={() => setActiveTab('drone')}
                    />
                    <SidebarItem
                        icon={<Activity size={22} />}
                        label="AI Analytics"
                        active={activeTab === 'analytics'}
                        compact={!isSidebarOpen}
                        onClick={() => setActiveTab('analytics')}
                    />
                    <SidebarItem
                        icon={<Plane size={22} />}
                        label="Precision VRA"
                        active={activeTab === 'vra'}
                        compact={!isSidebarOpen}
                        onClick={() => setActiveTab('vra')}
                    />
                    <div className="my-2 border-t border-white/5 mx-2" />
                    <SidebarItem
                        icon={<FileText size={22} />}
                        label="Mission Reports"
                        active={activeTab === 'reports'}
                        compact={!isSidebarOpen}
                        onClick={() => setActiveTab('reports')}
                    />
                    <SidebarItem
                        icon={<DollarSign size={22} />}
                        label="Finance & Carbon"
                        active={activeTab === 'finance'}
                        compact={!isSidebarOpen}
                        onClick={() => setActiveTab('finance')}
                    />
                    <SidebarItem
                        icon={<ClipboardList size={22} />}
                        label="Task Command"
                        active={activeTab === 'tasks'}
                        compact={!isSidebarOpen}
                        onClick={() => setActiveTab('tasks')}
                    />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <SidebarItem
                        icon={<Settings size={22} />}
                        label="System Config"
                        compact={!isSidebarOpen}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="h-16 px-8 flex items-center justify-between bg-farm-card/50 backdrop-blur-sm border-b border-white/5">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-emerald-400">CLOUD - ENTERPRISE v2.0</span>
                        </div>
                        <button className="relative p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-farm-dark"></span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white/10"></div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-slide-in">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick, compact }) {
    return (
        <button
            onClick={onClick}
            className={`w - full flex items - center gap - 4 px - 4 py - 3.5 rounded - xl transition - all duration - 300 group ${active
                ? 'bg-gradient-to-r from-farm-green/20 to-transparent text-farm-green border-l-2 border-farm-green'
                : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                } `}
        >
            <div className={`transition - transform duration - 300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'group-hover:scale-110'} `}>
                {icon}
            </div>
            {!compact && (
                <span className={`font - medium whitespace - nowrap transition - opacity duration - 300 ${active ? 'font-bold' : ''} `}>
                    {label}
                </span>
            )}
            {active && !compact && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-farm-green shadow-[0_0_8px_#10B981]"></div>
            )}
        </button>
    );
}

export default App;

