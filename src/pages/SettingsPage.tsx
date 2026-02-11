import { DashboardLayout } from '@/components/DashboardLayout';

const SettingsPage = () => {
    return (
        <DashboardLayout showSearch={false}>
            <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto w-full">
                <div>
                    <h2 className="text-3xl font-serif text-stone-900 mb-2">Settings</h2>
                    <p className="text-stone-500 text-sm">Manage your account preferences and configuration.</p>
                </div>

                {/* Profile Section */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h3 className="font-semibold text-stone-800 text-lg mb-4">Profile</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-stone-600 mb-1 block">Full Name</label>
                            <input
                                type="text"
                                defaultValue="John Doe"
                                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-stone-600 mb-1 block">Email</label>
                            <input
                                type="email"
                                defaultValue="john@example.com"
                                className="w-full px-4 py-2.5 rounded-lg border border-stone-200 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                            />
                        </div>
                        <button className="bg-[#1A1C1E] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-md">
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h3 className="font-semibold text-stone-800 text-lg mb-4">Notifications</h3>
                    <div className="space-y-4">
                        {['Email notifications', 'Document signed alerts', 'Weekly summary reports'].map((label) => (
                            <label key={label} className="flex items-center justify-between cursor-pointer group">
                                <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">{label}</span>
                                <div className="relative">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-10 h-6 bg-stone-200 rounded-full peer-checked:bg-green-500 transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
                    <h3 className="font-semibold text-stone-800 text-lg mb-4">Appearance</h3>
                    <div className="flex gap-4">
                        {['Light', 'Dark', 'System'].map((theme) => (
                            <button
                                key={theme}
                                className={`px-6 py-3 rounded-lg border text-sm font-medium transition-all ${theme === 'Light'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                                    }`}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
                    <h3 className="font-semibold text-red-600 text-lg mb-2">Danger Zone</h3>
                    <p className="text-sm text-stone-500 mb-4">Once you delete your account, there is no going back.</p>
                    <button className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-md">
                        Delete Account
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
