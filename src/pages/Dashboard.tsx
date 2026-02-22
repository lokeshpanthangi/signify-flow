import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  FileText,
  LayoutTemplate,
  Link as LinkIcon,
  BarChart2,
  Settings,
  Grip,
  Send,
  PenTool,
  MoreHorizontal,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Zap,
  Activity,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listSignForms, type SignFormData } from '@/lib/api/signforms';
import { listDocuments, type DocumentData } from '@/lib/api/documents';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
  Legend
} from 'recharts';
import { TemplatesView } from '@/components/TemplatesView';

// --- Dashboard Components ---

const SidebarItem = ({
  icon: Icon,
  label,
  isActive,
  onClick
}: {
  icon: any,
  label: string,
  isActive: boolean,
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex flex-col items-center justify-center gap-1 py-4 transition-all duration-200 group relative",
      isActive
        ? "text-white"
        : "text-gray-400 hover:text-white"
    )}
  >
    {isActive && (
      <motion.div
        layoutId="active-pill"
        className="absolute left-0 w-1 h-8 bg-green-500 rounded-r-full"
      />
    )}
    <Icon className={cn("h-6 w-6 mb-1", isActive && "text-green-400")} />
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

const ActionCard = ({
  icon: Icon,
  label,
  onClick
}: {
  icon: any,
  label: string,
  onClick: () => void
}) => (
  <motion.button
    whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)" }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center w-64 h-48 bg-white border border-stone-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 group"
  >
    <Icon className="h-10 w-10 text-stone-600 mb-4 group-hover:text-green-600 transition-colors" />
    <span className="text-lg font-medium text-stone-800">{label}</span>
  </motion.button>
);

// A visual representation of a document page with real text
const DocumentPreview = () => (
  <div className="w-full h-64 bg-white p-6 relative overflow-hidden flex flex-col gap-3 shadow-inner">
    {/* Real Mock Text */}
    <div className="space-y-4 opacity-70 select-none pointer-events-none">
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-800 mb-1">Non-Disclosure Agreement</h4>
        <div className="h-[1px] w-full bg-stone-200 mb-2" />
      </div>

      {/* Justified text lines using flex/blocks for visual simulation of a contract */}
      <p className="text-[7px] leading-relaxed text-stone-500 font-serif text-justify">
        This Agreement is entered into by and between the parties ("Disclosing Party") and ("Receiving Party") for the purpose of preventing the unauthorized disclosure of Confidential Information as defined below. The parties agree to enter into a confidential relationship with respect to the disclosure of certain proprietary and confidential information ("Confidential Information").
      </p>

      <p className="text-[7px] leading-relaxed text-stone-500 font-serif text-justify">
        1. <strong>Definition of Confidential Information.</strong> For purposes of this Agreement, "Confidential Information" shall include all information or material that has or could have commercial value or other utility in the business in which Disclosing Party is engaged. If Confidential Information is in written form, the Disclosing Party shall label or stamp the materials with the word "Confidential" or some similar warning.
      </p>

      <p className="text-[7px] leading-relaxed text-stone-500 font-serif text-justify">
        2. <strong>Exclusions from Confidential Information.</strong> Receiving Party's obligations under this Agreement do not extend to information that is publicly known at the time of disclosure or subsequently becomes publicly known through no fault of the Receiving Party.
      </p>
    </div>

    {/* Signature area mock */}
    <div className="absolute bottom-12 right-6 w-20">
      <div className="h-[1px] bg-stone-800 mb-1 w-full" />
      <p className="text-[6px] text-stone-400 font-serif text-center uppercase tracking-widest">Signature</p>

      {/* Fake signature scribble */}
      <svg className="absolute -top-6 left-0 w-full h-8 text-blue-900 opacity-60" viewBox="0 0 100 40">
        <path d="M5,25 Q20,10 40,25 T90,15" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  </div>
);

const DocumentCard = ({ doc, onClick }: { doc: DocumentData, onClick: () => void }) => {
  const statusColors: Record<string, string> = {
    signed: 'text-green-600',
    pending: 'text-amber-600',
    declined: 'text-red-500',
    draft: 'text-stone-400',
  };
  const dateStr = doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        y: -8,
        scale: 1.02,
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.2)"
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative flex flex-col bg-white border border-stone-200/60 rounded-xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg"
      onClick={onClick}
    >
      <DocumentPreview />

      {/* Blurred Glass Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/60 backdrop-blur-md border-t border-white/20 flex flex-col justify-center px-5 transition-all group-hover:bg-white/80">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="font-semibold text-stone-800 text-sm truncate" title={doc.name}>{doc.name}</h3>
            <p className="text-[10px] text-stone-600 font-medium mt-0.5">
              {dateStr} • <span className={cn(
                "uppercase tracking-wide font-bold",
                statusColors[doc.status] || 'text-stone-400'
              )}>{doc.status}</span>
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4 text-stone-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem>Open</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
};

const SignFormCard = ({ form, onClick }: { form: SignFormData; onClick: () => void }) => (
  <div
    className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-stone-50 rounded-xl group-hover:bg-green-50 transition-colors">
        <LinkIcon className="h-6 w-6 text-stone-400 group-hover:text-green-600 transition-colors" />
      </div>
      <span className={cn(
        "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold",
        form.status === 'active' ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
      )}>
        {form.status}
      </span>
    </div>
    <h3 className="font-semibold text-stone-800 text-lg mb-1">{form.name}</h3>
    <p className="text-xs text-stone-400 font-medium mb-1 line-clamp-1">{form.description || 'No description'}</p>
    <p className="text-[10px] text-stone-300 font-medium mb-5">Created {new Date(form.created_at).toLocaleDateString()}</p>

    {form.max_responses && (
      <div className="mb-4">
        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${Math.min((form.responses_count / form.max_responses) * 100, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-stone-400 mt-1 text-right">{form.responses_count} / {form.max_responses}</p>
      </div>
    )}

    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-stone-800">{form.responses_count}</span>
        <span className="text-xs text-stone-500 font-medium uppercase tracking-wide">Responses</span>
      </div>
      <span className="text-xs font-semibold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        View Details →
      </span>
    </div>
  </div>
);


// --- Reports Components ---

const KPICard = ({ title, value, change, icon: Icon, delay }: { title: string, value: string, change: string, icon: any, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow"
  >
    <div>
      <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-stone-800 font-serif">{value}</h3>
      <p className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1 bg-green-50 w-fit px-2 py-1 rounded-full">
        <TrendingUp className="h-3 w-3" />
        {change}
      </p>
    </div>
    <div className="p-3 bg-stone-50 rounded-xl text-stone-600 border border-stone-100">
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
        <div className="text-2xl font-bold text-stone-800 font-serif">1,100</div>
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


// --- Main Dashboard ---

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [signForms, setSignForms] = useState<SignFormData[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await listDocuments({ search: searchQuery || undefined, limit: 12 });
      setDocuments(res.documents);
    } catch { /* silent */ }
    finally { setIsLoadingDocs(false); }
  }, [searchQuery]);

  useEffect(() => {
    setIsLoadingDocs(true);
    const t = setTimeout(fetchDocs, 300);
    return () => clearTimeout(t);
  }, [fetchDocs]);

  useEffect(() => {
    (async () => {
      try {
        setIsLoadingForms(true);
        const res = await listSignForms({ limit: 12 });
        setSignForms(res.sign_forms);
      } catch { /* silent */ }
      finally { setIsLoadingForms(false); }
    })();
  }, []);

  return (
    <div className="flex h-screen bg-[#F9F9F7] font-sans overflow-hidden">

      {/* Dark Sidebar */}
      <aside className="w-[90px] bg-[#1A1C1E] flex flex-col items-center py-4 z-50 shrink-0 shadow-xl">
        {/* Top Grid Icon */}
        <button className="p-3 text-gray-400 hover:text-white mb-6 transition-colors">
          <Grip className="h-6 w-6" />
        </button>

        {/* Menu Items */}
        <nav className="flex-1 w-full space-y-1">
          <SidebarItem
            icon={Home}
            label="Home"
            isActive={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
          <SidebarItem
            icon={FileText}
            label="Documents"
            isActive={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
          />
          <SidebarItem
            icon={LayoutTemplate}
            label="Templates"
            isActive={activeTab === 'templates'}
            onClick={() => setActiveTab('templates')}
          />
          <SidebarItem
            icon={LinkIcon}
            label="SignForms"
            isActive={activeTab === 'signforms'}
            onClick={() => setActiveTab('signforms')}
          />
          <SidebarItem
            icon={BarChart2}
            label="Reports"
            isActive={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
          />
          <SidebarItem
            icon={Settings}
            label="Settings"
            isActive={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-8 max-w-[1600px] mx-auto min-h-full flex flex-col">

          {/* Top Bar: Search + User Profile */}
          <div className="flex items-center justify-between mb-12 gap-8">
            {/* Logo - Signature Style */}
            <div className="flex-shrink-0 pt-2">
              <h1 className="text-3xl text-stone-800 font-normal select-none" style={{ fontFamily: "'Great Vibes', cursive" }}>
                SignFlow
              </h1>
            </div>

            {/* Centered Search Bar */}
            <div className="flex-1 max-w-2xl relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-stone-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-full border-stone-200 bg-white shadow-sm hover:shadow-md focus:shadow-lg focus:border-green-500/50 transition-all text-sm"
              />
            </div>

            {/* User Avatar (Top Right) */}
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 w-10 rounded-full bg-gradient-to-tr from-stone-700 to-stone-600 flex items-center justify-center text-white text-xs font-bold border-2 border-stone-500 cursor-pointer shadow-md hover:border-green-500 transition-colors hover:scale-105">
                    {user?.name?.[0] || 'U'}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { localStorage.clear(); navigate('/auth?mode=login'); }} className="text-red-600">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* REPORTS VIEW */}
          {activeTab === 'reports' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div>
                <h2 className="text-3xl font-serif text-stone-900 mb-2">Reports & Analytics</h2>
                <p className="text-stone-500 text-sm">Track your document performance and team efficiency.</p>
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
                  className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-stone-800 text-lg">Activity Overview</h3>
                      <p className="text-xs text-stone-400">Total documents sent vs signed</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs font-medium text-stone-500 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">Last 30 Days</span>
                    </div>
                  </div>
                  <ActivityChart />
                </motion.div>

                {/* Document Distribution Pie */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center"
                >
                  <h3 className="font-semibold text-stone-800 mb-2 self-start w-full">Distribution</h3>
                  <DocumentDistribution />

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mt-2 justify-center">
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                      <span className="block w-2 h-2 rounded-full bg-green-600" /> Contracts
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                      <span className="block w-2 h-2 rounded-full bg-stone-800" /> NDAs
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                      <span className="block w-2 h-2 rounded-full bg-stone-400" /> Proposals
                    </div>
                  </div>
                </motion.div>

                {/* Velocity Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
                >
                  <h3 className="font-semibold text-stone-800 mb-2">Completion Velocity</h3>
                  <p className="text-xs text-stone-400 mb-4">Signatures collected per day</p>
                  <VelocityChart />
                </motion.div>

                {/* Team Performance Radar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
                >
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-2 font-serif text-xl">Team Performance</h3>
                    <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                      Your team is performing exceptionally well in <strong>Security</strong> and <strong>Volume</strong> metrics.
                      Consider improving collaboration times to boost overall efficiency.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-medium text-stone-600 mb-1">
                          <span>Security Compliance</span>
                          <span>98%</span>
                        </div>
                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} transition={{ duration: 1, delay: 1 }} className="h-full bg-green-600 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium text-stone-600 mb-1">
                          <span>Turnaround Time</span>
                          <span>85%</span>
                        </div>
                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1, delay: 1.2 }} className="h-full bg-stone-800 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <TeamPerformance />
                </motion.div>
              </div>
            </div>
          )}

          {/* HOME / DOCUMENTS VIEW */}
          {(activeTab === 'home' || activeTab === 'documents') && (
            <>
              {/* Action Cards (Only on 'Home' tab) */}
              {activeTab === 'home' && (
                <div className="flex flex-wrap gap-8 mb-16 justify-start">
                  <ActionCard
                    icon={Send}
                    label="Send for signatures"
                    onClick={() => navigate('/templates')}
                  />
                  <ActionCard
                    icon={PenTool}
                    label="Sign yourself"
                    onClick={() => navigate('/signforms')}
                  />
                </div>
              )}

              {/* Loading */}
              {isLoadingDocs && (
                <div className="flex items-center justify-center py-16 text-stone-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {/* Documents Grid */}
              {!isLoadingDocs && documents.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-stone-700 font-sans">My Documents</h2>
                    <button onClick={() => navigate('/documents')} className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors">View all</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        onClick={() => navigate(`/edit-document/${doc.id}`)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {!isLoadingDocs && documents.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 mt-20">
                  <Search className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No documents found</p>
                  <p className="text-sm">Try searching for something else</p>
                </div>
              )}
            </>
          )}

          {/* SignForms Tab */}
          {activeTab === 'signforms' && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-stone-800 mb-2">SignForms</h2>
                  <p className="text-stone-500 text-sm">Create public links for anyone to sign your documents.</p>
                </div>
                <button
                  onClick={() => navigate('/signforms/create')}
                  className="bg-[#1A1C1E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                >
                  <LinkIcon className="h-4 w-4" />
                  Create SignForm
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {isLoadingForms ? (
                  <div className="col-span-full flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
                  </div>
                ) : signForms.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-stone-400">
                    <p className="text-sm">No sign forms yet. Create one to get started.</p>
                  </div>
                ) : (
                  signForms.map((form) => (
                    <SignFormCard key={form.id} form={form} onClick={() => navigate(`/signforms/${form.id}`)} />
                  ))
                )}
              </div>
            </section>
          )}

          {/* Templates View */}
          {activeTab === 'templates' && (
            <TemplatesView />
          )}

        </div>
      </main>

    </div>
  );
};

export default Dashboard;
