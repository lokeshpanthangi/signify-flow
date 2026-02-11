import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Upload, FileText, Save, Loader2,
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Redo, Undo,
    Minus, Quote, Code, Subscript, Superscript,
    Type, Palette, Highlighter, Image as ImageIcon,
    Link2, Table as TableIcon, Pilcrow,
    ChevronDown, Printer, Download, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

// --- Toolbar Button ---
const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    title,
    children
}: {
    onClick: () => void,
    isActive?: boolean,
    disabled?: boolean,
    title: string,
    children: React.ReactNode
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={cn(
            "p-1.5 rounded-md transition-all duration-150 flex items-center justify-center",
            isActive
                ? "bg-stone-200 text-stone-900 shadow-inner"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            disabled && "opacity-30 cursor-not-allowed"
        )}
    >
        {children}
    </button>
);

const ToolbarDivider = () => (
    <div className="w-px h-6 bg-stone-200 mx-1 shrink-0" />
);

// --- Toolbar Select ---
const ToolbarSelect = ({ value, onChange, options, title, width = 'w-28' }: {
    value: string,
    onChange: (val: string) => void,
    options: { value: string, label: string }[],
    title: string,
    width?: string
}) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={title}
        className={cn(
            "h-7 text-xs font-medium text-stone-700 bg-white border border-stone-200 rounded px-2 py-0 cursor-pointer hover:bg-stone-50 focus:outline-none focus:ring-1 focus:ring-green-500/30 transition-all",
            width
        )}
    >
        {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
);

// --- Color Picker Button ---
const ColorButton = ({ color, onChange, title, icon: Icon }: {
    color: string,
    onChange: (color: string) => void,
    title: string,
    icon: any
}) => (
    <div className="relative group">
        <button title={title} className="p-1.5 rounded-md text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-all flex items-center gap-0.5">
            <Icon className="h-4 w-4" />
            <div className="w-4 h-1 rounded-full mt-0.5" style={{ backgroundColor: color || '#000' }} />
        </button>
        <input
            type="color"
            value={color || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title={title}
        />
    </div>
);

// --- Font sizes (points) ---
const FONT_SIZES = [
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
    { value: '12', label: '12' },
    { value: '14', label: '14' },
    { value: '16', label: '16' },
    { value: '18', label: '18' },
    { value: '20', label: '20' },
    { value: '24', label: '24' },
    { value: '28', label: '28' },
    { value: '32', label: '32' },
    { value: '36', label: '36' },
    { value: '48', label: '48' },
    { value: '72', label: '72' },
];

const FONT_FAMILIES = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Garamond', label: 'Garamond' },
    { value: 'Palatino', label: 'Palatino' },
];

const HEADING_OPTIONS = [
    { value: 'paragraph', label: 'Normal Text' },
    { value: '1', label: 'Heading 1' },
    { value: '2', label: 'Heading 2' },
    { value: '3', label: 'Heading 3' },
    { value: '4', label: 'Heading 4' },
    { value: '5', label: 'Heading 5' },
    { value: '6', label: 'Heading 6' },
];

const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa'];

// --- Main Component ---

export default function CreateTemplate() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'upload' | 'editor'>('upload');
    const [isProcessing, setIsProcessing] = useState(false);
    const [templateName, setTemplateName] = useState('Untitled Document');
    const [textColor, setTextColor] = useState('#000000');
    const [highlightColor, setHighlightColor] = useState('#fef08a');
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);
    const [currentFontSize, setCurrentFontSize] = useState('12');
    const [currentFontFamily, setCurrentFontFamily] = useState('Inter');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4, 5, 6] },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            UnderlineExt,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            FontFamily,
            ImageExt,
            LinkExt.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder: 'Start typing your document...' }),
            SubScript,
            SuperScript,
            TableExt.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-stone max-w-none focus:outline-none min-h-[800px] px-16 py-12 text-stone-800 leading-relaxed',
                style: 'font-size: 12pt; font-family: Inter, sans-serif;',
            },
        },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
            toast.error('Please upload a PDF or Word document');
            return;
        }

        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setTemplateName(file.name.replace(/\.[^/.]+$/, ""));
            if (editor) {
                editor.commands.setContent(`
          <h1>Non-Disclosure Agreement</h1>
          <p>This Agreement is made on <strong>[Date]</strong> between <strong>[Party A]</strong> and <strong>[Party B]</strong>.</p>
          <h2>1. Confidentiality</h2>
          <p>The parties agree to maintain the confidentiality of all information shared during the course of this agreement. This includes, but is not limited to, trade secrets, business plans, customer data, and financial information.</p>
          <h2>2. Term</h2>
          <p>This agreement shall remain in effect for a period of <strong>[Duration]</strong> from the effective date, unless terminated earlier by mutual written consent.</p>
          <h2>3. Obligations</h2>
          <ul>
            <li>Both parties shall use reasonable efforts to protect confidential information.</li>
            <li>Information shall not be disclosed to third parties without prior written consent.</li>
            <li>All materials containing confidential information must be returned upon termination.</li>
          </ul>
          <h2>4. Signatures</h2>
          <p><em>Signatures of both parties are required below to make this agreement binding.</em></p>
          <p>&nbsp;</p>
          <p>_______________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _______________________</p>
          <p><strong>[Party A Name]</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>[Party B Name]</strong></p>
        `);
            }
            setStep('editor');
            toast.success('Document processed successfully');
        }, 1500);
    };

    const handleSave = () => {
        if (!templateName || templateName === 'Untitled Document') {
            toast.error('Please enter a template name');
            return;
        }
        toast.success('Template saved successfully!');
        setTimeout(() => navigate('/dashboard?tab=templates'), 1000);
    };

    const setFontSize = useCallback((size: string) => {
        setCurrentFontSize(size);
        if (editor) {
            editor.chain().focus().selectAll().run();
            // Apply font size using style
            const el = document.querySelector('.ProseMirror') as HTMLElement;
            if (el) el.style.fontSize = `${size}pt`;
        }
    }, [editor]);

    const setFontFamilyHandler = useCallback((family: string) => {
        setCurrentFontFamily(family);
        if (editor) {
            editor.chain().focus().setFontFamily(family).run();
        }
    }, [editor]);

    const getCurrentHeading = (): string => {
        if (!editor) return 'paragraph';
        for (let i = 1; i <= 6; i++) {
            if (editor.isActive('heading', { level: i })) return String(i);
        }
        return 'paragraph';
    };

    const setHeading = (val: string) => {
        if (!editor) return;
        if (val === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        } else {
            editor.chain().focus().toggleHeading({ level: parseInt(val) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
        }
    };

    const addLink = () => {
        if (!editor) return;
        const url = window.prompt('Enter URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        if (!editor) return;
        const url = window.prompt('Enter image URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const addTable = () => {
        if (!editor) return;
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    // Word count
    const wordCount = editor?.storage?.characterCount?.words?.() ??
        (editor?.getText().split(/\s+/).filter(Boolean).length ?? 0);
    const charCount = editor?.getText().length ?? 0;

    return (
        <div className="min-h-screen bg-[#e8e8e8] flex flex-col">
            <AnimatePresence mode="wait">
                {step === 'upload' ? (
                    <motion.div
                        key="upload-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="min-h-screen bg-[#F9F9F7] flex flex-col items-center justify-center p-8"
                    >
                        <div className="max-w-lg w-full">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center text-stone-500 hover:text-stone-800 transition-colors mb-8"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </button>

                            <h1 className="text-3xl font-serif text-stone-800 mb-2">Create Template</h1>
                            <p className="text-stone-500 mb-8">Upload a document or start from scratch.</p>

                            <div className="bg-white rounded-xl border-2 border-dashed border-stone-300 p-12 flex flex-col items-center justify-center text-center hover:border-green-400 hover:bg-green-50/5 transition-all">
                                {isProcessing ? (
                                    <div className="flex flex-col items-center animate-pulse">
                                        <Loader2 className="h-10 w-10 text-green-600 animate-spin mb-4" />
                                        <p className="text-lg font-medium text-stone-600">Extracting text...</p>
                                        <p className="text-sm text-stone-400 mt-1">This might take a few seconds</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                                            <Upload className="h-8 w-8 text-stone-400" />
                                        </div>
                                        <h2 className="text-xl font-medium text-stone-800 mb-2">Upload Document</h2>
                                        <p className="text-stone-500 mb-8 max-w-md text-sm">
                                            Drag and drop your PDF or Word document here, or click to browse. We'll extract the text for you to edit.
                                        </p>
                                        <div className="relative">
                                            <input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <Button variant="outline" className="pointer-events-none">Choose File</Button>
                                        </div>
                                        <div className="mt-8 pt-8 border-t border-stone-100 w-full max-w-xs">
                                            <p className="text-xs text-stone-400 uppercase tracking-widest mb-4">Or start blank</p>
                                            <Button variant="ghost" className="w-full" onClick={() => setStep('editor')}>
                                                <FileText className="h-4 w-4 mr-2" />
                                                Create Blank Template
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="editor-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-screen flex flex-col bg-[#e8e8e8]"
                    >
                        {/* ===== TOP MENU BAR (Like Word's Title Bar) ===== */}
                        <div className="bg-white border-b border-stone-200 px-4 py-1.5 flex items-center justify-between shrink-0 shadow-sm z-20">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="p-1.5 rounded hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
                                    title="Back to Dashboard"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-green-600 rounded-md flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <input
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            className="text-sm font-semibold text-stone-800 bg-transparent border-none outline-none hover:bg-stone-50 focus:bg-stone-50 px-1.5 py-0.5 rounded transition-colors w-64"
                                            placeholder="Untitled Document"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSave}
                                    className="text-xs text-stone-600 hover:text-stone-900 gap-1.5"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    Save
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1.5 shadow-md"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Save as Template
                                </Button>
                            </div>
                        </div>

                        {/* ===== FORMATTING TOOLBAR (Like Word's Ribbon) ===== */}
                        <div className="bg-[#f8f9fa] border-b border-stone-200 px-4 py-1 shrink-0 z-10">
                            {/* Row 1: Main formatting */}
                            <div className="flex items-center gap-1 flex-wrap">
                                {/* Undo / Redo */}
                                <ToolbarButton title="Undo (Ctrl+Z)" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
                                    <Undo className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Redo (Ctrl+Y)" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
                                    <Redo className="h-4 w-4" />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* Heading Selector */}
                                <ToolbarSelect
                                    value={getCurrentHeading()}
                                    onChange={setHeading}
                                    options={HEADING_OPTIONS}
                                    title="Text Style"
                                    width="w-32"
                                />

                                <ToolbarDivider />

                                {/* Font Family */}
                                <ToolbarSelect
                                    value={currentFontFamily}
                                    onChange={setFontFamilyHandler}
                                    options={FONT_FAMILIES}
                                    title="Font Family"
                                    width="w-36"
                                />

                                {/* Font Size */}
                                <ToolbarSelect
                                    value={currentFontSize}
                                    onChange={setFontSize}
                                    options={FONT_SIZES}
                                    title="Font Size"
                                    width="w-16"
                                />

                                <ToolbarDivider />

                                {/* Bold, Italic, Underline, Strikethrough */}
                                <ToolbarButton title="Bold (Ctrl+B)" onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive('bold') ?? false}>
                                    <Bold className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Italic (Ctrl+I)" onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive('italic') ?? false}>
                                    <Italic className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Underline (Ctrl+U)" onClick={() => editor?.chain().focus().toggleUnderline().run()} isActive={editor?.isActive('underline') ?? false}>
                                    <UnderlineIcon className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Strikethrough" onClick={() => editor?.chain().focus().toggleStrike().run()} isActive={editor?.isActive('strike') ?? false}>
                                    <Strikethrough className="h-4 w-4" />
                                </ToolbarButton>

                                {/* Subscript / Superscript */}
                                <ToolbarButton title="Subscript" onClick={() => editor?.chain().focus().toggleSubscript().run()} isActive={editor?.isActive('subscript') ?? false}>
                                    <Subscript className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Superscript" onClick={() => editor?.chain().focus().toggleSuperscript().run()} isActive={editor?.isActive('superscript') ?? false}>
                                    <Superscript className="h-4 w-4" />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* Text Color */}
                                <ColorButton color={textColor} onChange={(c) => { setTextColor(c); editor?.chain().focus().setColor(c).run(); }} title="Text Color" icon={Type} />

                                {/* Highlight Color */}
                                <div className="relative">
                                    <button
                                        title="Highlight"
                                        onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                                        className={cn(
                                            "p-1.5 rounded-md text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-all flex items-center gap-0.5",
                                            editor?.isActive('highlight') && "bg-stone-200"
                                        )}
                                    >
                                        <Highlighter className="h-4 w-4" />
                                        <div className="w-4 h-1 rounded-full mt-0.5" style={{ backgroundColor: highlightColor }} />
                                    </button>
                                    {showHighlightPicker && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-xl p-2 flex gap-1.5 z-50">
                                            {HIGHLIGHT_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    className="w-6 h-6 rounded border border-stone-200 hover:scale-110 transition-transform"
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => {
                                                        setHighlightColor(c);
                                                        editor?.chain().focus().toggleHighlight({ color: c }).run();
                                                        setShowHighlightPicker(false);
                                                    }}
                                                />
                                            ))}
                                            <button
                                                className="w-6 h-6 rounded border border-stone-200 hover:scale-110 transition-transform flex items-center justify-center text-[10px] text-stone-400"
                                                onClick={() => { editor?.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}
                                                title="Remove Highlight"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <ToolbarDivider />

                                {/* Alignment */}
                                <ToolbarButton title="Align Left" onClick={() => editor?.chain().focus().setTextAlign('left').run()} isActive={editor?.isActive({ textAlign: 'left' }) ?? false}>
                                    <AlignLeft className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Align Center" onClick={() => editor?.chain().focus().setTextAlign('center').run()} isActive={editor?.isActive({ textAlign: 'center' }) ?? false}>
                                    <AlignCenter className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Align Right" onClick={() => editor?.chain().focus().setTextAlign('right').run()} isActive={editor?.isActive({ textAlign: 'right' }) ?? false}>
                                    <AlignRight className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Justify" onClick={() => editor?.chain().focus().setTextAlign('justify').run()} isActive={editor?.isActive({ textAlign: 'justify' }) ?? false}>
                                    <AlignJustify className="h-4 w-4" />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* Lists */}
                                <ToolbarButton title="Bullet List" onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive('bulletList') ?? false}>
                                    <List className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Numbered List" onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={editor?.isActive('orderedList') ?? false}>
                                    <ListOrdered className="h-4 w-4" />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* Insert Elements */}
                                <ToolbarButton title="Insert Link" onClick={addLink} isActive={editor?.isActive('link') ?? false}>
                                    <Link2 className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Insert Image" onClick={addImage}>
                                    <ImageIcon className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Insert Table" onClick={addTable}>
                                    <TableIcon className="h-4 w-4" />
                                </ToolbarButton>

                                <ToolbarDivider />

                                {/* Block Elements */}
                                <ToolbarButton title="Block Quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={editor?.isActive('blockquote') ?? false}>
                                    <Quote className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Code Block" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} isActive={editor?.isActive('codeBlock') ?? false}>
                                    <Code className="h-4 w-4" />
                                </ToolbarButton>
                                <ToolbarButton title="Horizontal Rule" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
                                    <Minus className="h-4 w-4" />
                                </ToolbarButton>
                            </div>
                        </div>

                        {/* ===== DOCUMENT CANVAS ===== */}
                        <div className="flex-1 overflow-y-auto py-8 px-4">
                            <div className="max-w-[816px] mx-auto bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] min-h-[1056px]">
                                {/* The TipTap Editor */}
                                <EditorContent editor={editor} />
                            </div>
                        </div>

                        {/* ===== STATUS BAR (Like Word's Bottom Bar) ===== */}
                        <div className="bg-[#f8f9fa] border-t border-stone-200 px-4 py-1.5 flex items-center justify-between text-[11px] text-stone-500 shrink-0 z-10">
                            <div className="flex items-center gap-4">
                                <span>{wordCount} words</span>
                                <span>{charCount} characters</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span>English (US)</span>
                                <span className="text-green-600 font-medium">● Editing</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
