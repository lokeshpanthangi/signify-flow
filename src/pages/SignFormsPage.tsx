import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link as LinkIcon, Loader2, Plus } from 'lucide-react';
import { listSignForms, SignFormData } from '@/lib/api/signforms';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const SignFormCard = ({ form, onClick }: { form: SignFormData; onClick: () => void }) => (
    <div
        className="bg-white dark:bg-[#18181F] p-6 rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm hover:shadow-md transition-all group cursor-pointer"
        onClick={onClick}
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-stone-50 dark:bg-white/5 rounded-xl group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                <LinkIcon className="h-6 w-6 text-stone-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
            </div>
            <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold",
                form.status === 'completed' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                form.status === 'active' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-stone-400"
            )}>
                {form.status}
            </span>
        </div>
        <h3 className="font-semibold text-stone-800 dark:text-white text-lg mb-1">{form.name}</h3>
        <p className="text-xs text-stone-400 font-medium mb-1 line-clamp-1">{form.description || 'No description'}</p>
        <p className="text-[10px] text-stone-300 dark:text-stone-500 font-medium mb-5">Created {new Date(form.created_at).toLocaleDateString()}</p>

        {form.max_responses && (
            <div className="mb-4">
                <div className="h-1.5 w-full bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min((form.responses_count / form.max_responses) * 100, 100)}%` }}
                    />
                </div>
                <p className="text-[10px] text-stone-400 mt-1 text-right">{form.responses_count} / {form.max_responses}</p>
            </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-[#2A2A32]">
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-stone-800 dark:text-white">{form.responses_count}</span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium uppercase tracking-wide">Responses</span>
            </div>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View Details →
            </span>
        </div>
    </div>
);

const SignFormsPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [signForms, setSignForms] = useState<SignFormData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await listSignForms();
                setSignForms(res.sign_forms);
            } catch (err: unknown) {
                toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Failed to load sign forms.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <DashboardLayout showSearch={false}>
            <section>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold text-stone-800 dark:text-white mb-2">SignForms</h2>
                        <p className="text-stone-500 dark:text-stone-400 text-sm">Create public links for anyone to sign your documents.</p>
                    </div>
                    <button
                        onClick={() => navigate('/signforms/create')}
                        className="bg-[#1A1C1E] dark:bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-green-500 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                    >
                        <Plus className="h-4 w-4" />
                        Create SignForm
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-stone-400 mb-3" />
                        <p className="text-sm text-stone-500 dark:text-stone-400">Loading sign forms…</p>
                    </div>
                ) : signForms.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-stone-100 dark:bg-white/10 p-4 rounded-full inline-block mb-4">
                            <LinkIcon className="h-8 w-8 text-stone-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-stone-700 dark:text-white mb-2">No SignForms Yet</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                            Create your first SignForm to generate a public signing link.
                        </p>
                        <button
                            onClick={() => navigate('/signforms/create')}
                            className="bg-[#1A1C1E] dark:bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-green-500 transition-colors inline-flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create SignForm
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {signForms.map((form) => (
                            <SignFormCard key={form.id} form={form} onClick={() => navigate(`/signforms/${form.id}`)} />
                        ))}
                    </div>
                )}
            </section>
        </DashboardLayout>
    );
};

export default SignFormsPage;
