import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Upload, FileText, Save, Loader2,
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Redo, Undo,
    Minus, Quote, Code, Subscript, Superscript,
    Type, Highlighter, Image as ImageIcon,
    Link2, Table as TableIcon,
    Download, Star, Clock, Eye,
    ChevronDown, RemoveFormatting,
    FilePlus2, FileUp,
    ZoomIn, ZoomOut, MoreHorizontal,
    PenTool, User, Calendar, Hash, CheckSquare,
    Mail, Building2, Briefcase, GripVertical,
    X, Trash2, Settings2, Plus, UserPlus,
    Sparkles, MousePointerClick, Move,
    FileSignature, Stamp, AtSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createTemplate, updateTemplate, getTemplate } from '@/lib/api/templates';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline as UnderlineExt } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { Image as ImageExt } from '@tiptap/extension-image';
import { Link as LinkExt } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Subscript as SubScript } from '@tiptap/extension-subscript';
import { Superscript as SuperScript } from '@tiptap/extension-superscript';
import { Table as TableExt } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';


/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */
interface Recipient {
    id: string;
    name: string;
    email: string;
    role: string;
    color: string;
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
    placeholder?: string;
}

/* ─────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────── */
const RECIPIENT_COLORS = [
    { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-500', ring: 'ring-green-400', hex: '#22c55e' },
    { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', dot: 'bg-blue-500', ring: 'ring-blue-400', hex: '#3b82f6' },
    { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', dot: 'bg-amber-500', ring: 'ring-amber-400', hex: '#f59e0b' },
    { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', dot: 'bg-purple-500', ring: 'ring-purple-400', hex: '#a855f7' },
    { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-700', dot: 'bg-rose-500', ring: 'ring-rose-400', hex: '#f43f5e' },
    { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-700', dot: 'bg-teal-500', ring: 'ring-teal-400', hex: '#14b8a6' },
];

const FIELD_TYPES = [
    { type: 'signature', label: 'Signature', icon: PenTool, width: 200, height: 60, desc: 'Signature field' },
    { type: 'initials', label: 'Initials', icon: FileSignature, width: 80, height: 40, desc: 'Initials field' },
    { type: 'date', label: 'Date Signed', icon: Calendar, width: 150, height: 32, desc: 'Auto-filled date' },
    { type: 'text', label: 'Text Field', icon: Type, width: 180, height: 32, desc: 'Freeform text input' },
    { type: 'name', label: 'Full Name', icon: User, width: 180, height: 32, desc: 'Recipient name' },
    { type: 'email', label: 'Email', icon: Mail, width: 200, height: 32, desc: 'Recipient email' },
    { type: 'company', label: 'Company', icon: Building2, width: 180, height: 32, desc: 'Company name' },
    { type: 'title', label: 'Job Title', icon: Briefcase, width: 160, height: 32, desc: 'Job title' },
    { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, width: 24, height: 24, desc: 'Check/uncheck' },
    { type: 'stamp', label: 'Stamp', icon: Stamp, width: 100, height: 100, desc: 'Company stamp' },
];

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];

const FONT_FAMILIES = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Garamond', label: 'Garamond' },
];

const HEADING_OPTIONS = [
    { value: 'paragraph', label: 'Normal text' },
    { value: '1', label: 'Heading 1' },
    { value: '2', label: 'Heading 2' },
    { value: '3', label: 'Heading 3' },
];

const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', 'transparent'];

const STARTER_TEMPLATES = [
    { id: 'blank', title: 'Blank', icon: FilePlus2, content: '' },
    {
        id: 'nda', title: 'NDA', icon: FileText,
        content: `<h1>Non-Disclosure Agreement</h1><p>This Agreement is made on <strong>[Date]</strong> between <strong>[Party A]</strong> and <strong>[Party B]</strong>.</p><h2>1. Confidentiality</h2><p>The parties agree to maintain the confidentiality of all information shared during the course of this agreement.</p><h2>2. Term</h2><p>This agreement shall remain in effect for a period of <strong>[Duration]</strong> from the effective date.</p><h2>3. Obligations</h2><ul><li>Both parties shall use reasonable efforts to protect confidential information.</li><li>Information shall not be disclosed to third parties without prior written consent.</li><li>All materials must be returned upon termination.</li></ul><h2>4. Signatures</h2><p><em>Signatures of both parties are required below.</em></p><p>&nbsp;</p><p>_______________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _______________________</p><p><strong>[Party A]</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>[Party B]</strong></p>`,
    },
    {
        id: 'offer', title: 'Offer Letter', icon: Sparkles,
        content: `<h1>Offer Letter</h1><p>Dear <strong>[Candidate Name]</strong>,</p><p>We are pleased to offer you the position of <strong>[Job Title]</strong> at <strong>[Company Name]</strong>.</p><h2>Employment Details</h2><ul><li><strong>Start Date:</strong> [Start Date]</li><li><strong>Salary:</strong> [Annual Salary]</li><li><strong>Department:</strong> [Department]</li><li><strong>Reporting To:</strong> [Manager Name]</li></ul><h2>Benefits</h2><p>You will be eligible for our comprehensive benefits package.</p><p>&nbsp;</p><p>Sincerely,</p><p><strong>[HR Manager Name]</strong></p>`,
    },
    {
        id: 'contract', title: 'Contract', icon: CheckSquare,
        content: `<h1>Service Agreement</h1><p>This Service Agreement is entered into as of <strong>[Date]</strong>, by and between:</p><p><strong>[Service Provider]</strong> ("Provider") and <strong>[Client Name]</strong> ("Client").</p><h2>1. Scope of Services</h2><ul><li>[Service 1]</li><li>[Service 2]</li><li>[Service 3]</li></ul><h2>2. Compensation</h2><p>The Client agrees to compensate the Provider in the amount of <strong>[Amount]</strong>.</p><h2>3. Signatures</h2><p>&nbsp;</p><p>_______________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _______________________</p><p><strong>Provider</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Client</strong></p>`,
    },
];


/* ─────────────────────────────────────────────
   REUSABLE COMPONENTS
   ───────────────────────────────────────────── */
const TBtn = ({ onClick, isActive = false, disabled = false, tip, children }: {
    onClick: () => void; isActive?: boolean; disabled?: boolean; tip: string; children: React.ReactNode;
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button onClick={onClick} disabled={disabled}
                className={cn(
                    "h-7 w-7 rounded flex items-center justify-center transition-all duration-150",
                    isActive ? "bg-green-100 text-green-700" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700",
                    disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
                )}>
                {children}
            </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{tip}</TooltipContent>
    </Tooltip>
);

const TDivider = () => <div className="w-px h-5 bg-stone-200 mx-0.5 shrink-0" />;


/* ─────────────────────────────────────────────
   DRAGGABLE FIELD ITEM (sidebar)
   ───────────────────────────────────────────── */
const FieldItem = ({ type, label, icon: Icon, desc, onDragStart }: {
    type: string; label: string; icon: any; desc: string;
    onDragStart: (e: React.DragEvent, type: string) => void;
}) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, type)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-stone-200 bg-white hover:border-green-300 hover:bg-green-50/30 cursor-grab active:cursor-grabbing transition-all group select-none"
    >
        <div className="h-8 w-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-green-100 group-hover:text-green-600 transition-colors shrink-0">
            <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
            <p className="text-sm font-medium text-stone-700 truncate">{label}</p>
            <p className="text-[10px] text-stone-400 truncate">{desc}</p>
        </div>
        <GripVertical className="h-4 w-4 text-stone-300 ml-auto shrink-0" />
    </div>
);


/* ─────────────────────────────────────────────
   PLACED FIELD ON CANVAS
   ───────────────────────────────────────────── */
const PlacedFieldComponent = ({
    field, recipientColor, isSelected, onSelect, onDelete, onDragStart,
}: {
    field: PlacedField;
    recipientColor: typeof RECIPIENT_COLORS[0];
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onDragStart: (e: React.DragEvent) => void;
}) => {
    const fieldDef = FIELD_TYPES.find(f => f.type === field.type);
    const Icon = fieldDef?.icon || Type;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={cn(
                "absolute group cursor-move select-none",
                "rounded border-2 border-dashed transition-all",
                isSelected ? `${recipientColor.border} ${recipientColor.bg} shadow-md ring-2 ${recipientColor.ring}` : `${recipientColor.border} ${recipientColor.bg} hover:shadow-sm`,
            )}
            style={{
                left: field.x,
                top: field.y,
                width: field.width,
                height: field.height,
            }}
        >
            {/* Field content */}
            <div className="flex items-center gap-1.5 h-full px-2">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", recipientColor.text)} />
                <span className={cn("text-xs font-medium truncate", recipientColor.text)}>
                    {field.label}
                </span>
                {field.required && (
                    <span className="text-red-500 text-xs ml-auto">*</span>
                )}
            </div>

            {/* Delete button on hover / selected */}
            {isSelected && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            )}

            {/* Resize handle */}
            {isSelected && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-sm bg-white border-2 border-stone-400 cursor-se-resize" />
            )}
        </div>
    );
};


/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function CreateTemplate() {
    const navigate = useNavigate();
    const { id: editId } = useParams<{ id?: string }>();
    const isEditMode = Boolean(editId);
    const [step, setStep] = useState<'start' | 'editor'>(editId ? 'editor' : 'start');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(Boolean(editId));
    const [isSaving, setIsSaving] = useState(false);
    const [templateName, setTemplateName] = useState('Untitled Template');
    const [templateCategory, setTemplateCategory] = useState('General');
    const [isDragging, setIsDragging] = useState(false);
    const [zoom, setZoom] = useState(100);

    // Signature field system
    const [recipients, setRecipients] = useState<Recipient[]>([
        { id: '1', name: 'Signer 1', email: '', role: 'Signer', color: '0' },
    ]);
    const [activeRecipientId, setActiveRecipientId] = useState('1');
    const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [dragFieldType, setDragFieldType] = useState<string | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'fields' | 'recipients'>('fields');

    // Editor state
    const [currentFontSize, setCurrentFontSize] = useState('11');
    const [currentFontFamily, setCurrentFontFamily] = useState('Inter');
    const [textColor, setTextColor] = useState('#000000');
    const [highlightColor, setHighlightColor] = useState('#fef08a');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    /* ── Editor Setup ── */
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            UnderlineExt, TextStyle, Color,
            Highlight.configure({ multicolor: true }),
            FontFamily, ImageExt,
            LinkExt.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder: 'Start typing your template content…' }),
            SubScript, SuperScript,
            TableExt.configure({ resizable: true }),
            TableRow, TableCell, TableHeader,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'docs-editor focus:outline-none min-h-[1000px] px-[72px] py-[56px] text-stone-800 leading-[1.6]',
                style: 'font-size: 11pt; font-family: Inter, sans-serif;',
            },
        },
    });

    /* ── Load existing template for edit mode ── */
    useEffect(() => {
        if (!editId || !editor) return;
        let cancelled = false;

        const loadTemplate = async () => {
            setIsLoadingTemplate(true);
            try {
                const data = await getTemplate(editId);
                if (cancelled) return;

                setTemplateName(data.name);
                setTemplateCategory(data.category);
                editor.commands.setContent(data.content || '');

                if (data.fields_config) {
                    const cfg = data.fields_config;
                    if (cfg.recipients?.length) {
                        setRecipients(cfg.recipients);
                        setActiveRecipientId(cfg.recipients[0].id);
                    }
                    if (cfg.fields?.length) {
                        setPlacedFields(cfg.fields as PlacedField[]);
                    }
                }
            } catch (err: any) {
                toast.error(err.message || 'Failed to load template');
                navigate('/templates');
            } finally {
                if (!cancelled) setIsLoadingTemplate(false);
            }
        };

        loadTemplate();
        return () => { cancelled = true; };
    }, [editId, editor]);

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

    /* ── Recipients ── */
    const addRecipient = () => {
        if (recipients.length >= 6) { toast.error('Maximum 6 recipients allowed'); return; }
        const newId = String(Date.now());
        const newIdx = recipients.length;
        setRecipients(prev => [...prev, {
            id: newId, name: `Signer ${newIdx + 1}`, email: '', role: 'Signer', color: String(newIdx),
        }]);
        setActiveRecipientId(newId);
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

    /* ── Field Drag & Drop ── */
    const handleFieldDragStart = (e: React.DragEvent, type: string) => {
        setDragFieldType(type);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', type);
    };

    const handlePlacedFieldDragStart = (e: React.DragEvent, fieldId: string) => {
        e.dataTransfer.setData('fieldId', fieldId);
        e.dataTransfer.effectAllowed = 'move';
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
        const x = (e.clientX - rect.left) / (zoom / 100);
        const y = (e.clientY - rect.top) / (zoom / 100);

        // Moving existing field
        const existingFieldId = e.dataTransfer.getData('fieldId');
        if (existingFieldId) {
            setPlacedFields(prev => prev.map(f =>
                f.id === existingFieldId ? { ...f, x: Math.max(0, x - f.width / 2), y: Math.max(0, y - f.height / 2) } : f
            ));
            setDragFieldType(null);
            return;
        }

        // Placing new field
        const type = e.dataTransfer.getData('text/plain') || dragFieldType;
        if (!type) return;

        const fieldDef = FIELD_TYPES.find(f => f.type === type);
        if (!fieldDef) return;

        const newField: PlacedField = {
            id: `field_${Date.now()}`,
            type: fieldDef.type,
            label: fieldDef.label,
            recipientId: activeRecipientId,
            x: Math.max(0, x - fieldDef.width / 2),
            y: Math.max(0, y - fieldDef.height / 2),
            width: fieldDef.width,
            height: fieldDef.height,
            required: type === 'signature' || type === 'initials',
            placeholder: fieldDef.desc,
        };

        setPlacedFields(prev => [...prev, newField]);
        setSelectedFieldId(newField.id);
        setDragFieldType(null);
    };

    const deleteField = (id: string) => {
        setPlacedFields(prev => prev.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    /* ── File Processing ── */
    const processFile = (file: File) => {
        if (!file.name.match(/\.(pdf|docx?|txt)$/i)) {
            toast.error('Please upload a PDF, Word, or Text document');
            return;
        }
        setIsProcessing(true);
        setTemplateName(file.name.replace(/\.[^/.]+$/, ''));
        setTimeout(() => {
            if (editor) {
                editor.commands.setContent(
                    `<h1>${file.name.replace(/\.[^/.]+$/, '')}</h1><p>Document content extracted from <strong>${file.name}</strong>. Edit this content and place signature fields where needed.</p><p></p>`
                );
            }
            setIsProcessing(false);
            setStep('editor');
            toast.success('Document loaded — now drag signature fields onto the document');
        }, 1500);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDropZone = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, []);

    const startFromTemplate = (template: typeof STARTER_TEMPLATES[0]) => {
        if (template.id !== 'blank') {
            setTemplateName(template.title);
            // Map starter template IDs to categories
            const categories: Record<string, string> = { nda: 'Legal', offer: 'HR', contract: 'Business' };
            setTemplateCategory(categories[template.id] || 'General');
        }
        if (editor && template.content) editor.commands.setContent(template.content);
        setStep('editor');
    };

    /* ── Editor Handlers ── */
    const handleSave = useCallback(async () => {
        if (!templateName || templateName === 'Untitled Template') {
            toast.error('Please name your template first');
            return;
        }
        if (!editor) return;

        setIsSaving(true);
        try {
            const htmlContent = editor.getHTML();
            const fieldsConfig = {
                recipients: recipients.map(r => ({
                    id: r.id,
                    name: r.name,
                    email: r.email,
                    role: r.role,
                    color: r.color,
                })),
                fields: placedFields.map(f => ({
                    id: f.id,
                    type: f.type,
                    label: f.label,
                    recipientId: f.recipientId,
                    x: f.x,
                    y: f.y,
                    width: f.width,
                    height: f.height,
                    required: f.required,
                    placeholder: f.placeholder,
                })),
            };

            if (isEditMode && editId) {
                await updateTemplate(editId, {
                    name: templateName,
                    category: templateCategory,
                    content: htmlContent,
                    fields_config: fieldsConfig,
                });
            } else {
                await createTemplate({
                    name: templateName,
                    category: templateCategory,
                    content: htmlContent,
                    fields_config: fieldsConfig,
                });
            }

            toast.success(`Template "${templateName}" ${isEditMode ? 'updated' : 'saved'} with ${placedFields.length} fields!`);
            setTimeout(() => navigate('/templates'), 600);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save template');
        } finally {
            setIsSaving(false);
        }
    }, [templateName, templateCategory, placedFields, recipients, editor, navigate]);

    const setFontSize = useCallback((size: string) => {
        setCurrentFontSize(size);
        const el = document.querySelector('.docs-editor') as HTMLElement;
        if (el) el.style.fontSize = `${size}pt`;
    }, []);

    const setFontFamilyHandler = useCallback((family: string) => {
        setCurrentFontFamily(family);
        editor?.chain().focus().setFontFamily(family).run();
    }, [editor]);

    const getCurrentHeading = (): string => {
        if (!editor) return 'paragraph';
        for (let i = 1; i <= 3; i++) {
            if (editor.isActive('heading', { level: i })) return String(i);
        }
        return 'paragraph';
    };

    const setHeading = (val: string) => {
        if (!editor) return;
        if (val === 'paragraph') editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({ level: parseInt(val) as 1 | 2 | 3 }).run();
    };

    const addLink = () => {
        if (!editor) return;
        const url = window.prompt('Enter URL:', editor.getAttributes('link').href || 'https://');
        if (url === null) return;
        if (url === '') { editor.chain().focus().unsetLink().run(); return; }
        editor.chain().focus().setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt('Enter image URL:');
        if (url) editor?.chain().focus().setImage({ src: url }).run();
    };

    const addTable = () => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    /* ── Stats ── */
    const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length ?? 0;
    const headingLabel = HEADING_OPTIONS.find(h => h.value === getCurrentHeading())?.label || 'Normal text';

    const fieldsForActiveRecipient = placedFields.filter(f => f.recipientId === activeRecipientId);

    /* ─────────────────────────────────────────────
       RENDER
       ───────────────────────────────────────────── */
    return (
        <TooltipProvider delayDuration={300}>
            <div className="min-h-screen bg-[#F9F9F7] flex flex-col font-sans">
                <AnimatePresence mode="wait">
                    {step === 'start' ? (
                        /* ═══════════════════════════════════
                           STEP 1: START / CHOOSE TEMPLATE
                           ═══════════════════════════════════ */
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="min-h-screen flex flex-col"
                        >
                            {/* Subtle top nav */}
                            <div className="px-6 pt-5 pb-0">
                                <button
                                    onClick={() => navigate('/templates')}
                                    className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors group"
                                >
                                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                                    Templates
                                </button>
                            </div>

                            {/* Centered content */}
                            <div className="flex-1 flex items-start justify-center pt-16 pb-20 px-6">
                                <div className="w-full max-w-lg">
                                    {/* Header */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05, duration: 0.3 }}
                                        className="mb-10"
                                    >
                                        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">New Template</h1>
                                        <p className="text-stone-500 text-sm mt-1">Pick a starting point for your document.</p>
                                    </motion.div>

                                    {/* Template options */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                        className="space-y-2 mb-8"
                                    >
                                        {STARTER_TEMPLATES.map((t, i) => (
                                            <motion.button
                                                key={t.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.12 + i * 0.04, duration: 0.25 }}
                                                onClick={() => startFromTemplate(t)}
                                                className={cn(
                                                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-150",
                                                    "bg-white border border-stone-200/80 hover:border-green-300 hover:shadow-sm",
                                                    "group active:scale-[0.995]"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                                    t.id === 'blank'
                                                        ? 'bg-stone-100 text-stone-400 group-hover:bg-green-50 group-hover:text-green-600'
                                                        : 'bg-green-50 text-green-600 group-hover:bg-green-100'
                                                )}>
                                                    <t.icon className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-stone-800 group-hover:text-stone-900">{t.title === 'Blank' ? 'Blank Document' : t.title}</p>
                                                    <p className="text-xs text-stone-400 mt-0.5 truncate">
                                                        {t.id === 'blank' && 'Start with an empty document'}
                                                        {t.id === 'nda' && 'Standard non-disclosure agreement'}
                                                        {t.id === 'offer' && 'Employee offer letter with terms'}
                                                        {t.id === 'contract' && 'Service agreement between parties'}
                                                    </p>
                                                </div>
                                                <ArrowLeft className="h-4 w-4 text-stone-300 rotate-180 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                            </motion.button>
                                        ))}
                                    </motion.div>

                                    {/* Divider */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3, duration: 0.3 }}
                                        className="flex items-center gap-3 mb-8"
                                    >
                                        <div className="flex-1 h-px bg-stone-200" />
                                        <span className="text-xs text-stone-400 font-medium">or upload a file</span>
                                        <div className="flex-1 h-px bg-stone-200" />
                                    </motion.div>

                                    {/* Upload zone */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35, duration: 0.3 }}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDropZone}
                                        className={cn(
                                            "relative rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer",
                                            isDragging
                                                ? "border-green-400 bg-green-50/60 scale-[1.01]"
                                                : "border-stone-200 hover:border-stone-300 bg-white/60"
                                        )}
                                        onClick={() => !isProcessing && fileInputRef.current?.click()}
                                    >
                                        {isProcessing ? (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                                                <Loader2 className="h-6 w-6 text-green-600 animate-spin mb-3" />
                                                <p className="text-sm font-medium text-stone-600">Processing document…</p>
                                                <p className="text-xs text-stone-400 mt-0.5">Extracting content</p>
                                            </motion.div>
                                        ) : (
                                            <>
                                                <Upload className={cn("h-5 w-5 mb-2.5 transition-colors", isDragging ? "text-green-500" : "text-stone-400")} />
                                                <p className="text-sm text-stone-600">
                                                    Drop a file here or <span className="text-green-600 font-medium hover:underline">browse</span>
                                                </p>
                                                <p className="text-xs text-stone-400 mt-1">PDF, DOCX, DOC, or TXT</p>
                                                <input ref={fileInputRef} type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" className="hidden" />
                                            </>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* ═══════════════════════════════════
                           STEP 2: TEMPLATE EDITOR + FIELDS
                           ═══════════════════════════════════ */
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-screen flex flex-col overflow-hidden"
                        >
                            {/* Loading overlay for edit mode */}
                            {isLoadingTemplate && (
                                <div className="absolute inset-0 z-50 bg-[#F9F9F7]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                                    <p className="text-sm font-medium text-stone-600">Loading template…</p>
                                </div>
                            )}

                            {/* ─── TOP BAR ─── */}
                            <div className="bg-white border-b border-stone-200 px-4 py-2 shrink-0 z-30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => navigate('/templates')} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 transition-colors">
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <input
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            className="text-base font-semibold text-stone-800 bg-transparent border-none outline-none hover:bg-stone-50 focus:bg-stone-50 focus:ring-1 focus:ring-green-500/40 px-2 py-0.5 rounded transition-all w-72"
                                            placeholder="Untitled Template"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-stone-400">{placedFields.length} fields placed</span>
                                    <Button onClick={handleSave} disabled={isSaving || isLoadingTemplate} className="bg-green-600 hover:bg-green-500 text-white text-sm h-9 px-5 rounded-full font-medium shadow-sm shadow-green-900/10 disabled:opacity-60">
                                        {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                                        {isSaving ? 'Saving…' : isEditMode ? 'Update Template' : 'Save Template'}
                                    </Button>
                                </div>
                            </div>

                            {/* ─── FORMATTING TOOLBAR ─── */}
                            <div className="bg-[#F9F9F7] border-b border-stone-200 px-3 py-1 shrink-0 z-20">
                                <div className="flex items-center gap-0.5 flex-wrap">
                                    <TBtn tip="Undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
                                        <Undo className="h-4 w-4" />
                                    </TBtn>
                                    <TBtn tip="Redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
                                        <Redo className="h-4 w-4" />
                                    </TBtn>

                                    <TDivider />

                                    {/* Zoom */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-7 px-2 text-xs text-stone-500 hover:bg-stone-100 rounded transition-colors flex items-center gap-1 min-w-[55px] justify-center">
                                                {zoom}%
                                                <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="min-w-[90px]">
                                            {[75, 90, 100, 125, 150].map(z => (
                                                <DropdownMenuItem key={z} onClick={() => setZoom(z)}>{z}%</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <TDivider />

                                    {/* Heading */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-7 px-2 text-xs text-stone-600 hover:bg-stone-100 rounded transition-colors flex items-center gap-1 min-w-[100px]">
                                                {headingLabel}
                                                <ChevronDown className="h-3 w-3 ml-auto" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="min-w-[160px]">
                                            {HEADING_OPTIONS.map(h => (
                                                <DropdownMenuItem key={h.value} onClick={() => setHeading(h.value)}
                                                    className={cn(
                                                        getCurrentHeading() === h.value && "bg-green-50",
                                                        h.value === '1' && "text-xl font-bold",
                                                        h.value === '2' && "text-lg font-bold",
                                                        h.value === '3' && "text-base font-semibold",
                                                    )}>
                                                    {h.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <TDivider />

                                    {/* Font Family */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-7 px-2 text-xs text-stone-600 hover:bg-stone-100 rounded transition-colors flex items-center gap-1 min-w-[90px]" style={{ fontFamily: currentFontFamily }}>
                                                {currentFontFamily}
                                                <ChevronDown className="h-3 w-3 ml-auto" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="min-w-[160px] max-h-[250px] overflow-y-auto">
                                            {FONT_FAMILIES.map(f => (
                                                <DropdownMenuItem key={f.value} onClick={() => setFontFamilyHandler(f.value)}
                                                    style={{ fontFamily: f.value }}
                                                    className={cn(currentFontFamily === f.value && "bg-green-50")}>
                                                    {f.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <TDivider />

                                    {/* Font Size */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-7 px-2 text-xs text-stone-500 hover:bg-stone-100 rounded transition-colors flex items-center gap-1 w-12 justify-center">
                                                {currentFontSize}
                                                <ChevronDown className="h-3 w-3" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="min-w-[60px] max-h-[200px] overflow-y-auto">
                                            {FONT_SIZES.map(s => (
                                                <DropdownMenuItem key={s} onClick={() => setFontSize(s)}>{s}</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <TDivider />

                                    <TBtn tip="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive('bold') ?? false}>
                                        <Bold className="h-4 w-4" />
                                    </TBtn>
                                    <TBtn tip="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive('italic') ?? false}>
                                        <Italic className="h-4 w-4" />
                                    </TBtn>
                                    <TBtn tip="Underline" onClick={() => editor?.chain().focus().toggleUnderline().run()} isActive={editor?.isActive('underline') ?? false}>
                                        <UnderlineIcon className="h-4 w-4" />
                                    </TBtn>

                                    {/* Text Color */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="h-7 w-7 rounded flex flex-col items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors gap-0">
                                                <Type className="h-3.5 w-3.5" />
                                                <div className="w-4 h-[3px] rounded-full -mt-0.5" style={{ backgroundColor: textColor }} />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2" align="start">
                                            <div className="flex gap-1 flex-wrap max-w-[160px]">
                                                {['#000000', '#434343', '#666666', '#999999', '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff'].map(c => (
                                                    <button key={c} className={cn("w-5 h-5 rounded-sm border border-gray-200 hover:scale-125 transition-transform", textColor === c && "ring-2 ring-green-500 ring-offset-1")}
                                                        style={{ backgroundColor: c }}
                                                        onClick={() => { setTextColor(c); editor?.chain().focus().setColor(c).run(); }}
                                                    />
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Highlight */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className={cn("h-7 w-7 rounded flex flex-col items-center justify-center gap-0",
                                                editor?.isActive('highlight') ? "bg-green-100 text-green-700" : "text-stone-500 hover:bg-stone-100"
                                            )}>
                                                <Highlighter className="h-3.5 w-3.5" />
                                                <div className="w-4 h-[3px] rounded-full -mt-0.5" style={{ backgroundColor: highlightColor === 'transparent' ? '#e5e7eb' : highlightColor }} />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2" align="start">
                                            <div className="flex gap-1.5">
                                                {HIGHLIGHT_COLORS.map((c, i) => (
                                                    <button key={`hl-${i}`}
                                                        className={cn("w-6 h-6 rounded-md border border-gray-200 hover:scale-110 transition-all",
                                                            highlightColor === c && "ring-2 ring-green-500 ring-offset-1",
                                                            c === 'transparent' && "flex items-center justify-center bg-white"
                                                        )}
                                                        style={{ backgroundColor: c === 'transparent' ? undefined : c }}
                                                        onClick={() => {
                                                            setHighlightColor(c);
                                                            if (c === 'transparent') editor?.chain().focus().unsetHighlight().run();
                                                            else editor?.chain().focus().toggleHighlight({ color: c }).run();
                                                        }}>
                                                        {c === 'transparent' && <span className="text-[10px] text-gray-400">✕</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <TDivider />

                                    <TBtn tip="Align left" onClick={() => editor?.chain().focus().setTextAlign('left').run()} isActive={editor?.isActive({ textAlign: 'left' }) ?? false}>
                                        <AlignLeft className="h-4 w-4" />
                                    </TBtn>
                                    <TBtn tip="Align center" onClick={() => editor?.chain().focus().setTextAlign('center').run()} isActive={editor?.isActive({ textAlign: 'center' }) ?? false}>
                                        <AlignCenter className="h-4 w-4" />
                                    </TBtn>
                                    <TBtn tip="Align right" onClick={() => editor?.chain().focus().setTextAlign('right').run()} isActive={editor?.isActive({ textAlign: 'right' }) ?? false}>
                                        <AlignRight className="h-4 w-4" />
                                    </TBtn>

                                    <TDivider />

                                    <TBtn tip="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={editor?.isActive('orderedList') ?? false}>
                                        <ListOrdered className="h-4 w-4" />
                                    </TBtn>
                                    <TBtn tip="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive('bulletList') ?? false}>
                                        <List className="h-4 w-4" />
                                    </TBtn>

                                    <TDivider />

                                    <TBtn tip="Insert link" onClick={addLink} isActive={editor?.isActive('link') ?? false}>
                                        <Link2 className="h-4 w-4" />
                                    </TBtn>
                                    <TBtn tip="Insert image" onClick={addImage}>
                                        <ImageIcon className="h-4 w-4" />
                                    </TBtn>
                                    <TBtn tip="Insert table" onClick={addTable}>
                                        <TableIcon className="h-4 w-4" />
                                    </TBtn>

                                    <TDivider />

                                    <TBtn tip="Clear formatting" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}>
                                        <RemoveFormatting className="h-4 w-4" />
                                    </TBtn>

                                    {/* Overflow */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-7 w-7 rounded flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleStrike().run()}>
                                                <Strikethrough className="h-4 w-4 mr-2" /> Strikethrough
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
                                                <Quote className="h-4 w-4 mr-2" /> Blockquote
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
                                                <Code className="h-4 w-4 mr-2" /> Code block
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
                                                <Minus className="h-4 w-4 mr-2" /> Horizontal rule
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* ─── MAIN CONTENT: SIDEBAR + CANVAS ─── */}
                            <div className="flex-1 flex overflow-hidden">

                                {/* ─── LEFT SIDEBAR: Recipients & Fields ─── */}
                                <div className="w-72 bg-white border-r border-stone-200 flex flex-col shrink-0 z-10">
                                    {/* Sidebar Tabs */}
                                    <div className="flex border-b border-stone-200">
                                        <button
                                            onClick={() => setSidebarTab('fields')}
                                            className={cn("flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                                                sidebarTab === 'fields' ? "text-green-600 border-b-2 border-green-500" : "text-stone-400 hover:text-stone-600"
                                            )}>
                                            Fields
                                        </button>
                                        <button
                                            onClick={() => setSidebarTab('recipients')}
                                            className={cn("flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                                                sidebarTab === 'recipients' ? "text-green-600 border-b-2 border-green-500" : "text-stone-400 hover:text-stone-600"
                                            )}>
                                            Recipients
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        <AnimatePresence mode="wait">
                                            {sidebarTab === 'fields' ? (
                                                <motion.div
                                                    key="fields-tab"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    className="p-3 space-y-4"
                                                >
                                                    {/* Active recipient indicator */}
                                                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium", getRecipientColor(activeRecipientId).bg, getRecipientColor(activeRecipientId).text)}>
                                                        <div className={cn("w-2.5 h-2.5 rounded-full", getRecipientColor(activeRecipientId).dot)} />
                                                        Placing fields for: {activeRecipient.name}
                                                    </div>

                                                    {/* Drag instruction */}
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg">
                                                        <MousePointerClick className="h-4 w-4 text-stone-400 shrink-0" />
                                                        <p className="text-[11px] text-stone-500">Drag fields onto the document</p>
                                                    </div>

                                                    {/* Signature Fields */}
                                                    <div>
                                                        <h3 className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">Signature</h3>
                                                        <div className="space-y-1.5">
                                                            {FIELD_TYPES.filter(f => ['signature', 'initials', 'stamp'].includes(f.type)).map(f => (
                                                                <FieldItem key={f.type} {...f} onDragStart={handleFieldDragStart} />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Auto-fill Fields */}
                                                    <div>
                                                        <h3 className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">Auto-fill</h3>
                                                        <div className="space-y-1.5">
                                                            {FIELD_TYPES.filter(f => ['name', 'email', 'company', 'title', 'date'].includes(f.type)).map(f => (
                                                                <FieldItem key={f.type} {...f} onDragStart={handleFieldDragStart} />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Input Fields */}
                                                    <div>
                                                        <h3 className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">Input</h3>
                                                        <div className="space-y-1.5">
                                                            {FIELD_TYPES.filter(f => ['text', 'checkbox'].includes(f.type)).map(f => (
                                                                <FieldItem key={f.type} {...f} onDragStart={handleFieldDragStart} />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Placed fields summary */}
                                                    {fieldsForActiveRecipient.length > 0 && (
                                                        <div className="border-t border-stone-100 pt-3">
                                                            <h3 className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">
                                                                Placed ({fieldsForActiveRecipient.length})
                                                            </h3>
                                                            <div className="space-y-1">
                                                                {fieldsForActiveRecipient.map(f => {
                                                                    const def = FIELD_TYPES.find(ft => ft.type === f.type);
                                                                    const Icon = def?.icon || Type;
                                                                    const color = getRecipientColor(f.recipientId);
                                                                    return (
                                                                        <div key={f.id}
                                                                            onClick={() => setSelectedFieldId(f.id)}
                                                                            className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors",
                                                                                selectedFieldId === f.id ? `${color.bg} ${color.border} border` : "hover:bg-stone-50"
                                                                            )}>
                                                                            <Icon className={cn("h-3.5 w-3.5", color.text)} />
                                                                            <span className="text-stone-600 truncate">{f.label}</span>
                                                                            {f.required && <span className="text-red-500 text-[10px]">*</span>}
                                                                            <button onClick={(e) => { e.stopPropagation(); deleteField(f.id); }} className="ml-auto text-stone-300 hover:text-red-500 transition-colors">
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="recipients-tab"
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    className="p-3 space-y-3"
                                                >
                                                    <p className="text-[11px] text-stone-500 px-1">
                                                        Add recipients who need to sign or fill this template. Each recipient gets a unique color.
                                                    </p>

                                                    {recipients.map((r, idx) => {
                                                        const color = RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length];
                                                        const fieldCount = placedFields.filter(f => f.recipientId === r.id).length;
                                                        return (
                                                            <div key={r.id}
                                                                onClick={() => setActiveRecipientId(r.id)}
                                                                className={cn(
                                                                    "rounded-lg border-2 p-3 transition-all cursor-pointer",
                                                                    activeRecipientId === r.id
                                                                        ? `${color.border} ${color.bg} shadow-sm`
                                                                        : "border-stone-200 hover:border-stone-300"
                                                                )}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className={cn("w-3 h-3 rounded-full", color.dot)} />
                                                                    <span className="text-xs font-semibold text-stone-700 flex-1">{r.role} {idx + 1}</span>
                                                                    <span className="text-[10px] text-stone-400">{fieldCount} fields</span>
                                                                    {recipients.length > 1 && (
                                                                        <button onClick={(e) => { e.stopPropagation(); removeRecipient(r.id); }}
                                                                            className="p-0.5 text-stone-300 hover:text-red-500 transition-colors">
                                                                            <X className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    value={r.name}
                                                                    onChange={(e) => updateRecipient(r.id, { name: e.target.value })}
                                                                    placeholder="Recipient name"
                                                                    className="h-8 text-xs mb-1.5 bg-white/70"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <Input
                                                                    value={r.email}
                                                                    onChange={(e) => updateRecipient(r.id, { email: e.target.value })}
                                                                    placeholder="email@example.com"
                                                                    type="email"
                                                                    className="h-8 text-xs bg-white/70"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <div className="mt-2">
                                                                    <select
                                                                        value={r.role}
                                                                        onChange={(e) => updateRecipient(r.id, { role: e.target.value })}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-full h-8 text-xs border border-stone-200 rounded-md px-2 bg-white/70 text-stone-600 focus:outline-none focus:ring-1 focus:ring-green-500/40"
                                                                    >
                                                                        <option value="Signer">Signer</option>
                                                                        <option value="Reviewer">Reviewer</option>
                                                                        <option value="Approver">Approver</option>
                                                                        <option value="CC">CC (Copy)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    <button onClick={addRecipient}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-stone-300 text-stone-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50/30 transition-all text-xs font-medium">
                                                        <UserPlus className="h-4 w-4" />
                                                        Add Recipient
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* ─── DOCUMENT CANVAS ─── */}
                                <div className="flex-1 overflow-y-auto bg-stone-100" onClick={() => setSelectedFieldId(null)}>
                                    <div className="py-6 flex justify-center min-h-full">
                                        <div
                                            ref={canvasRef}
                                            onDragOver={handleCanvasDragOver}
                                            onDrop={handleCanvasDrop}
                                            className="relative bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] rounded-sm"
                                            style={{
                                                width: '816px',
                                                minHeight: '1056px',
                                                zoom: `${zoom}%`,
                                            }}
                                        >
                                            {/* TipTap Editor */}
                                            <EditorContent editor={editor} />

                                            {/* Placed Signature Fields Overlay */}
                                            {placedFields.map(field => (
                                                <PlacedFieldComponent
                                                    key={field.id}
                                                    field={field}
                                                    recipientColor={getRecipientColor(field.recipientId)}
                                                    isSelected={selectedFieldId === field.id}
                                                    onSelect={() => setSelectedFieldId(field.id)}
                                                    onDelete={() => deleteField(field.id)}
                                                    onDragStart={(e) => handlePlacedFieldDragStart(e, field.id)}
                                                />
                                            ))}

                                            {/* Drop hint overlay */}
                                            {dragFieldType && (
                                                <div className="absolute inset-0 bg-green-50/10 border-2 border-dashed border-green-300/40 rounded-sm pointer-events-none z-40 flex items-center justify-center">
                                                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-green-200 text-sm text-green-700 font-medium">
                                                        Drop field here
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ─── RIGHT PANEL: Field Properties ─── */}
                                <AnimatePresence>
                                    {selectedFieldId && (() => {
                                        const field = placedFields.find(f => f.id === selectedFieldId);
                                        if (!field) return null;
                                        const fieldDef = FIELD_TYPES.find(ft => ft.type === field.type);
                                        const Icon = fieldDef?.icon || Type;
                                        const color = getRecipientColor(field.recipientId);
                                        const recipient = recipients.find(r => r.id === field.recipientId);

                                        return (
                                            <motion.div
                                                key="properties"
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: 260, opacity: 1 }}
                                                exit={{ width: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="bg-white border-l border-stone-200 overflow-hidden shrink-0"
                                            >
                                                <div className="w-[260px] p-4 space-y-4">
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Settings2 className="h-4 w-4 text-stone-400" />
                                                            <span className="text-sm font-semibold text-stone-700">Field Properties</span>
                                                        </div>
                                                        <button onClick={() => setSelectedFieldId(null)} className="p-1 hover:bg-stone-100 rounded transition-colors">
                                                            <X className="h-4 w-4 text-stone-400" />
                                                        </button>
                                                    </div>

                                                    {/* Field type */}
                                                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", color.bg)}>
                                                        <Icon className={cn("h-4 w-4", color.text)} />
                                                        <span className={cn("text-sm font-medium", color.text)}>{field.label}</span>
                                                    </div>

                                                    {/* Assigned to */}
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Assigned to</label>
                                                        <select
                                                            value={field.recipientId}
                                                            onChange={(e) => {
                                                                setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, recipientId: e.target.value } : f));
                                                            }}
                                                            className="w-full h-8 mt-1 text-xs border border-stone-200 rounded-md px-2 bg-white text-stone-600 focus:outline-none focus:ring-1 focus:ring-green-500/40"
                                                        >
                                                            {recipients.map((r, idx) => (
                                                                <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Label */}
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Label</label>
                                                        <Input
                                                            value={field.label}
                                                            onChange={(e) => {
                                                                setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, label: e.target.value } : f));
                                                            }}
                                                            className="h-8 text-xs mt-1"
                                                        />
                                                    </div>

                                                    {/* Required toggle */}
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs text-stone-600">Required</label>
                                                        <button
                                                            onClick={() => {
                                                                setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, required: !f.required } : f));
                                                            }}
                                                            className={cn(
                                                                "relative w-9 h-5 rounded-full transition-colors",
                                                                field.required ? "bg-green-500" : "bg-stone-200"
                                                            )}>
                                                            <div className={cn(
                                                                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                                                                field.required ? "translate-x-4" : "translate-x-0.5"
                                                            )} />
                                                        </button>
                                                    </div>

                                                    {/* Size */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Width</label>
                                                            <Input
                                                                type="number"
                                                                value={field.width}
                                                                onChange={(e) => {
                                                                    const w = Math.max(24, parseInt(e.target.value) || 24);
                                                                    setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, width: w } : f));
                                                                }}
                                                                className="h-8 text-xs mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Height</label>
                                                            <Input
                                                                type="number"
                                                                value={field.height}
                                                                onChange={(e) => {
                                                                    const h = Math.max(20, parseInt(e.target.value) || 20);
                                                                    setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, height: h } : f));
                                                                }}
                                                                className="h-8 text-xs mt-1"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Position */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">X pos</label>
                                                            <Input
                                                                type="number"
                                                                value={Math.round(field.x)}
                                                                onChange={(e) => {
                                                                    setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, x: parseInt(e.target.value) || 0 } : f));
                                                                }}
                                                                className="h-8 text-xs mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Y pos</label>
                                                            <Input
                                                                type="number"
                                                                value={Math.round(field.y)}
                                                                onChange={(e) => {
                                                                    setPlacedFields(prev => prev.map(f => f.id === field.id ? { ...f, y: parseInt(e.target.value) || 0 } : f));
                                                                }}
                                                                className="h-8 text-xs mt-1"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Delete */}
                                                    <button onClick={() => deleteField(field.id)}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs font-medium mt-4">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete Field
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </div>

                            {/* ─── STATUS BAR ─── */}
                            <div className="bg-[#F9F9F7] border-t border-stone-200 px-4 py-1 flex items-center justify-between text-[11px] text-stone-500 shrink-0 z-20">
                                <div className="flex items-center gap-4">
                                    <span>{wordCount} words</span>
                                    <span>{placedFields.length} signature fields</span>
                                    <span>{recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setZoom(Math.max(zoom - 10, 50))} className="hover:bg-stone-100 p-0.5 rounded transition-colors">
                                            <ZoomOut className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="min-w-[36px] text-center">{zoom}%</span>
                                        <button onClick={() => setZoom(Math.min(zoom + 10, 200))} className="hover:bg-stone-100 p-0.5 rounded transition-colors">
                                            <ZoomIn className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </TooltipProvider>
    );
}
