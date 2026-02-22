import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MoreHorizontal, Search, Plus, FileText, Trash2, Edit3, Eye, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { listDocuments, deleteDocument, type DocumentData } from '@/lib/api/documents';

/* ── Document Preview — shows first ~200 chars as a visual thumbnail ── */
const DocumentPreview = ({ content }: { content?: string }) => (
    <div className="w-full h-52 bg-stone-50 dark:bg-[#111114] relative overflow-hidden">
        {content ? (
            <div className="w-full h-full overflow-hidden p-5 pointer-events-none select-none">
                <div
                    className="text-[7px] leading-relaxed text-stone-500 dark:text-stone-400 font-serif"
                    style={{ wordBreak: 'break-word' }}
                    dangerouslySetInnerHTML={{ __html: content.slice(0, 2000) }}
                />
            </div>
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <div className="space-y-3 w-3/4 opacity-40 select-none">
                    <div className="h-2 bg-stone-300 dark:bg-stone-600 rounded w-2/3" />
                    <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded w-full" />
                    <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded w-5/6" />
                    <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded w-full" />
                    <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded w-4/6" />
                    <div className="h-2 bg-stone-300 dark:bg-stone-600 rounded w-1/2 mt-4" />
                    <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded w-full" />
                    <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                </div>
            </div>
        )}
        {/* fade overlay at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white dark:from-[#18181F] to-transparent" />
    </div>
);

/* ── Document Card ── */
const DocumentCard = ({
    doc,
    onClick,
    onEdit,
    onDelete,
}: {
    doc: DocumentData;
    onClick: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}) => {


    const dateStr = doc.updated_at
        ? new Date(doc.updated_at).toLocaleDateString()
        : '';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -6, boxShadow: '0 16px 32px -12px rgba(0,0,0,0.15)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="group relative flex flex-col bg-white dark:bg-[#18181F] border border-stone-200/60 dark:border-[#2A2A32] rounded-xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            onClick={onClick}
        >
            <DocumentPreview content={doc.content || undefined} />

            <div className="px-4 py-3 border-t border-stone-100 dark:border-[#2A2A32]">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                        <h3 className="font-semibold text-stone-800 dark:text-white text-sm truncate">{doc.name}</h3>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                            {dateStr} •{' '}
                            <span className={cn('uppercase tracking-wide font-bold', STATUS_COLORS[doc.status] || 'text-stone-400')}>
                                {doc.status}
                            </span>
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> View
                            </DropdownMenuItem>
                            {onEdit && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                                    <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    );
};


/* ═══════════════════════════════
   DOCUMENTS PAGE
   ═══════════════════════════════ */
const DocumentsPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch documents from API
    const fetchDocuments = useCallback(async () => {
        try {
            const res = await listDocuments({ search: searchQuery || undefined });
            setDocuments(res.documents);
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Failed to load documents');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        setIsLoading(true);
        const timeout = setTimeout(fetchDocuments, 300); // debounce search
        return () => clearTimeout(timeout);
    }, [fetchDocuments]);

    const handleDelete = async (id: string) => {
        try {
            await deleteDocument(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
            toast.success('Document deleted');
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Failed to delete document');
        }
    };

    const isEmpty = documents.length === 0 && !isLoading;

    return (
        <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-xl font-semibold text-stone-900 dark:text-white">Documents</h1>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Create, view, and manage your documents</p>
                </div>
                <Button
                    onClick={() => navigate('/create-document')}
                    className="bg-green-600 hover:bg-green-500 text-white text-sm h-10 px-5 gap-2 rounded-lg font-medium"
                >
                    <Plus className="h-4 w-4" /> Create Document
                </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 mt-20">
                    <Loader2 className="h-8 w-8 animate-spin mb-3 opacity-40" />
                    <p className="text-sm">Loading documents…</p>
                </div>
            )}

            {/* Documents Grid */}
            {!isLoading && documents.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-medium text-stone-700 dark:text-stone-200">My Documents</h2>
                        <span className="text-xs text-stone-400 font-medium">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {documents.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                onClick={() => navigate(`/view-document/${doc.id}`)}
                                onEdit={() => navigate(`/edit-document/${doc.id}`)}
                                onDelete={() => handleDelete(doc.id)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {isEmpty && (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 mt-20">
                    {searchQuery ? (
                        <>
                            <Search className="h-14 w-14 mb-4 opacity-20" />
                            <p className="text-base font-medium">No documents matching "{searchQuery}"</p>
                            <p className="text-sm mt-1">Try a different search term</p>
                        </>
                    ) : (
                        <>
                            <FileText className="h-14 w-14 mb-4 opacity-20" />
                            <p className="text-base font-medium">No documents yet</p>
                            <p className="text-sm mt-1 mb-4">Create your first document to get started</p>
                            <Button
                                onClick={() => navigate('/create-document')}
                                className="bg-green-600 hover:bg-green-500 text-white text-sm h-9 px-5 gap-2 rounded-lg"
                            >
                                <Plus className="h-4 w-4" /> Create Document
                            </Button>
                        </>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
};

export default DocumentsPage;
