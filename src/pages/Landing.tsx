import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Globe,
  PenTool,
  ArrowRight,
  FileText,
  CheckCircle2,
  Lock,
  Feather,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { Timeline } from '@/components/ui/timeline';

// -- Components --

const FeatureItem = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    className="flex flex-col gap-4 p-6 rounded-2xl bg-white dark:bg-[#18181F] border border-stone-200/60 dark:border-[#2A2A32] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
  >
    <div className="h-12 w-12 rounded-xl bg-[#F9F9F7] dark:bg-[#0E0E13] flex items-center justify-center text-stone-600 dark:text-stone-400 group-hover:bg-green-50 dark:group-hover:bg-green-500/10 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-white mb-2">{title}</h3>
      <p className="text-stone-500 dark:text-stone-400 leading-relaxed font-sans">{desc}</p>
    </div>
  </motion.div>
);

const Landing = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const timelineData = [
    {
      title: "Create",
      content: (
        <div>
          <p className="text-stone-600 text-lg font-light mb-8 font-serif leading-relaxed">
            Drag and drop your contracts, agreements, or forms. Our intelligent engine instantly
            prepares them for signature, identifying fields and signers automatically.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-200">
              <img
                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop"
                alt="Document Preparation"
                className="w-full h-64 md:h-96 object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Sign",
      content: (
        <div>
          <p className="text-stone-600 text-lg font-light mb-8 font-serif leading-relaxed">
            Experience the "liquid ink" feel. Whether on desktop or mobile, signing feels natural,
            responsive, and personal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-200">
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop"
                alt="Signing on Tablet"
                className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-200">
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                alt="Signing Paper Contract"
                className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Complete",
      content: (
        <div>
          <p className="text-stone-600 text-lg font-light mb-8 font-serif leading-relaxed">
            Instant notifications, audit trails, and secure storage.
            Once signed, everyone receives a legally binding copy. Deal closed.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-200 relative">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop"
                alt="Handshake Deal"
                className="w-full h-64 md:h-96 object-cover hover:scale-105 transition-transform duration-700"
              />
              {/* Overlay checkmark */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                <div className="bg-green-600 text-white p-4 rounded-full shadow-2xl animate-bounce">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7] dark:bg-[#0E0E13] text-stone-800 dark:text-stone-200 font-sans selection:bg-stone-200 dark:selection:bg-stone-700 selection:text-stone-900 dark:selection:text-white">
      <Navbar />

      <main>
        {/* --- Hero Section --- */}
        <section className="relative min-h-[90vh] flex flex-col justify-center items-center pt-32 pb-20 px-4 overflow-hidden">

          {/* Abstract Background Shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-green-50/50 to-stone-50/50 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl from-stone-100 to-green-50/30 rounded-full blur-[100px]" />
          </div>

          <div className="container relative z-10 max-w-5xl mx-auto text-center">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#18181F] border border-stone-200 dark:border-[#2A2A32] shadow-sm mb-8">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold tracking-wide uppercase text-stone-500 dark:text-stone-400">The New Standard</span>
              </div>

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-medium text-stone-900 dark:text-white tracking-tight leading-[1.1] mb-8">
                Signatures, <br />
                <span className="italic text-stone-500 dark:text-stone-400 font-serif">Reimagined.</span>
              </h1>

              <p className="max-w-2xl mx-auto text-xl md:text-2xl text-stone-500 dark:text-stone-400 font-light leading-relaxed mb-12">
                Experience the fluidity of ink with the speed of digital.
                Secure, legally binding, and effortlessly elegant.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/auth?mode=signup">
                  <Button size="xl" className="h-16 px-10 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-100 text-lg shadow-xl shadow-stone-900/10 transition-all hover:scale-105">
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button variant="outline" size="xl" className="h-16 px-10 rounded-full border-stone-300 dark:border-[#2A2A32] text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-white/5 hover:text-stone-900 dark:hover:text-white text-lg bg-transparent">
                    View Demo
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Floating Document Preview */}
            <motion.div
              style={{ y }}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mt-20 relative mx-auto max-w-4xl"
            >
              <div className="relative rounded-t-3xl bg-white p-2 shadow-2xl shadow-stone-200/50 border border-stone-200/50">
                <div className="absolute top-0 left-0 w-full h-full bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-t-3xl opacity-0 hover:opacity-100 transition-opacity duration-500 cursor-pointer">
                  <div className="bg-stone-900 text-white px-6 py-3 rounded-full font-medium shadow-lg transform translate-y-4 hover:translate-y-0 transition-transform">
                    Explore Interface
                  </div>
                </div>

                {/* Mock UI Header */}
                <div className="bg-[#F9F9F7] rounded-t-2xl border-b border-stone-200 p-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-300/50" />
                    <div className="h-3 w-3 rounded-full bg-amber-300/50" />
                    <div className="h-3 w-3 rounded-full bg-green-300/50" />
                  </div>
                  <div className="h-6 w-80 bg-white rounded-md shadow-sm mx-auto hidden sm:block" />
                  <div className="w-16" />
                </div>

                {/* Mock Document Content */}
                <div className="bg-white p-6 sm:p-12 min-h-[400px] flex flex-col items-center">
                  <div className="w-full max-w-2xl space-y-8">
                    <div className="h-8 w-1/3 bg-stone-100 rounded-sm" />
                    <div className="space-y-4">
                      <div className="h-2 w-full bg-stone-50 rounded-full" />
                      <div className="h-2 w-full bg-stone-50 rounded-full" />
                      <div className="h-2 w-full bg-stone-50 rounded-full" />
                      <div className="h-2 w-2/3 bg-stone-50 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-8 pt-8">
                      <div className="border-b-2 border-stone-200 pb-2">
                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-4">Signed by</p>
                        <div className="font-script text-3xl sm:text-5xl text-blue-900" style={{ fontFamily: "'Great Vibes', cursive" }}>Alex Morgan</div>
                      </div>
                      <div className="border-b-2 border-stone-200 pb-2 flex flex-col justify-end">
                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-2">Date</p>
                        <div className="font-serif text-lg text-stone-800">October 24, 2025</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- Trusted section --- */}
        <section className="py-12 border-y border-stone-200 dark:border-[#2A2A32] bg-[#F9F9F7] dark:bg-[#0E0E13]">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-stone-400 uppercase tracking-[0.2em] mb-8">Trusted by Global Leaders</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-24 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {['Acme', 'Horizon', 'Stark', 'Wayne', 'Cyberdyne'].map((logo) => (
                <span key={logo} className="text-xl md:text-2xl font-serif font-bold text-stone-800 dark:text-stone-200">{logo} Imports</span>
              ))}
            </div>
          </div>
        </section>

        {/* --- Timeline Section (New) --- */}
        <div className="w-full bg-[#F9F9F7] dark:bg-[#0E0E13]">
          <Timeline data={timelineData} />
        </div>

        {/* --- Features Grid --- */}
        <section className="py-32 bg-[#F9F9F7] dark:bg-[#0E0E13]">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 dark:text-white mb-6">Designed for Focus</h2>
              <p className="text-xl text-stone-500 dark:text-stone-400 font-light">Eliminate the noise. SignFlow provides the essential tools you need in an interface you'll actually enjoy using.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureItem
                icon={Feather}
                title="Liquid Ink Effect"
                desc="Signatures that look and feel real. Our vectors mimic the pressure and flow of a real fountain pen."
                delay={0.1}
              />
              <FeatureItem
                icon={ShieldCheck}
                title="Ironclad Security"
                desc="Bank-grade 256-bit encryption ensuring your sensitive documents never fall into the wrong hands."
                delay={0.2}
              />
              <FeatureItem
                icon={Zap}
                title="Lighting Fast"
                desc="Send contracts in seconds. Templates allow you to reuse common forms with a single click."
                delay={0.3}
              />
              <FeatureItem
                icon={Globe}
                title="Legally Binding"
                desc="Compliant with eIDAS, ESIGN, and UETA. Your digital signature is as valid as a wet ink one."
                delay={0.4}
              />
              <FeatureItem
                icon={Smartphone}
                title="Mobile Perfect"
                desc="Sign expenses, contracts, and approvals from your phone while on the go. No app needed."
                delay={0.5}
              />
              <FeatureItem
                icon={Lock}
                title="Private by Default"
                desc="We don't sell your data. Your documents are yours alone, encrypted at rest and in transit."
                delay={0.6}
              />
            </div>
          </div>
        </section>

        {/* --- Stats Display --- */}
        <section className="py-20 bg-white dark:bg-[#18181F] border border-stone-200 dark:border-[#2A2A32] rounded-3xl mx-4 lg:mx-8 mb-20 shadow-sm overflow-hidden relative">

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="lg:w-1/3">
                <h2 className="text-3xl md:text-4xl font-serif mb-4 text-stone-900 dark:text-white">Impact by the numbers</h2>
                <p className="text-stone-500 dark:text-stone-400 font-light leading-relaxed">
                  We handle millions of secure transactions daily for freelancers, startups, and expansive enterprises.
                </p>
              </div>
              <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { k: '10M+', l: 'Signatures' },
                  { k: '99.9%', l: 'Uptime' },
                  { k: '142', l: 'Countries' },
                  { k: '24/7', l: 'Support' }
                ].map((stat) => (
                  <div key={stat.l}>
                    <div className="text-4xl font-bold font-serif mb-1 text-stone-900 dark:text-white">{stat.k}</div>
                    <div className="text-sm text-stone-400 uppercase tracking-widest">{stat.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- CTA --- */}
        <section className="py-32 bg-[#F9F9F7] dark:bg-[#0E0E13] border-t border-stone-200 dark:border-[#2A2A32]">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-serif text-stone-900 dark:text-white mb-8">Ready to sign?</h2>
              <p className="text-xl text-stone-500 dark:text-stone-400 font-light mb-12">
                Join the new era of digital documentation. Elegant, fast, and secure.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/auth?mode=signup">
                  <Button className="h-14 px-8 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium text-lg w-full sm:w-auto shadow-lg shadow-green-900/10">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="h-14 px-8 rounded-full border-stone-200 dark:border-[#2A2A32] hover:bg-white dark:hover:bg-white/5 text-stone-600 dark:text-stone-300 font-medium text-lg w-full sm:w-auto bg-transparent">
                    Contact Sales
                  </Button>
                </Link>
              </div>
              <p className="mt-8 text-sm text-stone-400">No credit card required. Cancel anytime.</p>
            </div>
          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="border-t border-stone-200 dark:border-[#2A2A32] bg-[#F9F9F7] dark:bg-[#0E0E13] pt-16 pb-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2 lg:col-span-2">
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-normal text-stone-800 dark:text-white" style={{ fontFamily: "'Great Vibes', cursive" }}>SignFlow</span>
                </Link>
                <p className="text-stone-500 max-w-xs mb-6 text-sm">
                  The secure, fast, and legal way to get documents signed online. Built for modern business.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-stone-800 dark:text-stone-200">Product</h4>
                <ul className="space-y-3 text-sm text-stone-500 dark:text-stone-400">
                  <li><Link to="#" className="hover:text-green-600">Features</Link></li>
                  <li><Link to="#" className="hover:text-green-600">Pricing</Link></li>
                  <li><Link to="#" className="hover:text-green-600">API</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-stone-800 dark:text-stone-200">Company</h4>
                <ul className="space-y-3 text-sm text-stone-500 dark:text-stone-400">
                  <li><Link to="#" className="hover:text-green-600">About</Link></li>
                  <li><Link to="#" className="hover:text-green-600">Careers</Link></li>
                  <li><Link to="#" className="hover:text-green-600">Contact</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-stone-800 dark:text-stone-200">Legal</h4>
                <ul className="space-y-3 text-sm text-stone-500 dark:text-stone-400">
                  <li><Link to="#" className="hover:text-green-600">Privacy</Link></li>
                  <li><Link to="#" className="hover:text-green-600">Terms</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-stone-200 dark:border-[#2A2A32] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-stone-400">
              <div>© 2026 SignFlow Inc.</div>
              <div className="flex gap-6">
                <Link to="#" className="hover:text-stone-800">Twitter</Link>
                <Link to="#" className="hover:text-stone-800">LinkedIn</Link>
              </div>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default Landing;
