import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
    Send, RefreshCw, Loader2, Pencil, Trash2, Check, X, CheckCircle, XCircle, AlertTriangle,
    Newspaper, Activity, Construction, KeyRound, LogOut, ShieldAlert, BarChart3, Globe,
    MonitorSmartphone, Bug, Inbox, Eye, MapPin, Clock, Smartphone, Laptop, User,
    FileText, Terminal, Music2, Search, Radio, Users, Zap, Timer, MapPinned,
    TrendingUp, Users2, Filter, Bot,
} from "lucide-react";
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const R2_PUBLIC_BASE = 'https://rmc.hpbooks.uk';

// ============================================================
// TYPES
// ============================================================
interface NewsPost {
    id: number;
    author_id: string;
    author_name: string;
    category: string;
    content: string;
    created_at: string;
}

interface WorkerStat {
    name: string;
    friendly_name: string;
    success: number;
    error: number;
    void_count: number;
    runs: number;
    success_rate: number;
    status: string;
    last_timestamp: string;
}

interface UserRequest {
    id: number;
    user_id: string;
    type: 'report_abuse' | 'request_changes' | 'delete_account';
    reason: string;
    status: 'pending' | 'processing' | 'resolved' | 'rejected';
    meta: any;
    created_at: string;
    resolved_at: string | null;
    resolved_by: string | null;
    admin_note: string | null;
}

interface AnalyticsEvent {
    id: number;
    event_type: 'page_view' | 'error' | 'signed_in' | 'onboarding_complete' | 'first_action';
    page_path: string;
    user_id: string | null;
    session_id: string;
    browser: string;
    os: string;
    device_type: string;
    screen_width: number | null;
    screen_height: number | null;
    referrer: string | null;
    error_message: string | null;
    error_stack: string | null;
    country: string | null;
    country_code: string | null;
    city: string | null;
    region: string | null;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
}

interface PlaylistTrack {
    id: number;
    title: string;
    url: string;
    duration_seconds: number | null;
    order_index: number;
    active: boolean;
    created_at: string;
}

interface AdworResponse {
    news: NewsPost[];
    workers: WorkerStat[];
    historyByWorker: Record<string, number[]>;
    maintenance: { enabled: boolean; message: string | null };
    requests: UserRequest[];
    playlist: PlaylistTrack[];
    fetched_at: string;
}

interface SessionSummary {
    session_id: string;
    user_id: string | null;
    country: string | null;
    country_code: string | null;
    city: string | null;
    region: string | null;
    latitude: number | null;
    longitude: number | null;
    device_type: string;
    browser: string;
    os: string;
    screen_width: number | null;
    screen_height: number | null;
    referrer: string | null;
    first_seen: string;
    last_seen: string;
    duration_ms: number;
    page_view_count: number;
    error_count: number;
    pages: string[];
    last_error: string | null;
    is_live: boolean;
    has_errors: boolean;
    is_suspected_bot: boolean;
}

interface GrowthKpis {
    dau: number;
    wau: number;
    mau: number;
    stickiness: number;
    sessionsPerUser: number;
}

interface FunnelStep {
    label: string;
    value: number;
    pct: number;
}

type Section = "requests" | "news" | "music" | "workers" | "maintenance" | "analytics";
type DateRange = '15m' | '30m' | '1h' | '24h' | '7d' | '30d' | 'all';

const LIVE_THRESHOLD_MS = 2 * 60 * 1000;
const BOT_MAX_DURATION_MS = 3000;

const NAV_ITEMS: { id: Section; label: string; icon: typeof Newspaper }[] = [
    { id: "requests", label: "Requests", icon: Inbox },
    { id: "news", label: "News", icon: Newspaper },
    { id: "music", label: "Music", icon: Music2 },
    { id: "workers", label: "Workers", icon: Activity },
    { id: "maintenance", label: "Maintenance", icon: Construction },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const REQUEST_TYPE_LABEL: Record<UserRequest['type'], string> = {
    report_abuse: 'Report abuse',
    request_changes: 'Request changes',
    delete_account: 'Delete account',
};

const REQUEST_TYPE_COLOR: Record<UserRequest['type'], string> = {
    report_abuse: 'text-red-400 bg-red-500/10 border-red-500/20',
    request_changes: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    delete_account: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const PIE_COLORS = ['#1E90FF', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#6b7280'];

const RANGE_OPTIONS: DateRange[] = ['15m', '30m', '1h', '24h', '7d', '30d', 'all'];

// ============================================================
// HELPERS
// ============================================================
function relativeTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
}

function rangeCutoff(range: DateRange): number {
    const now = Date.now();
    switch (range) {
        case '15m': return now - 15 * 60 * 1000;
        case '30m': return now - 30 * 60 * 1000;
        case '1h': return now - 60 * 60 * 1000;
        case '24h': return now - 24 * 60 * 60 * 1000;
        case '7d': return now - 7 * 24 * 60 * 60 * 1000;
        case '30d': return now - 30 * 24 * 60 * 60 * 1000;
        case 'all': return 0;
    }
}

function rangeBucketMs(range: DateRange): number {
    switch (range) {
        case '15m': return 60 * 1000;
        case '30m': return 2 * 60 * 1000;
        case '1h': return 5 * 60 * 1000;
        case '24h': return 60 * 60 * 1000;
        case '7d': return 6 * 60 * 60 * 1000;
        case '30d': return 24 * 60 * 60 * 1000;
        case 'all': return 24 * 60 * 60 * 1000;
    }
}

function flagEmoji(code: string | null | undefined): string {
    if (!code || code.length !== 2) return '🌍';
    const A = 0x1F1E6;
    return String.fromCodePoint(
        A + code.toUpperCase().charCodeAt(0) - 65,
        A + code.toUpperCase().charCodeAt(1) - 65,
    );
}

function osIcon(os: string | null | undefined) {
    const o = (os || '').toLowerCase();
    if (o.includes('android') || o.includes('ios')) return Smartphone;
    if (o.includes('windows') || o.includes('linux') || o.includes('mac')) return Laptop;
    return MonitorSmartphone;
}

function formatDuration(seconds: number | null): string {
    if (seconds == null || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDurationMs(ms: number): string {
    if (ms < 1000) return '<1s';
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m < 60) return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
}

function categorizeError(message: string | null): string {
    if (!message) return 'Other';
    const m = message.toLowerCase();
    if (m.includes('unhandled promise rejection') || m.includes('unhandledrejection')) return 'Unhandled promise';
    if (m.includes('network') || m.includes('fetch') || m.includes('cors')) return 'Network / fetch';
    if (m.includes('cannot read prop') || m.includes('undefined is not') || m.includes('null is not')) return 'Null / undefined access';
    if (m.includes('script error')) return 'Cross-origin script';
    if (m.includes('chunk') || m.includes('loading chunk')) return 'Chunk load failure';
    if (m.includes('hydration') || m.includes('react')) return 'React';
    if (m.includes('quota') || m.includes('storage')) return 'Storage';
    if (m.includes('permission')) return 'Permission';
    return 'Uncaught exception';
}

function attributeAnonymousEvents(events: AnalyticsEvent[]): AnalyticsEvent[] {
    const sessionUser = new Map<string, string>();
    for (const e of events) {
        if (e.user_id) {
            sessionUser.set(e.session_id, e.user_id);
        }
    }
    return events.map((e) => {
        if (e.user_id) return e;
        const uid = sessionUser.get(e.session_id);
        if (uid) return { ...e, user_id: uid };
        return e;
    });
}

function buildSessions(events: AnalyticsEvent[]): SessionSummary[] {
    const map = new Map<string, SessionSummary>();
    const now = Date.now();

    for (const e of events) {
        let s = map.get(e.session_id);

        if (!s) {
            s = {
                session_id: e.session_id,
                user_id: e.user_id,
                country: e.country,
                country_code: e.country_code,
                city: e.city,
                region: e.region,
                latitude: e.latitude,
                longitude: e.longitude,
                device_type: e.device_type || 'unknown',
                browser: e.browser || 'unknown',
                os: e.os || 'unknown',
                screen_width: e.screen_width,
                screen_height: e.screen_height,
                referrer: e.referrer,
                first_seen: e.created_at,
                last_seen: e.created_at,
                duration_ms: 0,
                page_view_count: 0,
                error_count: 0,
                pages: [],
                last_error: null,
                is_live: false,
                has_errors: false,
                is_suspected_bot: false,
            };
            map.set(e.session_id, s);
        }

        if (e.created_at < s.first_seen) s.first_seen = e.created_at;
        if (e.created_at > s.last_seen) s.last_seen = e.created_at;
        if (!s.latitude && e.latitude != null) s.latitude = e.latitude;
        if (!s.longitude && e.longitude != null) s.longitude = e.longitude;
        if (!s.country && e.country) s.country = e.country;
        if (!s.country_code && e.country_code) s.country_code = e.country_code;
        if (!s.city && e.city) s.city = e.city;
        if (!s.region && e.region) s.region = e.region;
        if (!s.user_id && e.user_id) s.user_id = e.user_id;

        if (e.event_type === 'page_view') {
            s.page_view_count++;
            if (e.page_path && !s.pages.includes(e.page_path)) s.pages.push(e.page_path);
        } else if (e.event_type === 'error') {
            s.error_count++;
            if (e.error_message) s.last_error = e.error_message;
        }
    }

    const out = Array.from(map.values());
    for (const s of out) {
        s.duration_ms = new Date(s.last_seen).getTime() - new Date(s.first_seen).getTime();
        s.is_live = now - new Date(s.last_seen).getTime() < LIVE_THRESHOLD_MS;
        s.has_errors = s.error_count > 0;

        const underBotDuration = s.duration_ms < BOT_MAX_DURATION_MS;
        const singleSlashPage =
            s.page_view_count <= 1 &&
            s.pages.length <= 1 &&
            (s.pages.length === 0 || s.pages[0] === '/');
        const ultraFast = s.duration_ms < 500;
        const noPageViews = s.page_view_count === 0;

        s.is_suspected_bot =
            (underBotDuration && singleSlashPage) ||
            ultraFast ||
            noPageViews;
    }
    return out.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());
}

function uniqueUsersInWindow(events: AnalyticsEvent[], windowMs: number): number {
    const cutoff = Date.now() - windowMs;
    const set = new Set<string>();
    for (const e of events) {
        if (new Date(e.created_at).getTime() < cutoff) continue;
        const key = e.user_id || e.session_id;
        if (key) set.add(key);
    }
    return set.size;
}

function uniqueUsersTotal(events: AnalyticsEvent[]): number {
    const set = new Set<string>();
    for (const e of events) {
        const key = e.user_id || e.session_id;
        if (key) set.add(key);
    }
    return set.size;
}

function countSessions(events: AnalyticsEvent[]): number {
    const set = new Set<string>();
    for (const e of events) if (e.session_id) set.add(e.session_id);
    return set.size;
}

// ============================================================
// MAIN
// ============================================================
export default function AdminPage() {
    const { user, getToken, logout } = useKindeAuth();
    const [section, setSection] = useState<Section>("requests");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastFetched, setLastFetched] = useState<string | null>(null);

    const [news, setNews] = useState<NewsPost[]>([]);
    const [workers, setWorkers] = useState<WorkerStat[]>([]);
    const [historyByWorker, setHistoryByWorker] = useState<Record<string, number[]>>({});
    const [requests, setRequests] = useState<UserRequest[]>([]);
    const [playlist, setPlaylist] = useState<PlaylistTrack[]>([]);

    const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState("");
    const [maintenanceKey, setMaintenanceKey] = useState("");
    const [savingMaintenance, setSavingMaintenance] = useState(false);

    const fetchAdminData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Session expired. Please sign in again.');
                return;
            }
            const res = await fetch(`${BASE_URL}/Adwor`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                toast.error('Unauthorized — your admin ID may not be in ADMIN_KINDE_IDS.');
                return;
            }
            if (!res.ok) throw new Error(`Adwor failed (${res.status})`);
            const data: AdworResponse = await res.json();

            setNews(data.news ?? []);
            setWorkers(data.workers ?? []);
            setHistoryByWorker(data.historyByWorker ?? {});
            setRequests(data.requests ?? []);
            setPlaylist(data.playlist ?? []);
            setMaintenanceEnabled(!!data.maintenance?.enabled);
            setMaintenanceMessage(data.maintenance?.message ?? '');
            setLastFetched(data.fetched_at ?? new Date().toISOString());
        } catch (err: any) {
            toast.error(err?.message ?? 'Failed to load admin data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const [busyRequestId, setBusyRequestId] = useState<number | null>(null);

    const handleRequestAction = async (
        id: number,
        action: 'resolve' | 'reject' | 'delete',
        note?: string,
    ) => {
        if (!confirm(
            action === 'delete'
                ? 'Permanently delete this request?'
                : `${action === 'resolve' ? 'Mark as resolved' : 'Reject'} this request?`,
        )) return;

        setBusyRequestId(id);
        try {
            const token = await getToken();
            if (!token) { toast.error('Session expired.'); return; }
            const res = await fetch(`${BASE_URL}/RequestAction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id, action, note }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Action failed');

            toast.success(
                action === 'delete' ? 'Request deleted'
                    : action === 'resolve' ? 'Marked as resolved'
                        : 'Request rejected',
            );
            setRequests((prev) => prev.filter((r) => r.id !== id));
        } catch (err: any) {
            toast.error(err?.message ?? 'Action failed');
        } finally {
            setBusyRequestId(null);
        }
    };

    const [newsContent, setNewsContent] = useState("");
    const [posting, setPosting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    const postNews = async () => {
        if (!newsContent.trim()) return;
        setPosting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/Adnew`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: newsContent }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to post news");
            toast.success("News posted!");
            setNewsContent("");
            fetchAdminData(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to post news");
        } finally {
            setPosting(false);
        }
    };

    const saveEdit = async (postId: number) => {
        if (!editContent.trim()) return;
        setSavingEdit(true);
        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/Upnews`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: postId, content: editContent }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update");
            toast.success("News updated!");
            setEditingId(null);
            fetchAdminData(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to update");
        } finally {
            setSavingEdit(false);
        }
    };

    const deleteNews = async (postId: number) => {
        if (!confirm("Delete this news post?")) return;
        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/Delnews`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: postId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete");
            toast.success("News deleted!");
            fetchAdminData(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete");
        }
    };

    const applyMaintenance = async (nextEnabled: boolean) => {
        if (!maintenanceKey.trim()) { toast.error("Enter your admin key first"); return; }
        const confirmMsg = nextEnabled
            ? "This will block every visitor. Continue?"
            : "Bring the app back online for everyone?";
        if (!confirm(confirmMsg)) return;

        setSavingMaintenance(true);
        try {
            const res = await fetch(`${BASE_URL}/Set_Maintenance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: nextEnabled,
                    message: maintenanceMessage,
                    key: maintenanceKey,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update");
            setMaintenanceEnabled(nextEnabled);
            toast.success(nextEnabled ? "Maintenance mode ON" : "Site is back online");
        } catch (err: any) {
            toast.error(err.message || "Failed to update");
        } finally {
            setSavingMaintenance(false);
        }
    };

    const pendingCount = requests.filter((r) => r.status === 'pending').length;

    return (
        <div className="flex min-h-screen bg-[#0A0A0A] text-white">
            <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-white/5 bg-[#0C0C0C] sm:flex">
                <div className="px-5 py-5">
                    <p className="cr-display text-sm font-bold tracking-wide">Admin</p>
                    <p className="mt-0.5 text-xs text-gray-500">Claim The Room</p>
                </div>
                <nav className="flex-1 space-y-1 px-3">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = section === item.id;
                        const badge = item.id === 'requests' && pendingCount > 0 ? pendingCount : null;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setSection(item.id)}
                                className={cn(
                                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    active ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white",
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                                {badge !== null && (
                                    <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                        {badge}
                                    </span>
                                )}
                                {item.id === "maintenance" && maintenanceEnabled && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />
                                )}
                            </button>
                        );
                    })}
                </nav>
                <div className="border-t border-white/5 px-5 py-4">
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                    {logout && (
                        <button
                            onClick={() => logout()}
                            className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition"
                        >
                            <LogOut className="h-3 w-3" />
                            Sign out
                        </button>
                    )}
                </div>
            </aside>

            <div className="fixed inset-x-0 top-0 z-20 flex border-b border-white/5 bg-[#0A0A0A]/95 backdrop-blur sm:hidden">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = section === item.id;
                    const badge = item.id === 'requests' && pendingCount > 0 ? pendingCount : null;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setSection(item.id)}
                            className={cn(
                                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                                active ? "text-white" : "text-gray-500",
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                            {badge !== null && (
                                <span className="absolute top-1 right-1/4 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[9px] font-bold leading-4 text-white">
                                    {badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <main className="min-w-0 flex-1 px-5 py-6 pt-16 sm:pt-6 sm:px-8 sm:py-8">
                <div className="mx-auto max-w-5xl">
                    {maintenanceEnabled && (
                        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                            Maintenance mode is live — visitors can't reach the app right now.
                        </div>
                    )}

                    <div className="mb-5 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            {lastFetched ? `Updated ${relativeTime(lastFetched)}` : 'Loading…'}
                        </p>
                        <button
                            onClick={() => fetchAdminData(true)}
                            disabled={refreshing || loading}
                            className="rounded-full p-2 text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                            title="Refresh"
                        >
                            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="grid place-items-center py-24">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {section === "requests" && (
                                <RequestsSection
                                    requests={requests}
                                    busyId={busyRequestId}
                                    onAction={handleRequestAction}
                                />
                            )}
                            {section === "news" && (
                                <NewsSection
                                    news={news}
                                    newsContent={newsContent}
                                    setNewsContent={setNewsContent}
                                    posting={posting}
                                    postNews={postNews}
                                    editingId={editingId}
                                    setEditingId={setEditingId}
                                    editContent={editContent}
                                    setEditContent={setEditContent}
                                    savingEdit={savingEdit}
                                    saveEdit={saveEdit}
                                    deleteNews={deleteNews}
                                />
                            )}
                            {section === "music" && (
                                <MusicSection
                                    playlist={playlist}
                                    onRefresh={() => fetchAdminData(true)}
                                    getToken={getToken}
                                />
                            )}
                            {section === "workers" && (
                                <WorkersSection workers={workers} historyByWorker={historyByWorker} />
                            )}
                            {section === "maintenance" && (
                                <MaintenanceSection
                                    enabled={maintenanceEnabled}
                                    message={maintenanceMessage}
                                    setMessage={setMaintenanceMessage}
                                    adminKey={maintenanceKey}
                                    setAdminKey={setMaintenanceKey}
                                    saving={savingMaintenance}
                                    apply={applyMaintenance}
                                />
                            )}
                            {section === "analytics" && <AnalyticsSection />}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

// ============================================================
// REQUESTS SECTION
// ============================================================
function RequestsSection({
    requests,
    busyId,
    onAction,
}: {
    requests: UserRequest[];
    busyId: number | null;
    onAction: (id: number, action: 'resolve' | 'reject' | 'delete', note?: string) => void;
}) {
    const [viewing, setViewing] = useState<UserRequest | null>(null);
    const [noteFor, setNoteFor] = useState<{ id: number; action: 'resolve' | 'reject' } | null>(null);
    const [note, setNote] = useState('');

    if (requests.length === 0) {
        return (
            <div className="rounded-2xl border border-white/5 bg-[#141414] p-12 text-center">
                <Inbox className="mx-auto h-10 w-10 text-gray-600" />
                <p className="mt-3 text-sm font-medium">No pending requests</p>
                <p className="mt-1 text-xs text-gray-500">All caught up.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="cr-display text-xl font-bold">Requests</h1>
                <p className="mt-1 text-sm text-gray-500">
                    {requests.length} active · {requests.filter((r) => r.status === 'pending').length} pending
                </p>
            </div>

            <div className="space-y-3">
                {requests.map((r) => (
                    <div
                        key={r.id}
                        className="rounded-2xl border border-white/5 bg-[#141414] p-4 sm:p-5 transition hover:border-white/10"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", REQUEST_TYPE_COLOR[r.type])}>
                                        {REQUEST_TYPE_LABEL[r.type]}
                                    </span>
                                    <span className={cn(
                                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                                        r.status === 'pending'
                                            ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                                            : "border-blue-500/20 bg-blue-500/10 text-blue-400",
                                    )}>
                                        {r.status}
                                    </span>
                                    <span className="text-xs text-gray-500">#{r.id}</span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm text-gray-300">{r.reason}</p>
                                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {relativeTime(r.created_at)}
                                    </span>
                                    <span className="truncate max-w-[180px]">uid: {r.user_id.slice(0, 16)}…</span>
                                </p>
                            </div>

                            <div className="flex shrink-0 gap-1">
                                <button
                                    onClick={() => setViewing(r)}
                                    className="rounded-full p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                                    title="View details"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => { setNoteFor({ id: r.id, action: 'resolve' }); setNote(''); }}
                                    disabled={busyId === r.id}
                                    className="rounded-full p-2 text-green-400 transition hover:bg-green-500/20 disabled:opacity-40"
                                    title="Resolve"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => { setNoteFor({ id: r.id, action: 'reject' }); setNote(''); }}
                                    disabled={busyId === r.id}
                                    className="rounded-full p-2 text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-40"
                                    title="Reject"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => onAction(r.id, 'delete')}
                                    disabled={busyId === r.id}
                                    className="rounded-full p-2 text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
                                    title="Delete"
                                >
                                    {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {viewing && <RequestDetailModal request={viewing} onClose={() => setViewing(null)} />}

            {noteFor && (
                <Modal
                    onClose={() => setNoteFor(null)}
                    title={noteFor.action === 'resolve' ? 'Resolve request' : 'Reject request'}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400">
                            {noteFor.action === 'resolve'
                                ? 'Optional internal note about how this was resolved.'
                                : 'Optional reason for rejection (internal only).'}
                        </p>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value.slice(0, 500))}
                            rows={3}
                            placeholder="Note (optional)…"
                            className="w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setNoteFor(null)}
                                className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { onAction(noteFor.id, noteFor.action, note); setNoteFor(null); }}
                                className={cn(
                                    "rounded-full px-5 py-2 text-sm font-semibold text-white",
                                    noteFor.action === 'resolve'
                                        ? "bg-green-600 hover:brightness-110"
                                        : "bg-yellow-600 hover:brightness-110",
                                )}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ============================================================
// REQUEST DETAIL MODAL
// ============================================================
function RequestDetailModal({ request, onClose }: { request: UserRequest; onClose: () => void }) {
    const ua = request.meta?.user_agent as string | undefined;

    const parsedUa = ua
        ? {
            browser: ua.includes('Firefox') ? 'Firefox'
                : ua.includes('Edg') ? 'Edge'
                    : ua.includes('Chrome') ? 'Chrome'
                        : ua.includes('Safari') ? 'Safari' : 'Unknown',
            os: ua.includes('Windows') ? 'Windows'
                : ua.includes('Mac') ? 'macOS'
                    : ua.includes('Android') ? 'Android'
                        : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
                            : ua.includes('Linux') ? 'Linux' : 'Unknown',
        }
        : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
            <div className="relative max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/5 bg-[#141414] px-6 py-5">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", REQUEST_TYPE_COLOR[request.type])}>
                                {REQUEST_TYPE_LABEL[request.type]}
                            </span>
                            <span className={cn(
                                "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                request.status === 'pending'
                                    ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                                    : "border-blue-500/20 bg-blue-500/10 text-blue-400",
                            )}>
                                {request.status}
                            </span>
                        </div>
                        <h2 className="cr-display mt-2 text-lg font-bold">Request #{request.id}</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Submitted {new Date(request.created_at).toLocaleString()} · {relativeTime(request.created_at)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                    <section>
                        <div className="mb-2 flex items-center gap-2 text-gray-400">
                            <FileText className="h-3.5 w-3.5" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">Reason</h3>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                                {request.reason}
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="mb-2 flex items-center gap-2 text-gray-400">
                            <User className="h-3.5 w-3.5" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">User</h3>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4">
                            <p className="font-mono text-xs text-gray-300 break-all">{request.user_id}</p>
                        </div>
                    </section>

                    {parsedUa && (
                        <section>
                            <div className="mb-2 flex items-center gap-2 text-gray-400">
                                <Terminal className="h-3.5 w-3.5" />
                                <h3 className="text-xs font-semibold uppercase tracking-wide">Client</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-3">
                                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Browser</p>
                                    <p className="mt-1 text-sm font-medium">{parsedUa.browser}</p>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-3">
                                    <p className="text-[10px] uppercase tracking-wide text-gray-500">OS</p>
                                    <p className="mt-1 text-sm font-medium">{parsedUa.os}</p>
                                </div>
                            </div>
                        </section>
                    )}

                    <section>
                        <div className="mb-2 flex items-center gap-2 text-gray-400">
                            <Clock className="h-3.5 w-3.5" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">Timeline</h3>
                        </div>
                        <div className="space-y-2 rounded-xl border border-white/5 bg-[#0A0A0A] p-4">
                            <TimelineRow
                                label="Submitted"
                                value={new Date(request.created_at).toLocaleString()}
                                tone="default"
                            />
                            {request.resolved_at && (
                                <TimelineRow
                                    label={request.status === 'resolved' ? 'Resolved' : 'Rejected'}
                                    value={new Date(request.resolved_at).toLocaleString()}
                                    tone={request.status === 'resolved' ? 'green' : 'red'}
                                />
                            )}
                            {request.resolved_by && (
                                <TimelineRow
                                    label="Handled by"
                                    value={request.resolved_by}
                                    tone="default"
                                    mono
                                />
                            )}
                        </div>
                    </section>

                    {request.admin_note && (
                        <section>
                            <div className="mb-2 flex items-center gap-2 text-gray-400">
                                <FileText className="h-3.5 w-3.5" />
                                <h3 className="text-xs font-semibold uppercase tracking-wide">Admin note</h3>
                            </div>
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                                <p className="whitespace-pre-wrap text-sm text-blue-200">
                                    {request.admin_note}
                                </p>
                            </div>
                        </section>
                    )}

                    {ua && (
                        <details className="group">
                            <summary className="cursor-pointer list-none">
                                <span className="text-xs text-gray-500 hover:text-gray-300 transition">
                                    Show raw user agent ▾
                                </span>
                            </summary>
                            <pre className="mt-2 overflow-x-auto rounded-xl border border-white/5 bg-[#0A0A0A] p-3 text-[11px] leading-relaxed text-gray-500">
                                {ua}
                            </pre>
                        </details>
                    )}
                </div>

                <div className="sticky bottom-0 border-t border-white/5 bg-[#141414] px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full rounded-full border border-white/10 bg-transparent py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function TimelineRow({
    label,
    value,
    tone,
    mono,
}: {
    label: string;
    value: string;
    tone: 'default' | 'green' | 'red';
    mono?: boolean;
}) {
    const toneClass = {
        default: 'text-gray-300',
        green: 'text-green-400',
        red: 'text-red-400',
    }[tone];

    return (
        <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className={cn("text-right", toneClass, mono && "font-mono text-xs break-all")}>
                {value}
            </span>
        </div>
    );
}

// ============================================================
// NEWS SECTION
// ============================================================
function NewsSection({
    news, newsContent, setNewsContent, posting, postNews,
    editingId, setEditingId, editContent, setEditContent, savingEdit, saveEdit, deleteNews,
}: any) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="cr-display text-xl font-bold">News</h1>
                <p className="mt-1 text-sm text-gray-500">Post and manage official announcements.</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Post News</h2>
                <textarea
                    value={newsContent}
                    onChange={(e: any) => setNewsContent(e.target.value.slice(0, 1000))}
                    rows={3}
                    placeholder="Write an announcement…"
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{newsContent.length}/1000</span>
                    <button
                        onClick={postNews}
                        disabled={!newsContent.trim() || posting}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                    >
                        <Send className="h-4 w-4" />
                        {posting ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                    Existing News <span className="text-gray-600">· {news.length}</span>
                </h2>
                {news.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500">No news posts yet.</p>
                ) : (
                    <div className="space-y-3">
                        {news.map((post: NewsPost) => (
                            <div key={post.id} className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4">
                                {editingId === post.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value.slice(0, 1000))}
                                            rows={3}
                                            className="w-full resize-none rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-sm outline-none focus:border-primary"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => saveEdit(post.id)}
                                                disabled={savingEdit}
                                                className="rounded-full p-2 text-green-400 hover:bg-white/5 hover:text-white"
                                            >
                                                <Check className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-300">{post.content}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {post.author_name} · {relativeTime(post.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <button
                                                onClick={() => { setEditingId(post.id); setEditContent(post.content); }}
                                                className="rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteNews(post.id)}
                                                className="rounded-full p-2 text-red-400 hover:bg-red-500/20 hover:text-white"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// MUSIC SECTION
// ============================================================
// ============================================================
// MUSIC SECTION
// ============================================================
function MusicSection({
    playlist,
    onRefresh,
    getToken,
}: {
    playlist: PlaylistTrack[];
    onRefresh: () => void;
    getToken: () => Promise<string | null>;
}) {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [duration, setDuration] = useState('');
    const [adding, setAdding] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);

    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeCount = playlist.filter((t) => t.active).length;

    const addTrack = async () => {
        if (!title.trim() || !url.trim()) {
            toast.error('Title and URL are required');
            return;
        }
        setAdding(true);
        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/Plmu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'add',
                    title: title.trim(),
                    url: url.trim(),
                    duration_seconds: duration ? Number(duration) : null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add track');
            toast.success('Track added');
            setTitle('');
            setUrl('');
            setDuration('');
            onRefresh();
        } catch (err: any) {
            toast.error(err?.message ?? 'Failed to add track');
        } finally {
            setAdding(false);
        }
    };

    const uploadFile = async (file: File) => {
        if (!file) return;
        if (!file.type.startsWith('audio/')) {
            toast.error('Only audio files are allowed');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            toast.error('File too large (max 20 MB)');
            return;
        }

        setUploading(true);
        try {
            const token = await getToken();

            const prep = await fetch(`${BASE_URL}/Rmup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type || 'audio/mpeg',
                }),
            });
            const prepData = await prep.json();
            if (!prep.ok) throw new Error(prepData.error || 'Failed to prepare upload');

            const put = await fetch(prepData.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type || 'audio/mpeg' },
                body: file,
            });
            if (!put.ok) throw new Error(`R2 upload failed (${put.status})`);

            const guessedTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');

            const insert = await fetch(`${BASE_URL}/Plmu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'add',
                    title: guessedTitle,
                    url: prepData.publicUrl,
                    duration_seconds: null,
                }),
            });
            const insertData = await insert.json();
            if (!insert.ok) throw new Error(insertData.error || 'Failed to save track');

            toast.success(`Uploaded: ${guessedTitle}`);
            onRefresh();
        } catch (err: any) {
            toast.error(err?.message ?? 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        e.target.value = '';
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    const toggleTrack = async (id: number) => {
        setBusyId(id);
        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/Plmu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action: 'toggle', id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to toggle');
            toast.success('Updated');
            onRefresh();
        } catch (err: any) {
            toast.error(err?.message ?? 'Failed to toggle');
        } finally {
            setBusyId(null);
        }
    };

    const deleteTrack = async (id: number, trackTitle: string) => {
        if (!confirm(`Delete "${trackTitle}" from the playlist?`)) return;
        setBusyId(id);
        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/Plmu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action: 'delete', id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete');
            toast.success('Track deleted');
            onRefresh();
        } catch (err: any) {
            toast.error(err?.message ?? 'Failed to delete');
        } finally {
            setBusyId(null);
        }
    };

    const inactiveCount = playlist.length - activeCount;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="cr-display text-xl font-semibold tracking-tight">Music</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Background music playlist · {activeCount} active · {playlist.length} total
                </p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                {/* Left: add tracks */}
                <div className="space-y-6">
                    <Card title="Upload audio" subtitle="Files are stored in your R2 bucket and added to the playlist.">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={cn(
                                'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-8 text-center transition-colors',
                                dragOver
                                    ? 'border-primary/60 bg-primary/5'
                                    : 'border-white/10 bg-[#0A0A0A] hover:border-white/20',
                                uploading && 'pointer-events-none opacity-60',
                            )}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                    <p className="text-sm text-gray-400">Uploading…</p>
                                </>
                            ) : (
                                <>
                                    <Music2 className="h-5 w-5 text-gray-500" />
                                    <p className="text-sm text-gray-300">
                                        Drop an MP3 here, or <span className="text-[#5CA8FF]">browse</span>
                                    </p>
                                    <p className="text-xs text-gray-500">Max 20 MB · audio/*</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={onFileChange}
                            className="hidden"
                        />
                    </Card>

                    <Card title="Add by URL" subtitle="Link to a track that is already hosted.">
                        <div className="space-y-4">
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-medium text-gray-400">Title</span>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                                    placeholder="Track title"
                                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-600 focus:border-primary/60"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-medium text-gray-400">URL</span>
                                <input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder={`${R2_PUBLIC_BASE}/track.mp3`}
                                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 font-mono text-xs outline-none transition-colors placeholder:text-gray-600 focus:border-primary/60"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-400">
                                    Duration <span className="font-normal text-gray-600">Optional · seconds</span>
                                </span>
                                <input
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                    placeholder="e.g. 214"
                                    inputMode="numeric"
                                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2 text-sm tabular-nums outline-none transition-colors placeholder:text-gray-600 focus:border-primary/60"
                                />
                            </label>
                            <button
                                onClick={addTrack}
                                disabled={adding || !title.trim() || !url.trim()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                            >
                                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Add track
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Right: playlist */}
                <Card
                    title="Playlist"
                    subtitle={`${playlist.length} track${playlist.length === 1 ? '' : 's'}`}
                    action={
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span><span className="tabular-nums text-green-400">{activeCount}</span> active</span>
                            <span><span className="tabular-nums text-gray-300">{inactiveCount}</span> inactive</span>
                        </div>
                    }
                    flush
                >
                    {playlist.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <Music2 className="mx-auto h-6 w-6 text-gray-600" />
                            <p className="mt-3 text-sm text-gray-400">No tracks yet</p>
                            <p className="mt-1 text-xs text-gray-600">Upload a file or add a URL to get started.</p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden grid-cols-[28px_minmax(0,1fr)_64px_92px_36px] items-center gap-4 border-b border-white/[0.06] px-5 py-2.5 text-xs font-medium text-gray-500 sm:grid">
                                <span>#</span>
                                <span>Track</span>
                                <span className="text-right">Length</span>
                                <span>Status</span>
                                <span />
                            </div>
                            <div className="divide-y divide-white/[0.06]">
                                {playlist.map((track, i) => (
                                    <div
                                        key={track.id}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors hover:bg-white/[0.02] sm:grid-cols-[28px_minmax(0,1fr)_64px_92px_36px]"
                                    >
                                        <span className="hidden text-xs tabular-nums text-gray-600 sm:block">{i + 1}</span>
                                        <div className="min-w-0">
                                            <p className={cn("truncate text-sm font-medium", track.active ? "text-white" : "text-gray-500")}>
                                                {track.title}
                                            </p>
                                            <p className="mt-0.5 truncate font-mono text-[11px] text-gray-600">{track.url}</p>
                                        </div>
                                        <span className="hidden text-right text-xs tabular-nums text-gray-400 sm:block">
                                            {track.duration_seconds != null ? formatDuration(track.duration_seconds) : '—'}
                                        </span>
                                        <button
                                            onClick={() => toggleTrack(track.id)}
                                            disabled={busyId === track.id}
                                            title={track.active ? 'Deactivate' : 'Activate'}
                                            className={cn(
                                                "inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                                                track.active
                                                    ? "border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/15"
                                                    : "border-white/10 text-gray-400 hover:bg-white/5 hover:text-white",
                                            )}
                                        >
                                            {busyId === track.id
                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                : <span className={cn("h-1.5 w-1.5 rounded-full", track.active ? "bg-green-400" : "bg-gray-500")} />}
                                            {track.active ? 'Active' : 'Inactive'}
                                        </button>
                                        <button
                                            onClick={() => deleteTrack(track.id, track.title)}
                                            disabled={busyId === track.id}
                                            className="justify-self-end rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}

// ============================================================
// WORKERS SECTION
// ============================================================
function WorkersSection({
    workers,
    historyByWorker,
}: {
    workers: WorkerStat[];
    historyByWorker: Record<string, number[]>;
}) {
    const [filter, setFilter] = useState<'all' | 'problem'>('all');
    const [query, setQuery] = useState('');

    const sorted = useMemo(() => {
        const order = { 'High traffic': 0, 'Degraded': 1, 'No data': 2, 'No problems': 3 };
        return [...workers]
            .filter((w) => filter === 'all' || w.status !== 'No problems')
            .filter((w) => !query || w.friendly_name.toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => {
                const oa = order[a.status as keyof typeof order] ?? 4;
                const ob = order[b.status as keyof typeof order] ?? 4;
                if (oa !== ob) return oa - ob;
                return a.friendly_name.localeCompare(b.friendly_name);
            });
    }, [workers, filter, query]);

    const stats = useMemo(() => ({
        total: workers.length,
        healthy: workers.filter((w) => w.status === 'No problems').length,
        degraded: workers.filter((w) => w.status === 'Degraded').length,
        critical: workers.filter((w) => w.status === 'High traffic').length,
        nodata: workers.filter((w) => w.status === 'No data').length,
    }), [workers]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="cr-display text-xl font-bold">Workers</h1>
                <p className="mt-1 text-sm text-gray-500">Background job health and run history.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard label="Healthy" value={stats.healthy} tone="green" icon={<CheckCircle className="h-4 w-4" />} />
                <KpiCard label="Degraded" value={stats.degraded} tone="yellow" icon={<AlertTriangle className="h-4 w-4" />} />
                <KpiCard label="Critical" value={stats.critical} tone="red" icon={<XCircle className="h-4 w-4" />} />
                <KpiCard label="No data" value={stats.nodata} tone="gray" icon={<Activity className="h-4 w-4" />} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-full border border-white/10 bg-[#141414] p-1">
                    {(['all', 'problem'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "rounded-full px-4 py-1.5 text-xs font-medium transition",
                                filter === f ? "bg-white/10 text-white" : "text-gray-500 hover:text-white",
                            )}
                        >
                            {f === 'all' ? 'All' : 'Problems only'}
                        </button>
                    ))}
                </div>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search workers…"
                    className="flex-1 min-w-[180px] rounded-full border border-white/10 bg-[#141414] px-4 py-1.5 text-xs outline-none focus:border-primary"
                />
            </div>

            {sorted.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">No workers match.</p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {sorted.map((w) => (
                        <WorkerCard key={w.name} worker={w} history={historyByWorker[w.name] ?? []} />
                    ))}
                </div>
            )}
        </div>
    );
}

function WorkerCard({ worker, history }: { worker: WorkerStat; history: number[] }) {
    const tone =
        worker.status === 'No problems' ? 'green'
            : worker.status === 'Degraded' ? 'yellow'
                : worker.status === 'High traffic' ? 'red'
                    : 'gray';

    const ringColor = {
        green: '#22c55e',
        yellow: '#f59e0b',
        red: '#ef4444',
        gray: '#6b7280',
    }[tone];

    const statusLabel = {
        green: 'Healthy',
        yellow: 'Degraded',
        red: 'Critical',
        gray: 'No data',
    }[tone];

    const sparkline = history.length > 1
        ? history
        : [worker.success_rate, worker.success_rate];

    return (
        <div className="rounded-2xl border border-white/5 bg-[#141414] p-4 transition hover:border-white/10">
            <div className="flex items-start gap-3">
                <ProgressRing value={worker.success_rate} color={ringColor} size={64} stroke={5} />

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{worker.friendly_name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-gray-600">{worker.name}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            tone === 'green' && "bg-green-500/10 text-green-400",
                            tone === 'yellow' && "bg-yellow-500/10 text-yellow-400",
                            tone === 'red' && "bg-red-500/10 text-red-400",
                            tone === 'gray' && "bg-gray-500/10 text-gray-400",
                        )}>
                            {statusLabel}
                        </span>
                        <span className="text-[10px] text-gray-500">
                            {relativeTime(worker.last_timestamp)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-3 h-10">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkline.map((v, i) => ({ i, v }))}>
                        <Line type="monotone" dataKey="v" stroke={ringColor} strokeWidth={2} dot={false} />
                        <YAxis domain={[0, 100]} hide />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
                <div>
                    <p className="text-xs text-gray-500">Success</p>
                    <p className="text-sm font-semibold text-green-400">{worker.success.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Errors</p>
                    <p className="text-sm font-semibold text-red-400">{worker.error.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Runs</p>
                    <p className="text-sm font-semibold">{worker.runs.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

function ProgressRing({ value, color, size = 64, stroke = 5 }: { value: number; color: string; size?: number; stroke?: number }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (value / 100) * c;
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
                <span className="text-xs font-bold">{value}%</span>
            </div>
        </div>
    );
}

// ============================================================
// MAINTENANCE SECTION
// ============================================================
function MaintenanceSection({
    enabled, message, setMessage, adminKey, setAdminKey, saving, apply,
}: any) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="cr-display text-xl font-bold">Maintenance Mode</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Block every visitor with a holding page while you make changes.
                </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#0A0A0A] p-4">
                        <div>
                            <p className="text-sm font-medium">
                                Status: {enabled ? (
                                    <span className="text-red-400">Live — site is blocked</span>
                                ) : (
                                    <span className="text-green-400">Site is open</span>
                                )}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Visitors pick this up within ~8 seconds — no refresh needed.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Message shown to visitors (optional)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                            rows={2}
                            placeholder="We're making some improvements. This won't take long."
                            className="w-full resize-none rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            <KeyRound className="h-3 w-3" />
                            Admin key
                        </label>
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            placeholder="Required to confirm this change"
                            className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm outline-none focus:border-primary"
                        />
                        <p className="mt-1.5 text-xs text-gray-600">
                            The same key you'd append as <code className="text-gray-500">?key=</code> to bypass the block page.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                        {enabled ? (
                            <button
                                onClick={() => apply(false)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                Bring site back online
                            </button>
                        ) : (
                            <button
                                onClick={() => apply(true)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Construction className="h-4 w-4" />}
                                Enable maintenance mode
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// GROWTH KPIs ROW
// ============================================================
function GrowthKpisRow({ events }: { events: AnalyticsEvent[] }) {
    const kpis = useMemo<GrowthKpis>(() => {
        const DAY = 24 * 60 * 60 * 1000;
        const dau = uniqueUsersInWindow(events, DAY);
        const wau = uniqueUsersInWindow(events, 7 * DAY);
        const mau = uniqueUsersInWindow(events, 30 * DAY);
        const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0;
        const totalUsers = uniqueUsersTotal(events);
        const totalSessions = countSessions(events);
        const sessionsPerUser = totalUsers > 0 ? totalSessions / totalUsers : 0;
        return { dau, wau, mau, stickiness, sessionsPerUser };
    }, [events]);

    const stickinessTone =
        kpis.stickiness >= 40 ? 'green'
            : kpis.stickiness >= 20 ? 'yellow'
                : 'red';

    const stickinessLabel =
        kpis.stickiness >= 40 ? 'Excellent'
            : kpis.stickiness >= 20 ? 'Healthy'
                : 'Needs work';

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <KpiCard label="DAU" value={kpis.dau} tone="blue" icon={<Users2 className="h-4 w-4" />} />
            <KpiCard label="WAU" value={kpis.wau} tone="purple" icon={<Users2 className="h-4 w-4" />} />
            <KpiCard label="MAU" value={kpis.mau} tone="green" icon={<Users2 className="h-4 w-4" />} />
            <div className={cn(
                'rounded-2xl border bg-[#141414] p-4',
                stickinessTone === 'green' ? 'border-green-500/20'
                    : stickinessTone === 'yellow' ? 'border-yellow-500/20'
                        : 'border-red-500/20',
            )}>
                <div className={cn(
                    'flex items-center gap-2',
                    stickinessTone === 'green' ? 'text-green-400'
                        : stickinessTone === 'yellow' ? 'text-yellow-400'
                            : 'text-red-400',
                )}>
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Stickiness</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums">
                    {kpis.stickiness}%
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                    DAU/MAU · {stickinessLabel}
                </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-[#141414] p-4">
                <div className="flex items-center gap-2 text-gray-400">
                    <Filter className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Sessions / User</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums">
                    {kpis.sessionsPerUser.toFixed(1)}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                    across loaded events
                </p>
            </div>
        </div>
    );
}

// ============================================================
// NEW VS RETURNING
// ============================================================
function NewVsReturningCard({ events }: { events: AnalyticsEvent[] }) {
    const series = useMemo(() => {
        const firstSeen = new Map<string, number>();
        for (const e of events) {
            const key = e.user_id || e.session_id;
            if (!key) continue;
            const t = new Date(e.created_at).getTime();
            const existing = firstSeen.get(key);
            if (existing === undefined || t < existing) firstSeen.set(key, t);
        }

        const days = new Map<string, { new: number; returning: number }>();
        const seenToday = new Map<string, Set<string>>();

        for (const e of events) {
            const key = e.user_id || e.session_id;
            if (!key) continue;
            const day = e.created_at.slice(0, 10);
            const eventDay = Math.floor(new Date(e.created_at).getTime() / (24 * 60 * 60 * 1000));
            const firstDay = firstSeen.get(key) !== undefined
                ? Math.floor(firstSeen.get(key)! / (24 * 60 * 60 * 1000))
                : -1;
            const isNew = firstDay === eventDay;

            if (!days.has(day)) days.set(day, { new: 0, returning: 0 });
            if (!seenToday.has(day)) seenToday.set(day, new Set());
            if (seenToday.get(day)!.has(key)) continue;
            seenToday.get(day)!.add(key);

            if (isNew) days.get(day)!.new += 1;
            else days.get(day)!.returning += 1;
        }

        return Array.from(days.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([day, counts]) => ({
                t: new Date(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                new: counts.new,
                returning: counts.returning,
            }));
    }, [events]);

    if (series.length === 0) {
        return <Empty msg="No data." />;
    }

    return (
        <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="new" stackId="1" stroke="#1E90FF" fill="#1E90FF" fillOpacity={0.3} />
                <Area type="monotone" dataKey="returning" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ============================================================
// FUNNEL
// ============================================================
function FunnelCard({ events }: { events: AnalyticsEvent[] }) {
    const steps: FunnelStep[] = useMemo(() => {
        const visited = new Set<string>();
        const signedIn = new Set<string>();
        const onboarded = new Set<string>();
        const acted = new Set<string>();

        for (const e of events) {
            const key = e.user_id || e.session_id;
            if (!key) continue;
            if (e.event_type === 'page_view' && e.page_path === '/') visited.add(key);
            if (e.event_type === 'signed_in') signedIn.add(key);
            if (e.event_type === 'onboarding_complete') onboarded.add(key);
            if (e.event_type === 'first_action') acted.add(key);
        }

        const v = visited.size;
        const s = Array.from(signedIn).filter((k) => visited.has(k)).length;
        const o = Array.from(onboarded).filter((k) => signedIn.has(k)).length;
        const a = Array.from(acted).filter((k) => onboarded.has(k)).length;

        const pctOf = (n: number, base: number) => base > 0 ? Math.round((n / base) * 100) : 0;
        return [
            { label: 'Visited feed', value: v, pct: 100 },
            { label: 'Signed in', value: s, pct: pctOf(s, v) },
            { label: 'Onboarded', value: o, pct: pctOf(o, v) },
            { label: 'Claim or create', value: a, pct: pctOf(a, v) },
        ];
    }, [events]);

    const max = steps[0]?.value ?? 0;

    if (max === 0) {
        return <Empty msg="No funnel data yet. Fires once users visit and sign in." />;
    }

    return (
        <div className="space-y-2">
            {steps.map((step, i) => (
                <div key={step.label} className="rounded-lg bg-[#0A0A0A] p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-gray-400 tabular-nums">
                                Step {i + 1}
                            </span>
                            <span className="text-sm font-medium truncate">{step.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold tabular-nums">{step.value}</span>
                            <span className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                                step.pct >= 60 ? 'bg-green-500/10 text-green-400'
                                    : step.pct >= 25 ? 'bg-yellow-500/10 text-yellow-400'
                                        : 'bg-red-500/10 text-red-400',
                            )}>
                                {step.pct}%
                            </span>
                        </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                step.pct >= 60 ? 'bg-green-500'
                                    : step.pct >= 25 ? 'bg-yellow-500'
                                        : 'bg-red-500',
                            )}
                            style={{ width: `${step.pct}%` }}
                        />
                    </div>
                </div>
            ))}
            <p className="pt-1 text-[11px] text-gray-500">
                Percentage shown relative to step 1 (Visited feed). Watch for the biggest drop between steps — that's your leak.
            </p>
        </div>
    );
}

// ============================================================
// REFERRERS
// ============================================================
function ReferrersCard({ events }: { events: AnalyticsEvent[] }) {
    const referrers = useMemo(() => {
        // Hosts that are auth redirects or our own domain — not real traffic sources
        const IGNORED_HOSTS = new Set([
            'accounts.google.com',
            'appleid.apple.com',
            'login.microsoftonline.com',
            'login.live.com',
            'app.hpbooks.uk',
        ]);

        const counts = new Map<string, number>();
        for (const e of events) {
            const r = e.referrer;
            if (!r) {
                counts.set('Direct', (counts.get('Direct') || 0) + 1);
                continue;
            }
            try {
                const host = new URL(r).hostname;
                if (IGNORED_HOSTS.has(host)) continue;
                // Also filter any *.kinde.com subdomain
                if (host.endsWith('.kinde.com')) continue;
                counts.set(host, (counts.get(host) || 0) + 1);
            } catch {
                const fallback = r.slice(0, 40);
                counts.set(fallback, (counts.get(fallback) || 0) + 1);
            }
        }
        const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
        return Array.from(counts.entries())
            .map(([host, count]) => ({ host, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [events]);

    if (referrers.length === 0) {
        return <Empty msg="No referrer data." />;
    }

    return (
        <div className="space-y-2">
            {referrers.map((r) => (
                <div key={r.host} className="rounded-lg bg-[#0A0A0A] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm">{r.host}</span>
                        <span className="flex items-center gap-2 shrink-0 text-[11px] text-gray-500">
                            <span className="tabular-nums">{r.pct}%</span>
                            <span className="tabular-nums font-semibold text-gray-300">{r.count}</span>
                        </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
                        <div
                            className="h-full rounded-full bg-[#1E90FF]"
                            style={{ width: `${r.pct}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// ANALYTICS SECTION
// ============================================================
function AnalyticsSection() {
    const [range, setRange] = useState<DateRange>('24h');
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorFilter, setErrorFilter] = useState<string | null>(null);
    const [sessionFilter, setSessionFilter] = useState<'all' | 'live' | 'errors'>('all');
    const [sessionQuery, setSessionQuery] = useState('');
    const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);
    const [countryQuery, setCountryQuery] = useState('');
    const [showAllCountries, setShowAllCountries] = useState(false);
    const [hideBots, setHideBots] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const cutoff = rangeCutoff(range);
            let q = supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10000);
            if (cutoff > 0) q = q.gte('created_at', new Date(cutoff).toISOString());
            const { data, error } = await q;
            if (error) throw error;
            setEvents(data || []);
        } catch (err: any) {
            toast.error(err?.message ?? 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    useEffect(() => {
        if (range !== '15m' && range !== '30m' && range !== '1h') return;
        const id = setInterval(() => fetchAnalytics(), 30_000);
        return () => clearInterval(id);
    }, [range, fetchAnalytics]);

    const allSessions = useMemo(() => buildSessions(events), [events]);

    const botSessionIds = useMemo(
        () => new Set(allSessions.filter((s) => s.is_suspected_bot).map((s) => s.session_id)),
        [allSessions],
    );

    const sessions = useMemo(
        () => hideBots
            ? allSessions.filter((s) => !s.is_suspected_bot)
            : allSessions,
        [allSessions, hideBots],
    );

    const visibleEvents = useMemo(
        () => hideBots
            ? events.filter((e) => !botSessionIds.has(e.session_id))
            : events,
        [events, botSessionIds, hideBots],
    );

    const attributedEvents = useMemo(
        () => attributeAnonymousEvents(visibleEvents),
        [visibleEvents],
    );

    const botCount = allSessions.length - sessions.length;

    const sessionStats = useMemo(() => {
        const live = sessions.filter((s) => s.is_live).length;
        const withErrors = sessions.filter((s) => s.has_errors).length;
        const total = sessions.length;
        const avgDuration = total > 0
            ? sessions.reduce((sum, s) => sum + s.duration_ms, 0) / total
            : 0;
        return { total, live, withErrors, avgDuration };
    }, [sessions]);

    const filteredSessions = useMemo(() => {
        let list = sessions;
        if (sessionFilter === 'live') list = list.filter((s) => s.is_live);
        if (sessionFilter === 'errors') list = list.filter((s) => s.has_errors);
        if (sessionQuery.trim()) {
            const q = sessionQuery.toLowerCase();
            list = list.filter((s) =>
                s.session_id.toLowerCase().includes(q) ||
                (s.user_id && s.user_id.toLowerCase().includes(q)) ||
                (s.country && s.country.toLowerCase().includes(q)) ||
                (s.city && s.city.toLowerCase().includes(q)) ||
                s.os.toLowerCase().includes(q) ||
                s.browser.toLowerCase().includes(q)
            );
        }
        return list;
    }, [sessions, sessionFilter, sessionQuery]);

    // Single array passed to the map — SessionMap decides bot vs dot per session.
    const mappableSessions = useMemo(
        () => filteredSessions.filter((s) => s.latitude != null && s.longitude != null),
        [filteredSessions],
    );

    const allCountries = useMemo(() => {
        const map: Record<string, { country: string; code: string; count: number; sessions: number }> = {};
        const byCountry = new Map<string, Set<string>>();
        for (const e of visibleEvents) {
            if (!e.country) continue;
            const key = e.country;
            const code = e.country_code || 'XX';
            if (!map[key]) map[key] = { country: key, code, count: 0, sessions: 0 };
            map[key].count++;
            if (!byCountry.has(key)) byCountry.set(key, new Set());
            byCountry.get(key)!.add(e.session_id);
        }
        for (const [country, set] of byCountry) {
            if (map[country]) map[country].sessions = set.size;
        }
        return Object.values(map).sort((a, b) => b.count - a.count);
    }, [visibleEvents]);

    const visibleCountries = useMemo(() => {
        let list = allCountries;
        if (countryQuery.trim()) {
            const q = countryQuery.toLowerCase();
            list = list.filter((c) => c.country.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
        }
        if (!showAllCountries && list.length > 12) return list.slice(0, 12);
        return list;
    }, [allCountries, countryQuery, showAllCountries]);

    const summary = useMemo(() => {
        const pageViews = visibleEvents.filter((e) => e.event_type === 'page_view');
        const errors = visibleEvents.filter((e) => e.event_type === 'error');
        const uniqueSessions = new Set(visibleEvents.map((e) => e.session_id)).size;
        const uniqueUsers = new Set(visibleEvents.map((e) => e.user_id).filter(Boolean)).size;
        const uniqueCountries = new Set(visibleEvents.map((e) => e.country_code).filter(Boolean)).size;

        const bucketMs = rangeBucketMs(range);
        const buckets: Record<string, number> = {};
        for (const e of pageViews) {
            const t = new Date(e.created_at).getTime();
            const bucket = Math.floor(t / bucketMs) * bucketMs;
            const key = new Date(bucket).toISOString();
            buckets[key] = (buckets[key] || 0) + 1;
        }
        const timeSeries = Object.entries(buckets)
            .map(([iso, count]) => {
                const d = new Date(iso);
                const label =
                    range === '15m' || range === '30m' || range === '1h'
                        ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                        : range === '24h'
                            ? d.toLocaleTimeString(undefined, { hour: 'numeric' })
                            : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                return { t: label, count };
            })
            .sort((a, b) => a.t.localeCompare(b.t));

        const pageCounts: Record<string, number> = {};
        for (const e of pageViews) {
            const p = e.page_path || '/unknown';
            pageCounts[p] = (pageCounts[p] || 0) + 1;
        }
        const topPages = Object.entries(pageCounts)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        const deviceCounts: Record<string, number> = {};
        for (const e of visibleEvents) {
            const d = e.device_type || 'unknown';
            deviceCounts[d] = (deviceCounts[d] || 0) + 1;
        }
        const devices = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

        const browserCounts: Record<string, number> = {};
        for (const e of visibleEvents) {
            const b = e.browser || 'unknown';
            browserCounts[b] = (browserCounts[b] || 0) + 1;
        }
        const browsers = Object.entries(browserCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const osCounts: Record<string, number> = {};
        for (const e of visibleEvents) {
            const o = e.os || 'unknown';
            osCounts[o] = (osCounts[o] || 0) + 1;
        }
        const osAll = Object.entries(osCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const osErrorCounts: Record<string, { total: number; errors: number }> = {};
        for (const e of visibleEvents) {
            const o = e.os || 'unknown';
            if (!osErrorCounts[o]) osErrorCounts[o] = { total: 0, errors: 0 };
            osErrorCounts[o].total++;
            if (e.event_type === 'error') osErrorCounts[o].errors++;
        }
        const osErrorRate = Object.entries(osErrorCounts)
            .map(([os, { total, errors }]) => ({
                name: os,
                total,
                errors,
                rate: total > 0 ? Math.round((errors / total) * 100) : 0,
            }))
            .sort((a, b) => b.rate - a.rate);

        const groupMap: Record<
            string,
            {
                category: string;
                count: number;
                last: string;
                pages: Set<string>;
                sample: string;
                osSet: Set<string>;
                countrySet: Set<string>;
            }
        > = {};

        for (const e of errors) {
            const cat = categorizeError(e.error_message);
            if (!groupMap[cat]) {
                groupMap[cat] = {
                    category: cat,
                    count: 0,
                    last: e.created_at,
                    pages: new Set(),
                    sample: e.error_message || 'Unknown',
                    osSet: new Set(),
                    countrySet: new Set(),
                };
            }
            const g = groupMap[cat];
            g.count++;
            if (e.created_at > g.last) g.last = e.created_at;
            if (e.page_path) g.pages.add(e.page_path);
            if (e.os) g.osSet.add(e.os);
            if (e.country) g.countrySet.add(`${flagEmoji(e.country_code)} ${e.country}`);
        }

        const errorGroups = Object.values(groupMap)
            .map((g) => ({
                category: g.category,
                count: g.count,
                last: g.last,
                pages: Array.from(g.pages).slice(0, 5),
                sample: g.sample,
                osList: Array.from(g.osSet),
                countryList: Array.from(g.countrySet).slice(0, 5),
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalPageViews: pageViews.length,
            totalErrors: errors.length,
            uniqueSessions,
            uniqueUsers,
            uniqueCountries,
            timeSeries,
            topPages,
            devices,
            browsers,
            osAll,
            osErrorRate,
            errorGroups,
        };
    }, [visibleEvents, range]);

    const filteredErrors = useMemo(() => {
        if (!errorFilter) return [];
        return visibleEvents
            .filter((e) => e.event_type === 'error' && categorizeError(e.error_message) === errorFilter)
            .slice(0, 30);
    }, [visibleEvents, errorFilter]);

    return (
        <div className="space-y-6">
            <style>{`
                @keyframes an-pulse-ring {
                    0%   { transform: scale(0.9); opacity: 0.9; }
                    70%  { transform: scale(2.4); opacity: 0; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
                .leaflet-container {
                    background: #050608 !important;
                    font-family: inherit;
                }
                .leaflet-tile {
                    filter: hue-rotate(180deg) invert(1) brightness(0.85) contrast(0.9);
                }
                .leaflet-control-attribution {
                    background: rgba(0,0,0,0.6) !important;
                    color: #6b7280 !important;
                    font-size: 10px !important;
                }
                .leaflet-control-attribution a { color: #9ca3af !important; }
                .leaflet-bar a {
                    background: #141414 !important;
                    color: #d1d5db !important;
                    border-color: rgba(255,255,255,0.08) !important;
                }
                .leaflet-bar a:hover {
                    background: #1f1f1f !important;
                    color: #fff !important;
                }
                .ctr-bot-marker {
                    background: transparent;
                    border: none;
                }
            `}</style>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="cr-display text-xl font-bold">Analytics</h1>
                    <p className="mt-1 text-sm text-gray-500">Live traffic, sessions, and error diagnostics.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-full border border-white/10 bg-[#141414] p-1">
                        {RANGE_OPTIONS.map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={cn(
                                    "rounded-full px-3 py-1 text-[11px] font-medium transition uppercase tabular-nums",
                                    range === r ? "bg-white/10 text-white" : "text-gray-500 hover:text-white",
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setHideBots((v) => !v)}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition",
                            hideBots
                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                : "border-white/10 bg-[#141414] text-gray-400 hover:text-white",
                        )}
                        title={hideBots ? `Excluding ${botCount} suspected bot session${botCount === 1 ? '' : 's'}` : 'Including suspected bot sessions'}
                    >
                        <Bot className="h-3.5 w-3.5" />
                        {hideBots ? `NSB · hiding ${botCount}` : `Showing ${botCount} bots`}
                    </button>
                    <button
                        onClick={fetchAnalytics}
                        className="rounded-full p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {!loading && visibleEvents.length > 0 && (
                <GrowthKpisRow events={attributedEvents} />
            )}

            {loading ? (
                <div className="grid place-items-center py-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <KpiCard label="Live now" value={sessionStats.live} tone="green" icon={<Radio className="h-4 w-4" />} pulse={sessionStats.live > 0} />
                        <KpiCard label="Sessions" value={sessionStats.total} tone="blue" icon={<Users className="h-4 w-4" />} />
                        <KpiCard label="Page views" value={summary.totalPageViews} tone="purple" icon={<BarChart3 className="h-4 w-4" />} />
                        <KpiCard label="Errors" value={summary.totalErrors} tone="red" icon={<Bug className="h-4 w-4" />} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MiniStat label="Avg. session" value={formatDurationMs(sessionStats.avgDuration)} icon={<Timer className="h-3.5 w-3.5" />} />
                        <MiniStat label="Sessions w/ errors" value={String(sessionStats.withErrors)} icon={<AlertTriangle className="h-3.5 w-3.5" />} tone={sessionStats.withErrors > 0 ? 'warn' : 'default'} />
                        <MiniStat label="Unique users" value={String(summary.uniqueUsers)} icon={<User className="h-3.5 w-3.5" />} />
                        <MiniStat label="Countries" value={String(summary.uniqueCountries)} icon={<MapPin className="h-3.5 w-3.5" />} />
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-[#141414] overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <MapPinned className="h-4 w-4 text-gray-500" />
                                <h2 className="text-sm font-semibold">Session map</h2>
                                <span className="text-[11px] text-gray-500">
                                    {mappableSessions.length} plotted
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex rounded-full border border-white/10 bg-[#0A0A0A] p-0.5">
                                    {([
                                        { id: 'all', label: 'All', count: sessions.length },
                                        { id: 'live', label: 'Live', count: sessionStats.live },
                                        { id: 'errors', label: 'Errors', count: sessionStats.withErrors },
                                    ] as const).map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSessionFilter(f.id)}
                                            className={cn(
                                                "rounded-full px-3 py-1 text-[11px] font-medium transition flex items-center gap-1.5",
                                                sessionFilter === f.id
                                                    ? "bg-white/10 text-white"
                                                    : "text-gray-500 hover:text-white",
                                            )}
                                        >
                                            {f.label}
                                            <span className="text-gray-500 tabular-nums">{f.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <SessionMap
                            sessions={mappableSessions}
                            onSelect={setSelectedSession}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-2.5 text-[11px] text-gray-500">
                            <div className="flex flex-wrap items-center gap-4">
                                <LegendDot color="#1E90FF" label="Past session" />
                                <LegendDot color="#22c55e" label="Live" pulse />
                                <LegendDot color="#ef4444" label="Session with error" />
                                {!hideBots && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Bot className="h-3 w-3 text-orange-400" />
                                        <span>Suspected bot</span>
                                    </span>
                                )}
                            </div>
                            <span>Click a dot for details</span>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="All countries">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
                                    <input
                                        value={countryQuery}
                                        onChange={(e) => setCountryQuery(e.target.value)}
                                        placeholder="Search countries…"
                                        className="w-full rounded-full border border-white/10 bg-[#0A0A0A] py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary"
                                    />
                                </div>
                                {allCountries.length > 12 && !countryQuery && (
                                    <button
                                        onClick={() => setShowAllCountries((v) => !v)}
                                        className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-gray-400 hover:bg-white/5 hover:text-white transition whitespace-nowrap"
                                    >
                                        {showAllCountries ? 'Show less' : `Show all ${allCountries.length}`}
                                    </button>
                                )}
                            </div>

                            {visibleCountries.length === 0 ? (
                                <Empty msg="No location data yet." />
                            ) : (
                                <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
                                    {visibleCountries.map((c) => (
                                        <div key={c.country} className="flex items-center justify-between rounded-lg bg-[#0A0A0A] px-3 py-2">
                                            <span className="flex items-center gap-2 text-sm truncate">
                                                <span className="text-lg shrink-0">{flagEmoji(c.code)}</span>
                                                <span className="truncate">{c.country}</span>
                                            </span>
                                            <span className="flex items-center gap-3 shrink-0 text-[11px] text-gray-500">
                                                <span className="tabular-nums">
                                                    {c.sessions} <span className="text-gray-600">ses</span>
                                                </span>
                                                <span className="tabular-nums font-semibold text-gray-300">
                                                    {c.count}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card title="Devices">
                            {summary.devices.length === 0 ? (
                                <Empty msg="No data." />
                            ) : (
                                <ResponsiveContainer width="100%" height={340}>
                                    <PieChart>
                                        <Pie
                                            data={summary.devices}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={110}
                                            innerRadius={55}
                                            paddingAngle={2}
                                            label={(entry: any) => `${entry.name} (${entry.value})`}
                                            labelLine={false}
                                        >
                                            {summary.devices.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Card>
                    </div>

                    <Card title="Traffic over time">
                        {summary.timeSeries.length === 0 ? (
                            <Empty msg="No page views in this range." />
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={summary.timeSeries}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="t" stroke="#6b7280" fontSize={11} />
                                    <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                    <Line type="monotone" dataKey="count" stroke="#1E90FF" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </Card>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="New vs Returning">
                                <NewVsReturningCard events={attributedEvents} />
                        </Card>

                        <Card title="Referrers">
                            <ReferrersCard events={visibleEvents} />
                        </Card>
                    </div>

                    <Card title="Conversion funnel">
                            <FunnelCard events={attributedEvents} />
                    </Card>

                    <div className="rounded-2xl border border-white/5 bg-[#141414]">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <h2 className="text-sm font-semibold">Sessions</h2>
                                <span className="text-[11px] text-gray-500 tabular-nums">
                                    {filteredSessions.length} of {sessions.length}
                                </span>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
                                <input
                                    value={sessionQuery}
                                    onChange={(e) => setSessionQuery(e.target.value)}
                                    placeholder="Search sessions…"
                                    className="w-full rounded-full border border-white/10 bg-[#0A0A0A] py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        {filteredSessions.length === 0 ? (
                            <Empty msg="No sessions match." />
                        ) : (
                            <div className="max-h-[520px] divide-y divide-white/5 overflow-y-auto">
                                {filteredSessions.slice(0, 200).map((s) => (
                                    <SessionRow key={s.session_id} session={s} onClick={() => setSelectedSession(s)} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card title="Top pages">
                            {summary.topPages.length === 0 ? (
                                <Empty msg="No data." />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={summary.topPages} layout="vertical" margin={{ left: 12 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" stroke="#6b7280" fontSize={11} allowDecimals={false} />
                                        <YAxis dataKey="path" type="category" stroke="#6b7280" fontSize={11} width={90} />
                                        <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                        <Bar dataKey="count" fill="#1E90FF" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card>

                        <Card title="Browsers">
                            {summary.browsers.length === 0 ? (
                                <Empty msg="No data." />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={summary.browsers}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                                        <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                                        <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                        <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card>

                        <Card title="Operating systems">
                            {summary.osAll.length === 0 ? (
                                <Empty msg="No data." />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={summary.osAll} layout="vertical" margin={{ left: 12 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" stroke="#6b7280" fontSize={11} allowDecimals={false} />
                                        <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={80} />
                                        <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                                        <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card>

                        <Card title="Error rate by OS">
                            {summary.osErrorRate.length === 0 ? (
                                <Empty msg="No data." />
                            ) : (
                                <div className="space-y-2">
                                    {summary.osErrorRate.map((row) => {
                                        const Icon = osIcon(row.name);
                                        return (
                                            <div key={row.name} className="rounded-lg bg-[#0A0A0A] p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm font-medium">{row.name}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                                        row.rate >= 20 ? "bg-red-500/10 text-red-400"
                                                            : row.rate >= 5 ? "bg-yellow-500/10 text-yellow-400"
                                                                : "bg-green-500/10 text-green-400",
                                                    )}>
                                                        {row.rate}% errors
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all",
                                                            row.rate >= 20 ? "bg-red-500"
                                                                : row.rate >= 5 ? "bg-yellow-500"
                                                                    : "bg-green-500",
                                                        )}
                                                        style={{ width: `${Math.min(100, row.rate)}%` }}
                                                    />
                                                </div>
                                                <p className="mt-1.5 text-[11px] text-gray-500">
                                                    {row.errors} errors / {row.total} events
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>

                    <Card title="Error categories">
                        {summary.errorGroups.length === 0 ? (
                            <Empty msg="No errors recorded." />
                        ) : (
                            <div className="space-y-2">
                                {summary.errorGroups.map((g) => (
                                    <button
                                        key={g.category}
                                        onClick={() => setErrorFilter(g.category)}
                                        className="w-full rounded-lg bg-[#0A0A0A] p-3 text-left transition hover:bg-white/5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Bug className="h-3.5 w-3.5 text-red-400" />
                                                    <span className="text-sm font-semibold text-red-300">{g.category}</span>
                                                </div>
                                                <p className="mt-1 line-clamp-1 text-xs text-gray-500">{g.sample}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                    {g.osList.slice(0, 4).map((os) => {
                                                        const Icon = osIcon(os);
                                                        return (
                                                            <span key={os} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
                                                                <Icon className="h-2.5 w-2.5" />
                                                                {os}
                                                            </span>
                                                        );
                                                    })}
                                                    {g.countryList.slice(0, 3).map((c) => (
                                                        <span key={c} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                                    ×{g.count}
                                                </span>
                                                <p className="mt-1 text-[10px] text-gray-500">
                                                    {relativeTime(g.last)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>

                    {errorFilter && (
                        <Card title={`Recent "${errorFilter}" errors`}>
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-xs text-gray-500">{filteredErrors.length} events</p>
                                <button
                                    onClick={() => setErrorFilter(null)}
                                    className="text-xs text-gray-500 hover:text-white"
                                >
                                    Clear filter
                                </button>
                            </div>
                            {filteredErrors.length === 0 ? (
                                <Empty msg="No errors of this type." />
                            ) : (
                                <div className="space-y-2">
                                    {filteredErrors.map((e) => (
                                        <div key={e.id} className="rounded-lg bg-[#0A0A0A] p-3">
                                            <p className="text-sm text-red-300 break-words">{e.error_message}</p>
                                            {e.error_stack && (
                                                <details className="mt-1">
                                                    <summary className="cursor-pointer text-[11px] text-gray-500 hover:text-gray-300">
                                                        Stack trace
                                                    </summary>
                                                    <pre className="mt-1 overflow-x-auto rounded bg-black/40 p-2 text-[10px] text-gray-400">
                                                        {e.error_stack.slice(0, 600)}
                                                    </pre>
                                                </details>
                                            )}
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                                                <span className="rounded-full bg-white/5 px-2 py-0.5">{e.page_path}</span>
                                                <span className="rounded-full bg-white/5 px-2 py-0.5">{e.os || 'unknown OS'}</span>
                                                <span className="rounded-full bg-white/5 px-2 py-0.5">{e.browser || 'unknown'}</span>
                                                {e.country && (
                                                    <span className="rounded-full bg-white/5 px-2 py-0.5">
                                                        {flagEmoji(e.country_code)} {e.country}
                                                        {e.city ? ` · ${e.city}` : ''}
                                                    </span>
                                                )}
                                                <span className="ml-auto">{relativeTime(e.created_at)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </>
            )}

            {selectedSession && (
                <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
            )}
        </div>
    );
}

// ============================================================
// SESSION MAP — one marker per session (bot OR dot, never both)
// ============================================================
function SessionMap({
    sessions,
    onSelect,
}: {
    sessions: SessionSummary[];
    onSelect: (s: SessionSummary) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [20, 0],
            zoom: 2,
            worldCopyJump: true,
            minZoom: 2,
            maxZoom: 12,
            zoomControl: true,
            attributionControl: true,
        });

        L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_44ek_1_bf1cbc0ef2ac07ba7c106296', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        const layer = L.layerGroup().addTo(map);
        layerRef.current = layer;
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            layerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const layer = layerRef.current;
        if (!layer) return;
        layer.clearLayers();

        // Hardening: dedupe by session_id so the same session can never be
        // drawn twice even if the caller passes overlapping arrays.
        const seen = new Set<string>();

        for (const s of sessions) {
            if (seen.has(s.session_id)) continue;
            seen.add(s.session_id);

            if (s.latitude == null || s.longitude == null) continue;

            // ── Suspected bot → bot-icon marker only. Skip the dot.
            if (s.is_suspected_bot) {
                const icon = L.divIcon({
                    className: 'ctr-bot-marker',
                    html: `
                        <div style="
                            width: 22px; height: 22px;
                            border-radius: 50%;
                            background: rgba(255,255,255,0.95);
                            border: 2px solid #f97316;
                            display: flex; align-items: center; justify-content: center;
                            box-shadow: 0 0 0 1px rgba(249,115,22,0.4), 0 2px 6px rgba(0,0,0,0.5);
                            transform: translate(-11px, -11px);
                        ">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 8V4H8"/>
                                <rect width="16" height="12" x="4" y="8" rx="2"/>
                                <path d="M2 14h2"/>
                                <path d="M20 14h2"/>
                                <path d="M15 13v2"/>
                                <path d="M9 13v2"/>
                            </svg>
                        </div>
                    `,
                    iconSize: [22, 22],
                    iconAnchor: [11, 11],
                });

                const marker = L.marker([s.latitude, s.longitude], { icon });
                marker.on('click', () => onSelect(s));
                marker.addTo(layer);
                continue;
            }

            // ── Real session → colored dot
            const isLive = s.is_live;
            const hasErrors = s.has_errors;
            const color = hasErrors ? '#ef4444' : isLive ? '#22c55e' : '#1E90FF';

            const radius = isLive ? 7 : 5;
            const weight = isLive ? 2 : 1;
            const fillOpacity = isLive ? 0.85 : 0.7;

            const marker = L.circleMarker([s.latitude, s.longitude], {
                radius,
                color,
                weight,
                fillColor: color,
                fillOpacity,
                className: isLive ? 'ctr-live-marker' : undefined,
            });

            marker.on('click', () => onSelect(s));
            marker.addTo(layer);
        }
    }, [sessions, onSelect]);

    return (
        <>
            <style>{`
                .ctr-live-marker {
                    animation: an-pulse-ring 1.8s ease-out infinite;
                    transform-origin: center;
                    transform-box: fill-box;
                }
            `}</style>
            <div
                ref={containerRef}
                style={{ height: 380, width: '100%' }}
                className="relative"
            />
        </>
    );
}

function LegendDot({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span
                className={cn("inline-block h-2.5 w-2.5 rounded-full", pulse && "animate-pulse")}
                style={{ background: color }}
            />
            <span>{label}</span>
        </span>
    );
}

// ============================================================
// SESSION ROW + DETAIL MODAL
// ============================================================
function SessionRow({ session, onClick }: { session: SessionSummary; onClick: () => void }) {
    const live = session.is_live;
    const hasErrors = session.has_errors;
    const isBot = session.is_suspected_bot;
    const dotColor = hasErrors ? '#ef4444' : live ? '#22c55e' : '#1E90FF';

    return (
        <button
            onClick={onClick}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
        >
            <span className="relative flex-shrink-0">
                {isBot ? (
                    <span className="grid h-4 w-4 place-items-center rounded-full border border-orange-500/40 bg-white/95">
                        <Bot className="h-2.5 w-2.5 text-orange-500" />
                    </span>
                ) : (
                    <span
                        className={cn("block h-2.5 w-2.5 rounded-full", live && "animate-pulse")}
                        style={{ background: dotColor }}
                    />
                )}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px] text-gray-500 truncate max-w-[140px]">
                        {session.session_id.slice(0, 12)}…
                    </span>
                    {isBot && (
                        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-orange-400">
                            BOT?
                        </span>
                    )}
                    {session.user_id ? (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <User className="h-3 w-3" />
                            {session.user_id.slice(0, 12)}…
                        </span>
                    ) : (
                        <span className="text-[11px] text-gray-600">anonymous</span>
                    )}
                    {session.country && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 truncate">
                            <span>{flagEmoji(session.country_code)}</span>
                            <span className="truncate">{session.city || session.country}</span>
                        </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <MonitorSmartphone className="h-3 w-3" />
                        {session.device_type}
                    </span>
                    <span className="text-[11px] text-gray-500">
                        {session.os} · {session.browser}
                    </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                    <span className="tabular-nums">
                        {session.page_view_count} <span className="text-gray-600">views</span>
                    </span>
                    <span className="tabular-nums">
                        {formatDurationMs(session.duration_ms)}
                    </span>
                    {hasErrors && (
                        <span className="text-red-400">
                            {session.error_count} error{session.error_count > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0 text-right">
                <p className="text-[11px] text-gray-500">{relativeTime(session.last_seen)}</p>
                {live && (
                    <p className="mt-0.5 text-[10px] font-semibold text-green-400">LIVE</p>
                )}
            </div>
        </button>
    );
}

function SessionDetailModal({ session, onClose }: { session: SessionSummary; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/5 bg-[#141414] px-6 py-5">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={cn("inline-block h-2.5 w-2.5 rounded-full", session.is_live && "animate-pulse")}
                                style={{
                                    background: session.has_errors ? '#ef4444' : session.is_live ? '#22c55e' : '#1E90FF',
                                }}
                            />
                            <h2 className="cr-display text-lg font-bold">Session</h2>
                            {session.is_live && (
                                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
                                    LIVE
                                </span>
                            )}
                            {session.has_errors && (
                                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                                    {session.error_count} ERROR{session.error_count > 1 ? 'S' : ''}
                                </span>
                            )}
                            {session.is_suspected_bot && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                                    <Bot className="h-3 w-3" />
                                    SUSPECTED BOT
                                </span>
                            )}
                        </div>
                        <p className="mt-1 font-mono text-xs text-gray-500 break-all">{session.session_id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                    {session.is_suspected_bot && (
                        <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-3.5">
                            <p className="flex items-center gap-2 text-[13px] font-medium text-orange-300">
                                <Bot className="h-3.5 w-3.5" />
                                Flagged as suspected bot
                            </p>
                            <p className="mt-1 text-[12px] leading-relaxed text-gray-400">
                                This session had a very short duration and no meaningful navigation. It may be a crawler, link preview bot, or uptime monitor. It's not deleted — just hidden by default. Toggle NSB off to see bots in the data.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Stat label="Views" value={String(session.page_view_count)} />
                        <Stat label="Duration" value={formatDurationMs(session.duration_ms)} />
                        <Stat label="Errors" value={String(session.error_count)} tone={session.error_count > 0 ? 'red' : 'default'} />
                        <Stat
                            label="Status"
                            value={session.is_live ? 'Live now' : 'Ended'}
                            tone={session.is_live ? 'green' : 'default'}
                        />
                    </div>

                    <section>
                        <div className="mb-2 flex items-center gap-2 text-gray-400">
                            <MapPin className="h-3.5 w-3.5" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">Location</h3>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4">
                            {session.country ? (
                                <div className="space-y-1 text-sm">
                                    <p className="flex items-center gap-2">
                                        <span className="text-lg">{flagEmoji(session.country_code)}</span>
                                        <span className="font-medium">{session.country}</span>
                                    </p>
                                    {session.region && (
                                        <p className="text-xs text-gray-500">{session.region}{session.city ? ` · ${session.city}` : ''}</p>
                                    )}
                                    {session.latitude != null && session.longitude != null && (
                                        <p className="mt-2 font-mono text-[11px] text-gray-600">
                                            {session.latitude.toFixed(4)}, {session.longitude.toFixed(4)}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No location recorded</p>
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="mb-2 flex items-center gap-2 text-gray-400">
                            <MonitorSmartphone className="h-3.5 w-3.5" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">Device</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <Stat label="Device" value={session.device_type} />
                            <Stat label="OS" value={session.os} />
                            <Stat label="Browser" value={session.browser} />
                            <Stat
                                label="Screen"
                                value={session.screen_width && session.screen_height
                                    ? `${session.screen_width}×${session.screen_height}`
                                    : '—'}
                            />
                        </div>
                    </section>

                    <section>
                        <div className="mb-2 flex items-center gap-2 text-gray-400">
                            <User className="h-3.5 w-3.5" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">Identity</h3>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4 space-y-1.5 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-500">User ID</span>
                                <span className="font-mono text-xs text-gray-300 truncate max-w-[300px]">
                                    {session.user_id || 'anonymous'}
                                </span>
                            </div>
                            {session.referrer && (
                                <div className="flex justify-between gap-3">
                                    <span className="text-gray-500">Referrer</span>
                                    <span className="text-xs text-gray-300 truncate max-w-[300px]">
                                        {session.referrer}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="mb-2 flex items-center gap-2 text-gray-400">
                            <Clock className="h-3.5 w-3.5" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide">Timeline</h3>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">First seen</span>
                                <span className="text-gray-300">{new Date(session.first_seen).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Last seen</span>
                                <span className="text-gray-300">{new Date(session.last_seen).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Duration</span>
                                <span className="text-gray-300">{formatDurationMs(session.duration_ms)}</span>
                            </div>
                        </div>
                    </section>

                    {session.pages.length > 0 && (
                        <section>
                            <div className="mb-2 flex items-center gap-2 text-gray-400">
                                <FileText className="h-3.5 w-3.5" />
                                <h3 className="text-xs font-semibold uppercase tracking-wide">Pages visited</h3>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {session.pages.map((p) => (
                                    <span key={p} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-gray-300">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {session.last_error && (
                        <section>
                            <div className="mb-2 flex items-center gap-2 text-gray-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <h3 className="text-xs font-semibold uppercase tracking-wide">Last error</h3>
                            </div>
                            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
                                <p className="text-sm text-red-200 break-words">{session.last_error}</p>
                            </div>
                        </section>
                    )}
                </div>

                <div className="sticky bottom-0 border-t border-white/5 bg-[#141414] px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full rounded-full border border-white/10 bg-transparent py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// SHARED UI
// ============================================================
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
            <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 rounded-full p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>
                <h2 className="cr-display mb-5 text-lg font-bold">{title}</h2>
                {children}
            </div>
        </div>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
            {children}
        </div>
    );
}

function Empty({ msg }: { msg: string }) {
    return <p className="py-8 text-center text-sm text-gray-500">{msg}</p>;
}

function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'green' | 'red' }) {
    const valueClass = {
        default: 'text-white',
        green: 'text-green-400',
        red: 'text-red-400',
    }[tone];

    return (
        <div className="rounded-xl border border-white/5 bg-[#0A0A0A] p-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className={cn("mt-1 text-sm font-semibold truncate", valueClass)}>{value}</p>
        </div>
    );
}

function KpiCard({
    label, value, icon, tone, pulse,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    tone: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
    pulse?: boolean;
}) {
    const toneClass = {
        blue: 'text-blue-400',
        green: 'text-green-400',
        red: 'text-red-400',
        yellow: 'text-yellow-400',
        purple: 'text-purple-400',
        gray: 'text-gray-400',
    }[tone];

    return (
        <div className={cn(
            "rounded-2xl border bg-[#141414] p-4 transition",
            pulse ? "border-green-500/20" : "border-white/5",
        )}>
            <div className={cn("flex items-center gap-2", toneClass)}>
                {pulse && (
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                    </span>
                )}
                {icon}
                <span className="text-xs uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
        </div>
    );
}

function MiniStat({
    label, value, icon, tone = 'default',
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    tone?: 'default' | 'warn';
}) {
    return (
        <div className="rounded-xl border border-white/5 bg-[#141414] px-3 py-2.5">
            <div className={cn(
                "flex items-center gap-1.5 text-[10px] uppercase tracking-wide",
                tone === 'warn' ? "text-yellow-400" : "text-gray-500",
            )}>
                {icon}
                {label}
            </div>
            <p className="mt-1 text-lg font-semibold tabular-nums truncate">{value}</p>
        </div>
    );
}