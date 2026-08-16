import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Moon, Bell, Eye, Globe, Shield, FileText, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const APP_VERSION = 'v1.0.0';

// Default settings
const defaultSettings = {
    darkMode: false,
    pushNotifications: true,
    emailNotifications: false,
    showOnlineStatus: true,
    language: 'en',
};

type SettingsType = typeof defaultSettings;

export default function SettingsPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [settings, setSettings] = useState<SettingsType>(defaultSettings);

    // Load settings from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('userSettings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSettings({ ...defaultSettings, ...parsed });
            } catch {
                // fallback to defaults
            }
        }
    }, []);

    // Save to localStorage and show toast
    const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        toast.success('Setting updated', {
            description: `${key} changed to ${value}`,
        });
    };

    const resetToDefaults = () => {
        setSettings(defaultSettings);
        localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
        toast.success('Settings reset to defaults');
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white cr-body">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
                {/* Header with back button */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-full p-2 text-gray-400 hover:text-white hover:bg-white/5 transition"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="cr-display text-2xl font-bold">Settings</h1>
                </div>

                <div className="space-y-6">
                    {/* Appearance */}
                    <Section title="Appearance" icon={<Moon className="h-4 w-4" />}>
                        <ToggleRow
                            label="Dark Mode"
                            description="Use dark theme throughout the app"
                            checked={settings.darkMode}
                            onChange={(checked) => updateSetting('darkMode', checked)}
                        />
                    </Section>

                    {/* Notifications */}
                    <Section title="Notifications" icon={<Bell className="h-4 w-4" />}>
                        <ToggleRow
                            label="Push Notifications"
                            description="Receive match updates and reminders"
                            checked={settings.pushNotifications}
                            onChange={(checked) => updateSetting('pushNotifications', checked)}
                        />
                        <ToggleRow
                            label="Email Notifications"
                            description="Get important alerts via email"
                            checked={settings.emailNotifications}
                            onChange={(checked) => updateSetting('emailNotifications', checked)}
                        />
                    </Section>

                    {/* Privacy */}
                    <Section title="Privacy" icon={<Eye className="h-4 w-4" />}>
                        <ToggleRow
                            label="Show Online Status"
                            description="Let others see when you're active"
                            checked={settings.showOnlineStatus}
                            onChange={(checked) => updateSetting('showOnlineStatus', checked)}
                        />
                    </Section>

                    {/* Language */}
                    <Section title="Language" icon={<Globe className="h-4 w-4" />}>
                        <SelectRow
                            label="App Language"
                            description="Choose your preferred language"
                            value={settings.language}
                            options={[
                                { value: 'en', label: 'English' },
                                { value: 'es', label: 'Spanish' },
                                { value: 'fr', label: 'French' },
                                { value: 'de', label: 'German' },
                            ]}
                            onChange={(value) => updateSetting('language', value)}
                        />
                    </Section>

                    {/* Legal */}
                    <Section title="Legal" icon={<FileText className="h-4 w-4" />}>
                        <div className="space-y-2">
                            <LinkRow to="/terms" label="Terms of Service" />
                            <LinkRow to="/privacy" label="Privacy Policy" />
                        </div>
                    </Section>

                    {/* About */}
                    <Section title="About" icon={<Shield className="h-4 w-4" />}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Claim The Room (CTR)</p>
                                <p className="text-xs text-gray-500">Version {APP_VERSION}</p>
                            </div>
                            <button
                                onClick={resetToDefaults}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset to defaults
                            </button>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
}

// Helper components
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-[#141414] rounded-2xl border border-white/5 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-400">{icon}</span>
                <h2 className="cr-display text-sm font-semibold tracking-wide text-gray-300 uppercase">{title}</h2>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function ToggleRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-1">
            <div>
                <p className="text-sm font-medium">{label}</p>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors ${checked ? 'bg-[#1E90FF]' : 'bg-[#0A0A0A] border border-white/10'
                    }`}
                role="switch"
                aria-checked={checked}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                />
            </button>
        </div>
    );
}

function SelectRow({
    label,
    description,
    value,
    options,
    onChange,
}: {
    label: string;
    description?: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-1">
            <div>
                <p className="text-sm font-medium">{label}</p>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/50"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function LinkRow({ to, label }: { to: string; label: string }) {
    return (
        <a
            href={to}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition"
        >
            <span className="text-sm">{label}</span>
            <ChevronLeft className="h-4 w-4 text-gray-500 rotate-180" />
        </a>
    );
}