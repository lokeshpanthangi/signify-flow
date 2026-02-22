import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home,
    FileText,
    LayoutTemplate,
    Link as LinkIcon,
    BarChart2,
    Settings,
    Grip,
    Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

// --- Sidebar Item ---
const SidebarItem = ({
    icon: Icon,
    label,
    isActive,
    onClick
}: {
    icon: any,
    label: string,
    isActive: boolean,
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex flex-col items-center justify-center gap-1 py-4 transition-all duration-200 group relative",
            isActive
                ? "text-white"
                : "text-gray-400 hover:text-white"
        )}
    >
        {isActive && (
            <motion.div
                layoutId="active-pill"
                className="absolute left-0 w-1 h-8 bg-green-500 rounded-r-full"
            />
        )}
        <Icon className={cn("h-6 w-6 mb-1", isActive && "text-green-400")} />
        <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
);

// Route mapping for sidebar items
const sidebarItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: LayoutTemplate, label: 'Templates', path: '/templates' },
    { icon: LinkIcon, label: 'SignForms', path: '/signforms' },
    { icon: BarChart2, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

interface DashboardLayoutProps {
    children: React.ReactNode;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    showSearch?: boolean;
}

export const DashboardLayout = ({
    children,
    searchQuery = '',
    onSearchChange,
    showSearch = true,
}: DashboardLayoutProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [localSearch, setLocalSearch] = useState('');
    const { resolvedTheme, setTheme } = useTheme();

    const currentSearch = onSearchChange ? searchQuery : localSearch;
    const handleSearchChange = onSearchChange || setLocalSearch;

    // Determine active tab from current route
    const getActiveTab = () => {
        const path = location.pathname;
        for (const item of sidebarItems) {
            if (path === item.path || path.startsWith(item.path + '/')) {
                return item.path;
            }
        }
        return '/dashboard';
    };

    const activeTab = getActiveTab();

    return (
        <div className="flex h-screen bg-[#F9F9F7] dark:bg-[#0E0E13] font-sans overflow-hidden">

            {/* Dark Sidebar */}
            <aside className="w-[90px] bg-[#1A1C1E] dark:bg-[#111114] flex flex-col items-center py-4 z-50 shrink-0 shadow-xl">
                {/* Top Grid Icon */}
                <button className="p-3 text-gray-400 hover:text-white mb-6 transition-colors">
                    <Grip className="h-6 w-6" />
                </button>

                {/* Menu Items */}
                <nav className="flex-1 w-full space-y-1">
                    {sidebarItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            isActive={activeTab === item.path}
                            onClick={() => navigate(item.path)}
                        />
                    ))}
                </nav>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    className="p-3 text-gray-400 hover:text-white mb-4 transition-colors"
                    title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <div className="p-8 max-w-[1600px] mx-auto min-h-full flex flex-col">

                    {/* Top Bar: Search + User Profile */}
                    <div className="flex items-center justify-between mb-12 gap-8">
                        {/* Logo - Signature Style */}
                        <div className="flex-shrink-0 pt-2">
                            <h1
                                className="text-3xl text-stone-800 dark:text-white font-normal select-none cursor-pointer"
                                style={{ fontFamily: "'Great Vibes', cursive" }}
                                onClick={() => navigate('/dashboard')}
                            >
                                SignFlow
                            </h1>
                        </div>

                        {/* Centered Search Bar */}
                        {showSearch && (
                            <div className="flex-1 max-w-2xl relative group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-stone-400 group-focus-within:text-green-600 transition-colors" />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={currentSearch}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10 h-11 rounded-full border-stone-200 dark:border-[#2A2A32] bg-white dark:bg-[#18181F] shadow-sm hover:shadow-md focus:shadow-lg focus:border-green-500/50 transition-all text-sm dark:text-stone-200 dark:placeholder:text-stone-500"
                                />
                            </div>
                        )}

                        {/* User Avatar (Top Right) */}
                        <div className="flex-shrink-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="h-10 w-10 rounded-full bg-gradient-to-tr from-stone-700 to-stone-600 dark:from-stone-600 dark:to-stone-500 flex items-center justify-center text-white text-xs font-bold border-2 border-stone-500 dark:border-stone-600 cursor-pointer shadow-md hover:border-green-500 transition-colors hover:scale-105">
                                        {user?.name?.[0] || 'U'}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate('/settings')}>Profile</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { localStorage.clear(); navigate('/auth?mode=login'); }} className="text-red-600 dark:text-red-400">Logout</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Page Content */}
                    {children}

                </div>
            </main>
        </div>
    );
};
