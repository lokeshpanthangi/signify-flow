import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, PenLine, Check } from 'lucide-react';
import SignatureModal from '@/components/SignatureModal';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const documentSections = [
  {
    title: 'Service Partnership Agreement',
    subtitle: 'Digital Services and Delivery Terms',
    meta: ['Version 2.1', 'Prepared February 14, 2026'],
  },
  {
    heading: '1. Scope of Work',
    body: [
      'Provider will design, implement, and maintain the agreed deliverables outlined in Appendix A. Work includes discovery, prototyping, implementation, QA, and deployment assistance.',
      'Any items outside of Appendix A require written approval and may be subject to additional fees and timeline adjustments.',
    ],
  },
  {
    heading: '2. Timeline and Delivery',
    body: [
      'Project commences within five business days of signature. Estimated completion is eight weeks from the start date, subject to timely client feedback.',
      'Milestones and review windows are listed in Appendix B. Delays in feedback extend the delivery schedule accordingly.',
    ],
  },
  {
    heading: '3. Fees and Payment',
    body: [
      'Total project fee is $48,000 USD. Payment terms are 40% upfront, 30% at mid‑project delivery, and 30% upon final acceptance.',
      'Late payments accrue 1.5% monthly interest or the maximum permitted by law, whichever is lower.',
    ],
  },
  {
    heading: '4. Confidentiality',
    body: [
      'Each party agrees to protect non‑public information and use it solely for the purpose of this agreement.',
      'Confidentiality obligations survive termination for a period of three years.',
    ],
  },
  {
    heading: '5. Intellectual Property',
    body: [
      'Upon full payment, Client receives a perpetual license to use the deliverables. Provider retains ownership of pre‑existing tools and frameworks.',
      'Open‑source components remain under their respective licenses.',
    ],
  },
  {
    heading: '6. Termination',
    body: [
      'Either party may terminate with 14 days written notice. Client will pay for work completed to date.',
      'All confidential information must be returned or destroyed upon termination.',
    ],
  },
  {
    heading: 'Signatures',
    body: [
      'By signing, both parties acknowledge and accept the terms of this agreement.',
    ],
  },
];

const SigningInterface = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const signRequired = Boolean(searchParams.get('fromForm'));
  const signerName = searchParams.get('signerName');

  useEffect(() => {
    if (signerName) {
      setTimeout(() => {
        toast({
          title: `Welcome, ${signerName}`,
          description: 'Please sign the document where indicated.',
        });
      }, 500);
    }
  }, [signerName, toast]);

  const [showModal, setShowModal] = useState(false);
  const [signatureValue, setSignatureValue] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);

  const handleSignatureApply = (value: string, type: 'draw' | 'type') => {
    setSignatureValue(value);
    setSignatureType(type);
    setSignedAt(new Date().toLocaleString());
    toast({
      title: 'Signature captured',
      description: 'You can finish once you are ready.',
    });
  };

  const handleFinish = () => {
    if (signRequired && !signatureValue) {
      toast({
        title: 'Signature required',
        description: 'Please add your signature before finishing.',
      });
      return;
    }
    toast({
      title: '✅ Document Signed Successfully',
      description: 'The signed document has been saved and sent to all parties.',
    });
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.28),transparent_60%)]" />
          <div className="absolute top-40 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),transparent_65%)]" />
          <div className="absolute bottom-[-180px] left-[-120px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18),transparent_65%)]" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0f1a]/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Document</p>
                <p className="text-sm font-semibold text-white/90">SP-2026-{String(id).padStart(4, '0')}</p>
              </div>
            </div>
            {signRequired && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/10"
                  onClick={() => setShowModal(true)}
                >
                  <PenLine className="mr-1 h-4 w-4" /> Sign
                </Button>
                <Button
                  size="sm"
                  className="bg-cyan-400 text-slate-900 hover:bg-cyan-300"
                  onClick={handleFinish}
                  disabled={!signatureValue}
                >
                  <Check className="mr-1 h-4 w-4" /> Finish
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:px-8 lg:py-10">
          {signRequired && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70 backdrop-blur">
              {signatureValue ? (
                <span>
                  Signature captured{signatureType ? ` (${signatureType})` : ''}{signedAt ? ` on ${signedAt}` : ''}.
                </span>
              ) : (
                <span>Review the document, then click Sign to add your signature.</span>
              )}
            </div>
          )}

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-1 shadow-[0_20px_60px_rgba(2,6,23,0.45)] backdrop-blur">
            <div className="rounded-[24px] bg-gradient-to-br from-white/95 via-white/90 to-white/80 p-6 text-slate-900 shadow-inner sm:p-10">
              <div className="border-b border-slate-200 pb-6">
                <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">Confidential</p>
                <h1 className="mt-3 font-serif text-3xl font-semibold text-slate-900 sm:text-4xl">
                  {documentSections[0].title}
                </h1>
                <p className="mt-2 text-sm text-slate-500">{documentSections[0].subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
                  {documentSections[0].meta?.map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-slate-600">
                {documentSections.slice(1).map((section) => (
                  <div key={section.heading} className="space-y-3">
                    <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
                    {section.body?.map((line, index) => (
                      <p key={`${section.heading}-${index}`}>{line}</p>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Provider</p>
                  <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">Aurora Labs LLC</p>
                    <p className="text-xs text-slate-500">Authorized Representative</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Client</p>
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">Client Representative</p>
                    <p className="text-xs text-slate-500">Signature required</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
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
