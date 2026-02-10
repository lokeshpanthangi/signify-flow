
import React, { useState } from 'react';
import { MoreVertical, FileText, Calendar, Download, Share2, Trash2, Copy } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Template } from '@/data/mockData';

interface DocumentTemplateCardProps {
    template: Template;
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
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-border bg-card h-[320px] flex flex-col"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Document Preview Area */}
            <div className="relative bg-gradient-to-br from-stone-100 via-white to-stone-50 p-6 flex-1 overflow-hidden">
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 30px)`,
                    }} />
                </div>

                {/* Document Icon Header */}
                <div className="relative flex items-center justify-between mb-4 z-10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-white shadow-sm text-stone-700 border border-stone-100">
                            <FileText className="w-4 h-4" />
                        </div>
                        {template.category && (
                            <Badge variant="secondary" className="text-[10px] bg-white/80 backdrop-blur-sm border-stone-200 text-stone-600">
                                {template.category}
                            </Badge>
                        )}
                    </div>

                    {/* Options Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 hover:bg-black/5 transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                            >
                                <MoreVertical className="h-4 w-4 text-stone-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={onDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onShare}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDuplicate}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Actual Text Preview */}
                <CardContent className="p-0 relative z-0 h-full">
                    <div className="w-full bg-white shadow-sm border border-gray-100 p-4 min-h-[160px] text-[7px] leading-relaxed text-stone-500 font-serif overflow-hidden select-none">
                        <p className="whitespace-pre-wrap">{template.content}</p>
                    </div>
                </CardContent>

                {/* Hover Overlay Effect */}
                <div
                    className={`absolute inset-0 bg-gradient-to-t from-white/20 to-transparent transition-opacity duration-300 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'
                        }`}
                />
            </div>

            {/* Footer with Document Info */}
            <CardFooter className="flex flex-col items-start gap-1 p-4 bg-white border-t border-stone-100 relative z-20">
                <h3 className="font-semibold text-sm text-stone-800 line-clamp-1 w-full" title={template.name}>
                    {template.name}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>Created {template.dateCreated}</span>
                </div>
            </CardFooter>

            {/* Subtle Border Glow on Hover */}
            <div
                className={`absolute inset-0 rounded-xl border-2 border-green-500/20 transition-opacity duration-300 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
            />
        </Card>
    );
};
