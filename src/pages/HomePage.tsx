import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Send,
    PenTool,
    MoreHorizontal,
    Search,
    Loader2,
    FileText,
    ArrowRight,
} from 'lucide-react';
import { listDocuments, type DocumentData } from '@/lib/api/documents';
import { getPendingForMe, type PendingSignFormItem } from '@/lib/api/signforms';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/DashboardLayout';

// --- Components ---

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
        className="flex flex-col items-center justify-center w-64 h-48 bg-white dark:bg-[#18181F] border border-stone-200 dark:border-[#2A2A32] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 group"
    >
        <Icon className="h-10 w-10 text-stone-600 dark:text-stone-400 mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
        <span className="text-lg font-medium text-stone-800 dark:text-white">{label}</span>
    </motion.button>
);

/** Renders a miniature preview of actual document HTML content */
const DocumentPreview = ({ content }: { content?: string }) => (
    <div className="w-full h-64 bg-white dark:bg-[#1A1A1F] p-6 relative overflow-hidden shadow-inner">
        {content ? (
            <div
                className="prose prose-stone max-w-none pointer-events-none select-none opacity-70"
                style={{ fontSize: '7px', lineHeight: '1.5', transform: 'scale(1)', transformOrigin: 'top left' }}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        ) : (
            <div className="flex items-center justify-center h-full">
                <FileText className="h-12 w-12 text-stone-200" />
            </div>
        )}
    </div>
);

const DocumentCard = ({ doc, onClick }: { doc: DocumentData, onClick: () => void }) => {
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
            className="group relative flex flex-col bg-white dark:bg-[#18181F] border border-stone-200/60 dark:border-[#2A2A32] rounded-xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg"
            onClick={onClick}
        >
            <DocumentPreview content={doc.content} />

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/60 dark:bg-[#18181F]/80 backdrop-blur-md border-t border-white/20 dark:border-[#2A2A32] flex flex-col justify-center px-5 transition-all group-hover:bg-white/80 dark:group-hover:bg-[#18181F]/90">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                        <h3 className="font-semibold text-stone-800 dark:text-white text-sm truncate" title={doc.name}>{doc.name}</h3>
                        <p className="text-[10px] text-stone-600 font-medium mt-0.5">
                            {dateStr} • <span className={cn(
                                "uppercase tracking-wide font-bold",
                                STATUS_COLORS[doc.status] || 'text-stone-400'
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

/** Card for a document the user needs to sign — matches DocumentCard style */
const PendingSignCard = ({ item, onClick }: { item: PendingSignFormItem; onClick: () => void }) => {
    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';
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
            className="group relative flex flex-col bg-white dark:bg-[#18181F] border border-stone-200/60 dark:border-[#2A2A32] rounded-xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg"
            onClick={onClick}
        >
            <DocumentPreview content={item.template_content || undefined} />

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/60 dark:bg-[#18181F]/80 backdrop-blur-md border-t border-white/20 dark:border-[#2A2A32] flex flex-col justify-center px-5 transition-all group-hover:bg-white/80 dark:group-hover:bg-[#18181F]/90">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                        <h3 className="font-semibold text-stone-800 dark:text-white text-sm truncate" title={item.sign_form_name}>{item.sign_form_name}</h3>
                        <p className="text-[10px] text-stone-600 font-medium mt-0.5">
                            {dateStr} • <span className="uppercase tracking-wide font-bold text-amber-600">Needs Signature</span>
                        </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Sign <ArrowRight className="h-3 w-3" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- Home Page ---

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [pendingForms, setPendingForms] = useState<PendingSignFormItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingLoading, setPendingLoading] = useState(true);

    const fetchDocs = useCallback(async () => {
        try {
            const res = await listDocuments({ search: searchQuery || undefined, limit: 12 });
            setDocuments(res.documents);
        } catch { /* silent on home page */ }
        finally { setIsLoading(false); }
    }, [searchQuery]);

    const fetchPending = useCallback(async () => {
        try {
            const res = await getPendingForMe();
            setPendingForms(res.pending);
        } catch { /* silent */ }
        finally { setPendingLoading(false); }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const t = setTimeout(fetchDocs, 300);
        return () => clearTimeout(t);
    }, [fetchDocs]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    return (
        <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
            {/* Action Cards */}
            <div className="flex flex-wrap gap-8 mb-12 justify-start">
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

            {/* ═══ Documents To Sign ═══ */}
            {!pendingLoading && pendingForms.length > 0 && (
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <PenTool className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-stone-800 dark:text-white">Documents To Sign</h2>
                                <p className="text-xs text-stone-400">{pendingForms.length} document{pendingForms.length !== 1 ? 's' : ''} waiting for your signature</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pendingForms.map(item => (
                            <PendingSignCard
                                key={item.sign_form_id}
                                item={item}
                                onClick={() => {
                                    // Logged-in user → skip PublicSignForm, go directly to signing
                                    const name = encodeURIComponent(user?.name || '');
                                    const email = encodeURIComponent(user?.email || '');
                                    navigate(`/sign/${item.sign_form_url}?signerName=${name}&signerEmail=${email}`);
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ═══ My Documents ═══ */}
            {isLoading && (
                <div className="flex items-center justify-center py-12 text-stone-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            )}

            {!isLoading && documents.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-medium text-stone-700 dark:text-stone-200 font-sans">My Documents</h2>
                        <button
                            onClick={() => navigate('/documents')}
                            className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                            View all
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {documents.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                onClick={() => navigate(`/view-document/${doc.id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {!isLoading && documents.length === 0 && !pendingLoading && pendingForms.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 mt-20">
                    <Search className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No documents found</p>
                    <p className="text-sm">Create a document or check back when someone sends you one to sign</p>
                </div>
            )}
        </DashboardLayout>
    );
};

export default HomePage;
