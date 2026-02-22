import { DashboardLayout } from '@/components/DashboardLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const SettingsPage = () => {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();

    return (
        <DashboardLayout showSearch={false}>
            <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto w-full">
                <div>
                    <h2 className="text-3xl font-serif text-stone-900 dark:text-white mb-2">Settings</h2>
                    <p className="text-stone-500 dark:text-stone-400 text-sm">Manage your account preferences and configuration.</p>
                </div>

                {/* Profile Section */}
                <div className="bg-white dark:bg-[#18181F] rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm p-6">
                    <h3 className="font-semibold text-stone-800 dark:text-white text-lg mb-4">Profile</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1 block">Full Name</label>
                            <input
                                type="text"
                                defaultValue={user?.name || ''}
                                placeholder="Your full name"
                                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 dark:border-[#2A2A32] bg-white dark:bg-[#111114] text-stone-800 dark:text-stone-200 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors placeholder:text-stone-400 dark:placeholder:text-stone-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1 block">Email</label>
                            <input
                                type="email"
                                defaultValue={user?.email || ''}
                                placeholder="your@email.com"
                                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 dark:border-[#2A2A32] bg-white dark:bg-[#111114] text-stone-800 dark:text-stone-200 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors placeholder:text-stone-400 dark:placeholder:text-stone-500"
                            />
                        </div>
                        <button className="bg-[#1A1C1E] dark:bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-green-500 transition-colors shadow-md">
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white dark:bg-[#18181F] rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm p-6">
                    <h3 className="font-semibold text-stone-800 dark:text-white text-lg mb-4">Notifications</h3>
                    <div className="space-y-4">
                        {['Email notifications', 'Document signed alerts', 'Weekly summary reports'].map((label) => (
                            <label key={label} className="flex items-center justify-between cursor-pointer group">
                                <span className="text-sm text-stone-600 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">{label}</span>
                                <div className="relative">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-10 h-6 bg-stone-200 dark:bg-white/10 rounded-full peer-checked:bg-green-500 transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-white dark:bg-[#18181F] rounded-xl border border-stone-200 dark:border-[#2A2A32] shadow-sm p-6">
                    <h3 className="font-semibold text-stone-800 dark:text-white text-lg mb-4">Appearance</h3>
                    <div className="flex gap-4">
                        {(['light', 'dark', 'system'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`px-6 py-3 rounded-lg border text-sm font-medium transition-all capitalize ${
                                    theme === t
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                        : 'border-stone-200 dark:border-[#2A2A32] text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-500'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white dark:bg-[#18181F] rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm p-6">
                    <h3 className="font-semibold text-red-600 text-lg mb-2">Danger Zone</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">Once you delete your account, there is no going back.</p>
                    <button className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-md">
                        Delete Account
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
