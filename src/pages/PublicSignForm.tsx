import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mockSignForms, mockTemplates, SignForm } from '@/data/mockData';
import { User, Mail, ArrowRight, FileText, CheckCircle2, AlertCircle, Shield, Lock } from 'lucide-react';
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
    const [step, setStep] = useState<'details' | 'preview'>('details');

    useEffect(() => {
        const foundForm = mockSignForms.find(f => f.id === id);
        setTimeout(() => {
            setForm(foundForm || null);
            setLoading(false);
        }, 500);
    }, [id]);

    const template = useMemo(() => {
        if (!form) return null;
        return mockTemplates.find(t => t.id === form.templateId) || null;
    }, [form]);

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

    if (form.status === 'inactive') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
                <div className="text-center p-8">
                    <div className="bg-amber-50 p-4 rounded-full inline-block mb-4">
                        <Lock className="h-8 w-8 text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">Form Closed</h1>
                    <p className="text-stone-500">This form is no longer accepting responses.</p>
                </div>
            </div>
        );
    }

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('preview');
    };

    const handleSign = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            const newDocId = `doc_${Date.now()}`;
            navigate(`/sign/${newDocId}?fromForm=${id}&signerName=${encodeURIComponent(formData.name)}`);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#F9F9F7] font-sans flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-stone-200 mb-4">
                        <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">{form.name}</h1>
                    <p className="text-stone-500 text-sm">{form.description}</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                            step === 'details' ? "bg-[#1A1C1E] text-white" : "bg-green-600 text-white"
                        )}>
                            {step === 'preview' ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                        </div>
                        <span className="text-xs font-medium text-stone-600">Your Info</span>
                    </div>
                    <div className={cn("w-12 h-[2px] rounded-full", step === 'preview' ? 'bg-green-600' : 'bg-stone-200')} />
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                            step === 'preview' ? "bg-[#1A1C1E] text-white" : "bg-stone-200 text-stone-500"
                        )}>
                            2
                        </div>
                        <span className="text-xs font-medium text-stone-500">Review & Sign</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: Enter Details */}
                    {step === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 p-8"
                        >
                            <form onSubmit={handleDetailsSubmit} className="space-y-6">
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
                                    className="w-full bg-[#1A1C1E] text-white font-medium py-3.5 px-6 rounded-xl hover:bg-black hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2 mt-4"
                                >
                                    Continue <ArrowRight className="h-5 w-5" />
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* STEP 2: Document Preview & Sign */}
                    {step === 'preview' && (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {/* Signer Info Summary */}
                            <div className="bg-green-50 rounded-xl border border-green-200 p-4 mb-4 flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-green-800">{formData.name}</p>
                                    <p className="text-xs text-green-600">{formData.email}</p>
                                </div>
                                <button
                                    onClick={() => setStep('details')}
                                    className="ml-auto text-xs font-medium text-green-700 hover:text-green-900 underline"
                                >
                                    Edit
                                </button>
                            </div>

                            {/* Document Preview */}
                            <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-200 overflow-hidden">
                                <div className="p-5 border-b border-stone-100 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-stone-400" />
                                    <h3 className="text-sm font-semibold text-stone-700">{template?.name || 'Document'}</h3>
                                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-stone-300">Preview</span>
                                </div>

                                <div className="p-6 max-h-[350px] overflow-y-auto bg-stone-50/50">
                                    {template?.content.split('\n').map((line, i) => (
                                        <p key={i} className={cn(
                                            "text-xs leading-relaxed font-serif",
                                            line.startsWith('[') ? "text-blue-600 font-semibold" :
                                                line.match(/^[A-Z]/) && line.length < 60 ? "text-stone-800 font-bold text-sm mt-4 mb-1" :
                                                    line.match(/^\d\./) ? "text-stone-700 font-semibold mt-3" :
                                                        line === '' ? "h-3" : "text-stone-500"
                                        )}>
                                            {line || '\u00A0'}
                                        </p>
                                    ))}
                                </div>

                                <div className="p-5 border-t border-stone-100 bg-white">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Shield className="h-4 w-4 text-green-600" />
                                        <p className="text-xs text-stone-500">
                                            By signing, you agree to the terms outlined in this document.
                                            Your signature will be legally binding.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleSign}
                                        disabled={isSubmitting}
                                        className="w-full bg-green-600 text-white font-medium py-3.5 px-6 rounded-xl hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                        ) : (
                                            <>
                                                Sign Document <ArrowRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-8 text-center">
                    <p className="text-xs text-stone-400 font-medium overflow-hidden flex items-center justify-center gap-1">
                        <Lock className="h-3 w-3" />
                        Powered by <span className="font-bold text-stone-500">SignFlow</span> • Secure & Legally Binding
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default PublicSignForm;
