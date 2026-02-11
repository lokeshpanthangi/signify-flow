import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mockSignForms, mockTemplates, SignForm, SignFormResponse } from '@/data/mockData';
import {
    ArrowLeft, Link as LinkIcon, Copy, ExternalLink, Power, PowerOff,
    Users, Clock, CheckCircle2, AlertCircle, FileText, Calendar,
    BarChart2, Eye, Search, MoreHorizontal, XCircle, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// --- Status Badge ---
const StatusBadge = ({ status }: { status: SignFormResponse['status'] }) => {
    const config = {
        completed: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle2 },
        pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock },
        expired: { bg: 'bg-red-50 border-red-200', text: 'text-red-600', icon: XCircle },
    };
    const c = config[status];
    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border", c.bg, c.text)}>
            <c.icon className="h-3 w-3" />
            {status}
        </span>
    );
};

// --- KPI Stat Card ---
const StatCard = ({ label, value, icon: Icon, color, delay }: { label: string; value: string | number; icon: any; color: string; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
        <div className="flex items-center justify-between mb-3">
            <div className={cn("p-2.5 rounded-lg", color)}>
                <Icon className="h-4 w-4" />
            </div>
        </div>
        <p className="text-2xl font-bold text-stone-800">{value}</p>
        <p className="text-xs text-stone-500 font-medium mt-1">{label}</p>
    </motion.div>
);

const SignFormDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const form = useMemo(() => mockSignForms.find(f => f.id === id), [id]);
    const template = useMemo(() => form ? mockTemplates.find(t => t.id === form.templateId) : null, [form]);

    const [isActive, setIsActive] = useState(form?.status === 'active');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeResponseTab, setActiveResponseTab] = useState<'all' | 'completed' | 'pending' | 'expired'>('all');

    if (!form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
                <div className="text-center p-8">
                    <div className="bg-red-50 p-4 rounded-full inline-block mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">Form Not Found</h1>
                    <p className="text-stone-500 mb-6">The sign form you are looking for does not exist.</p>
                    <button onClick={() => navigate('/dashboard')} className="text-green-600 hover:text-green-700 font-medium text-sm">
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const shareUrl = `${window.location.origin}/forms/${form.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: '✅ Link Copied!', description: 'The public form link has been copied to your clipboard.' });
    };

    const handleToggleStatus = () => {
        setIsActive(!isActive);
        toast({
            title: isActive ? '⏸️ Form Deactivated' : '✅ Form Activated',
            description: isActive ? 'The form is now inactive and will no longer accept responses.' : 'The form is now live and accepting responses.',
        });
    };

    const completed = form.responsesList.filter(r => r.status === 'completed').length;
    const pending = form.responsesList.filter(r => r.status === 'pending').length;
    const expired = form.responsesList.filter(r => r.status === 'expired').length;

    const filteredResponses = form.responsesList.filter(r => {
        const matchesTab = activeResponseTab === 'all' || r.status === activeResponseTab;
        const matchesSearch = r.signerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.signerEmail.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#F9F9F7] font-sans">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-stone-800">{form.name}</h1>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border",
                                    isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-stone-100 text-stone-500 border-stone-200"
                                )}>
                                    {isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-sm text-stone-500 mt-0.5">{form.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.open(`/forms/${form.id}`, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-all"
                        >
                            <Eye className="h-4 w-4" /> Preview
                        </button>
                        <button
                            onClick={handleToggleStatus}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all",
                                isActive
                                    ? "text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
                                    : "text-green-600 bg-green-50 hover:bg-green-100 border-green-200"
                            )}
                        >
                            {isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Share Link Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-stone-200 p-5 mb-8 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                                <LinkIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Public Form Link</p>
                                <p className="text-sm font-mono text-stone-700 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">{shareUrl}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1C1E] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-md hover:shadow-lg"
                            >
                                <Copy className="h-4 w-4" /> Copy Link
                            </button>
                            <button
                                onClick={() => window.open(`/forms/${form.id}`, '_blank')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors border border-stone-200"
                            >
                                <ExternalLink className="h-4 w-4" /> Open
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* KPI Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Responses" value={form.responses} icon={Users} color="bg-stone-100 text-stone-600" delay={0.1} />
                    <StatCard label="Completed" value={completed} icon={CheckCircle2} color="bg-green-50 text-green-600" delay={0.2} />
                    <StatCard label="Pending" value={pending} icon={Clock} color="bg-amber-50 text-amber-600" delay={0.3} />
                    <StatCard
                        label="Capacity"
                        value={form.maxResponses ? `${form.responses}/${form.maxResponses}` : '∞'}
                        icon={BarChart2}
                        color="bg-blue-50 text-blue-600"
                        delay={0.4}
                    />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Form Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm"
                    >
                        <h3 className="font-semibold text-stone-800 text-lg mb-4">Form Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <FileText className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Template</p>
                                    <p className="text-sm font-medium text-stone-700">{template?.name || 'Unknown'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Created</p>
                                    <p className="text-sm font-medium text-stone-700">{form.dateCreated}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Expires</p>
                                    <p className="text-sm font-medium text-stone-700">{form.expiryDate || 'No expiry'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-0.5">Response Limit</p>
                                    <p className="text-sm font-medium text-stone-700">{form.maxResponses ? `${form.maxResponses} max` : 'Unlimited'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Capacity Progress Bar */}
                        {form.maxResponses && (
                            <div className="mt-6 pt-4 border-t border-stone-100">
                                <div className="flex justify-between text-xs font-medium text-stone-600 mb-2">
                                    <span>Capacity Used</span>
                                    <span>{Math.round((form.responses / form.maxResponses) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(form.responses / form.maxResponses) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-green-600 rounded-full"
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Responses Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
                    >
                        {/* Table Header */}
                        <div className="p-5 border-b border-stone-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-stone-800 text-lg">Responses</h3>
                                <span className="text-xs font-bold text-stone-400 bg-stone-50 px-3 py-1 rounded-full border border-stone-200">
                                    {filteredResponses.length} of {form.responsesList.length}
                                </span>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex items-center gap-2">
                                {(['all', 'completed', 'pending', 'expired'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveResponseTab(tab)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                                            activeResponseTab === tab
                                                ? "bg-stone-800 text-white shadow"
                                                : "text-stone-500 hover:bg-stone-100"
                                        )}
                                    >
                                        {tab} {tab !== 'all' && `(${tab === 'completed' ? completed : tab === 'pending' ? pending : expired})`}
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="relative mt-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-stone-100 max-h-[400px] overflow-y-auto">
                            {filteredResponses.length === 0 ? (
                                <div className="p-12 text-center text-stone-400">
                                    <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-medium">No responses found</p>
                                </div>
                            ) : (
                                filteredResponses.map((response, i) => (
                                    <motion.div
                                        key={response.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-stone-600 to-stone-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {response.signerName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-stone-800">{response.signerName}</p>
                                                <p className="text-xs text-stone-400 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {response.signerEmail}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <p className="text-xs text-stone-400 font-medium hidden md:block">{response.signedAt}</p>
                                            <StatusBadge status={response.status} />
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default SignFormDetail;
