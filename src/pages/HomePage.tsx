import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Send,
    PenTool,
    MoreHorizontal,
    Search
} from 'lucide-react';
import { mockSentDocuments, mockReceivedDocuments, Document } from '@/data/mockData';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/DashboardLayout';

// --- Components ---

const ActionCard = ({
    icon: Icon,
    label,
    onClick
}: {
    icon: any,
    label: string,
    onClick: () => void
}) => (
    <motion.button
        whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)" }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex flex-col items-center justify-center w-64 h-48 bg-white border border-stone-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 group"
    >
        <Icon className="h-10 w-10 text-stone-600 mb-4 group-hover:text-green-600 transition-colors" />
        <span className="text-lg font-medium text-stone-800">{label}</span>
    </motion.button>
);

// A visual representation of a document page with real text
const DocumentPreview = () => (
    <div className="w-full h-64 bg-white p-6 relative overflow-hidden flex flex-col gap-3 shadow-inner">
        {/* Real Mock Text */}
        <div className="space-y-4 opacity-70 select-none pointer-events-none">
            <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-800 mb-1">Non-Disclosure Agreement</h4>
                <div className="h-[1px] w-full bg-stone-200 mb-2" />
            </div>

            <p className="text-[7px] leading-relaxed text-stone-500 font-serif text-justify">
                This Agreement is entered into by and between the parties ("Disclosing Party") and ("Receiving Party") for the purpose of preventing the unauthorized disclosure of Confidential Information as defined below. The parties agree to enter into a confidential relationship with respect to the disclosure of certain proprietary and confidential information ("Confidential Information").
            </p>

            <p className="text-[7px] leading-relaxed text-stone-500 font-serif text-justify">
                1. <strong>Definition of Confidential Information.</strong> For purposes of this Agreement, "Confidential Information" shall include all information or material that has or could have commercial value or other utility in the business in which Disclosing Party is engaged. If Confidential Information is in written form, the Disclosing Party shall label or stamp the materials with the word "Confidential" or some similar warning.
            </p>

            <p className="text-[7px] leading-relaxed text-stone-500 font-serif text-justify">
                2. <strong>Exclusions from Confidential Information.</strong> Receiving Party's obligations under this Agreement do not extend to information that is publicly known at the time of disclosure or subsequently becomes publicly known through no fault of the Receiving Party.
            </p>
        </div>

        {/* Signature area mock */}
        <div className="absolute bottom-12 right-6 w-20">
            <div className="h-[1px] bg-stone-800 mb-1 w-full" />
            <p className="text-[6px] text-stone-400 font-serif text-center uppercase tracking-widest">Signature</p>

            {/* Fake signature scribble */}
            <svg className="absolute -top-6 left-0 w-full h-8 text-blue-900 opacity-60" viewBox="0 0 100 40">
                <path d="M5,25 Q20,10 40,25 T90,15" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        </div>
    </div>
);

const DocumentCard = ({ doc, onClick }: { doc: Document, onClick: () => void }) => {
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
            className="group relative flex flex-col bg-white border border-stone-200/60 rounded-xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg"
            onClick={onClick}
        >
            <DocumentPreview />

            {/* Blurred Glass Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/60 backdrop-blur-md border-t border-white/20 flex flex-col justify-center px-5 transition-all group-hover:bg-white/80">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                        <h3 className="font-semibold text-stone-800 text-sm truncate" title={doc.name}>{doc.name}</h3>
                        <p className="text-[10px] text-stone-600 font-medium mt-0.5">
                            {doc.dateModified} • <span className={cn(
                                "uppercase tracking-wide font-bold",
                                doc.status === 'signed' ? "text-green-600" :
                                    doc.status === 'pending' ? "text-amber-600" : "text-red-500"
                            )}>{doc.status}</span>
                        </p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 hover:bg-black/5 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4 text-stone-600" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem>Open</DropdownMenuItem>
                            <DropdownMenuItem>Share</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    );
};

// --- Home Page ---

const HomePage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSentDocs = useMemo(() => {
        return mockSentDocuments.filter(doc =>
            doc.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const filteredReceivedDocs = useMemo(() => {
        return mockReceivedDocuments.filter(doc =>
            doc.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    return (
        <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
            {/* Action Cards */}
            <div className="flex flex-wrap gap-8 mb-16 justify-start">
                <ActionCard
                    icon={Send}
                    label="Send for signatures"
                    onClick={() => navigate('/sign/new?type=send')}
                />
                <ActionCard
                    icon={PenTool}
                    label="Sign yourself"
                    onClick={() => navigate('/sign/new?type=self')}
                />
            </div>

            {/* Documents Grid - Sent */}
            {filteredSentDocs.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-medium text-stone-700 font-sans">Sent Documents</h2>
                        <button
                            onClick={() => navigate('/documents')}
                            className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                            View all
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredSentDocs.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                onClick={() => navigate(`/sign/${doc.id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Documents Grid - Received */}
            {filteredReceivedDocs.length > 0 && (
                <section className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-medium text-stone-700 font-sans">Shared with me</h2>
                            <span className="bg-stone-200 text-stone-600 text-xs font-bold px-2 py-0.5 rounded-full">{filteredReceivedDocs.length}</span>
                        </div>
                        <button
                            onClick={() => navigate('/documents')}
                            className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                            View all
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredReceivedDocs.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                onClick={() => navigate(`/sign/${doc.id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {filteredSentDocs.length === 0 && filteredReceivedDocs.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 mt-20">
                    <Search className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No documents found</p>
                    <p className="text-sm">Try searching for something else</p>
                </div>
            )}
        </DashboardLayout>
    );
};

export default HomePage;
