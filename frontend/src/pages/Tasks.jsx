
import React, { useState } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function Tasks() {
    // Mock Tasks for now - connected to DB in future or via API if I implemented GET /tasks
    const [tasks, setTasks] = useState([
        { id: 101, type: 'Pest Control', priority: 'High', status: 'Pending', target: 'Palm #182', assigned: 'Unassigned', time: '2 hrs ago' },
        { id: 102, type: 'Fertilize', priority: 'Medium', status: 'In Progress', target: 'Zone A', assigned: 'Ahmed', time: '5 hrs ago' },
        { id: 103, type: 'Harvest Check', priority: 'Low', status: 'Done', target: 'Sector 4', assigned: 'Ali', time: '1 day ago' },
    ]);

    return (
        <div className="h-full flex flex-col space-y-6">
            <header>
                <h2 className="text-3xl font-bold mb-1">Task Command</h2>
                <p className="text-gray-400">Automated Workflow Dispatch</p>
            </header>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
                <KanbanColumn title="PENDING" count={tasks.filter(t => t.status === 'Pending').length} color="border-red-500/30 bg-red-500/5">
                    {tasks.filter(t => t.status === 'Pending').map(task => (
                        <TaskCard key={task.id} task={task} color="red" />
                    ))}
                </KanbanColumn>

                <KanbanColumn title="IN PROGRESS" count={tasks.filter(t => t.status === 'In Progress').length} color="border-yellow-500/30 bg-yellow-500/5">
                    {tasks.filter(t => t.status === 'In Progress').map(task => (
                        <TaskCard key={task.id} task={task} color="yellow" />
                    ))}
                </KanbanColumn>

                <KanbanColumn title="COMPLETED" count={tasks.filter(t => t.status === 'Done').length} color="border-green-500/30 bg-green-500/5">
                    {tasks.filter(t => t.status === 'Done').map(task => (
                        <TaskCard key={task.id} task={task} color="green" />
                    ))}
                </KanbanColumn>
            </div>
        </div>
    );
}

const KanbanColumn = ({ title, count, color, children }) => (
    <div className={`flex flex-col h-full rounded-xl border ${color} backdrop-blur-sm`}>
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold tracking-wider text-xs">{title}</h3>
            <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{count}</span>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-auto">
            {children}
        </div>
    </div>
);

const TaskCard = ({ task, color }) => {
    const borderColor = {
        red: 'border-l-red-500',
        yellow: 'border-l-yellow-500',
        green: 'border-l-green-500'
    }[color];

    return (
        <div className={`bg-farm-card p-4 rounded-lg border border-white/5 border-l-4 ${borderColor} hover:bg-white/5 transition-colors cursor-pointer group`}>
            <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-white">{task.type}</span>
                <span className="text-[10px] text-gray-500">{task.time}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <AlertTriangle size={12} />
                {task.target}
            </div>
            <div className="flex justify-between items-center">
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-[10px] flex items-center justify-center border border-farm-card">AH</div>
                </div>
                <button className="text-xs px-2 py-1 bg-white/5 rounded hover:bg-white/10">View</button>
            </div>
        </div>
    );
};
