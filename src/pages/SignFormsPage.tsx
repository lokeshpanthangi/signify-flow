import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link as LinkIcon } from 'lucide-react';
import { mockSignForms, SignForm } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/DashboardLayout';

const SignFormCard = ({ form, onClick }: { form: SignForm; onClick: () => void }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.12)" }}
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
        <p className="text-xs text-stone-400 font-medium mb-1 line-clamp-1">{form.description}</p>
        <p className="text-[10px] text-stone-300 font-medium mb-5">Created {form.dateCreated}</p>

        {form.maxResponses && (
            <div className="mb-4">
                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min((form.responses / form.maxResponses) * 100, 100)}%` }}
                    />
                </div>
                <p className="text-[10px] text-stone-400 mt-1 text-right">{form.responses} / {form.maxResponses}</p>
            </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-stone-800">{form.responses}</span>
                <span className="text-xs text-stone-500 font-medium uppercase tracking-wide">Responses</span>
            </div>
            <span className="text-xs font-semibold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View Details →
            </span>
        </div>
    </motion.div>
);

const SignFormsPage = () => {
    const navigate = useNavigate();

    return (
        <DashboardLayout showSearch={false}>
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
                    {mockSignForms.map((form) => (
                        <SignFormCard key={form.id} form={form} onClick={() => navigate(`/signforms/${form.id}`)} />
                    ))}
                </div>
            </section>
        </DashboardLayout>
    );
};

export default SignFormsPage;
