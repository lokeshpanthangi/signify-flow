import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTemplates, TemplateData } from '@/lib/api/templates';
import { createSignForm } from '@/lib/api/signforms';
import {
    ArrowLeft, ArrowRight, FileText, Link as LinkIcon,
    Check, Calendar, Hash, AlertCircle, Sparkles, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Step = 'template' | 'configure' | 'review';

const CreateSignForm = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<Step>('template');
    const [templates, setTemplates] = useState<TemplateData[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
    const [creating, setCreating] = useState(false);
    const [formConfig, setFormConfig] = useState({
        name: '',
        description: '',
        maxResponses: '',
        expiryDate: '',
    });

    // Fetch real templates on mount
    useEffect(() => {
        (async () => {
            try {
                setLoadingTemplates(true);
                const res = await listTemplates({ limit: 100 });
                setTemplates(res.templates);
            } catch (err: unknown) {
                toast({
                    title: 'Error loading templates',
                    description: err instanceof Error ? err.message : 'Could not fetch templates.',
                    variant: 'destructive',
                });
            } finally {
                setLoadingTemplates(false);
            }
        })();
    }, []);

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

    const handleCreate = async () => {
        if (!selectedTemplate || creating) return;

        setCreating(true);
        try {
            await createSignForm({
                template_id: selectedTemplate.id,
                name: formConfig.name.trim(),
                description: formConfig.description.trim() || undefined,
                max_responses: formConfig.maxResponses ? parseInt(formConfig.maxResponses, 10) : undefined,
                expiry_date: formConfig.expiryDate || undefined,
            });

            toast({
                title: '🎉 SignForm Created!',
                description: `"${formConfig.name}" is now live and accepting responses.`,
            });
            setTimeout(() => navigate('/signforms'), 800);
        } catch (err: unknown) {
            toast({
                title: 'Failed to create SignForm',
                description: err instanceof Error ? err.message : 'Unknown error.',
                variant: 'destructive',
            });
        } finally {
            setCreating(false);
        }
    };

    // How many recipients does this template have?
    const recipientCount = selectedTemplate?.fields_config?.recipients?.length ?? 0;
    const fieldCount = selectedTemplate?.fields_config?.fields?.length ?? 0;

    return (
        <div className="min-h-screen bg-[#F9F9F7] font-sans">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/signforms')}
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
                                        ? "bg-[#1A1C1E] dark:bg-green-600 text-white shadow-lg"
                                        : steps.findIndex(s => s.key === currentStep) > i
                                            ? "bg-green-600 text-white"
                                            : "bg-stone-200 dark:bg-white/10 text-stone-500 dark:text-stone-400"
                                )}>
                                    {steps.findIndex(s => s.key === currentStep) > i ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        step.number
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm font-medium hidden sm:block",
                                    currentStep === step.key ? "text-stone-800 dark:text-white" : "text-stone-400"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={cn(
                                    "w-16 h-[2px] mx-3 rounded-full transition-colors",
                                    steps.findIndex(s => s.key === currentStep) > i ? "bg-green-600" : "bg-stone-200 dark:bg-white/10"
                                )} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                {/* STEP 1: Select Template */}
                {currentStep === 'template' && (
                    <div>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-stone-800 mb-2">Choose a Template</h2>
                            <p className="text-stone-500 text-sm">Select the document template that signers will fill out and sign.</p>
                        </div>

                        {loadingTemplates ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-stone-400 mb-3" />
                                <p className="text-sm text-stone-500">Loading templates…</p>
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="bg-stone-100 dark:bg-white/10 p-4 rounded-full inline-block mb-4">
                                    <FileText className="h-8 w-8 text-stone-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-stone-700 dark:text-white mb-2">No Templates Yet</h3>
                                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Create a template first to use it in a SignForm.</p>
                                <button
                                    onClick={() => navigate('/templates/create')}
                                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                                >
                                    ← Go create a template
                                </button>
                            </div>
                        ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map(template => (
                                <button
                                    key={template.id}
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
                                            ? "border-green-500 bg-green-50/50 dark:bg-green-900/20 shadow-md ring-2 ring-green-500/20"
                                            : "border-stone-200 dark:border-[#2A2A32] bg-white dark:bg-[#18181F] hover:border-stone-300 dark:hover:border-stone-500 hover:shadow-sm"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            selectedTemplate?.id === template.id ? "bg-green-100 dark:bg-green-900/30" : "bg-stone-100 dark:bg-white/10"
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
                                    <h3 className="font-semibold text-stone-800 dark:text-white text-sm mb-1">{template.name}</h3>
                                    <p className="text-xs text-stone-400 font-medium mb-1">
                                        {template.category} • {new Date(template.created_at).toLocaleDateString()}
                                    </p>

                                    {/* Template metadata */}
                                    {template.fields_config && (
                                        <div className="mt-2 flex gap-2">
                                            {(template.fields_config.recipients?.length ?? 0) > 0 && (
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                                    {template.fields_config.recipients.length} recipient{template.fields_config.recipients.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {(template.fields_config.fields?.length ?? 0) > 0 && (
                                                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                                                    {template.fields_config.fields.length} field{template.fields_config.fields.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Document Preview */}
                                    <div className="mt-3 p-3 bg-stone-50 dark:bg-[#111114] rounded-lg border border-stone-100 dark:border-[#2A2A32]">
                                        <p className="text-[9px] text-stone-400 leading-relaxed line-clamp-4 font-mono">
                                            {template.content.replace(/<[^>]*>/g, '').substring(0, 180)}...
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        )}
                    </div>
                )}

                {/* STEP 2: Configure */}
                {currentStep === 'configure' && (
                    <div>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-stone-800 mb-2">Configure Your Form</h2>
                            <p className="text-stone-500 text-sm">Set up basic information and optional limits for this sign form.</p>
                        </div>

                        <div className="max-w-xl mx-auto bg-white dark:bg-[#18181F] rounded-2xl border border-stone-200 dark:border-[#2A2A32] shadow-sm p-8">
                            <div className="space-y-6">
                                {/* Template summary */}
                                {selectedTemplate && (
                                    <div className="bg-stone-50 dark:bg-[#111114] rounded-xl p-4 border border-stone-200 dark:border-[#2A2A32]">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Selected Template</p>
                                        <p className="font-semibold text-stone-800 dark:text-white">{selectedTemplate.name}</p>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                            {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} • {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                )}

                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 ml-1">
                                        Form Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formConfig.name}
                                        onChange={e => setFormConfig(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-stone-50 dark:bg-[#111114] border border-stone-200 dark:border-[#2A2A32] rounded-xl text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                        placeholder="e.g. Employee Onboarding NDA"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 ml-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formConfig.description}
                                        onChange={e => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-stone-50 dark:bg-[#111114] border border-stone-200 dark:border-[#2A2A32] rounded-xl text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium resize-none"
                                        placeholder="Briefly describe what this form is for..."
                                    />
                                </div>

                                {/* Max Responses & Expiry */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 ml-1">
                                            <Hash className="h-3 w-3 inline mr-1" />
                                            Max Responses
                                        </label>
                                        <input
                                            type="number"
                                            value={formConfig.maxResponses}
                                            onChange={e => setFormConfig(prev => ({ ...prev, maxResponses: e.target.value }))}
                                            className="w-full px-4 py-3 bg-stone-50 dark:bg-[#111114] border border-stone-200 dark:border-[#2A2A32] rounded-xl text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                            placeholder="Unlimited"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 ml-1">
                                            <Calendar className="h-3 w-3 inline mr-1" />
                                            Expiry Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formConfig.expiryDate}
                                            onChange={e => setFormConfig(prev => ({ ...prev, expiryDate: e.target.value }))}
                                            className="w-full px-4 py-3 bg-stone-50 dark:bg-[#111114] border border-stone-200 dark:border-[#2A2A32] rounded-xl text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Review */}
                {currentStep === 'review' && (
                    <div>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-stone-800 mb-2">Review & Create</h2>
                            <p className="text-stone-500 text-sm">Double-check your form settings before publishing.</p>
                        </div>

                        <div className="max-w-xl mx-auto bg-white dark:bg-[#18181F] rounded-2xl border border-stone-200 dark:border-[#2A2A32] shadow-sm p-8">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-stone-100 dark:border-[#2A2A32]">
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                                    <Sparkles className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-stone-800 dark:text-white text-lg">{formConfig.name}</h3>
                                    <p className="text-sm text-stone-500 dark:text-stone-400">{formConfig.description || 'No description provided.'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">Template</span>
                                    <span className="text-sm font-semibold text-stone-800 dark:text-white">{selectedTemplate?.name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">Category</span>
                                    <span className="text-sm font-semibold text-stone-800 dark:text-white">{selectedTemplate?.category}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">Recipients</span>
                                    <span className="text-sm font-semibold text-stone-800 dark:text-white">{recipientCount}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">Sign Fields</span>
                                    <span className="text-sm font-semibold text-stone-800 dark:text-white">{fieldCount}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">Max Responses</span>
                                    <span className="text-sm font-semibold text-stone-800 dark:text-white">
                                        {formConfig.maxResponses || 'Unlimited'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-stone-500 dark:text-stone-400 font-medium">Expiry Date</span>
                                    <span className="text-sm font-semibold text-stone-800 dark:text-white">
                                        {formConfig.expiryDate || 'Never'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-100 dark:border-[#2A2A32]">
                                <p className="text-xs text-stone-400 text-center mb-4">
                                    Once created, a public link will be generated that recipients can use to sign this document.
                                </p>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating}
                                    className="w-full bg-[#1A1C1E] dark:bg-green-600 text-white font-medium py-3.5 px-6 rounded-xl hover:bg-black dark:hover:bg-green-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Creating…
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="h-5 w-5" />
                                            Create SignForm & Go Live
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-10 max-w-xl mx-auto">
                    <button
                        onClick={currentStep === 'template' ? () => navigate('/signforms') : handleBack}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white bg-white dark:bg-[#18181F] border border-stone-200 dark:border-[#2A2A32] rounded-lg hover:bg-stone-50 dark:hover:bg-[#1A1A1F] transition-all"
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
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1A1C1E] dark:bg-green-600 rounded-lg hover:bg-black dark:hover:bg-green-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
