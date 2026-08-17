import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ChevronLeft, ChevronRight, Moon, Sun, Bell, Eye, Shield, FileText,
    Mail, Copy, X
} from 'lucide-react';
import { SiInstagram, SiTiktok } from 'react-icons/si';
import { useIsMobile } from '@/hooks/use-mobile';

const APP_VERSION = 'v1.0.0';

// Default settings (language removed)
const defaultSettings = {
    darkMode: false,
    pushNotifications: true,
    emailNotifications: false,
    showOnlineStatus: true,
};

type SettingsType = typeof defaultSettings;

// Human-readable labels for toast messages
const SETTING_LABELS: Record<keyof SettingsType, (value: any) => string> = {
    darkMode: (v) => (v ? 'Dark mode turned on' : 'Dark mode turned off'),
    pushNotifications: (v) => (v ? 'Push notifications enabled' : 'Push notifications disabled'),
    emailNotifications: (v) => (v ? 'Email notifications enabled' : 'Email notifications disabled'),
    showOnlineStatus: (v) => (v ? 'Online status is now visible' : 'Online status is now hidden'),
};

// Contact info with official social icons (from lucide-react)
const CONTACT = {
    instagram: {
        label: 'Instagram',
        handle: '@claim.the.room',
        icon: SiInstagram,
        iconColor: '#E4405F',
        url: 'https://instagram.com/claim.the.room',
    },
    tiktok: {
        label: 'TikTok',
        handle: '@Claimtheroom',
        icon: SiTiktok,
        iconColor: '#000000',
        url: 'https://tiktok.com/@claimtheroom',
    },
    email: {
        label: 'Email',
        handle: 'support@hpbooks.uk',
        icon: Mail,
        iconColor: '#6B7280',
        url: 'mailto:support@hpbooks.uk',
    },
};

// Shared focus + press affordance, matching Profile/other pages.
const FOCUS_RING =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]';
const PRESS = 'active:scale-[0.97]';

export default function SettingsPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [contactModalOpen, setContactModalOpen] = useState(false);

    // Lazy init from localStorage
    const [settings, setSettings] = useState<SettingsType>(() => {
        try {
            const stored = localStorage.getItem('userSettings');
            if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
            // fallback to defaults
        }
        return defaultSettings;
    });

    // Apply dark mode class to html element
    useEffect(() => {
        document.documentElement.classList.toggle('dark', settings.darkMode);
    }, [settings.darkMode]);

    const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        toast.success(SETTING_LABELS[key](value));
    };

    // Push notifications permission handling
    const handlePushToggle = async (checked: boolean) => {
        if (checked && typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'denied') {
                toast.error('Notifications are blocked in your browser settings.', {
                    description: 'Enable them for this site, then try again.',
                });
                return;
            }
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    toast.error('Notifications weren\'t enabled.');
                    return;
                }
            }
        }
        updateSetting('pushNotifications', checked);
    };

    // Copy handler
    const copyToClipboard = (text: string, label: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                toast.success(`${label} copied to clipboard`);
            }).catch(() => {
                // fallback
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                toast.success(`${label} copied to clipboard`);
            });
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            toast.success(`${label} copied to clipboard`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white cr-body">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&display=swap');
                .cr-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.02em; }
                .cr-body { font-family: 'Inter', sans-serif; }
                .cr-card {
                    background: linear-gradient(180deg, #161616 0%, #121212 100%);
                    box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05);
                }
            `}</style>

            <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
                {/* Header with back button */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className={`rounded-full p-2 text-gray-400 hover:text-white hover:bg-white/5 transition ${PRESS} ${FOCUS_RING}`}
                        aria-label="Go back"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="cr-display text-2xl font-bold">Settings</h1>
                </div>

                <div className="space-y-4">
                    {/* Appearance */}
                    <Section title="Appearance" icon={<Moon className="h-4 w-4" />}>
                        <ToggleRow
                            label="Dark Mode"
                            description="Applies across the app wherever theming is wired up"
                            checked={settings.darkMode}
                            onChange={(checked) => updateSetting('darkMode', checked)}
                            thumbIcon="theme"
                        />
                    </Section>

                    {/* Notifications */}
                    <Section title="Notifications" icon={<Bell className="h-4 w-4" />}>
                        <ToggleRow
                            label="Push Notifications"
                            description={
                                typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied'
                                    ? 'Blocked in your browser settings'
                                    : 'Receive match updates and reminders'
                            }
                            checked={settings.pushNotifications}
                            onChange={handlePushToggle}
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

                    {/* Contact */}
                    <Section title="Contact" icon={<Mail className="h-4 w-4" />}>
                        <button
                            onClick={() => setContactModalOpen(true)}
                            className={`flex w-full items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors ${FOCUS_RING}`}
                        >
                            <span className="text-sm">Contact Support</span>
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        </button>
                    </Section>

                    {/* Legal */}
                    <Section title="Legal" icon={<FileText className="h-4 w-4" />}>
                        <div className="space-y-1.5 -my-1">
                            <LinkRow to="/terms" label="Terms of Service" />
                            <LinkRow to="/privacy" label="Privacy Policy" />
                        </div>
                    </Section>

                    {/* About */}
                    <Section title="About" icon={<Shield className="h-4 w-4" />}>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium">Claim The Room (CTR)</p>
                                <p className="text-xs text-gray-500 mt-0.5">Version {APP_VERSION}</p>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>

            {/* Contact Modal */}
            {contactModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setContactModalOpen(false);
                    }}
                    onKeyDown={(e) => e.key === 'Escape' && setContactModalOpen(false)}
                >
                    <div className="relative cr-card rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setContactModalOpen(false)}
                            className={`absolute top-3 right-3 rounded-full p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition ${FOCUS_RING}`}
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h2 className="cr-display text-xl font-bold mb-6">Get in touch</h2>
                        <div className="space-y-4">
                            <ContactItem
                                icon={CONTACT.instagram.icon}
                                iconColor={CONTACT.instagram.iconColor}
                                label={CONTACT.instagram.label}
                                value={CONTACT.instagram.handle}
                                onCopy={() => copyToClipboard(CONTACT.instagram.handle, CONTACT.instagram.label)}
                            />
                            <ContactItem
                                icon={CONTACT.tiktok.icon}
                                iconColor={CONTACT.tiktok.iconColor}
                                label={CONTACT.tiktok.label}
                                value={CONTACT.tiktok.handle}
                                onCopy={() => copyToClipboard(CONTACT.tiktok.handle, CONTACT.tiktok.label)}
                            />
                            <ContactItem
                                icon={CONTACT.email.icon}
                                iconColor={CONTACT.email.iconColor}
                                label={CONTACT.email.label}
                                value={CONTACT.email.handle}
                                onCopy={() => copyToClipboard(CONTACT.email.handle, CONTACT.email.label)}
                            />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-6">
                            Tap any copy icon to copy the contact info.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper components

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/5 cr-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-500">{icon}</span>
                <h2 className="cr-display text-sm font-semibold tracking-wide text-gray-300 uppercase">{title}</h2>
            </div>
            {/* Spacing lives on each row (pt-3.5 first:pt-0) — don't also add space-y here,
                or the gap doubles up against the divider line. */}
            <div className="divide-y divide-white/5">{children}</div>
        </div>
    );
}

function ToggleRow({
    label,
    description,
    checked,
    onChange,
    thumbIcon,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    thumbIcon?: 'theme';
}) {
    return (
        <div className="flex items-start justify-between gap-4 pt-3.5 first:pt-0">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{label}</p>
                {description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center cursor-pointer rounded-full transition-colors duration-200 ${FOCUS_RING} ${checked ? 'bg-[#1E90FF]' : 'bg-[#0A0A0A] border border-white/10'
                    } hover:ring-2 hover:ring-[#1E90FF]/30`}
                role="switch"
                aria-checked={checked}
                aria-label={label}
            >
                <span
                    className={`grid h-5 w-5 place-items-center transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                >
                    {thumbIcon === 'theme' &&
                        (checked ? (
                            <Moon className="h-3 w-3 text-[#1E90FF]" strokeWidth={2.5} />
                        ) : (
                            <Sun className="h-3 w-3 text-gray-400" strokeWidth={2.5} />
                        ))}
                </span>
            </button>
        </div>
    );
}

function LinkRow({ to, label }: { to: string; label: string }) {
    return (
        <Link
            to={to}
            className={`flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors ${FOCUS_RING}`}
        >
            <span className="text-sm">{label}</span>
            <ChevronRight className="h-4 w-4 text-gray-500" />
        </Link>
    );
}

function ContactItem({
    icon: Icon,
    iconColor,
    label,
    value,
    onCopy,
}: {
    icon: any;
    iconColor: string;
    label: string;
    value: string;
    onCopy: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3 bg-[#0A0A0A] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0" style={{ color: iconColor }}>
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium truncate">{value}</p>
                </div>
            </div>
            <button
                onClick={onCopy}
                className={`flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition ${FOCUS_RING}`}
                aria-label={`Copy ${label}`}
            >
                <Copy className="h-4 w-4" />
            </button>
        </div>
    );
}