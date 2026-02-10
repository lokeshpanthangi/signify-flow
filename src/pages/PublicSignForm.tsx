import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mockSignForms, SignForm } from '@/data/mockData';
import { User, Mail, ArrowRight, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const PublicSignForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState<SignForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Simulate API fetch
        const foundForm = mockSignForms.find(f => f.id === id);
        setTimeout(() => {
            setForm(foundForm || null);
            setLoading(false);
        }, 500);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-stone-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-stone-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
                <div className="text-center p-8">
                    <div className="bg-red-50 p-4 rounded-full inline-block mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">Form Not Found</h1>
                    <p className="text-stone-500">The sign form you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate processing
        setTimeout(() => {
            // Navigate to signing interface with a new ID
            // In a real app, this would be a response from the backend
            const newDocId = `doc_${Date.now()}`;
            navigate(`/sign/${newDocId}?fromForm=${id}&signerName=${encodeURIComponent(formData.name)}`);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#F9F9F7] font-sans flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-stone-200 mb-4">
                        <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">{form.name}</h1>
                    <p className="text-stone-500 text-sm">Please enter your details to begin the signing process.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 ml-1">
                                Full Name
                            </label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 group-focus-within:text-stone-600 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 group-focus-within:text-stone-600 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#1A1C1E] text-white font-medium py-3.5 px-6 rounded-xl hover:bg-black hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 mt-4"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                                <>
                                    Start Signing <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-stone-400 font-medium overflow-hidden">
                        Powered by <span className="font-bold text-stone-500">SignFlow</span> • Secure & Legally Binding
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default PublicSignForm;
