import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ChevronLeft, ChevronRight, Moon, Sun, Bell, Eye, Shield, FileText,
    Mail, Copy, X, AlertTriangle, Send, UserCog, Loader2, CheckCircle,
} from 'lucide-react';
import { SiInstagram, SiTiktok } from 'react-icons/si';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { supabase } from '@/lib/supabaseClient';
import { useIsMobile } from '@/hooks/use-mobile';

const APP_VERSION = 'v1.0.0';

const ACTIVE_REQUEST_CACHE_KEY = 'ctr_active_request_';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Default settings
const defaultSettings = {
    darkMode: false,
    pushNotifications: true,
    emailNotifications: false,
    showOnlineStatus: true,
};

type SettingsType = typeof defaultSettings;

const SETTING_LABELS: Record<keyof SettingsType, (value: any) => string> = {
    darkMode: (v) => (v ? 'Dark mode turned on' : 'Dark mode turned off'),
    pushNotifications: (v) => (v ? 'Push notifications enabled' : 'Push notifications disabled'),
    emailNotifications: (v) => (v ? 'Email notifications enabled' : 'Email notifications disabled'),
    showOnlineStatus: (v) => (v ? 'Online status is now visible' : 'Online status is now hidden'),
};

// Contact info
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

const FOCUS_RING =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]';
const PRESS = 'active:scale-[0.97]';

export default function SettingsPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { user } = useKindeAuth();

    // ---- Settings ----
    const [settings, setSettings] = useState<SettingsType>(() => {
        try {
            const stored = localStorage.getItem('userSettings');
            if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
            // fallback
        }
        return defaultSettings;
    });

    // ---- Support form ----
    const [requestType, setRequestType] = useState<'report_abuse' | 'request_changes' | 'delete_account'>('report_abuse');
    const [requestReason, setRequestReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hasActiveRequest, setHasActiveRequest] = useState(false);
    const [activeRequestStatus, setActiveRequestStatus] = useState<string | null>(null);
    const [loadingRequestStatus, setLoadingRequestStatus] = useState(true);

    // ---- Delete confirmation modal ----
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ---- Contact modal ----
    const [contactModalOpen, setContactModalOpen] = useState(false);

    // Apply dark mode
    useEffect(() => {
        document.documentElement.classList.toggle('dark', settings.darkMode);
    }, [settings.darkMode]);

    // ---- Check for existing active request with caching ----
    useEffect(() => {
        if (!user?.id) {
            setLoadingRequestStatus(false);
            return;
        }
        const cacheKey = `${ACTIVE_REQUEST_CACHE_KEY}${user.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                // If cache is fresh, use it without DB query
                if (Date.now() - data.timestamp < CACHE_EXPIRY_MS) {
                    setHasActiveRequest(true);
                    setActiveRequestStatus(data.status);
                    setLoadingRequestStatus(false);
                    return;
                } else {
                    // Cache expired, remove it
                    localStorage.removeItem(cacheKey);
                }
            } catch {
                localStorage.removeItem(cacheKey);
            }
        }
        // No valid cache – query the database once
        const checkActiveRequest = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_requests')
                    .select('status')
                    .eq('user_id', user.id)
                    .in('status', ['pending', 'processing'])
                    .limit(1);
                if (error) throw error;
                if (data && data.length > 0) {
                    const status = data[0].status;
                    setHasActiveRequest(true);
                    setActiveRequestStatus(status);
                    // Store fresh cache
                    localStorage.setItem(cacheKey, JSON.stringify({ status, timestamp: Date.now() }));
                } else {
                    setHasActiveRequest(false);
                    setActiveRequestStatus(null);
                }
            } catch (err) {
                console.warn('Could not fetch active request:', err);
            } finally {
                setLoadingRequestStatus(false);
            }
        };
        checkActiveRequest();
    }, [user?.id]);

    // ---- Settings handlers ----
    const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        toast.success(SETTING_LABELS[key](value));
    };

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

    // ---- Copy handler ----
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

    // ---- Submit support request ----
    const handleSubmit = async () => {
        if (!requestReason.trim()) {
            toast.error('Please describe your request in detail.');
            return;
        }
        if (requestType === 'delete_account') {
            setShowDeleteConfirm(true);
            return;
        }
        // For other types, submit directly
        await submitRequest();
    };

    const submitRequest = async () => {
        if (!user) {
            toast.error('You must be signed in to submit a request.');
            return;
        }
        setSubmitting(true);
        try {
            const { error } = await supabase.from('user_requests').insert({
                user_id: user.id,
                type: requestType,
                reason: requestReason.trim(),
                status: 'pending',
                meta: {},
            });
            if (error) throw error;
            // Success: store cache immediately
            const cacheKey = `${ACTIVE_REQUEST_CACHE_KEY}${user.id}`;
            localStorage.setItem(cacheKey, JSON.stringify({ status: 'pending', timestamp: Date.now() }));
            setHasActiveRequest(true);
            setActiveRequestStatus('pending');
            toast.success('Your request has been submitted. We’ll review it and get back to you.');
            setRequestReason('');
            setRequestType('report_abuse');
        } catch (err: any) {
            if (err.message?.includes('permission denied') || err.status === 401) {
                toast.error('Permission denied. Please contact support.');
            } else {
                toast.error(err.message || 'Failed to submit request.');
            }
        } finally {
            setSubmitting(false);
            setShowDeleteConfirm(false);
        }
    };

    // ---- Determine if form should be disabled ----
    const isFormDisabled = loadingRequestStatus || hasActiveRequest || submitting;

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
                {/* Header */}
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

                    {/* Support & Account */}
                    <Section title="Support & Account" icon={<UserCog className="h-4 w-4" />}>
                        {loadingRequestStatus ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : hasActiveRequest ? (
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-300">
                                <CheckCircle className="inline h-4 w-4 mr-2" />
                                You already have a {activeRequestStatus === 'pending' ? 'pending' : 'processing'} request.
                                <br />
                                <span className="text-xs text-gray-400">
                                    We’re reviewing it and will get back to you soon. You can’t submit another request until this one is resolved.
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                                        Request type
                                    </label>
                                    <select
                                        value={requestType}
                                        onChange={(e) => setRequestType(e.target.value as any)}
                                        disabled={isFormDisabled}
                                        className={`w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[#1E90FF]/50 ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="report_abuse">Report Abuse</option>
                                        <option value="request_changes">Request Changes</option>
                                        <option value="delete_account">Delete Account</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                                        Details
                                    </label>
                                    <textarea
                                        value={requestReason}
                                        onChange={(e) => setRequestReason(e.target.value.slice(0, 1000))}
                                        rows={4}
                                        disabled={isFormDisabled}
                                        placeholder={
                                            requestType === 'report_abuse'
                                                ? 'Describe the abusive content or behaviour…'
                                                : requestType === 'request_changes'
                                                    ? 'What changes do you need? (profile info, squad, etc.)'
                                                    : 'Why do you want to delete your account? (optional)'
                                        }
                                        className={`w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[#1E90FF]/50 ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">{requestReason.length}/1000</p>
                                </div>

                                {requestType === 'delete_account' && (
                                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                                        <AlertTriangle className="inline h-4 w-4 mr-2" />
                                        Account deletion is permanent. All your data will be removed.
                                        <br />
                                        <span className="text-xs text-gray-400">
                                            You have <strong>7 days</strong> to cancel this request by contacting support.
                                            This waiting period allows us to ensure security and give you a chance to recover your data if needed.
                                        </span>
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={isFormDisabled}
                                    className={`w-full flex items-center justify-center gap-2 rounded-xl bg-[#1E90FF] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 ${FOCUS_RING}`}
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    Submit Request
                                </button>
                            </div>
                        )}
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowDeleteConfirm(false);
                    }}
                    onKeyDown={(e) => e.key === 'Escape' && setShowDeleteConfirm(false)}
                >
                    <div className="relative cr-card rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className={`absolute top-3 right-3 rounded-full p-1.5 text-gray-400 hover:text-white hover:bg-white/5 transition ${FOCUS_RING}`}
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h2 className="cr-display text-lg font-bold">Delete Account</h2>
                                <p className="text-sm text-gray-300 mt-1">
                                    Are you sure? This action is permanent and cannot be undone.
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    All your data (profile, matches, stats, etc.) will be removed.
                                    You’ll have 7 days to cancel this request.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className={`flex-1 rounded-xl border border-white/10 bg-transparent py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 ${FOCUS_RING}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRequest}
                                disabled={submitting}
                                className={`flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 ${FOCUS_RING}`}
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------- Helper Components (unchanged) ----------

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/5 cr-card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-500">{icon}</span>
                <h2 className="cr-display text-sm font-semibold tracking-wide text-gray-300 uppercase">{title}</h2>
            </div>
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