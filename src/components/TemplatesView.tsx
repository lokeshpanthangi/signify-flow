
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { mockTemplates } from '../data/mockData';
import { motion } from 'framer-motion';
import { DocumentTemplateCard } from './DocumentTemplateCard';

export const TemplatesView = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-stone-800 font-serif">Templates</h2>
                    <p className="text-stone-500 text-sm mt-1">Manage and create document templates.</p>
                </div>
                <button
                    onClick={() => navigate('/create-template')}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/20 active:scale-95 duration-200"
                >
                    <Plus className="h-4 w-4" />
                    <span>New Template</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {mockTemplates.map((template) => (
                    <DocumentTemplateCard key={template.id} template={template} />
                ))}

                {/* Create New Card */}
                <motion.button
                    onClick={() => navigate('/create-template')}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                    className="group flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl hover:border-green-400 hover:bg-green-50/10 transition-all duration-300 bg-transparent h-[320px]"
                >
                    <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center mb-4 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                        <Plus className="h-6 w-6 text-stone-400 group-hover:text-green-600" />
                    </div>
                    <span className="font-medium text-stone-600 group-hover:text-green-700">Create New</span>
                </motion.button>
            </div>
        </div>
    );
};
