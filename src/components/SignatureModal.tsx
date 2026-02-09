import { useState } from 'react';
import { motion } from 'framer-motion';
import DrawingCanvas from '@/components/DrawingCanvas';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (value: string, type: 'draw' | 'type') => void;
}

const SignatureModal = ({ open, onClose, onApply }: SignatureModalProps) => {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground">Add Your Signature</h2>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted p-1">
          {(['draw', 'type', 'upload'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'draw' && (
          <DrawingCanvas onSave={(dataUrl) => { onApply(dataUrl, 'draw'); onClose(); }} />
        )}

        {tab === 'type' && (
          <div className="space-y-4">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full name"
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
              <span className="font-cursive text-3xl text-foreground">{typedName || 'Preview'}</span>
            </div>
            <button
              onClick={() => { if (typedName.trim()) { onApply(typedName, 'type'); onClose(); } }}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
              Apply Signature
            </button>
          </div>
        )}

        {tab === 'upload' && (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted">
            <p className="text-sm text-muted-foreground">Upload feature coming soon</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SignatureModal;
