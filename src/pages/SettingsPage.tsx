import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ChevronLeft, ChevronRight, ChevronDown, Moon, Sun, Bell, Eye, Shield, FileText,
    Mail, Copy, X, AlertTriangle, Send, UserCog, Loader2, CheckCircle, LogOut,
 Camera, Music2,
} from 'lucide-react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    validateRequestReason,
    stripControlChars,
    REQUEST_REASON_MAX,
} from '@/lib/sanitizeRequest';

const APP_VERSION = 'v1.0.1';

const ACTIVE_REQUEST_CACHE_KEY = 'ctr_active_request_';
const CACHE_EXPIRY_MS = 60 * 60 * 1000;

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string;

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

const CONTACT = {
    instagram: {
        label: 'Instagram',
        handle: '@claim.the.room',
        icon: Camera,
        iconColor: '#E4405F',
    },
    tiktok: {
        label: 'TikTok',
        handle: '@Claimtheroom',
        icon: Music2,
        iconColor: '#ffffff',
    },
    email: {
        label: 'Email',
        handle: 'support@hpbooks.uk',
        icon: Mail,
        iconColor: '#9ca3af',
    },
};

const FOCUS_RING =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090b]';

type RequestType = 'report_abuse' | 'request_changes' | 'delete_account';

export default function SettingsPage() {
    const navigate = useNavigate();
    useIsMobile();
    const { user, getToken } = useKindeAuth();
    const { logout } = useKindeAuth();

    const [settings, setSettings] = useState<SettingsType>(() => {
        try {
            const stored = localStorage.getItem('userSettings');
            if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
        } catch { /* fallback */ }
        return defaultSettings;
    });

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [requestType, setRequestType] = useState<RequestType>('report_abuse');
    const [requestReason, setRequestReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hasActiveRequest, setHasActiveRequest] = useState(false);
    const [activeRequestStatus, setActiveRequestStatus] = useState<string | null>(null);
    const [loadingRequestStatus, setLoadingRequestStatus] = useState(true);
    const [supportOpen, setSupportOpen] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', settings.darkMode);
    }, [settings.darkMode]);

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
                if (Date.now() - data.timestamp < CACHE_EXPIRY_MS) {
                    setHasActiveRequest(true);
                    setActiveRequestStatus(data.status);
                    setLoadingRequestStatus(false);
                    return;
                }
                localStorage.removeItem(cacheKey);
            } catch {
                localStorage.removeItem(cacheKey);
            }
        }

        const checkActiveRequest = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    setLoadingRequestStatus(false);
                    return;
                }
                const res = await fetch(`${FUNCTIONS_URL}/submit-request/status`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    setHasActiveRequest(false);
                    setActiveRequestStatus(null);
                    return;
                }
                const data = await res.json();
                if (data?.active) {
                    setHasActiveRequest(true);
                    setActiveRequestStatus(data.status);
                    localStorage.setItem(
                        cacheKey,
                        JSON.stringify({ status: data.status, timestamp: Date.now() }),
                    );
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
    }, [user?.id, getToken]);

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
                    toast.error("Notifications weren't enabled.");
                    return;
                }
            }
        }
        updateSetting('pushNotifications', checked);
    };

    const copyToClipboard = (text: string, label: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                toast.success(`${label} copied to clipboard`);
            }).catch(() => {
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

    const handleLogout = () => {
        setIsLoggingOut(true);
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch { /* ignore */ }
        logout();
    };

    const handleReasonChange = (value: string) => {
        setRequestReason(stripControlChars(value, REQUEST_REASON_MAX));
    };

    const handleSubmit = () => {
        const validation = validateRequestReason(requestReason);
        if (!validation.ok) {
            toast.error(validation.error);
            return;
        }
        if (requestType === 'delete_account') {
            setShowDeleteConfirm(true);
            return;
        }
        void submitRequest();
    };

    const submitRequest = async () => {
        if (!user) {
            toast.error('You must be signed in to submit a request.');
            return;
        }

        const validation = validateRequestReason(requestReason);
        if (!validation.ok) {
            toast.error(validation.error);
            return;
        }

        setSubmitting(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Your session expired. Please sign in again.');
                return;
            }

            const res = await fetch(`${FUNCTIONS_URL}/submit-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: requestType,
                    reason: validation.value,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 409) {
                    toast.error(data.error ?? 'You already have an active request.');
                    const cacheKey = `${ACTIVE_REQUEST_CACHE_KEY}${user.id}`;
                    localStorage.setItem(
                        cacheKey,
                        JSON.stringify({ status: 'pending', timestamp: Date.now() }),
                    );
                    setHasActiveRequest(true);
                    setActiveRequestStatus('pending');
                    return;
                }
                if (res.status === 401) {
                    toast.error('Session expired. Please sign in again.');
                    return;
                }
                toast.error(data.error ?? 'Failed to submit request.');
                return;
            }

            const cacheKey = `${ACTIVE_REQUEST_CACHE_KEY}${user.id}`;
            localStorage.setItem(
                cacheKey,
                JSON.stringify({ status: 'pending', timestamp: Date.now() }),
            );
            setHasActiveRequest(true);
            setActiveRequestStatus('pending');
            toast.success("Your request has been submitted. We'll review it and get back to you.");
            setRequestReason('');
            setRequestType('report_abuse');
            setSupportOpen(false);
        } catch (err: any) {
            toast.error(err?.message ?? 'Failed to submit request.');
        } finally {
            setSubmitting(false);
            setShowDeleteConfirm(false);
        }
    };

    const isFormDisabled = loadingRequestStatus || hasActiveRequest || submitting;

    return (
        <div className="min-h-screen bg-[#08090b] text-white">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&display=swap');
                .sp-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.01em; }
                .sp-body { font-family: 'Inter', sans-serif; }
                .sp-group {
                    background: #0f0f11;
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 14px;
                    overflow: hidden;
                }
                .sp-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 14px 16px;
                    transition: background-color .15s ease;
                }
                .sp-row + .sp-row,
                .sp-row + .sp-row-group,
                .sp-row-group + .sp-row-group {
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .sp-row-group + .sp-row,
                .sp-row + .sp-row-group {
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                a.sp-row:hover,
                button.sp-row:hover {
                    background: rgba(255,255,255,0.02);
                }
                .sp-label {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: #6b7280;
                    padding: 0 4px 8px;
                }
            `}</style>

            <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-4 sp-body">
                {/* Header */}
                <header className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className={`rounded-full p-2 text-gray-400 transition hover:bg-white/[0.05] hover:text-white ${FOCUS_RING}`}
                        aria-label="Go back"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="sp-display text-2xl font-bold tracking-tight">Settings</h1>
                </header>

                <div className="space-y-6">
                    {/* APPEARANCE */}
                    <div>
                        <p className="sp-label">Appearance</p>
                        <div className="sp-group">
                            <ToggleRow
                                label="Dark mode"
                                description="Applies across the app where theming is wired up"
                                checked={settings.darkMode}
                                onChange={(checked) => updateSetting('darkMode', checked)}
                                thumbIcon="theme"
                            />
                        </div>
                    </div>

                    {/* NOTIFICATIONS */}
                    <div>
                        <p className="sp-label">Notifications</p>
                        <div className="sp-group">
                            <ToggleRow
                                label="Push notifications"
                                description={
                                    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied'
                                        ? 'Blocked in your browser settings'
                                        : 'Match updates and reminders'
                                }
                                checked={settings.pushNotifications}
                                onChange={handlePushToggle}
                            />
                            <ToggleRow
                                label="Email notifications"
                                description="Important alerts via email"
                                checked={settings.emailNotifications}
                                onChange={(checked) => updateSetting('emailNotifications', checked)}
                            />
                        </div>
                    </div>

                    {/* PRIVACY */}
                    <div>
                        <p className="sp-label">Privacy</p>
                        <div className="sp-group">
                            <ToggleRow
                                label="Show online status"
                                description="Let others see when you're active"
                                checked={settings.showOnlineStatus}
                                onChange={(checked) => updateSetting('showOnlineStatus', checked)}
                            />
                        </div>
                    </div>

                    {/* SUPPORT */}
                    <div>
                        <p className="sp-label">Support</p>
                        <div className="sp-group">
                            {loadingRequestStatus ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                </div>
                            ) : hasActiveRequest ? (
                                <div className="px-4 py-4">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1E90FF]/10">
                                            <CheckCircle className="h-4 w-4 text-[#5CA8FF]" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-white">
                                                Request {activeRequestStatus === 'pending' ? 'pending review' : 'being processed'}
                                            </p>
                                            <p className="mt-0.5 text-[12.5px] leading-relaxed text-gray-500">
                                                We're on it. You can submit another request once this one is resolved.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setSupportOpen((v) => !v)}
                                        aria-expanded={supportOpen}
                                        className={`sp-row w-full text-left ${FOCUS_RING}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <UserCog className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium">Contact support</span>
                                        </span>
                                        <ChevronDown
                                            className={`h-4 w-4 text-gray-500 transition-transform ${supportOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {supportOpen && (
                                        <div className="space-y-4 border-t border-white/[0.05] px-4 py-4">
                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                    Request type
                                                </label>
                                                <select
                                                    value={requestType}
                                                    onChange={(e) => setRequestType(e.target.value as RequestType)}
                                                    disabled={isFormDisabled}
                                                    className={`w-full rounded-lg border border-white/[0.08] bg-[#0a0a0b] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#1E90FF]/50 ${isFormDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                                >
                                                    <option value="report_abuse">Report abuse</option>
                                                    <option value="request_changes">Request changes</option>
                                                    <option value="delete_account">Delete account</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                                    Details
                                                </label>
                                                <textarea
                                                    value={requestReason}
                                                    onChange={(e) => handleReasonChange(e.target.value)}
                                                    rows={4}
                                                    disabled={isFormDisabled}
                                                    placeholder={
                                                        requestType === 'report_abuse'
                                                            ? 'Describe the abusive content or behaviour…'
                                                            : requestType === 'request_changes'
                                                                ? 'What changes do you need?'
                                                                : 'Why do you want to delete your account?'
                                                    }
                                                    className={`w-full resize-none rounded-lg border border-white/[0.08] bg-[#0a0a0b] px-3.5 py-3 text-sm outline-none transition focus:border-[#1E90FF]/50 ${isFormDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                                />
                                                <p className="mt-1 text-right text-[11px] text-gray-600">
                                                    {requestReason.length}/{REQUEST_REASON_MAX}
                                                </p>
                                            </div>

                                            {requestType === 'delete_account' && (
                                                <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3.5">
                                                    <p className="flex items-center gap-2 text-[13px] font-medium text-red-300">
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        Permanent action
                                                    </p>
                                                    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                                                        All your data will be removed. You have 7 days to cancel by contacting support.
                                                    </p>
                                                </div>
                                            )}

                                            <button
                                                onClick={handleSubmit}
                                                disabled={isFormDisabled}
                                                className={`flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E90FF] py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 ${FOCUS_RING}`}
                                            >
                                                {submitting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Send className="h-4 w-4" />
                                                )}
                                                {submitting ? 'Submitting…' : 'Submit request'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* CONTACT */}
                    <div>
                        <p className="sp-label">Contact</p>
                        <div className="sp-group">
                            <button
                                onClick={() => setContactModalOpen(true)}
                                className={`sp-row w-full text-left ${FOCUS_RING}`}
                            >
                                <span className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Get in touch</span>
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* LEGAL */}
                    <div>
                        <p className="sp-label">Legal</p>
                        <div className="sp-group">
                            <LinkRow to="/terms" label="Terms of Service" />
                            <LinkRow to="/privacy" label="Privacy Policy" />
                        </div>
                    </div>

                    {/* ABOUT */}
                    <div>
                        <p className="sp-label">About</p>
                        <div className="sp-group">
                            <button
                                type="button"
                                onClick={() => setAboutOpen(true)}
                                className={`sp-row w-full text-left ${FOCUS_RING}`}
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.04]">
                                        <Shield className="h-4 w-4 text-[#5CA8FF]" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            Claim The Room<sup className="ml-0.5 text-[11px] font-medium text-gray-400">™</sup>
                                        </p>
                                        <p className="mt-0.5 truncate text-[11px] text-gray-500">
                                            Competitive eFootball matchmaking
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <span className="rounded-full border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium text-gray-500">
                                        {APP_VERSION}
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-gray-600" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* LOGOUT */}
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/15 bg-red-500/[0.04] py-3.5 text-sm font-semibold text-red-400 transition hover:border-red-500/30 hover:bg-red-500/[0.08] active:scale-[0.99] disabled:opacity-50 ${FOCUS_RING}`}
                    >
                        {isLoggingOut ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Signing out…
                            </>
                        ) : (
                            <>
                                <LogOut className="h-4 w-4" />
                                Log out
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Contact Modal */}
            {contactModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setContactModalOpen(false); }}
                    onKeyDown={(e) => e.key === 'Escape' && setContactModalOpen(false)}
                >
                    <div className="w-full max-w-md overflow-hidden rounded-t-2xl border border-white/[0.08] bg-[#0f0f11] sm:rounded-2xl">
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                            <p className="text-sm font-semibold">Get in touch</p>
                            <button
                                onClick={() => setContactModalOpen(false)}
                                className={`rounded-full p-1.5 text-gray-500 transition hover:bg-white/[0.05] hover:text-white ${FOCUS_RING}`}
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="divide-y divide-white/[0.05]">
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
                        <p className="border-t border-white/[0.05] px-4 py-3 text-center text-[11px] text-gray-600">
                            Tap any row to copy
                        </p>
                    </div>
                </div>
            )}

            {/* About Modal */}
            {aboutOpen && (
                <AboutModal onClose={() => setAboutOpen(false)} version={APP_VERSION} />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
                    onKeyDown={(e) => e.key === 'Escape' && setShowDeleteConfirm(false)}
                >
                    <div className="w-full max-w-md overflow-hidden rounded-t-2xl border border-white/[0.08] bg-[#0f0f11] sm:rounded-2xl">
                        <div className="px-5 py-5">
                            <div className="flex items-start gap-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-500/10">
                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white">Delete your account?</p>
                                    <p className="mt-1 text-[12.5px] leading-relaxed text-gray-500">
                                        This is permanent. All your data will be removed after a 7-day grace period.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 border-t border-white/[0.06] px-5 py-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className={`flex-1 rounded-lg border border-white/[0.08] py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.03] ${FOCUS_RING}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRequest}
                                disabled={submitting}
                                className={`flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 ${FOCUS_RING}`}
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------- Row components ---------- */

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
        <div className="sp-row">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{label}</p>
                {description && (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">{description}</p>
                )}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${FOCUS_RING} ${checked ? 'bg-[#1E90FF]' : 'border border-white/[0.08] bg-transparent'
                    }`}
                role="switch"
                aria-checked={checked}
                aria-label={label}
            >
                <span
                    className={`grid h-5 w-5 transform place-items-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'
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
        <Link to={to} className={`sp-row w-full ${FOCUS_RING}`}>
            <span className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{label}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-gray-600" />
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
        <button
            onClick={onCopy}
            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] ${FOCUS_RING}`}
        >
            <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white/[0.04]">
                    <Icon className="h-4 w-4" style={{ color: iconColor }} />
                </span>
                <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
                    <p className="truncate text-[13px] font-medium text-white">{value}</p>
                </div>
            </div>
            <Copy className="h-4 w-4 flex-shrink-0 text-gray-600" />
        </button>
    );
}

/* ---------- About Modal ---------- */

function AboutModal({
    onClose,
    version,
}: {
    onClose: () => void;
    version: string;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="About Claim The Room"
        >
            <div className="w-full max-w-md overflow-hidden rounded-t-2xl border border-white/[0.08] bg-[#0f0f11] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.9)] sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.04]">
                            <Shield className="h-5 w-5 text-[#5CA8FF]" />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-white">
                                Claim The Room<sup className="ml-0.5 text-[11px] font-medium text-gray-400">™</sup>
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-gray-500">
                                Competitive eFootball matchmaking
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className={`rounded-full p-1.5 text-gray-500 transition hover:bg-white/[0.05] hover:text-gray-200 ${FOCUS_RING}`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="divide-y divide-white/[0.05]">
                    <AboutSection label="Brand">
                        <p className="text-[13px] leading-relaxed text-gray-300">
                            CTR (<span className="text-white">Claim The Room</span>) is a
                            matchmaking tool built for the eFootball community.
                        </p>
                    </AboutSection>

                    <AboutSection label="Built by">
                        <div className="flex items-center gap-2.5">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#5CA8FF]/10 text-[10px] font-bold text-[#5CA8FF]">
                                H
                            </span>
                            <div>
                                <p className="text-[13px] font-medium text-white">
                                    HazyPixelStudios
                                </p>
                                <p className="text-[11px] text-gray-500">
                                    Design &amp; development
                                </p>
                            </div>
                        </div>
                    </AboutSection>

                    <AboutSection label="Registered to">
                        <p className="text-[13px] text-gray-300">
                            <span className="font-medium text-white">HBOOKS</span>
                            <span className="text-gray-500"> · Registered business and funding entity</span>
                        </p>
                    </AboutSection>

                    <AboutSection label="Legal">
                        <div className="space-y-1.5">
                            <Link
                                to="/terms"
                                onClick={onClose}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-gray-300 transition hover:bg-white/[0.04] hover:text-white ${FOCUS_RING}`}
                            >
                                <span>Terms of Service</span>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
                            </Link>
                            <Link
                                to="/privacy"
                                onClick={onClose}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-gray-300 transition hover:bg-white/[0.04] hover:text-white ${FOCUS_RING}`}
                            >
                                <span>Privacy Policy</span>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
                            </Link>
                        </div>
                    </AboutSection>

                    <div className="px-5 py-4">
                        <p className="text-[11px] leading-relaxed text-gray-600">
                            Not affiliated with, endorsed by, or sponsored by Konami Group
                            Corporation. All trademarks are the property of their respective
                            owners and are used here only to describe the Service.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3.5">
                    <span className="text-[11px] text-gray-600">
                        Version {version}
                    </span>
                    <button
                        onClick={onClose}
                        className={`rounded-full border border-white/[0.08] px-4 py-1.5 text-[12px] font-medium text-gray-300 transition hover:bg-white/[0.04] ${FOCUS_RING}`}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function AboutSection({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="px-5 py-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                {label}
            </p>
            {children}
        </div>
    );
}