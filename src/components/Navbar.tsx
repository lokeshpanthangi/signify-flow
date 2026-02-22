import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-[#F9F9F7]/90 dark:bg-[#0E0E13]/90 backdrop-blur-md border-b border-stone-200/50 dark:border-[#2A2A32]/50 h-16 shadow-sm'
          : 'bg-transparent h-20'
          }`}
      >
        <div className="container mx-auto h-full px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-3xl font-normal text-stone-800 dark:text-white relative top-1" style={{ fontFamily: "'Great Vibes', cursive" }}>
              SignFlow
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">Pricing</Link>
            <Link to="/about" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">About</Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/50 dark:hover:bg-white/5">Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={logout} className="border-stone-200 dark:border-[#2A2A32] text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5">Logout</Button>
              </>
            ) : (
              <>
                <Link to="/auth?mode=login">
                  <Button variant="ghost" className="font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/50 dark:hover:bg-white/5">Log in</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="font-medium bg-green-600 hover:bg-green-500 text-white shadow-md shadow-green-900/10 rounded-full px-6">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#F9F9F7] dark:bg-[#0E0E13] pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-lg text-stone-800 dark:text-stone-200">
              <Link to="/features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <hr className="border-stone-200" />
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left text-red-600">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                  <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)} className="text-green-600 font-bold">Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
