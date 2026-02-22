import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft, FileText, Save, Loader2,
    ChevronDown, ChevronUp,
    PenTool, User, Calendar, Hash, CheckSquare,
    Mail, Building2, Briefcase,
    X, Trash2, Settings2, Plus,
    FileSignature, Stamp,
    ZoomIn, ZoomOut, Printer, Download, Maximize,
    Image as ImageIcon, Type,
    Sparkles, FilePlus2, FileUp,
    SquareCheckBig, CircleDot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { A4_WIDTH, A4_HEIGHT, RECIPIENT_COLORS } from '@/lib/constants';
import { createTemplate, updateTemplate, getTemplate } from '@/lib/api/templates';
import { listDocuments, type DocumentData } from '@/lib/api/documents';
import { extractFileContent, ACCEPT_STRING } from '@/lib/fileExtractor';


/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */
interface Recipient {
    id: string;
    name: string;
    email: string;
    role: string;
    color: string;
    action: 'sign' | 'view' | 'approve';
    notifyVia: 'email' | 'sms' | 'both';
}

interface PlacedField {
    id: string;
    type: string;
    label: string;
    recipientId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    page: number;
    placeholder?: string;
}


/* ─────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────── */
const STANDARD_FIELDS = [
    { type: 'signature', label: 'Signature', icon: PenTool, width: 200, height: 60 },
    { type: 'initials', label: 'Initial', icon: FileSignature, width: 80, height: 40 },
    { type: 'stamp', label: 'Stamp', icon: Stamp, width: 100, height: 100 },
    { type: 'image', label: 'Image', icon: ImageIcon, width: 120, height: 80 },
    { type: 'company', label: 'Company', icon: Building2, width: 180, height: 32 },
    { type: 'name', label: 'Full name', icon: User, width: 180, height: 32 },
    { type: 'email', label: 'Email', icon: Mail, width: 200, height: 32 },
    { type: 'signdate', label: 'Sign date', icon: Calendar, width: 150, height: 32 },
    { type: 'date', label: 'Date', icon: Calendar, width: 150, height: 32 },
    { type: 'text', label: 'Text', icon: Type, width: 180, height: 32 },
    { type: 'splittext', label: 'Split text', icon: Type, width: 200, height: 32 },
    { type: 'jobtitle', label: 'Job title', icon: Briefcase, width: 160, height: 32 },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, width: 24, height: 24 },
    { type: 'dropdown', label: 'Dropdown', icon: ChevronDown, width: 180, height: 32 },
    { type: 'radio', label: 'Radio', icon: CircleDot, width: 24, height: 24 },
    { type: 'checkboxgroup', label: 'Checkbox gr...', icon: SquareCheckBig, width: 120, height: 60 },
    { type: 'payment', label: 'Payment', icon: Hash, width: 180, height: 32 },
    { type: 'attachment', label: 'Attachment', icon: FileUp, width: 120, height: 40 },
    { type: 'formula', label: 'Formula', icon: Hash, width: 160, height: 32 },
];


/* ─────────────────────────────────────────────
   REUSABLE COMPONENTS
   ───────────────────────────────────────────── */

/** Zoho-style field button (sidebar grid) */
const FieldButton = ({ type, label, icon: Icon, onDragStart }: {
    type: string; label: string; icon: React.ElementType;
    onDragStart: (e: React.DragEvent, type: string) => void;
}) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, type)}
        className="flex items-center gap-2 px-2.5 py-2 rounded border border-stone-200 dark:border-[#2A2A32] bg-white dark:bg-[#18181F] hover:border-green-300 hover:bg-green-50/30 dark:hover:bg-green-900/20 cursor-grab active:cursor-grabbing transition-all select-none text-xs"
    >
        <div className="h-5 w-5 rounded flex items-center justify-center text-green-700 bg-green-50 dark:bg-green-900/20 shrink-0">
            <Icon className="h-3 w-3" />
        </div>
        <span className="text-stone-700 dark:text-stone-200 font-medium truncate">{label}</span>
    </div>
);


/** Placed field on the canvas */
const PlacedFieldComponent = ({
    field, recipientColor, isSelected, onSelect, onDelete, onDragStart, onResize,
}: {
    field: PlacedField;
    recipientColor: typeof RECIPIENT_COLORS[0];
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onResize: (fieldId: string, newWidth: number, newHeight: number) => void;
}) => {
    const fieldDef = STANDARD_FIELDS.find(f => f.type === field.type);
    const Icon = fieldDef?.icon || Type;

    const handleResizeMouseDown = (e: React.MouseEvent, corner: string) => {
        e.stopPropagation();
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = field.width;
        const startH = field.height;

        const handleMouseMove = (ev: MouseEvent) => {
            let newW = startW;
            let newH = startH;
            if (corner.includes('e')) newW = Math.max(24, startW + (ev.clientX - startX));
            if (corner.includes('w')) newW = Math.max(24, startW - (ev.clientX - startX));
            if (corner.includes('s')) newH = Math.max(20, startH + (ev.clientY - startY));
            if (corner.includes('n')) newH = Math.max(20, startH - (ev.clientY - startY));
            onResize(field.id, newW, newH);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
                "absolute group cursor-move select-none",
                "rounded border-2 border-dashed transition-all",
                isSelected
                    ? `${recipientColor.border} ${recipientColor.bg} shadow-md ring-2 ${recipientColor.ring}`
                    : `${recipientColor.border} ${recipientColor.bg} hover:shadow-sm`,
            )}
            style={{ left: field.x, top: field.y, width: field.width, height: field.height }}
        >
            <div className="flex items-center gap-1.5 h-full px-2">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", recipientColor.text)} />
                <span className={cn("text-xs font-medium truncate", recipientColor.text)}>{field.label}</span>
                {field.required && <span className="text-red-500 text-xs ml-auto">*</span>}
            </div>
            {isSelected && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-20">
                    <X className="h-3 w-3" />
                </button>
            )}
            {/* Resize handles at all corners + edges */}
            {isSelected && (
                <>
                    {/* Bottom-right */}
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                        className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 rounded-sm bg-white dark:bg-[#18181F] border-2 border-stone-500 dark:border-stone-400 cursor-se-resize z-20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" />
                    {/* Bottom-left */}
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                        className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 rounded-sm bg-white dark:bg-[#18181F] border-2 border-stone-500 dark:border-stone-400 cursor-sw-resize z-20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" />
                    {/* Top-right */}
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                        className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-sm bg-white dark:bg-[#18181F] border-2 border-stone-500 dark:border-stone-400 cursor-ne-resize z-20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" />
                    {/* Right edge */}
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                        className="absolute top-1/2 -translate-y-1/2 -right-1.5 h-5 w-2.5 rounded-sm bg-white dark:bg-[#18181F] border-2 border-stone-400 dark:border-stone-500 cursor-e-resize z-20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" />
                    {/* Bottom edge */}
                    <div onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                        className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-5 h-2.5 rounded-sm bg-white dark:bg-[#18181F] border-2 border-stone-400 dark:border-stone-500 cursor-s-resize z-20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors" />
                </>
            )}
        </div>
    );
};


/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function CreateTemplate() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: editId } = useParams<{ id?: string }>();
    const isViewMode = location.pathname.startsWith('/view-template/');
    const isEditMode = Boolean(editId) && !isViewMode;

    const [step, setStep] = useState<'setup' | 'editor'>(editId ? 'editor' : 'setup');

    // Setup
    const [templateName, setTemplateName] = useState('');
    const [templateCategory, setTemplateCategory] = useState('General');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
    const [documentContent, setDocumentContent] = useState('');
    const [sendInOrder, setSendInOrder] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Editor
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(Boolean(editId));
    const [zoom, setZoom] = useState(100);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 1;

    // Recipients
    const [recipients, setRecipients] = useState<Recipient[]>([
        { id: '1', name: '', email: '', role: '', color: '0', action: 'sign', notifyVia: 'email' },
    ]);
    const [activeRecipientId, setActiveRecipientId] = useState('1');

    // Fields
    const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [dragFieldType, setDragFieldType] = useState<string | null>(null);
    const [fieldTab, setFieldTab] = useState<'standard' | 'custom'>('standard');

    // Store drag offset so field doesn't jump when dragged
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Import from saved documents
    const [showDocPicker, setShowDocPicker] = useState(false);
    const [savedDocs, setSavedDocs] = useState<DocumentData[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);

    /* ── Load existing template ── */
    useEffect(() => {
        if (!editId) return;
        let cancelled = false;
        const loadTemplate = async () => {
            setIsLoadingTemplate(true);
            try {
                const data = await getTemplate(editId);
                if (cancelled) return;
                setTemplateName(data.name);
                setTemplateCategory(data.category);
                setDocumentContent(data.content || '');
                if (data.fields_config) {
                    const cfg = data.fields_config;
                    if (cfg.recipients?.length) {
                        setRecipients(cfg.recipients.map((r: Partial<Recipient> & { id: string }) => ({
                            id: r.id,
                            name: r.name || '',
                            email: r.email || '',
                            role: r.role || '',
                            color: r.color || '0',
                            action: r.action || 'sign',
                            notifyVia: r.notifyVia || 'email',
                        })));
                        setActiveRecipientId(cfg.recipients[0].id);
                    }
                    if (cfg.fields?.length) setPlacedFields(cfg.fields as PlacedField[]);
                }
                setStep('editor');
            } catch (err: unknown) {
                toast.error((err as Error).message || 'Failed to load template');
                navigate('/templates');
            } finally {
                if (!cancelled) setIsLoadingTemplate(false);
            }
        };
        loadTemplate();
        return () => { cancelled = true; };
    }, [editId, navigate]);

    /* ── Helpers ── */
    const activeRecipient = useMemo(() =>
        recipients.find(r => r.id === activeRecipientId) || recipients[0],
        [recipients, activeRecipientId]
    );

    const getRecipientColor = (recipientId: string) => {
        const r = recipients.find(rec => rec.id === recipientId);
        const idx = r ? parseInt(r.color) : 0;
        return RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
    };

    /* ── Recipients CRUD ── */
    const addRecipient = () => {
        if (recipients.length >= 6) { toast.error('Maximum 6 recipients allowed'); return; }
        const newId = String(Date.now());
        setRecipients(prev => [...prev, {
            id: newId, name: '', email: '', role: '', color: String(prev.length),
            action: 'sign', notifyVia: 'email',
        }]);
    };

    const removeRecipient = (id: string) => {
        if (recipients.length <= 1) { toast.error('At least one recipient required'); return; }
        setRecipients(prev => prev.filter(r => r.id !== id));
        setPlacedFields(prev => prev.filter(f => f.recipientId !== id));
        if (activeRecipientId === id) setActiveRecipientId(recipients[0].id);
    };

    const updateRecipient = (id: string, updates: Partial<Recipient>) => {
        setRecipients(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    /* ── File Handling ── */

    const processFile = useCallback(async (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const allowedExts = ['pdf', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg'];

        if (!allowedExts.includes(ext)) {
            toast.error('Supported: PDF, DOCX, DOC, TXT, MD, PNG, JPG, JPEG');
            return;
        }

        setIsProcessing(true);
        setUploadedFile(file);
        setUploadedFileUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
        if (!templateName) setTemplateName(file.name.replace(/\.[^/.]+$/, ''));

        try {
            if (file.type.startsWith('image/')) {
                setDocumentContent('');
                return;
            }

            const result = await extractFileContent(file);
            if (result.success && result.html) {
                setDocumentContent(result.html);
            } else {
                setDocumentContent(
                    `<div style="padding:48px 0;text-align:center;color:#aaa;">` +
                    `<p style="font-size:14px;font-weight:500;margin-bottom:8px;">${result.error || 'Could not extract content'}</p>` +
                    `<p style="font-size:12px;">You can still place signature fields on this document.</p>` +
                    `</div>`
                );
            }
        } catch (err) {
            console.error('File processing error:', err);
            setDocumentContent(
                `<div style="padding:48px 0;text-align:center;color:#aaa;">` +
                `<p style="font-size:14px;font-weight:500;">Error processing ${file.name}</p></div>`
            );
        } finally {
            setIsProcessing(false);
        }
    }, [templateName]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDropZone = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    /* ── Import from saved documents ── */
    const openDocPicker = useCallback(async () => {
        setShowDocPicker(true);
        setIsLoadingDocs(true);
        try {
            const res = await listDocuments({ limit: 100 });
            setSavedDocs(res.documents);
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Failed to load documents');
        } finally {
            setIsLoadingDocs(false);
        }
    }, []);

    const importSavedDocument = useCallback((doc: DocumentData) => {
        setDocumentContent(doc.content || '');
        if (!templateName) setTemplateName(doc.name);
        setShowDocPicker(false);
        toast.success(`Imported "${doc.name}"`);
    }, [templateName]);

    /* ── Field Drag & Drop ── */
    const handleFieldDragStart = (e: React.DragEvent, type: string) => {
        setDragFieldType(type);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', type);
    };

    const handlePlacedFieldDragStart = (e: React.DragEvent, fieldId: string) => {
        e.dataTransfer.setData('fieldId', fieldId);
        e.dataTransfer.effectAllowed = 'move';
        // Track where within the field the user grabbed it
        const fieldEl = e.currentTarget as HTMLElement;
        const fieldRect = fieldEl.getBoundingClientRect();
        dragOffsetRef.current = {
            x: e.clientX - fieldRect.left,
            y: e.clientY - fieldRect.top,
        };
    };

    const handleCanvasDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = dragFieldType ? 'copy' : 'move';
    };

    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scale = zoom / 100;

        const existingFieldId = e.dataTransfer.getData('fieldId');
        if (existingFieldId) {
            // Use the stored offset so the field doesn't jump
            const offsetX = dragOffsetRef.current.x / scale;
            const offsetY = dragOffsetRef.current.y / scale;
            const dropX = (e.clientX - rect.left) / scale;
            const dropY = (e.clientY - rect.top) / scale;
            setPlacedFields(prev => prev.map(f =>
                f.id === existingFieldId
                    ? { ...f, x: Math.max(0, Math.round(dropX - offsetX)), y: Math.max(0, Math.round(dropY - offsetY)) }
                    : f
            ));
            setDragFieldType(null);
            return;
        }

        const type = e.dataTransfer.getData('text/plain') || dragFieldType;
        if (!type) return;
        const fieldDef = STANDARD_FIELDS.find(f => f.type === type);
        if (!fieldDef) return;

        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        const newField: PlacedField = {
            id: `field_${Date.now()}`,
            type: fieldDef.type,
            label: fieldDef.label,
            recipientId: activeRecipientId,
            x: Math.max(0, Math.round(x - fieldDef.width / 2)),
            y: Math.max(0, Math.round(y - fieldDef.height / 2)),
            width: fieldDef.width,
            height: fieldDef.height,
            required: ['signature', 'initials'].includes(type),
            page: currentPage,
            placeholder: fieldDef.label,
        };
        setPlacedFields(prev => [...prev, newField]);
        setSelectedFieldId(newField.id);
        setDragFieldType(null);
    };

    const deleteField = (id: string) => {
        setPlacedFields(prev => prev.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const handleFieldResize = useCallback((fieldId: string, newWidth: number, newHeight: number) => {
        setPlacedFields(prev => prev.map(f =>
            f.id === fieldId ? { ...f, width: Math.round(newWidth), height: Math.round(newHeight) } : f
        ));
    }, []);

    /* ── Save ── */
    const handleSave = useCallback(async () => {
        if (!templateName.trim()) { toast.error('Please enter a template name'); return; }
        const validRecipients = recipients.filter(r => r.email.trim());
        if (validRecipients.length === 0) { toast.error('Please add at least one recipient with an email'); return; }

        setIsSaving(true);
        try {
            const fieldsConfig = {
                recipients: recipients.map(r => ({ id: r.id, name: r.name, email: r.email, role: r.role, color: r.color, action: r.action, notifyVia: r.notifyVia })),
                fields: placedFields.map(f => ({ id: f.id, type: f.type, label: f.label, recipientId: f.recipientId, x: Math.round(f.x), y: Math.round(f.y), width: Math.round(f.width), height: Math.round(f.height), required: f.required, page: f.page, placeholder: f.placeholder })),
                sendInOrder,
            };
            const payload = { name: templateName, category: templateCategory, content: documentContent, fields_config: fieldsConfig };

            if (isEditMode && editId) await updateTemplate(editId, payload);
            else await createTemplate(payload);

            toast.success(`Template "${templateName}" ${isEditMode ? 'updated' : 'saved'}!`);
            setTimeout(() => navigate('/templates'), 500);
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Failed to save template');
        } finally {
            setIsSaving(false);
        }
    }, [templateName, templateCategory, documentContent, placedFields, recipients, sendInOrder, navigate, isEditMode, editId]);

    /* ── Continue ── */
    const handleContinue = () => {
        if (!templateName.trim()) { toast.error('Please enter a template name'); return; }
        const validRecipients = recipients.filter(r => r.email.trim());
        if (validRecipients.length === 0) { toast.error('Please add at least one recipient with an email'); return; }
        setStep('editor');
    };

    /* ─── RENDER ─── */
    return (
        <TooltipProvider delayDuration={300}>
            <div className="min-h-screen bg-[#F9F9F7] dark:bg-[#0E0E13] flex flex-col font-sans">
                <AnimatePresence mode="wait">
                    {step === 'setup' ? (
                        /* ═══════════════════════════════════
                           STEP 1 — SETUP: Upload + Recipients
                           ═══════════════════════════════════ */
                        <motion.div key="setup" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="min-h-screen flex flex-col">

                            {/* Top bar */}
                            <div className="bg-white dark:bg-[#111114] border-b border-stone-200 dark:border-[#2A2A32] px-6 py-3 flex items-center gap-3 shrink-0">
                                <button onClick={() => navigate('/templates')} className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 transition-colors">
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded bg-green-600 flex items-center justify-center">
                                        <FileText className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-stone-800 dark:text-white">Sign</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="max-w-4xl mx-auto px-6 py-8">
                                    <h1 className="text-xl font-semibold text-stone-900 dark:text-white mb-8">Create a template</h1>

                                    {/* ── Add documents ── */}
                                    <section className="mb-8">
                                        <h2 className="text-sm font-semibold text-stone-800 dark:text-white mb-4">Add documents</h2>
                                        <div className="flex gap-4">
                                            <div
                                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={handleDropZone}
                                                className={cn(
                                                    "w-64 h-48 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                                                    isDragging ? "border-green-400 bg-green-50/60 dark:bg-green-900/30"
                                                        : uploadedFile ? "border-green-400 bg-green-50/30 dark:bg-green-900/20"
                                                            : "border-stone-300 dark:border-[#2A2A32] hover:border-stone-400 dark:hover:border-stone-500 bg-white dark:bg-[#18181F]"
                                                )}
                                                onClick={() => !isProcessing && fileInputRef.current?.click()}
                                            >
                                                {isProcessing ? (
                                                    <div className="flex flex-col items-center">
                                                        <Loader2 className="h-6 w-6 text-green-600 animate-spin mb-2" />
                                                        <p className="text-xs text-stone-500 dark:text-stone-400">Processing…</p>
                                                    </div>
                                                ) : uploadedFile ? (
                                                    <div className="flex flex-col items-center">
                                                        <FileText className="h-8 w-8 text-green-600 mb-2" />
                                                        <p className="text-xs text-stone-700 dark:text-stone-200 font-medium px-3 truncate max-w-full">{uploadedFile.name}</p>
                                                        <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setUploadedFileUrl(null); setDocumentContent(''); }}
                                                            className="mt-2 text-[10px] text-red-500 hover:text-red-700 dark:hover:text-red-400 underline">Remove</button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <FileText className="h-10 w-10 text-stone-300 mb-3" />
                                                        <p className="text-sm text-stone-600 dark:text-stone-400 font-medium mb-1">Drag files here</p>
                                                        <p className="text-xs text-stone-400 mb-3">or</p>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button onClick={(e) => e.stopPropagation()} className="bg-green-600 hover:bg-green-500 text-white text-xs h-8 px-4 rounded-md font-medium">
                                                                    Add document <ChevronDown className="h-3 w-3 ml-1" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="center">
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                                                    <FileUp className="h-4 w-4 mr-2" /> Upload from computer
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDocPicker(); }}>
                                                                    <FileText className="h-4 w-4 mr-2" /> Import from documents
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDocumentContent(''); setUploadedFile(null); setUploadedFileUrl(null); }}>
                                                                    <FilePlus2 className="h-4 w-4 mr-2" /> Create blank document
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </>
                                                )}
                                                <input ref={fileInputRef} type="file" onChange={handleFileUpload} accept={ACCEPT_STRING} className="hidden" />
                                            </div>
                                        </div>
                                    </section>

                                    {/* ── Template name ── */}
                                    <section className="mb-8">
                                        <div className="flex items-center gap-6">
                                            <label className="text-sm font-medium text-stone-700 dark:text-stone-200 w-32 shrink-0">Template name</label>
                                            <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Enter name" className="max-w-sm h-9 text-sm" />
                                        </div>
                                    </section>

                                    {/* ── Add recipients ── */}
                                    <section className="mb-8">
                                        <h2 className="text-sm font-semibold text-stone-800 dark:text-white mb-4">Add recipients</h2>
                                        <div className="flex items-center gap-3 mb-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={sendInOrder} onChange={(e) => setSendInOrder(e.target.checked)}
                                                    className="h-4 w-4 rounded border-stone-300 dark:border-[#2A2A32] text-green-600 focus:ring-green-500" />
                                                <span className="text-sm text-stone-600 dark:text-stone-400">Send in order</span>
                                            </label>
                                            <button onClick={() => {
                                                const stored = localStorage.getItem('signify_user');
                                                if (stored) {
                                                    try {
                                                        const user = JSON.parse(stored);
                                                        const empty = recipients.find(r => !r.email);
                                                        if (empty) updateRecipient(empty.id, { name: user.name || '', email: user.email || '' });
                                                        else toast.info('All recipient slots are filled');
                                                    } catch { /* ignore */ }
                                                }
                                            }} className="text-sm text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-[#2A2A32] rounded-md px-3 py-1 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                                Add me
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {recipients.map((r, idx) => {
                                                const color = RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
                                                return (
                                                    <div key={r.id} className="relative">
                                                        <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", color.avatar)} />
                                                        <div className="bg-white dark:bg-[#18181F] border border-stone-200 dark:border-[#2A2A32] rounded-lg p-4 pl-5">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/5 rounded w-6 h-6 flex items-center justify-center shrink-0">{idx + 1}</span>
                                                                <Input value={r.role} onChange={(e) => updateRecipient(r.id, { role: e.target.value })} placeholder="Role" className="h-8 text-sm flex-1 max-w-xs" />
                                                                {recipients.length > 1 && (
                                                                    <button onClick={() => removeRecipient(r.id)} className="p-1 text-stone-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"><X className="h-4 w-4" /></button>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <Input value={r.email} onChange={(e) => updateRecipient(r.id, { email: e.target.value })} placeholder="Email" type="email" className="h-8 text-sm flex-1 min-w-[180px]" />
                                                                <Input value={r.name} onChange={(e) => updateRecipient(r.id, { name: e.target.value })} placeholder="Name" className="h-8 text-sm flex-1 min-w-[140px]" />
                                                                <select value={r.action} onChange={(e) => updateRecipient(r.id, { action: e.target.value as Recipient['action'] })}
                                                                    className="h-8 text-xs border border-stone-200 dark:border-[#2A2A32] rounded-md px-2 bg-white dark:bg-[#18181F] text-stone-600 dark:text-stone-400 focus:outline-none focus:ring-1 focus:ring-green-500/40 min-w-[120px]">
                                                                    <option value="sign">Needs to sign</option>
                                                                    <option value="view">Needs to view</option>
                                                                    <option value="approve">Needs to approve</option>
                                                                </select>
                                                                <select value={r.notifyVia} onChange={(e) => updateRecipient(r.id, { notifyVia: e.target.value as Recipient['notifyVia'] })}
                                                                    className="h-8 text-xs border border-stone-200 dark:border-[#2A2A32] rounded-md px-2 bg-white dark:bg-[#18181F] text-stone-600 dark:text-stone-400 focus:outline-none focus:ring-1 focus:ring-green-500/40 min-w-[80px]">
                                                                    <option value="email">Email</option>
                                                                    <option value="sms">SMS</option>
                                                                    <option value="both">Both</option>
                                                                </select>
                                                                <button className="h-8 text-xs border border-stone-200 dark:border-[#2A2A32] rounded-md px-3 bg-white dark:bg-[#18181F] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5">
                                                                    <Settings2 className="h-3.5 w-3.5" /> Customize
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button onClick={addRecipient} className="mt-3 flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
                                            <Plus className="h-4 w-4" /> Add recipient
                                        </button>
                                    </section>

                                    {/* ── Bottom Actions ── */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-stone-200 dark:border-[#2A2A32]">
                                        <Button onClick={handleContinue} className="bg-green-600 hover:bg-green-500 text-white text-sm h-10 px-6 rounded-md font-medium">Continue</Button>
                                        <Button onClick={handleSave} disabled={isSaving} variant="outline" className="text-sm h-10 px-6 rounded-md font-medium">
                                            {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                                            {isSaving ? 'Saving…' : 'Done'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    ) : (
                        /* ═══════════════════════════════════
                           STEP 2 — EDITOR: Zoho Sign style
                           ═══════════════════════════════════ */
                        <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen flex flex-col overflow-hidden">

                            {isLoadingTemplate && (
                                <div className="absolute inset-0 z-50 bg-[#F9F9F7]/80 dark:bg-[#0E0E13]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                                    <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Loading template…</p>
                                </div>
                            )}

                            {/* ─── TOP BAR ─── */}
                            <div className="bg-white dark:bg-[#111114] border-b border-stone-200 dark:border-[#2A2A32] px-4 py-2 shrink-0 z-30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => navigate('/templates')} className="p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded transition-colors text-stone-400">
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-sm text-stone-600 dark:text-stone-400 font-medium truncate max-w-[260px]">{templateName || 'Untitled Template'}</span>

                                    {/* Page nav */}
                                    <div className="flex items-center gap-1 ml-4">
                                        <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
                                            className="p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded transition-colors text-stone-400 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                                        <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
                                            className="p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded transition-colors text-stone-400 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                                        <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 ml-1">
                                            <input type="number" value={currentPage} onChange={(e) => setCurrentPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
                                                className="w-8 h-6 text-center border border-stone-200 dark:border-[#2A2A32] rounded text-xs bg-white dark:bg-[#111114] dark:text-white" />
                                            <span>of {totalPages}</span>
                                        </div>
                                    </div>

                                    {/* Zoom */}
                                    <div className="flex items-center gap-1 ml-4">
                                        <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded transition-colors text-stone-400"><ZoomOut className="h-4 w-4" /></button>
                                        <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded transition-colors text-stone-400"><ZoomIn className="h-4 w-4" /></button>
                                    </div>

                                    {/* Tools */}
                                    <div className="flex items-center gap-1 ml-2">
                                        <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded transition-colors text-stone-400"><Download className="h-4 w-4" /></button></TooltipTrigger>
                                            <TooltipContent side="bottom" className="text-xs">Download</TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded transition-colors text-stone-400"><Printer className="h-4 w-4" /></button></TooltipTrigger>
                                            <TooltipContent side="bottom" className="text-xs">Print</TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-stone-100 dark:hover:bg-white/10 rounded transition-colors text-stone-400"><Maximize className="h-4 w-4" /></button></TooltipTrigger>
                                            <TooltipContent side="bottom" className="text-xs">Fullscreen</TooltipContent></Tooltip>
                                    </div>
                                </div>

                                {/* Right actions */}
                                <div className="flex items-center gap-2">
                                    {isViewMode ? (
                                        <>
                                            <Button variant="outline" className="text-sm h-9 px-4 rounded-md font-medium"
                                                onClick={() => navigate(`/edit-template/${editId}`)}>
                                                Edit Template
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="outline" className="text-sm h-9 px-4 rounded-md font-medium border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                onClick={() => toast.info('AI field detection coming soon!')}>
                                                <Sparkles className="h-4 w-4 mr-1.5" /> Detect fields
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="text-sm h-9 px-4 rounded-md font-medium">Actions <ChevronDown className="h-3 w-3 ml-1" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setStep('setup')}><ArrowLeft className="h-4 w-4 mr-2" /> Back to setup</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setPlacedFields([]); setSelectedFieldId(null); toast.success('All fields cleared'); }}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Clear all fields
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button variant="outline" className="text-sm h-9 px-4 rounded-md font-medium" onClick={() => setStep('setup')}>Back</Button>
                                            <Button onClick={handleSave} disabled={isSaving || isLoadingTemplate} className="bg-green-600 hover:bg-green-500 text-white text-sm h-9 px-6 rounded-md font-medium">
                                                {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                                                {isSaving ? 'Saving…' : 'Save'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ─── MAIN LAYOUT ─── */}
                            <div className="flex-1 flex overflow-hidden">

                                {/* LEFT SIDEBAR — Document pages */}
                                <div className="w-[112px] min-w-[112px] max-w-[112px] bg-white dark:bg-[#18181F] border-r border-stone-200 dark:border-[#2A2A32] flex flex-col shrink-0 grow-0 z-10">
                                    <div className="px-3 py-3 border-b border-stone-200 dark:border-[#2A2A32]">
                                        <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">Documents</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2">
                                        <div className="mb-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="text-[10px] text-stone-500 dark:text-stone-400 truncate w-full text-left flex items-center gap-0.5 hover:text-stone-700 dark:hover:text-stone-200">
                                                        {(templateName || 'Document').slice(0, 10)}… <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuItem className="text-xs">{templateName || 'Document'}</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <p className="text-[10px] text-stone-400 mt-0.5">Pages</p>
                                        </div>
                                        {/* Page thumbnail — fixed size, never grows */}
                                        <div onClick={() => setCurrentPage(1)}
                                            className={cn("w-[88px] h-[114px] rounded border-2 cursor-pointer transition-all bg-white dark:bg-[#18181F] overflow-hidden relative mb-1 mx-auto",
                                                currentPage === 1 ? "border-green-500 shadow-sm" : "border-stone-200 dark:border-[#2A2A32] hover:border-stone-300 dark:hover:border-stone-400")}>
                                            {uploadedFileUrl && uploadedFile?.type.startsWith('image/') ? (
                                                <img src={uploadedFileUrl} alt="Page 1" className="w-full h-full object-cover" />
                                            ) : documentContent ? (
                                                <div className="w-full h-full overflow-hidden p-1 pointer-events-none">
                                                    <div className="transform scale-[0.08] origin-top-left w-[816px] text-[10pt] leading-tight"
                                                        dangerouslySetInnerHTML={{ __html: documentContent }} />
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><FileText className="h-5 w-5 text-stone-200" /></div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-center"><span className="text-[10px] text-stone-500 dark:text-stone-400">1</span></div>
                                    </div>
                                </div>

                                {/* DOCUMENT CANVAS (read-only) */}
                                <div className="flex-1 overflow-auto bg-[#E8E8E6] dark:bg-[#0E0E13]" onClick={() => setSelectedFieldId(null)}>
                                    <div className="py-6 flex flex-col items-center min-h-full">
                                        <div ref={canvasRef} onDragOver={isViewMode ? undefined : handleCanvasDragOver} onDrop={isViewMode ? undefined : handleCanvasDrop}
                                            className="relative bg-white dark:bg-[#18181F] shadow-[0_1px_4px_rgba(0,0,0,0.12)] rounded-sm"
                                            style={{ width: `${A4_WIDTH}px`, minHeight: `${A4_HEIGHT}px`, zoom: `${zoom}%` }}>

                                            {uploadedFileUrl && uploadedFile?.type.startsWith('image/') ? (
                                                <div className="w-full h-full"><img src={uploadedFileUrl} alt="Document" className="w-full h-auto" style={{ pointerEvents: 'none' }} /></div>
                                            ) : documentContent ? (
                                                <div className="px-16 py-12 text-stone-800 dark:text-white leading-relaxed select-none pointer-events-none"
                                                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '11pt' }}
                                                    dangerouslySetInnerHTML={{ __html: documentContent }} />
                                            ) : (
                                                <div className={cn("w-full flex items-center justify-center", `min-h-[${A4_HEIGHT}px]`)}>
                                                    <div className="text-center text-stone-300">
                                                        <FileText className="h-12 w-12 mx-auto mb-3" />
                                                        <p className="text-sm font-medium">{isViewMode ? 'No document content' : 'Drag fields onto this document'}</p>
                                                        <p className="text-xs mt-1">{isViewMode ? '' : 'Place signature and form fields where recipients need to fill'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {placedFields.filter(f => f.page === currentPage).map(field => (
                                                <PlacedFieldComponent key={field.id} field={field}
                                                    recipientColor={getRecipientColor(field.recipientId)}
                                                    isSelected={selectedFieldId === field.id}
                                                    onSelect={() => setSelectedFieldId(field.id)}
                                                    onDelete={() => deleteField(field.id)}
                                                    onDragStart={(e) => handlePlacedFieldDragStart(e, field.id)}
                                                    onResize={handleFieldResize} />
                                            ))}

                                            {dragFieldType && !isViewMode && (
                                                <div className="absolute inset-0 bg-green-50/10 dark:bg-green-900/10 border-2 border-dashed border-green-300/40 rounded-sm pointer-events-none z-40 flex items-center justify-center">
                                                    <div className="bg-white/90 dark:bg-[#18181F]/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-green-200 text-sm text-green-700 font-medium">Drop field here</div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Page indicator */}
                                        <div className="text-center mt-2 mb-4">
                                            <span className="text-xs text-stone-400 font-medium">Page {currentPage} of {totalPages}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT SIDEBAR — Recipients + Fields (hidden in view mode) */}
                                {!isViewMode && (
                                <div className="w-72 bg-white dark:bg-[#18181F] border-l border-stone-200 dark:border-[#2A2A32] flex flex-col shrink-0 z-10">
                                    {/* Recipients */}
                                    <div className="border-b border-stone-200 dark:border-[#2A2A32]">
                                        <div className="px-4 py-3">
                                            <p className="text-xs font-semibold text-stone-700 dark:text-stone-200 uppercase tracking-wide mb-3">Recipients</p>
                                            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-stone-50 dark:hover:bg-white/5 cursor-pointer transition-colors mb-1">
                                                <div className="h-7 w-7 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center text-stone-500 dark:text-stone-400 text-xs font-bold shrink-0">P</div>
                                                <span className="text-xs text-stone-600 dark:text-stone-400">Prefill by you</span>
                                            </div>
                                            {recipients.map((r, idx) => {
                                                const color = RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
                                                const isActive = activeRecipientId === r.id;
                                                const initial = r.name ? r.name[0].toUpperCase() : String(idx + 1);
                                                return (
                                                    <div key={r.id} onClick={() => setActiveRecipientId(r.id)}
                                                        className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-all mb-0.5",
                                                            isActive ? `${color.bg} ${color.border} border` : "hover:bg-stone-50 dark:hover:bg-white/5")}>
                                                        <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", color.avatar)}>{initial}</div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-medium text-stone-800 dark:text-white truncate">{r.name || r.role || `Signer ${idx + 1}`}</p>
                                                            <p className="text-[10px] text-stone-400 truncate">{r.email || 'No email'}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Field tabs */}
                                    <div className="flex border-b border-stone-200 dark:border-[#2A2A32]">
                                        <button onClick={() => setFieldTab('standard')}
                                            className={cn("flex-1 py-2.5 text-xs font-medium transition-colors text-center",
                                                fieldTab === 'standard' ? "text-green-700 border-b-2 border-green-500" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-400")}>
                                            Standard fields
                                        </button>
                                        <button onClick={() => setFieldTab('custom')}
                                            className={cn("flex-1 py-2.5 text-xs font-medium transition-colors text-center",
                                                fieldTab === 'custom' ? "text-green-700 border-b-2 border-green-500" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-400")}>
                                            Custom fields
                                        </button>
                                    </div>

                                    {/* Fields grid */}
                                    <div className="flex-1 overflow-y-auto p-3">
                                        <AnimatePresence mode="wait">
                                            {fieldTab === 'standard' ? (
                                                <motion.div key="standard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2">
                                                    {STANDARD_FIELDS.map(f => (
                                                        <FieldButton key={f.type} type={f.type} label={f.label} icon={f.icon} onDragStart={handleFieldDragStart} />
                                                    ))}
                                                </motion.div>
                                            ) : (
                                                <motion.div key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="flex flex-col items-center justify-center py-10 text-center">
                                                    <div className="h-12 w-12 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center mb-3"><Plus className="h-5 w-5 text-stone-400" /></div>
                                                    <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">No custom fields yet</p>
                                                    <p className="text-xs text-stone-400 mt-1">Custom fields will appear here</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {placedFields.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#2A2A32]">
                                                <h3 className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">Placed fields ({placedFields.length})</h3>
                                                <div className="space-y-1">
                                                    {placedFields.map(f => {
                                                        const def = STANDARD_FIELDS.find(ft => ft.type === f.type);
                                                        const FIcon = def?.icon || Type;
                                                        const color = getRecipientColor(f.recipientId);
                                                        return (
                                                            <div key={f.id} onClick={() => setSelectedFieldId(f.id)}
                                                                className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors",
                                                                    selectedFieldId === f.id ? `${color.bg} ${color.border} border` : "hover:bg-stone-50 dark:hover:bg-white/5")}>
                                                                <FIcon className={cn("h-3.5 w-3.5", color.text)} />
                                                                <span className="text-stone-600 dark:text-stone-400 truncate">{f.label}</span>
                                                                {f.required && <span className="text-red-500 text-[10px]">*</span>}
                                                                <button onClick={(e) => { e.stopPropagation(); deleteField(f.id); }} className="ml-auto text-stone-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                )}

                                {/* FIELD PROPERTIES PANEL */}
                                {!isViewMode && (
                                <AnimatePresence>
                                    {selectedFieldId && (() => {
                                        const field = placedFields.find(f => f.id === selectedFieldId);
                                        if (!field) return null;
                                        const fieldDef = STANDARD_FIELDS.find(ft => ft.type === field.type);
                                        const FIcon = fieldDef?.icon || Type;
                                        const color = getRecipientColor(field.recipientId);

                                        return (
                                            <motion.div key="properties" initial={{ width: 0, opacity: 0 }} animate={{ width: 250, opacity: 1 }}
                                                exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                                className="bg-white dark:bg-[#18181F] border-l border-stone-200 dark:border-[#2A2A32] overflow-hidden shrink-0">
                                                <div className="w-[250px] p-4 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-stone-400" /><span className="text-sm font-semibold text-stone-700 dark:text-stone-200">Properties</span></div>
                                                        <button onClick={() => setSelectedFieldId(null)} className="p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded transition-colors"><X className="h-4 w-4 text-stone-400" /></button>
                                                    </div>
                                                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", color.bg)}>
                                                        <FIcon className={cn("h-4 w-4", color.text)} /><span className={cn("text-sm font-medium", color.text)}>{field.label}</span>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Assigned to</label>
                                                        <select value={field.recipientId} onChange={(e) => setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, recipientId: e.target.value } : f))}
                                                            className="w-full h-8 mt-1 text-xs border border-stone-200 dark:border-[#2A2A32] rounded-md px-2 bg-white dark:bg-[#18181F] text-stone-600 dark:text-stone-400 focus:outline-none focus:ring-1 focus:ring-green-500/40">
                                                            {recipients.map((r, idx) => <option key={r.id} value={r.id}>{r.name || `Signer ${idx + 1}`} ({r.role || r.action})</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Label</label>
                                                        <Input value={field.label} onChange={(e) => setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, label: e.target.value } : f))} className="h-8 text-xs mt-1" />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs text-stone-600 dark:text-stone-400">Required</label>
                                                        <button onClick={() => setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, required: !f.required } : f))}
                                                            className={cn("relative w-9 h-5 rounded-full transition-colors", field.required ? "bg-green-500" : "bg-stone-200 dark:bg-white/10")}>
                                                            <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", field.required ? "translate-x-4" : "translate-x-0.5")} />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Width</label>
                                                            <Input type="number" value={field.width} onChange={(e) => { const w = Math.max(24, parseInt(e.target.value) || 24); setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, width: w } : f)); }} className="h-8 text-xs mt-1" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Height</label>
                                                            <Input type="number" value={field.height} onChange={(e) => { const h = Math.max(20, parseInt(e.target.value) || 20); setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, height: h } : f)); }} className="h-8 text-xs mt-1" />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">X pos</label>
                                                            <Input type="number" value={Math.round(field.x)} onChange={(e) => setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, x: parseInt(e.target.value) || 0 } : f))} className="h-8 text-xs mt-1" />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Y pos</label>
                                                            <Input type="number" value={Math.round(field.y)} onChange={(e) => setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, y: parseInt(e.target.value) || 0 } : f))} className="h-8 text-xs mt-1" />
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteField(field.id)}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs font-medium mt-4">
                                                        <Trash2 className="h-3.5 w-3.5" /> Delete Field
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Document Picker Dialog ── */}
            <AnimatePresence>
                {showDocPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                        onClick={() => setShowDocPicker(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-[#18181F] rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col overflow-hidden"
                        >
                            <div className="px-5 py-4 border-b border-stone-200 dark:border-[#2A2A32] flex items-center justify-between shrink-0">
                                <h3 className="text-sm font-semibold text-stone-800 dark:text-white">Import from saved documents</h3>
                                <button onClick={() => setShowDocPicker(false)} className="p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                    <X className="h-4 w-4 text-stone-400" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {isLoadingDocs ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                        <p className="text-xs">Loading documents…</p>
                                    </div>
                                ) : savedDocs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                                        <FileText className="h-10 w-10 mb-2 opacity-30" />
                                        <p className="text-sm font-medium">No saved documents</p>
                                        <p className="text-xs mt-1">Create documents first in the Documents section</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {savedDocs.map((doc) => (
                                            <button
                                                key={doc.id}
                                                onClick={() => importSavedDocument(doc)}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-stone-200 dark:border-[#2A2A32] hover:border-green-300 hover:bg-green-50/40 dark:hover:bg-green-900/20 transition-all text-left group"
                                            >
                                                <div className="w-8 h-8 rounded bg-stone-100 dark:bg-white/5 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 flex items-center justify-center shrink-0 transition-colors">
                                                    <FileText className="h-4 w-4 text-stone-400 group-hover:text-green-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">{doc.name}</p>
                                                    <p className="text-[10px] text-stone-400 mt-0.5">
                                                        {new Date(doc.updated_at).toLocaleDateString()} • {doc.status}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </TooltipProvider>
    );
}
