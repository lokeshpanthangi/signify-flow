import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2,
    Bold, Italic, Underline as UnderlineIcon,
    Heading1, Heading2, Heading3,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
    ImagePlus, FileUp, Undo2, Redo2, Minus, FileText,
    Type, Pilcrow,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExt from '@tiptap/extension-image';
import UnderlineExt from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { extractFileContent, ACCEPT_STRING } from '@/lib/fileExtractor';
import { createDocument, updateDocument, getDocument } from '@/lib/api/documents';


/* ─── Toolbar Button ─── */
const ToolbarBtn = ({
    icon: Icon,
    label,
    isActive = false,
    onClick,
    disabled = false,
}: {
    icon: React.ElementType;
    label: string;
    isActive?: boolean;
    onClick: () => void;
    disabled?: boolean;
}) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button
                onClick={onClick}
                disabled={disabled}
                className={cn(
                    'p-1.5 rounded transition-colors',
                    isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10 hover:text-stone-700 dark:hover:text-stone-200',
                    disabled && 'opacity-30 pointer-events-none',
                )}
            >
                <Icon className="h-4 w-4" />
            </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
            {label}
        </TooltipContent>
    </Tooltip>
);

const ToolbarSep = () => <div className="w-px h-5 bg-stone-200 dark:bg-[#2A2A32] mx-1" />;


/* ═══════════════════════════════
   CREATE DOCUMENT PAGE
   ═══════════════════════════════ */
export default function CreateDocument() {
    const navigate = useNavigate();
    const { id: editId } = useParams<{ id?: string }>();
    const isEditMode = Boolean(editId);

    const [docName, setDocName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isLoading, setIsLoading] = useState(Boolean(editId));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            UnderlineExt,
            ImageExt.configure({ inline: false, allowBase64: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({
                placeholder: 'Start writing your document here…',
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-stone max-w-none focus:outline-none min-h-[800px] px-16 py-12',
                style: 'font-family: Inter, sans-serif; font-size: 11pt; line-height: 1.75;',
            },
        },
    });

    /* ── Load existing document in edit mode ── */
    useEffect(() => {
        if (!editId || !editor) return;
        let cancelled = false;
        const loadDoc = async () => {
            setIsLoading(true);
            try {
                const data = await getDocument(editId);
                if (cancelled) return;
                setDocName(data.name);
                editor.commands.setContent(data.content || '');
            } catch (err: unknown) {
                toast.error((err as Error).message || 'Failed to load document');
                navigate('/documents');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        loadDoc();
        return () => { cancelled = true; };
    }, [editId, editor, navigate]);

    /* ── Import file content into editor ── */
    const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        setIsExtracting(true);
        try {
            const result = await extractFileContent(file);
            if (result.success && result.html) {
                // Append extracted content to editor
                const currentContent = editor.getHTML();
                if (currentContent === '<p></p>' || !currentContent.trim()) {
                    editor.commands.setContent(result.html);
                } else {
                    editor.commands.setContent(currentContent + '<hr/>' + result.html);
                }
                if (!docName) setDocName(file.name.replace(/\.[^/.]+$/, ''));
                toast.success(`Content extracted from ${file.name}`);
            } else {
                toast.error(result.error || 'Could not extract content from this file');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to process file');
        } finally {
            setIsExtracting(false);
            // Reset input so the same file can be re-uploaded
            e.target.value = '';
        }
    }, [editor, docName]);

    /* ── Insert image ── */
    const handleInsertImage = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Enter image URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    /* ── Save ── */
    const handleSave = useCallback(async () => {
        if (!editor) return;
        if (!docName.trim()) {
            toast.error('Please enter a document name');
            return;
        }

        const content = editor.getHTML();
        if (!content.trim() || content === '<p></p>') {
            toast.error('Document is empty');
            return;
        }

        setIsSaving(true);
        try {
            if (isEditMode && editId) {
                await updateDocument(editId, { name: docName, content });
                toast.success(`Document "${docName}" updated!`);
            } else {
                await createDocument({ name: docName, content, status: 'draft' });
                toast.success(`Document "${docName}" saved!`);
            }
            setTimeout(() => navigate('/documents'), 400);
        } catch (err: unknown) {
            toast.error((err as Error).message || 'Failed to save document');
        } finally {
            setIsSaving(false);
        }
    }, [editor, docName, navigate, isEditMode, editId]);

    if (!editor) return null;

    return (
        <TooltipProvider delayDuration={200}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-[#F9F9F7] dark:bg-[#0E0E13] flex flex-col"
            >
                {/* ─── Top Bar ─── */}
                <div className="bg-white dark:bg-[#111114] border-b border-stone-200 dark:border-[#2A2A32] px-5 py-2.5 flex items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/documents')}
                            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-stone-400 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="w-7 h-7 rounded bg-green-600 flex items-center justify-center">
                            <FileText className="h-3.5 w-3.5 text-white" />
                        </div>
                        <Input
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder="Untitled Document"
                            className="border-none shadow-none h-8 text-sm font-medium text-stone-800 dark:text-white max-w-xs focus-visible:ring-0 px-1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="text-sm h-9 px-4 gap-2"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isExtracting}
                        >
                            {isExtracting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileUp className="h-4 w-4" />
                            )}
                            {isExtracting ? 'Extracting…' : 'Import file'}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-500 text-white text-sm h-9 px-5 gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isSaving ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileImport}
                        accept={ACCEPT_STRING}
                        className="hidden"
                    />
                </div>

                {/* ─── Toolbar ─── */}
                <div className="bg-white dark:bg-[#111114] border-b border-stone-200 dark:border-[#2A2A32] px-5 py-1.5 flex items-center gap-0.5 shrink-0 z-10 overflow-x-auto">
                    <ToolbarBtn icon={Undo2} label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} />
                    <ToolbarBtn icon={Redo2} label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} />
                    <ToolbarSep />

                    <ToolbarBtn icon={Pilcrow} label="Paragraph" isActive={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} />
                    <ToolbarBtn icon={Heading1} label="Heading 1" isActive={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
                    <ToolbarBtn icon={Heading2} label="Heading 2" isActive={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
                    <ToolbarBtn icon={Heading3} label="Heading 3" isActive={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
                    <ToolbarSep />

                    <ToolbarBtn icon={Bold} label="Bold" isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
                    <ToolbarBtn icon={Italic} label="Italic" isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
                    <ToolbarBtn icon={UnderlineIcon} label="Underline" isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
                    <ToolbarBtn icon={Type} label="Strikethrough" isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
                    <ToolbarSep />

                    <ToolbarBtn icon={AlignLeft} label="Align Left" isActive={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
                    <ToolbarBtn icon={AlignCenter} label="Align Center" isActive={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
                    <ToolbarBtn icon={AlignRight} label="Align Right" isActive={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
                    <ToolbarSep />

                    <ToolbarBtn icon={List} label="Bullet List" isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
                    <ToolbarBtn icon={ListOrdered} label="Ordered List" isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
                    <ToolbarSep />

                    <ToolbarBtn icon={Minus} label="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
                    <ToolbarBtn icon={ImagePlus} label="Insert Image" onClick={handleInsertImage} />
                </div>

                {/* ─── Editor Area ─── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-[816px] mx-auto my-8 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] rounded-sm min-h-[1056px]">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </motion.div>
        </TooltipProvider>
    );
}
