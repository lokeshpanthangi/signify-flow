
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { DocumentTemplateCard } from './DocumentTemplateCard';
import { listTemplates, deleteTemplate, type TemplateData } from '@/lib/api/templates';
import { toast } from 'sonner';

export const TemplatesView = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<TemplateData[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listTemplates();
            setTemplates(data.templates);
            setTotal(data.total);
        } catch (err: any) {
            setError(err.message || 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const handleDelete = async (id: string) => {
        try {
            await deleteTemplate(id);
            toast.success('Template deleted');
            setTemplates(prev => prev.filter(t => t.id !== id));
            setTotal(prev => prev - 1);
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete template');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-stone-800 dark:text-white font-serif">Templates</h2>
                    <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
                        {loading ? 'Loading…' : `${total} template${total !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/create-template')}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-green-600 text-white rounded-lg hover:bg-stone-800 dark:hover:bg-green-500 transition-colors shadow-lg shadow-stone-900/20 dark:shadow-green-600/20 active:scale-95 duration-200"
                >
                    <Plus className="h-4 w-4" />
                    <span>New Template</span>
                </button>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                    <p className="text-sm text-stone-500 dark:text-stone-400">Loading templates…</p>
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">{error}</p>
                    <button onClick={fetchTemplates}
                        className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
                        <RefreshCw className="h-4 w-4" /> Retry
                    </button>
                </div>
            )}

            {/* Templates grid */}
            {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {templates.map((template) => (
                        <DocumentTemplateCard
                            key={template.id}
                            template={template}
                            onDelete={() => handleDelete(template.id)}
                        />
                    ))}

                    {/* Create New Card */}
                    <button
                        onClick={() => navigate('/create-template')}
                        className="group flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-[#2A2A32] rounded-xl hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50/10 dark:hover:bg-green-900/10 transition-all duration-300 bg-transparent h-[280px]"
                    >
                        <div className="h-12 w-12 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/20 group-hover:text-green-600 transition-colors">
                            <Plus className="h-6 w-6 text-stone-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                        </div>
                        <span className="font-medium text-stone-600 dark:text-stone-400 group-hover:text-green-700 dark:group-hover:text-green-400">Create New</span>
                    </button>
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && templates.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-stone-500 dark:text-stone-400 text-sm">No templates yet. Create your first one!</p>
                </div>
            )}
        </div>
    );
};
