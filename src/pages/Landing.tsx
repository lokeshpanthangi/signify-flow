import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import heroIllustration from '@/assets/hero-illustration.png';

const features = [
  { icon: ShieldCheck, title: 'Legally Binding', desc: 'Compliant with eIDAS, ESIGN, and UETA regulations worldwide.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Get documents signed in minutes, not days.' },
  { icon: Globe, title: 'Sign Anywhere', desc: 'Works on any device — desktop, tablet, or mobile.' },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="container mx-auto flex flex-col-reverse items-center gap-12 px-4 py-20 lg:flex-row lg:py-32">
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Sign Documents Anywhere, Securely.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Send, sign, and manage legally binding digital signatures — all from one secure platform. Trusted by thousands of businesses worldwide.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">Start Free Trial</Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">Upload Document Now</Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img
              src={heroIllustration}
              alt="Digital contract being signed"
              className="w-full max-w-md drop-shadow-xl"
            />
          </motion.div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-card py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-semibold text-foreground">Why SignFlow?</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="rounded-lg border border-border bg-background p-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <f.icon className="mx-auto mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-background py-8 text-center text-sm text-muted-foreground">
          © 2026 SignFlow. All rights reserved.
        </footer>
      </main>
    </div>
  );
};

export default Landing;
