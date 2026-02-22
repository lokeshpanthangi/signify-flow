import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSignForm, updateSignForm, deleteSignForm, SignFormDetailData, SignFormResponseEntry } from '@/lib/api/signforms';
import { getTemplate, TemplateData, FieldsConfigRecipient } from '@/lib/api/templates';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
    ArrowLeft, Link as LinkIcon, Copy, ExternalLink, Power, PowerOff,
    Users, Clock, CheckCircle2, AlertCircle, FileText, Calendar,
    BarChart2, Eye, Search, Loader2, XCircle, Mail, Trash2, PenTool,
    Download, RefreshCw, PartyPopper, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RECIPIENT_HEX_COLORS as RECIPIENT_COLORS } from '@/lib/constants';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';


// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: SignFormResponseEntry['status'] }) => {
    const config = {
        completed: { bg: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20', text: 'text-green-700 dark:text-green-400', icon: CheckCircle2 },
        pending: { bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
        expired: { bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20', text: 'text-red-600 dark:text-red-400', icon: XCircle },
    };
    const c = config[status];
    return (
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border", c.bg, c.text)}>
            <c.icon className="h-3 w-3" />
            {status}
        </span>
    );
};


// ─── KPI Stat Card ────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className="bg-white dark:bg-[#18181F] rounded-xl border border-stone-200 dark:border-[#2A2A32] p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
            <div className={cn("p-2.5 rounded-lg", color)}>
                <Icon className="h-4 w-4" />
            </div>
        </div>
        <p className="text-2xl font-bold text-stone-800 dark:text-white">{value}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">{label}</p>
    </div>
);




// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
const SignFormDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState<SignFormDetailData | null>(null);
    const [template, setTemplate] = useState<TemplateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeResponseTab, setActiveResponseTab] = useState<'all' | 'completed' | 'pending' | 'expired'>('all');

    // ─── Fetch Data ───
    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const sf = await getSignForm(id);
            setForm(sf);
            setIsActive(sf.status === 'active');
            setIsCompleted(sf.status === 'completed');
            try {
                const t = await getTemplate(sf.template_id);
                setTemplate(t);
            } catch { /* template may have been deleted */ }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Could not load sign form.');
        }
    }, [id]);

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, [fetchData]);

    // Auto-refresh every 30 seconds for live status
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
        toast.success('Signing status updated.');
    };

    // ─── Loading / Not Found ───
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] dark:bg-[#0E0E13]">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400 dark:text-stone-500" />
            </div>
        );
    }

    if (!form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] dark:bg-[#0E0E13]">
                <div className="text-center p-8">
                    <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-full inline-block mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800 dark:text-white mb-2">Form Not Found</h1>
                    <p className="text-stone-500 dark:text-stone-400 mb-6">The sign form you are looking for does not exist.</p>
                    <button onClick={() => navigate('/signforms')} className="text-green-600 hover:text-green-700 font-medium text-sm">
                        ← Back to SignForms
                    </button>
                </div>
            </div>
        );
    }

    const shareUrl = `${window.location.origin}/forms/${form.url}`;
    const responsesList = form.responses_list || [];
    const completed = responsesList.filter(r => r.status === 'completed').length;
    const pending = responsesList.filter(r => r.status === 'pending').length;
    const expired = responsesList.filter(r => r.status === 'expired').length;

    // Determine signing recipients and completion
    const signingRecipients = template?.fields_config?.recipients.filter(r => r.action !== 'view') || [];
    const allSigned = signingRecipients.length > 0 && signingRecipients.every(r =>
        responsesList.some(resp => resp.status === 'completed' && resp.signer_email.toLowerCase() === r.email.toLowerCase())
    );

    const filteredResponses = responsesList.filter(r => {
        const matchesTab = activeResponseTab === 'all' || r.status === activeResponseTab;
        const matchesSearch = r.signer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.signer_email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // ─── Handlers ───
    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard.');
    };

    const handleToggleStatus = async () => {
        if (toggling) return;
        setToggling(true);
        const newStatus = isActive ? 'inactive' : 'active';
        try {
            await updateSignForm(form.id, { status: newStatus as 'active' | 'inactive' | 'completed' });
            setIsActive(!isActive);
            toast.success(isActive ? 'Form deactivated.' : 'Form activated.');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to update status.');
        } finally {
            setToggling(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this sign form? This cannot be undone.')) return;
        try {
            await deleteSignForm(form.id);
            toast.success('Sign form has been deleted.');
            navigate('/signforms');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete.');
        }
    };

    // ─── Download Document as PDF ───
    const handleDownload = async () => {
        setDownloading(true);
        try {
            // Create a hidden container with the full document + overlaid signatures
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.zIndex = '-1';
            container.style.background = '#fff';
            document.body.appendChild(container);

            // Build the document page
            const page = document.createElement('div');
            page.style.width = '816px';
            page.style.minHeight = '1056px';
            page.style.position = 'relative';
            page.style.background = '#fff';
            page.style.fontFamily = 'Inter, sans-serif';

            // Add template content
            if (template?.content) {
                const contentDiv = document.createElement('div');
                contentDiv.style.padding = '64px';
                contentDiv.style.fontSize = '11pt';
                contentDiv.style.lineHeight = '1.75';
                contentDiv.innerHTML = template.content;
                page.appendChild(contentDiv);
            }

            // Overlay signed fields
            if (template?.fields_config) {
                for (const field of template.fields_config.fields) {
                    const recipientIdx = template.fields_config.recipients.findIndex(r => r.id === field.recipientId);
                    const recipient = template.fields_config.recipients[recipientIdx];

                    const response = responsesList.find(resp => {
                        if (resp.status !== 'completed') return false;
                        if (resp.recipient_id && resp.recipient_id === field.recipientId) return true;
                        if (recipient && resp.signer_email.toLowerCase() === recipient.email.toLowerCase()) return true;
                        return false;
                    });

                    const value = response?.field_values?.[field.id];
                    if (value !== undefined && value !== null && value !== '') {
                        const fieldDiv = document.createElement('div');
                        fieldDiv.style.position = 'absolute';
                        fieldDiv.style.left = `${field.x}px`;
                        fieldDiv.style.top = `${field.y}px`;
                        fieldDiv.style.width = `${field.width}px`;
                        fieldDiv.style.height = `${field.height}px`;
                        fieldDiv.style.display = 'flex';
                        fieldDiv.style.alignItems = 'center';
                        fieldDiv.style.justifyContent = 'center';
                        fieldDiv.style.overflow = 'hidden';

                        const isSignatureType = field.type === 'signature' || field.type === 'initials';
                        if (isSignatureType && typeof value === 'string' && value.startsWith('data:')) {
                            const img = document.createElement('img');
                            img.src = value;
                            img.style.maxWidth = '100%';
                            img.style.maxHeight = '100%';
                            img.style.objectFit = 'contain';
                            fieldDiv.appendChild(img);
                        } else if (isSignatureType) {
                            fieldDiv.style.fontFamily = "'Great Vibes', cursive";
                            fieldDiv.style.fontSize = '18px';
                            fieldDiv.style.fontStyle = 'italic';
                            fieldDiv.style.color = '#1a1a1a';
                            fieldDiv.textContent = String(value);
                        } else {
                            fieldDiv.style.fontSize = '12px';
                            fieldDiv.style.color = '#1a1a1a';
                            fieldDiv.textContent = String(value);
                        }

                        page.appendChild(fieldDiv);
                    }
                }
            }

            container.appendChild(page);

            // Wait for images to load
            const images = container.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img =>
                img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })
            ));

            // Capture with html2canvas
            const canvas = await html2canvas(page, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 816,
                windowWidth: 816,
            });

            // Generate PDF (A4 portrait)
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            // Handle multi-page if content is long
            let yOffset = 0;
            while (yOffset < imgHeight) {
                if (yOffset > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, -yOffset, imgWidth, imgHeight);
                yOffset += pdfHeight;
            }

            pdf.save(`${form.name.replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`);
            document.body.removeChild(container);

            toast.success('Signed document saved as PDF.');
        } catch (err) {
            console.error('Download failed:', err);
            toast.error('Could not generate PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F9F7] dark:bg-[#0E0E13] font-sans">
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* ═══ Completion Banner ═══ */}
                {(isCompleted || allSigned) && (
                    <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 rounded-2xl border border-green-200 dark:border-green-500/20 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-xl">
                                    <PartyPopper className="h-7 w-7 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-green-800 dark:text-green-300">All Signatures Completed! 🎉</h3>
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-0.5">
                                        Every signer has signed this document. Download your completed document now.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="flex items-center gap-2.5 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-600/20 hover:shadow-green-600/30 transition-all disabled:opacity-50"
                            >
                                {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                                Download Signed Document
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ Top Bar: Back + Title + Actions ═══ */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/signforms')}
                            className="p-2 hover:bg-stone-100 dark:hover:bg-white/5 rounded-lg transition-colors text-stone-600 dark:text-stone-400"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-stone-800 dark:text-white">{form.name}</h1>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border",
                                    isCompleted
                                        ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20"
                                        : isActive
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                            : "bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-[#2A2A32]"
                                )}>
                                    {isCompleted ? '✓ Completed' : isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{form.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Refresh */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-white bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg border border-stone-200 dark:border-[#2A2A32] transition-all"
                            title="Refresh live status"
                        >
                            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                        </button>

                        {/* Preview */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-white bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg border border-stone-200 dark:border-[#2A2A32] transition-all">
                                    <Eye className="h-4 w-4" /> Preview
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[950px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-[#18181F] border-stone-200 dark:border-[#2A2A32]">
                                <LiveDocumentPreview
                                    template={template}
                                    responsesList={responsesList}
                                    signingRecipients={signingRecipients}
                                    allSigned={allSigned || isCompleted}
                                    onDownload={handleDownload}
                                    downloading={downloading}
                                    formName={form.name}
                                />
                            </DialogContent>
                        </Dialog>

                        {/* Download */}
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-white bg-stone-50 dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-lg border border-stone-200 dark:border-[#2A2A32] transition-all disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Download
                        </button>

                        {/* Toggle Active */}
                        <button
                            onClick={handleToggleStatus}
                            disabled={toggling}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all",
                                isActive
                                    ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border-red-200 dark:border-red-500/20"
                                    : "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 border-green-200 dark:border-green-500/20"
                            )}
                        >
                            {isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            {isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Delete */}
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg border border-red-200 dark:border-red-500/20 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ═══ Share Link Banner ═══ */}
                <div className="bg-white dark:bg-[#18181F] rounded-xl border border-stone-200 dark:border-[#2A2A32] p-5 mb-8 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
                                <LinkIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">Public Form Link</p>
                                <p className="text-sm font-mono text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-[#2A2A32]">{shareUrl}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1C1E] dark:bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-green-500 transition-colors shadow-md">
                                <Copy className="h-4 w-4" /> Copy Link
                            </button>
                            <button onClick={() => window.open(`/forms/${form.url}`, '_blank')} className="flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-200 dark:hover:bg-white/10 transition-colors border border-stone-200 dark:border-[#2A2A32]">
                                <ExternalLink className="h-4 w-4" /> Open
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══ KPI Stats ═══ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Responses" value={form.responses_count} icon={Users} color="bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400" />
                    <StatCard label="Completed" value={completed} icon={CheckCircle2} color="bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" />
                    <StatCard label="Pending" value={pending} icon={Clock} color="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" />
                    <StatCard label="Capacity" value={form.max_responses ? `${form.responses_count}/${form.max_responses}` : '∞'} icon={BarChart2} color="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" />
                </div>

                {/* ═══ Details Grid ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                    {/* ─── Left Column: Form Info + Signing Progress ─── */}
                    <div className="space-y-6">
                        {/* Form Info */}
                        <div className="bg-white dark:bg-[#18181F] rounded-xl border border-stone-200 dark:border-[#2A2A32] p-6 shadow-sm">
                            <h3 className="font-semibold text-stone-800 dark:text-white text-lg mb-4">Form Details</h3>
                            <div className="space-y-4">
                                {[
                                    { icon: FileText, label: 'Template', value: template?.name || 'Unknown' },
                                    { icon: Calendar, label: 'Created', value: new Date(form.created_at).toLocaleDateString() },
                                    { icon: Clock, label: 'Expires', value: form.expiry_date ? new Date(form.expiry_date).toLocaleDateString() : 'No expiry' },
                                    { icon: Users, label: 'Response Limit', value: form.max_responses ? `${form.max_responses} max` : 'Unlimited' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-start gap-3">
                                        <item.icon className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-0.5">{item.label}</p>
                                            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {form.max_responses && (
                                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-[#2A2A32]">
                                    <div className="flex justify-between text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">
                                        <span>Capacity Used</span>
                                        <span>{Math.round((form.responses_count / form.max_responses) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (form.responses_count / form.max_responses) * 100)}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ─── Signing Progress ─── */}
                        {signingRecipients.length > 0 && (
                            <div className="bg-white dark:bg-[#18181F] rounded-xl border border-stone-200 dark:border-[#2A2A32] p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-stone-800 dark:text-white text-lg">Signing Progress</h3>
                                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                                        {signingRecipients.filter(r => responsesList.some(resp => resp.status === 'completed' && resp.signer_email.toLowerCase() === r.email.toLowerCase())).length}/{signingRecipients.length}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="h-2.5 w-full bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden mb-5">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700"
                                        style={{
                                            width: `${(signingRecipients.filter(r =>
                                                responsesList.some(resp => resp.status === 'completed' && resp.signer_email.toLowerCase() === r.email.toLowerCase())
                                            ).length / signingRecipients.length) * 100}%`
                                        }}
                                    />
                                </div>

                                {/* Recipient list */}
                                <div className="space-y-3">
                                    {signingRecipients.map((r, idx) => {
                                        const color = RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
                                        const matchedResponse = responsesList.find(resp =>
                                            resp.status === 'completed' && resp.signer_email.toLowerCase() === r.email.toLowerCase()
                                        );
                                        const hasSigned = !!matchedResponse;

                                        return (
                                            <div
                                                key={r.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                                    hasSigned
                                                        ? "bg-green-50/50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20"
                                                        : "bg-stone-50/50 dark:bg-white/[0.02] border-stone-200 dark:border-[#2A2A32]"
                                                )}
                                            >
                                                <div
                                                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {(r.name || r.email).charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-stone-800 dark:text-white truncate">{r.name || r.email}</p>
                                                    <p className="text-xs text-stone-400 truncate">{r.email}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {hasSigned ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">
                                                                <CheckCircle2 className="h-3.5 w-3.5" /> Signed
                                                            </span>
                                                            {matchedResponse.signed_at && (
                                                                <span className="text-[10px] text-stone-400 mt-0.5">
                                                                    {new Date(matchedResponse.signed_at).toLocaleDateString()} {new Date(matchedResponse.signed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                                            <Clock className="h-3.5 w-3.5" /> Waiting
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Right Column: Responses Table ─── */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#18181F] rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-stone-100 dark:border-[#2A2A32]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-stone-800 dark:text-white text-lg">Responses</h3>
                                <span className="text-xs font-bold text-stone-400 bg-stone-50 dark:bg-white/5 px-3 py-1 rounded-full border border-stone-200 dark:border-[#2A2A32]">
                                    {filteredResponses.length} of {responsesList.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {(['all', 'completed', 'pending', 'expired'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveResponseTab(tab)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all",
                                            activeResponseTab === tab
                                                ? "bg-stone-800 dark:bg-white text-white dark:text-[#0E0E13] shadow"
                                                : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5"
                                        )}
                                    >
                                        {tab} {tab !== 'all' && `(${tab === 'completed' ? completed : tab === 'pending' ? pending : expired})`}
                                    </button>
                                ))}
                            </div>
                            <div className="relative mt-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-[#2A2A32] rounded-lg text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-stone-100 dark:divide-[#2A2A32] max-h-[500px] overflow-y-auto">
                            {filteredResponses.length === 0 ? (
                                <div className="p-12 text-center text-stone-400">
                                    <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-medium">No responses found</p>
                                    <p className="text-xs text-stone-400 mt-1">Responses will appear here as signers complete the form</p>
                                </div>
                            ) : (
                                filteredResponses.map(response => (
                                    <div key={response.id} className="flex items-center justify-between px-5 py-4 hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-stone-600 to-stone-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {response.signer_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-stone-800 dark:text-white">{response.signer_name}</p>
                                                <p className="text-xs text-stone-400 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />{response.signer_email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="text-xs text-stone-400 font-medium hidden md:block">
                                                {response.signed_at ? new Date(response.signed_at).toLocaleString() : response.created_at ? new Date(response.created_at).toLocaleString() : '—'}
                                            </p>
                                            <StatusBadge status={response.status} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ═══════════════════════════════════════════════════════════════════════════════
// Live Document Preview (Dialog Content)
// ═══════════════════════════════════════════════════════════════════════════════
const LiveDocumentPreview = ({
    template,
    responsesList,
    signingRecipients,
    allSigned,
    onDownload,
    downloading,
    formName,
}: {
    template: TemplateData | null;
    responsesList: SignFormResponseEntry[];
    signingRecipients: FieldsConfigRecipient[];
    allSigned: boolean;
    onDownload: () => void;
    downloading: boolean;
    formName: string;
}) => {
    const documentRef = useRef<HTMLDivElement>(null);

    // No template loaded at all
    if (!template) {
        return (
            <div className="p-12 text-center">
                <AlertCircle className="h-10 w-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Template data could not be loaded.</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">The template may have been deleted or is unavailable.</p>
            </div>
        );
    }

    const hasFieldsConfig = !!template.fields_config;
    const signedCount = signingRecipients.filter(r =>
        responsesList.some(resp => resp.status === 'completed' && resp.signer_email.toLowerCase() === r.email.toLowerCase())
    ).length;

    return (
        <div className="flex flex-col">
            {/* ─── Header ─── */}
            <div className="p-6 border-b border-stone-200 dark:border-[#2A2A32]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2.5 rounded-lg",
                            allSigned ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        )}>
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-stone-800 dark:text-white text-lg">Live Document Preview</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                {signingRecipients.length === 0
                                    ? 'No signing recipients configured'
                                    : allSigned
                                        ? 'All signatures completed ✓'
                                        : `${signedCount} of ${signingRecipients.length} signers completed`
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onDownload}
                        disabled={downloading}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50",
                            allSigned
                                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                                : "bg-stone-800 dark:bg-white hover:bg-black dark:hover:bg-stone-200 text-white dark:text-[#0E0E13] shadow-md"
                        )}
                    >
                        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {allSigned ? 'Download Signed PDF' : 'Download PDF'}
                    </button>
                </div>

                {/* ─── All-Done Banner inside Preview ─── */}
                {allSigned && (
                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-3 mb-4">
                        <div className="flex items-center gap-2">
                            <PartyPopper className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">All signatures are in! Download your completed document.</span>
                        </div>
                    </div>
                )}

                {/* ─── Recipient Status Chips ─── */}
                {signingRecipients.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {signingRecipients.map((r, idx) => {
                            const color = RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
                            const matchedResp = responsesList.find(resp =>
                                resp.status === 'completed' && resp.signer_email.toLowerCase() === r.email.toLowerCase()
                            );
                            const signed = !!matchedResp;
                            return (
                                <div
                                    key={r.id}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                                        signed
                                            ? "bg-green-50/80 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                                            : "bg-white dark:bg-[#18181F] border-stone-200 dark:border-[#2A2A32]"
                                    )}
                                >
                                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    <span className="text-stone-700 dark:text-stone-300">{r.name || r.email}</span>
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500">({r.role})</span>
                                    {signed
                                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                                        : <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    }
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Document Canvas ─── */}
            <div className="bg-[#E8E8E6] dark:bg-[#111114] p-6 overflow-auto">
                {!hasFieldsConfig && !template.content ? (
                    <div className="text-center py-16">
                        <FileText className="h-12 w-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
                        <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">No document content available.</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">The template has no content or signing fields configured.</p>
                    </div>
                ) : (
                    <div
                        ref={documentRef}
                        className="relative mx-auto bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] rounded-sm"
                        style={{ width: 816, minHeight: 1056 }}
                    >
                        {/* Template content (HTML from TipTap editor) */}
                        {template.content && (
                            <div
                                className="prose prose-stone max-w-none px-16 py-12 pointer-events-none select-none"
                                style={{ fontFamily: 'Inter, sans-serif', fontSize: '11pt', lineHeight: '1.75' }}
                                dangerouslySetInnerHTML={{ __html: template.content }}
                            />
                        )}

                        {/* Field overlays */}
                        {hasFieldsConfig && template.fields_config!.fields.map(field => {
                            const recipientIdx = template.fields_config!.recipients.findIndex(r => r.id === field.recipientId);
                            const recipient = template.fields_config!.recipients[recipientIdx];
                            const color = RECIPIENT_COLORS[recipientIdx % RECIPIENT_COLORS.length];

                            const response = responsesList.find(resp => {
                                if (resp.status !== 'completed') return false;
                                if (resp.recipient_id && resp.recipient_id === field.recipientId) return true;
                                if (recipient && resp.signer_email.toLowerCase() === recipient.email.toLowerCase()) return true;
                                return false;
                            });

                            const value = response?.field_values?.[field.id];
                            const isSigned = value !== undefined && value !== null && value !== '';
                            const isSignatureType = field.type === 'signature' || field.type === 'initials';
                            const isCheckbox = field.type === 'checkbox';

                            return (
                                <div
                                    key={field.id}
                                    className="absolute rounded transition-all"
                                    style={{
                                        left: field.x,
                                        top: field.y,
                                        width: field.width,
                                        height: field.height,
                                        borderWidth: 2,
                                        borderStyle: isSigned ? 'solid' : 'dashed',
                                        borderColor: isSigned ? color : `${color}60`,
                                        backgroundColor: isSigned ? `${color}08` : `${color}05`,
                                    }}
                                >
                                    {isSigned ? (
                                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                            {isSignatureType && typeof value === 'string' && value.startsWith('data:') ? (
                                                <img src={value} alt="Signature" className="max-w-full max-h-full object-contain" />
                                            ) : isSignatureType ? (
                                                <span className="text-stone-800 italic" style={{ fontFamily: "'Great Vibes', cursive", fontSize: '18px' }}>{String(value)}</span>
                                            ) : isCheckbox ? (
                                                <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center", value ? "bg-green-600 border-green-600" : "border-stone-300")}>
                                                    {value && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-stone-800 px-2 truncate">{String(value)}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-[9px] font-medium opacity-50" style={{ color }}>
                                                <PenTool className="inline h-2.5 w-2.5 mr-0.5 -mt-px" />{field.label}
                                            </span>
                                        </div>
                                    )}

                                    {/* Recipient tag */}
                                    <div
                                        className="absolute -top-5 left-0 text-[8px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                                        style={{
                                            backgroundColor: isSigned ? color : `${color}80`,
                                            color: '#fff',
                                        }}
                                    >
                                        {recipient?.name || field.label}{isSigned && ' ✓'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Footer with Security Badge ─── */}
            <div className="p-4 border-t border-stone-200 dark:border-[#2A2A32] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Document is secured and tamper-proof · Auto-refreshes every 30s</span>
                </div>
                {allSigned && (
                    <button
                        onClick={onDownload}
                        disabled={downloading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                        Download Now
                    </button>
                )}
            </div>
        </div>
    );
};


export default SignFormDetail;
