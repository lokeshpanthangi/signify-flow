
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function CreateTemplate() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'upload' | 'editor'>('upload');
    const [isProcessing, setIsProcessing] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [content, setContent] = useState('');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
            toast.error('Please upload a PDF or Word document');
            return;
        }

        setIsProcessing(true);
        // Simulate processing
        setTimeout(() => {
            setIsProcessing(false);
            setTemplateName(file.name.replace(/\.[^/.]+$/, ""));
            setContent(`[MOCK EXTRACTED CONTENT FROM ${file.name}]\n\nThis Agreement is made on [Date] between [Party A] and [Party B].\n\n1. Confidentiality\nThe parties agree to maintain the confidentiality of all information shared...\n\n2. Term\nThis agreement shall remain in effect for a period of...`);
            setStep('editor');
            toast.success('Document processed successfully');
        }, 1500);
    };

    const handleSave = () => {
        if (!templateName) {
            toast.error('Please enter a template name');
            return;
        }
        // Mock save
        toast.success('Template saved successfully!');
        setTimeout(() => navigate('/dashboard?tab=templates'), 1000);
    };

    return (
        <div className="min-h-screen bg-[#F9F9F7] p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-stone-500 hover:text-stone-800 transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </button>

                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-stone-800">Create Template</h1>
                        <p className="text-stone-500 mt-1">Upload a document or start from scratch.</p>
                    </div>
                    {step === 'editor' && (
                        <Button onClick={handleSave} className="bg-stone-900 hover:bg-stone-800 text-white">
                            <Save className="h-4 w-4 mr-2" />
                            Save Template
                        </Button>
                    )}
                </header>

                <AnimatePresence mode="wait">
                    {step === 'upload' ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-xl border-2 border-dashed border-stone-300 p-12 flex flex-col items-center justify-center text-center min-h-[400px] hover:border-green-400 hover:bg-green-50/5 transition-all"
                        >
                            {isProcessing ? (
                                <div className="flex flex-col items-center animate-pulse">
                                    <Loader2 className="h-10 w-10 text-green-600 animate-spin mb-4" />
                                    <p className="text-lg font-medium text-stone-600">Extracting text from document...</p>
                                    <p className="text-sm text-stone-400 mt-1">This might take a few seconds</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                                        <Upload className="h-8 w-8 text-stone-400" />
                                    </div>
                                    <h2 className="text-xl font-medium text-stone-800 mb-2">Upload Document</h2>
                                    <p className="text-stone-500 mb-8 max-w-md">
                                        Drag and drop your PDF or Word document here, or click to browse.
                                        We'll extract the text for you to edit.
                                    </p>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={handleFileUpload}
                                            accept=".pdf,.doc,.docx"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Button variant="outline" className="pointer-events-none">
                                            Choose File
                                        </Button>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-stone-100 w-full max-w-xs">
                                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-4">Or start blank</p>
                                        <Button variant="ghost" className="w-full" onClick={() => { setContent(''); setStep('editor'); }}>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Create Blank Template
                                        </Button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
                        >
                            <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Template Name</label>
                                <Input
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g. Standard NDA"
                                    className="text-lg font-medium bg-transparent border-stone-200 focus:bg-white transition-colors"
                                />
                            </div>
                            <div className="p-6">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Template Content</label>
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-[500px] font-mono text-sm leading-relaxed p-6 resize-y bg-stone-50/30 focus:bg-white"
                                    placeholder="Start typing your template content..."
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
