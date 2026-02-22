import { motion } from 'framer-motion';
import {
    FileText,
    TrendingUp,
    CheckCircle2,
    Zap,
    Activity
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';
import { DashboardLayout } from '@/components/DashboardLayout';

// --- Report Sub-Components ---

const KPICard = ({ title, value, change, icon: Icon, delay }: { title: string, value: string, change: string, icon: any, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="bg-white dark:bg-[#18181F] p-6 rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm flex items-start justify-between hover:shadow-md transition-shadow"
    >
        <div>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-stone-800 dark:text-white font-serif">{value}</h3>
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 w-fit px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                {change}
            </p>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-xl text-stone-600 dark:text-stone-400 border border-stone-100 dark:border-[#2A2A32]">
            <Icon className="h-5 w-5" />
        </div>
    </motion.div>
);

const ActivityChart = () => {
    const data = [
        { name: 'Mon', sent: 4, signed: 2 },
        { name: 'Tue', sent: 3, signed: 5 },
        { name: 'Wed', sent: 7, signed: 6 },
        { name: 'Thu', sent: 2, signed: 4 },
        { name: 'Fri', sent: 6, signed: 8 },
        { name: 'Sat', sent: 1, signed: 1 },
        { name: 'Sun', sent: 0, signed: 0 },
    ];

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSigned" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#292524" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#292524" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        cursor={{ stroke: '#d6d3d1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="sent" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                    <Area type="monotone" dataKey="signed" stroke="#292524" strokeWidth={3} fillOpacity={1} fill="url(#colorSigned)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const DocumentDistribution = () => {
    const data = [
        { name: 'Contracts', value: 400 },
        { name: 'NDAs', value: 300 },
        { name: 'Proposals', value: 250 },
        { name: 'Invoices', value: 150 },
    ];
    const COLORS = ['#16a34a', '#292524', '#78716c', '#e7e5e4'];

    return (
        <div className="h-[250px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        cornerRadius={4}
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600, color: '#44403c' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-2xl font-bold text-stone-800 dark:text-white font-serif">1,100</div>
                <div className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Total</div>
            </div>
        </div>
    );
}

const VelocityChart = () => {
    const data = [
        { name: 'M', value: 20 },
        { name: 'T', value: 45 },
        { name: 'W', value: 30 },
        { name: 'T', value: 80 },
        { name: 'F', value: 55 },
        { name: 'S', value: 15 },
        { name: 'S', value: 10 },
    ];

    return (
        <div className="h-[180px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <Tooltip
                        cursor={{ fill: '#f5f5f4' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={8} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

const TeamPerformance = () => {
    const data = [
        { subject: 'Speed', A: 120, fullMark: 150 },
        { subject: 'Volume', A: 98, fullMark: 150 },
        { subject: 'Accuracy', A: 86, fullMark: 150 },
        { subject: 'Security', A: 99, fullMark: 150 },
        { subject: 'Collab', A: 85, fullMark: 150 },
        { subject: 'Usage', A: 65, fullMark: 150 },
    ];

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e7e5e4" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 10, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar
                        name="Team"
                        dataKey="A"
                        stroke="#16a34a"
                        strokeWidth={2}
                        fill="#16a34a"
                        fillOpacity={0.2}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}

// --- Reports Page ---

const ReportsPage = () => {
    return (
        <DashboardLayout showSearch={false}>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <h2 className="text-3xl font-serif text-stone-900 dark:text-white mb-2">Reports & Analytics</h2>
                    <p className="text-stone-500 dark:text-stone-400 text-sm">Track your document performance and team efficiency.</p>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Documents" value="1,284" change="+12% from last month" icon={FileText} delay={0.1} />
                    <KPICard title="Completed" value="942" change="+8% from last month" icon={CheckCircle2} delay={0.2} />
                    <KPICard title="Sign Velocity" value="2.4 days" change="-12% faster" icon={Zap} delay={0.3} />
                    <KPICard title="Efficiency Score" value="98.5" change="Top 5%" icon={Activity} delay={0.4} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Activity Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-2 bg-white dark:bg-[#18181F] p-6 rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-semibold text-stone-800 dark:text-white text-lg">Activity Overview</h3>
                                <p className="text-xs text-stone-400">Total documents sent vs signed</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/10 px-3 py-1 rounded-full border border-stone-200 dark:border-[#2A2A32]">Last 30 Days</span>
                            </div>
                        </div>
                        <ActivityChart />
                    </motion.div>

                    {/* Document Distribution Pie */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white dark:bg-[#18181F] p-6 rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm flex flex-col items-center justify-center"
                    >
                        <h3 className="font-semibold text-stone-800 dark:text-white mb-2 self-start w-full">Distribution</h3>
                        <DocumentDistribution />

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mt-2 justify-center">
                            <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                                <span className="block w-2 h-2 rounded-full bg-green-600" /> Contracts
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                                <span className="block w-2 h-2 rounded-full bg-stone-800 dark:bg-stone-300" /> NDAs
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                                <span className="block w-2 h-2 rounded-full bg-stone-400" /> Proposals
                            </div>
                        </div>
                    </motion.div>

                    {/* Velocity Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-white dark:bg-[#18181F] p-6 rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm"
                    >
                        <h3 className="font-semibold text-stone-800 dark:text-white mb-2">Completion Velocity</h3>
                        <p className="text-xs text-stone-400 mb-4">Signatures collected per day</p>
                        <VelocityChart />
                    </motion.div>

                    {/* Team Performance Radar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="lg:col-span-2 bg-white dark:bg-[#18181F] p-6 rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                    >
                        <div>
                            <h3 className="font-semibold text-stone-800 dark:text-white mb-2 font-serif text-xl">Team Performance</h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
                                Your team is performing exceptionally well in <strong>Security</strong> and <strong>Volume</strong> metrics.
                                Consider improving collaboration times to boost overall efficiency.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        <span>Security Compliance</span>
                                        <span>98%</span>
                                    </div>
                                    <div className="h-2 w-full bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} transition={{ duration: 1, delay: 1 }} className="h-full bg-green-600 rounded-full" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        <span>Turnaround Time</span>
                                        <span>85%</span>
                                    </div>
                                    <div className="h-2 w-full bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1, delay: 1.2 }} className="h-full bg-stone-800 dark:bg-stone-300 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <TeamPerformance />
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReportsPage;
