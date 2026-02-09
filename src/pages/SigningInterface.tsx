import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Type, PenLine, Calendar, AlignLeft, Check } from 'lucide-react';
import { SignaturePlaceholder } from '@/data/mockData';
import SignatureModal from '@/components/SignatureModal';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const tools = [
  { type: 'signature' as const, icon: PenLine, label: 'Signature' },
  { type: 'initial' as const, icon: Type, label: 'Initial' },
  { type: 'date' as const, icon: Calendar, label: 'Date' },
  { type: 'text' as const, icon: AlignLeft, label: 'Text' },
];

const loremLines = [
  'MUTUAL NON-DISCLOSURE AGREEMENT',
  '',
  'This Mutual Non-Disclosure Agreement ("Agreement") is entered into',
  'as of the date last signed below (the "Effective Date") by and between',
  'Party A ("Disclosing Party") and Party B ("Receiving Party").',
  '',
  '1. DEFINITION OF CONFIDENTIAL INFORMATION',
  '"Confidential Information" means any data or information, oral or written,',
  'treated as confidential that relates to either party\'s past, present,',
  'or reasonably anticipated products, services, customers, or business.',
  '',
  '2. OBLIGATIONS OF RECEIVING PARTY',
  'The Receiving Party agrees to hold and maintain the Confidential',
  'Information in strictest confidence for the sole and exclusive benefit',
  'of the Disclosing Party. The Receiving Party shall not, without prior',
  'written approval, use for Receiving Party\'s benefit, publish, copy, or',
  'otherwise disclose to others, or permit the use by others for their',
  'benefit or to the detriment of the Disclosing Party.',
  '',
  '3. TIME PERIODS',
  'The nondisclosure provisions of this Agreement shall survive the',
  'termination of this Agreement and Receiving Party\'s duty to hold',
  'Confidential Information in confidence shall remain in effect until',
  'such information no longer qualifies as a trade secret.',
  '',
  '4. GOVERNING LAW',
  'This Agreement and all acts and transactions pursuant hereto and the',
  'rights and obligations of the parties hereto shall be governed by the',
  'laws of the State of Delaware, without giving effect to principles of',
  'conflict of law provisions thereof.',
  '',
  '',
  'AGREED AND ACCEPTED:',
  '',
  'Signature: _________________________     Date: ______________',
  '',
  'Name: _________________________',
];

const SigningInterface = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [placeholders, setPlaceholders] = useState<SignaturePlaceholder[]>([]);
  const [selectedTool, setSelectedTool] = useState<SignaturePlaceholder['type'] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTool) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPlaceholder: SignaturePlaceholder = {
      id: Date.now().toString(),
      type: selectedTool,
      x,
      y,
      value: selectedTool === 'date' ? new Date().toLocaleDateString() : undefined,
    };

    if (selectedTool === 'signature' || selectedTool === 'initial') {
      setPlaceholders((prev) => [...prev, newPlaceholder]);
      setActiveId(newPlaceholder.id);
      setShowModal(true);
    } else if (selectedTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        setPlaceholders((prev) => [...prev, { ...newPlaceholder, value: text }]);
      }
    } else {
      setPlaceholders((prev) => [...prev, newPlaceholder]);
    }
  };

  const handleSignatureApply = (value: string, type: 'draw' | 'type') => {
    setPlaceholders((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, value, signatureType: type } : p))
    );
  };

  const handlePlaceholderClick = (e: React.MouseEvent, ph: SignaturePlaceholder) => {
    e.stopPropagation();
    if (ph.type === 'signature' || ph.type === 'initial') {
      setActiveId(ph.id);
      setShowModal(true);
    }
  };

  const handleFinish = () => {
    toast({
      title: '✅ Document Signed Successfully',
      description: 'The signed document has been saved and sent to all parties.',
    });
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="flex h-screen flex-col bg-muted">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <span className="text-sm font-medium text-foreground">Document #{id}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            Tools
          </Button>
          <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={handleFinish}>
            <Check className="mr-1 h-4 w-4" /> Finish
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Tool palette */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 200 : 0, opacity: sidebarOpen ? 1 : 0 }}
          className="flex-shrink-0 overflow-hidden border-r border-border bg-card"
        >
          <div className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fields</h3>
            <div className="space-y-1">
              {tools.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => setSelectedTool(selectedTool === tool.type ? null : tool.type)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedTool === tool.type
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <tool.icon className="h-4 w-4" />
                  {tool.label}
                </button>
              ))}
            </div>
            {selectedTool && (
              <p className="mt-4 text-xs text-muted-foreground">
                Click anywhere on the document to place a <strong>{selectedTool}</strong> field.
              </p>
            )}
          </div>
        </motion.aside>

        {/* Document canvas */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto max-w-3xl">
            <div
              className={`relative rounded-lg border border-border bg-card p-8 shadow-sm lg:p-12 ${
                selectedTool ? 'cursor-crosshair' : ''
              }`}
              onClick={handleCanvasClick}
              style={{ minHeight: '900px' }}
            >
              {/* Mock document text */}
              <div className="select-none space-y-1 font-mono text-sm leading-relaxed text-foreground/80">
                {loremLines.map((line, i) => (
                  <p key={i} className={line === loremLines[0] ? 'text-center text-base font-bold text-foreground' : ''}>
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>

              {/* Placed fields */}
              {placeholders.map((ph) => (
                <div
                  key={ph.id}
                  className="absolute cursor-pointer"
                  style={{ left: ph.x, top: ph.y, transform: 'translate(-50%, -50%)' }}
                  onClick={(e) => handlePlaceholderClick(e, ph)}
                >
                  {ph.value && ph.type === 'signature' && (ph as any).signatureType !== 'type' && ph.value.startsWith('data:') ? (
                    <img src={ph.value} alt="Signature" className="h-12 border-b-2 border-primary" />
                  ) : ph.value && ph.type === 'signature' ? (
                    <span className="border-b-2 border-primary font-cursive text-2xl text-foreground">{ph.value}</span>
                  ) : ph.value ? (
                    <span className="rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-sm text-foreground">
                      {ph.value}
                    </span>
                  ) : (
                    <div className="flex h-10 items-center gap-1 rounded border-2 border-dashed border-primary/50 bg-primary/5 px-3 text-xs font-medium text-primary">
                      {ph.type === 'signature' && <PenLine className="h-3 w-3" />}
                      {ph.type === 'initial' && <Type className="h-3 w-3" />}
                      Click to sign
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SignatureModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onApply={handleSignatureApply}
      />
    </div>
  );
};

export default SigningInterface;
