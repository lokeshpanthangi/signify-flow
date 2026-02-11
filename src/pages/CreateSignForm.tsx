import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mockTemplates, Template } from '@/data/mockData';
import {
    ArrowLeft, ArrowRight, FileText, Link as LinkIcon,
    Check, Calendar, Hash, AlertCircle, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Step = 'template' | 'configure' | 'review';

const CreateSignForm = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<Step>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [formConfig, setFormConfig] = useState({
        name: '',
        description: '',
        maxResponses: '',
        expiryDate: '',
    });

    const steps: { key: Step; label: string; number: number }[] = [
        { key: 'template', label: 'Select Template', number: 1 },
        { key: 'configure', label: 'Configure', number: 2 },
        { key: 'review', label: 'Review & Create', number: 3 },
    ];

    const canProceedFromTemplate = selectedTemplate !== null;
    const canProceedFromConfigure = formConfig.name.trim().length > 0;

    const handleNext = () => {
        if (currentStep === 'template' && canProceedFromTemplate) setCurrentStep('configure');
        else if (currentStep === 'configure' && canProceedFromConfigure) setCurrentStep('review');
    };

    const handleBack = () => {
        if (currentStep === 'configure') setCurrentStep('template');
        else if (currentStep === 'review') setCurrentStep('configure');
    };

    const handleCreate = () => {
        // In a real app, this would call an API
        toast({
            title: '🎉 SignForm Created!',
            description: `"${formConfig.name}" is now live and accepting responses.`,
        });
        setTimeout(() => navigate('/dashboard'), 1200);
    };

    return (
        <div className="min-h-screen bg-[#F9F9F7] font-sans">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-bold text-stone-800">Create SignForm</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Stepper */}
                <div className="flex items-center justify-center mb-12">
                    {steps.map((step, i) => (
                        <div key={step.key} className="flex items-center">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                    currentStep === step.key
                                        ? "bg-[#1A1C1E] text-white shadow-lg"
                                        : steps.findIndex(s => s.key === currentStep) > i
                                            ? "bg-green-600 text-white"
                                            : "bg-stone-200 text-stone-500"
                                )}>
                                    {steps.findIndex(s => s.key === currentStep) > i ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        step.number
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm font-medium hidden sm:block",
                                    currentStep === step.key ? "text-stone-800" : "text-stone-400"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={cn(
                                    "w-16 h-[2px] mx-3 rounded-full transition-colors",
                                    steps.findIndex(s => s.key === currentStep) > i ? "bg-green-600" : "bg-stone-200"
                                )} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    {/* STEP 1: Select Template */}
                    {currentStep === 'template' && (
                        <motion.div
                            key="template"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-stone-800 mb-2">Choose a Template</h2>
                                <p className="text-stone-500 text-sm">Select the document template that signers will fill out and sign.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {mockTemplates.map(template => (
                                    <motion.button
                                        key={template.id}
                                        whileHover={{ y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setFormConfig(prev => ({
                                                ...prev,
                                                name: prev.name || `${template.name} Form`,
                                            }));
                                        }}
                                        className={cn(
                                            "text-left p-5 rounded-xl border-2 transition-all",
                                            selectedTemplate?.id === template.id
                                                ? "border-green-500 bg-green-50/50 shadow-md ring-2 ring-green-500/20"
                                                : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                selectedTemplate?.id === template.id ? "bg-green-100" : "bg-stone-100"
                                            )}>
                                                <FileText className={cn(
                                                    "h-5 w-5",
                                                    selectedTemplate?.id === template.id ? "text-green-600" : "text-stone-400"
                                                )} />
                                            </div>
                                            {selectedTemplate?.id === template.id && (
                                                <div className="bg-green-600 text-white p-1 rounded-full">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-stone-800 text-sm mb-1">{template.name}</h3>
                                        <p className="text-xs text-stone-400 font-medium">{template.category} • {template.dateCreated}</p>

                                        {/* Document Preview */}
                                        <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
                                            <p className="text-[9px] text-stone-400 leading-relaxed line-clamp-4 font-mono">
                                                {template.content.substring(0, 180)}...
                                            </p>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Configure */}
                    {currentStep === 'configure' && (
                        <motion.div
                            key="configure"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-stone-800 mb-2">Configure Your Form</h2>
                                <p className="text-stone-500 text-sm">Set up basic information and optional limits for this sign form.</p>
                            </div>

                            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
                                <div className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 ml-1">
                                            Form Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formConfig.name}
                                            onChange={e => setFormConfig(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                            placeholder="e.g. Employee Onboarding NDA"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 ml-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formConfig.description}
                                            onChange={e => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium resize-none"
                                            placeholder="Briefly describe what this form is for..."
                                        />
                                    </div>

                                    {/* Max Responses & Expiry */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 ml-1">
                                                <Hash className="h-3 w-3 inline mr-1" />
                                                Max Responses
                                            </label>
                                            <input
                                                type="number"
                                                value={formConfig.maxResponses}
                                                onChange={e => setFormConfig(prev => ({ ...prev, maxResponses: e.target.value }))}
                                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                                placeholder="Unlimited"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 ml-1">
                                                <Calendar className="h-3 w-3 inline mr-1" />
                                                Expiry Date
                                            </label>
                                            <input
                                                type="date"
                                                value={formConfig.expiryDate}
                                                onChange={e => setFormConfig(prev => ({ ...prev, expiryDate: e.target.value }))}
                                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Review */}
                    {currentStep === 'review' && (
                        <motion.div
                            key="review"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-stone-800 mb-2">Review & Create</h2>
                                <p className="text-stone-500 text-sm">Double-check your form settings before publishing.</p>
                            </div>

                            <div className="max-w-xl mx-auto bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-stone-100">
                                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                                        <Sparkles className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-800 text-lg">{formConfig.name}</h3>
                                        <p className="text-sm text-stone-500">{formConfig.description || 'No description provided.'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-stone-500 font-medium">Template</span>
                                        <span className="text-sm font-semibold text-stone-800">{selectedTemplate?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-stone-500 font-medium">Category</span>
                                        <span className="text-sm font-semibold text-stone-800">{selectedTemplate?.category}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-stone-500 font-medium">Max Responses</span>
                                        <span className="text-sm font-semibold text-stone-800">
                                            {formConfig.maxResponses || 'Unlimited'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-stone-500 font-medium">Expiry Date</span>
                                        <span className="text-sm font-semibold text-stone-800">
                                            {formConfig.expiryDate || 'Never'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-stone-100">
                                    <p className="text-xs text-stone-400 text-center mb-4">
                                        Once created, a public link will be generated that anyone can use to sign this document.
                                    </p>
                                    <button
                                        onClick={handleCreate}
                                        className="w-full bg-[#1A1C1E] text-white font-medium py-3.5 px-6 rounded-xl hover:bg-black hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <LinkIcon className="h-5 w-5" />
                                        Create SignForm & Go Live
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-10 max-w-xl mx-auto">
                    <button
                        onClick={currentStep === 'template' ? () => navigate('/dashboard') : handleBack}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-800 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>

                    {currentStep !== 'review' && (
                        <button
                            onClick={handleNext}
                            disabled={
                                (currentStep === 'template' && !canProceedFromTemplate) ||
                                (currentStep === 'configure' && !canProceedFromConfigure)
                            }
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1A1C1E] rounded-lg hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            Next <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateSignForm;
