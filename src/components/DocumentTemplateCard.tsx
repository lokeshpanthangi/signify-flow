
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, FileText, Pencil, Download, Share2, Trash2, Copy, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TemplateData } from '@/lib/api/templates';

interface DocumentTemplateCardProps {
    template: TemplateData;
    onDownload?: () => void;
    onShare?: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
}

export const DocumentTemplateCard: React.FC<DocumentTemplateCardProps> = ({
    template,
    onDownload = () => console.log('Download clicked'),
    onShare = () => console.log('Share clicked'),
    onDuplicate = () => console.log('Duplicate clicked'),
    onDelete = () => console.log('Delete clicked'),
}) => {
    const navigate = useNavigate();

    const fieldCount = template.fields_config?.fields?.length ?? 0;
    const createdDate = new Date(template.created_at).toLocaleDateString();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{
                y: -8,
                scale: 1.02,
                boxShadow: "0 20px 40px -15px rgba(0,0,0,0.2)"
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="group relative flex flex-col bg-white dark:bg-[#18181F] border border-stone-200/60 dark:border-[#2A2A32] rounded-xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg"
            onClick={() => navigate(`/view-template/${template.id}`)}
        >
            {/* Content Preview */}
            <div className="w-full h-64 bg-white dark:bg-[#1A1A1F] p-6 relative overflow-hidden shadow-inner">
                {template.content ? (
                    <div
                        className="prose prose-stone max-w-none pointer-events-none select-none opacity-70"
                        style={{ fontSize: '7px', lineHeight: '1.5', transform: 'scale(1)', transformOrigin: 'top left' }}
                        dangerouslySetInnerHTML={{ __html: template.content }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <FileText className="h-12 w-12 text-stone-200 dark:text-stone-600" />
                    </div>
                )}
            </div>

            {/* Glass Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/60 dark:bg-[#18181F]/80 backdrop-blur-md border-t border-white/20 dark:border-[#2A2A32] flex flex-col justify-center px-5 transition-all group-hover:bg-white/80 dark:group-hover:bg-[#18181F]/90">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                        <h3 className="font-semibold text-stone-800 dark:text-white text-sm truncate" title={template.name}>{template.name}</h3>
                        <p className="text-[10px] text-stone-600 dark:text-stone-400 font-medium mt-0.5">
                            {createdDate}
                            {fieldCount > 0 && (
                                <span className="ml-1">
                                    • <PenTool className="inline h-2.5 w-2.5 -mt-px" /> {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                                </span>
                            )}
                            {template.category && (
                                <span className="ml-1 uppercase tracking-wide font-bold text-stone-400">• {template.category}</span>
                            )}
                        </p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4 text-stone-600 dark:text-stone-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44" onClick={e => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => navigate(`/edit-template/${template.id}`)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDownload}>
                                <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onShare}>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDuplicate}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    );
};
