import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle, PenLine, Check, FileText, Lock } from 'lucide-react';
import SignatureModal from '@/components/SignatureModal';
import { toast } from 'sonner';
import { getPublicTemplate, submitSignFormResponse, PublicTemplateData } from '@/lib/api/signforms';
import { cn } from '@/lib/utils';

/* ─── Constants ─── */
const A4_WIDTH = 816;
const A4_HEIGHT = 1056;

/* Minimal color map for recipient field overlays */
const RECIPIENT_HEX: Record<string, string> = {};
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

/* ═════════════════════════════════════════════════════════════════════════════
   SIGNING INTERFACE
   ═════════════════════════════════════════════════════════════════════════════ */
const SigningInterface = () => {
    const { id: urlSlug } = useParams(); // url slug, NOT uuid
    const [searchParams] = useSearchParams();
    const signerName = searchParams.get('signerName') || '';
    const signerEmail = searchParams.get('signerEmail') || '';

    /* ── State ── */
    const [template, setTemplate] = useState<PublicTemplateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
    const [showSigModal, setShowSigModal] = useState(false);
    const [activeSignatureFieldId, setActiveSignatureFieldId] = useState<string | null>(null);

    /* ── Load template ── */
    useEffect(() => {
        if (!urlSlug) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await getPublicTemplate(urlSlug);
                if (cancelled) return;
                setTemplate(data);

                // Build recipient color map
                if (data.fields_config) {
                    data.fields_config.recipients.forEach((r, i) => {
                        RECIPIENT_HEX[r.id] = COLORS[i % COLORS.length];
                    });
                }

                // Auto-fill certain field types
                if (data.fields_config) {
                    const myRecipient = data.fields_config.recipients.find(
                        r => r.email.toLowerCase().trim() === signerEmail.toLowerCase().trim()
                    );
                    if (myRecipient) {
                        const auto: Record<string, string> = {};
                        for (const field of data.fields_config.fields) {
                            if (field.recipientId !== myRecipient.id) continue;
                            if (field.type === 'name') auto[field.id] = signerName;
                            if (field.type === 'email') auto[field.id] = signerEmail;
                            if (field.type === 'date' || field.type === 'signdate')
                                auto[field.id] = new Date().toLocaleDateString();
                        }
                        setFieldValues(auto);
                    }
                }
            } catch (err: unknown) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load document');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [urlSlug, signerEmail, signerName]);

    /* ── Derived data ── */
    const myRecipient = useMemo(() => {
        if (!template?.fields_config) return null;
        return template.fields_config.recipients.find(
            r => r.email.toLowerCase().trim() === signerEmail.toLowerCase().trim()
        ) || null;
    }, [template, signerEmail]);

    const myFields = useMemo(() => {
        if (!template?.fields_config || !myRecipient) return [];
        return template.fields_config.fields.filter(f => f.recipientId === myRecipient.id);
    }, [template, myRecipient]);

    const otherFields = useMemo(() => {
        if (!template?.fields_config || !myRecipient) return [];
        return template.fields_config.fields.filter(f => f.recipientId !== myRecipient.id);
    }, [template, myRecipient]);

    const allFields = useMemo(() => template?.fields_config?.fields || [], [template]);

    const requiredDone = useMemo(() => {
        const required = myFields.filter(f => f.required);
        if (required.length === 0) return true;
        return required.every(f => {
            const v = fieldValues[f.id];
            if (f.type === 'checkbox') return v === true;
            return v !== undefined && v !== null && String(v).trim() !== '';
        });
    }, [myFields, fieldValues]);

    const filledCount = useMemo(() => {
        return myFields.filter(f => {
            const v = fieldValues[f.id];
            if (f.type === 'checkbox') return v === true;
            return v !== undefined && v !== null && String(v).trim() !== '';
        }).length;
    }, [myFields, fieldValues]);

    /* ── Handlers ── */
    const handleFieldChange = useCallback((fieldId: string, value: string | boolean) => {
        setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    }, []);

    const handleSignatureClick = useCallback((fieldId: string) => {
        setActiveSignatureFieldId(fieldId);
        setShowSigModal(true);
    }, []);

    const handleSignatureApply = useCallback((value: string, _type: 'draw' | 'type') => {
        if (activeSignatureFieldId) {
            setFieldValues(prev => ({ ...prev, [activeSignatureFieldId]: value }));
        }
        setShowSigModal(false);
        setActiveSignatureFieldId(null);
        toast.success('Signature captured');
    }, [activeSignatureFieldId]);

    const handleSubmit = useCallback(async () => {
        if (!urlSlug || !requiredDone) return;
        setSubmitting(true);
        try {
            await submitSignFormResponse(urlSlug, {
                signer_name: signerName,
                signer_email: signerEmail,
                field_values: fieldValues,
                recipient_id: myRecipient?.id,
            });
            setCompleted(true);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to submit signature');
        } finally {
            setSubmitting(false);
        }
    }, [urlSlug, signerName, signerEmail, fieldValues, myRecipient, requiredDone]);

    /* ══════════════ Render States ══════════════ */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] dark:bg-[#0E0E13]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-3" />
                    <p className="text-sm text-stone-500 dark:text-stone-400">Loading document…</p>
                </div>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] dark:bg-[#0E0E13]">
                <div className="text-center p-8">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full inline-block mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-stone-800 dark:text-white mb-2">Unable to Load Document</h1>
                    <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm">{error || 'The document could not be loaded.'}</p>
                </div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] dark:bg-[#0E0E13]">
                <div className="text-center p-8 max-w-md">
                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-full inline-block mb-5">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800 dark:text-white mb-2">Document Signed!</h1>
                    <p className="text-stone-500 dark:text-stone-400 mb-2">Your signature has been recorded.</p>
                    <p className="text-xs text-stone-400">You may close this tab. All parties will be notified.</p>
                </div>
            </div>
        );
    }

    /* ═══════════════ Main Signing UI ═══════════════ */
    const fieldsToShow = myRecipient ? myFields : allFields;

    return (
        <div className="min-h-screen bg-[#F9F9F7] dark:bg-[#0E0E13] flex flex-col">
            {/* ─── Header ─── */}
            <header className="bg-white dark:bg-[#111114] border-b border-stone-200 dark:border-[#2A2A32] px-5 py-3 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-stone-800 dark:text-white">{template.template_name}</p>
                        <p className="text-[11px] text-stone-400">Signing as {signerName} ({signerEmail})</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Progress indicator */}
                    <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mr-2">
                        <span className="font-medium">{filledCount}/{myFields.length}</span>
                        <span>fields completed</span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!requiredDone || submitting}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                            requiredDone && !submitting
                                ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                            : "bg-stone-200 dark:bg-white/10 text-stone-400 cursor-not-allowed"
                        )}
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4" />
                        )}
                        {submitting ? 'Submitting…' : 'Finish & Submit'}
                    </button>
                </div>
            </header>

            {/* ─── Info Banner ─── */}
            {myFields.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/30 px-5 py-2 text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                    <PenLine className="h-3.5 w-3.5" />
                    <span>
                        {requiredDone
                            ? 'All required fields are filled. You can submit your signature.'
                            : `Please fill in all highlighted fields below (${filledCount}/${myFields.length} done).`}
                    </span>
                </div>
            )}

            {!myRecipient && signerEmail && (
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-2 text-xs text-amber-700 flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Your email wasn't matched to a recipient. You can view but not edit fields.</span>
                </div>
            )}

            {/* ─── Document Canvas ─── */}
            <div className="flex-1 overflow-auto py-6">
                <div
                    className="relative mx-auto bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] rounded-sm"
                    style={{ width: A4_WIDTH, minHeight: A4_HEIGHT }}
                >
                    {/* Render document HTML content */}
                    {template.content && (
                        <div
                            className="prose prose-stone max-w-none px-16 py-12"
                            style={{ fontFamily: 'Inter, sans-serif', fontSize: '11pt', lineHeight: '1.75' }}
                            dangerouslySetInnerHTML={{ __html: template.content }}
                        />
                    )}

                    {/* Render OTHER recipients' fields as ghost overlays */}
                    {myRecipient && otherFields.map(field => (
                        <div
                            key={field.id}
                            className="absolute rounded border border-dashed border-stone-200 bg-stone-50/40 flex items-center justify-center"
                            style={{
                                left: field.x,
                                top: field.y,
                                width: field.width,
                                height: field.height,
                            }}
                        >
                            <span className="text-[9px] text-stone-300 truncate px-1">
                                {field.label}
                            </span>
                        </div>
                    ))}

                    {/* Render MY fields (interactive) */}
                    {fieldsToShow.map(field => {
                        const value = fieldValues[field.id];
                        const color = RECIPIENT_HEX[field.recipientId] || '#22c55e';
                        const isSignature = field.type === 'signature' || field.type === 'initials';
                        const isCheckbox = field.type === 'checkbox';
                        const isMine = !!myRecipient;
                        const isFilled = isCheckbox ? value === true : value && String(value).trim() !== '';

                        return (
                            <div
                                key={field.id}
                                className={cn(
                                    "absolute rounded transition-all",
                                    isMine && !isFilled && "animate-pulse",
                                    isFilled ? "ring-1 ring-green-400" : "ring-2",
                                )}
                                style={{
                                    left: field.x,
                                    top: field.y,
                                    width: field.width,
                                    height: field.height,
                                    borderColor: color,
                                    borderWidth: 2,
                                    borderStyle: 'solid',
                                    backgroundColor: isFilled ? 'rgba(34,197,94,0.06)' : `${color}10`,
                                    ringColor: color,
                                }}
                            >
                                {/* Signature / Initials */}
                                {isSignature && (
                                    <button
                                        onClick={() => isMine && handleSignatureClick(field.id)}
                                        disabled={!isMine}
                                        className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-green-50/50 transition-colors"
                                    >
                                        {value ? (
                                            typeof value === 'string' && value.startsWith('data:') ? (
                                                <img
                                                    src={value}
                                                    alt="Signature"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            ) : (
                                                <span className="font-cursive text-lg text-stone-800">{String(value)}</span>
                                            )
                                        ) : (
                                            <span className="text-[10px] font-medium flex items-center gap-1" style={{ color }}>
                                                <PenLine className="h-3 w-3" />
                                                {field.type === 'initials' ? 'Click to initial' : 'Click to sign'}
                                            </span>
                                        )}
                                    </button>
                                )}

                                {/* Checkbox */}
                                {isCheckbox && (
                                    <button
                                        onClick={() => isMine && handleFieldChange(field.id, !value)}
                                        disabled={!isMine}
                                        className="w-full h-full flex items-center justify-center cursor-pointer"
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                            value ? "bg-green-600 border-green-600" : "border-stone-300"
                                        )}>
                                            {value && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                    </button>
                                )}

                                {/* Text-like fields */}
                                {!isSignature && !isCheckbox && (
                                    <input
                                        type="text"
                                        value={value !== undefined && value !== null ? String(value) : ''}
                                        onChange={e => isMine && handleFieldChange(field.id, e.target.value)}
                                        readOnly={!isMine}
                                        placeholder={field.placeholder || field.label}
                                        className="w-full h-full px-2 text-xs bg-transparent outline-none text-stone-800 placeholder-stone-300"
                                    />
                                )}

                                {/* Field label tooltip */}
                                <div
                                    className="absolute -top-5 left-0 text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                                    style={{ backgroundColor: color, color: '#fff' }}
                                >
                                    {field.label}{field.required ? ' *' : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── Bottom bar (mobile friendly) ─── */}
            <div className="sm:hidden bg-white dark:bg-[#111114] border-t border-stone-200 dark:border-[#2A2A32] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                    <Lock className="h-3 w-3" />
                    <span>Secure signing</span>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!requiredDone || submitting}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        requiredDone && !submitting
                            ? "bg-green-600 text-white"
                            : "bg-stone-200 text-stone-400 cursor-not-allowed"
                    )}
                >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Submit
                </button>
            </div>

            {/* ─── Signature Modal ─── */}
            <SignatureModal
                open={showSigModal}
                onClose={() => { setShowSigModal(false); setActiveSignatureFieldId(null); }}
                onApply={handleSignatureApply}
            />
        </div>
    );
};

export default SigningInterface;
