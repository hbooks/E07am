import { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
    Send, RefreshCw, Loader2, Pencil, Trash2, Check, X, CheckCircle, XCircle, AlertTriangle,
    Newspaper, Activity, Construction, KeyRound, LogOut, ShieldAlert, BarChart3, Globe, MonitorSmartphone, Bug,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

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

interface AnalyticsEvent {
    id: number;
    event_type: 'page_view' | 'error';
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
    created_at: string;
}

type Section = "news" | "workers" | "maintenance" | "analytics";

const NAV_ITEMS: { id: Section; label: string; icon: typeof Newspaper }[] = [
    { id: "news", label: "News", icon: Newspaper },
    { id: "workers", label: "Workers", icon: Activity },
    { id: "maintenance", label: "Maintenance", icon: Construction },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function AdminPage() {
    const { user, logout } = useKindeAuth();
    const [section, setSection] = useState<Section>("news");

    // ---- News state & handlers ----
    const [newsContent, setNewsContent] = useState("");
    const [posting, setPosting] = useState(false);
    const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    const fetchNewsPosts = async () => {
        try {
            const res = await fetch(`${BASE_URL}/Get_Admin_News`);
            if (!res.ok) throw new Error("Failed to fetch news");
            const data = await res.json();
            setNewsPosts(data);
        } catch (err: any) {
            toast.error(err.message || "Failed to load news");
        }
    };

    const postNews = async () => {
        if (!newsContent.trim()) return;
        setPosting(true);
        try {
            const res = await fetch(`${BASE_URL}/Adnew`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newsContent }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to post news");
            toast.success("News posted!");
            setNewsContent("");
            fetchNewsPosts();
        } catch (err: any) {
            toast.error(err.message || "Failed to post news");
        } finally {
            setPosting(false);
        }
    };

    const startEdit = (post: NewsPost) => {
        setEditingId(post.id);
        setEditContent(post.content);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent("");
    };

    const saveEdit = async (postId: number) => {
        if (!editContent.trim()) return;
        setSavingEdit(true);
        try {
            const res = await fetch(`${BASE_URL}/Upnews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: postId, content: editContent }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update");
            toast.success("News updated!");
            setEditingId(null);
            fetchNewsPosts();
        } catch (err: any) {
            toast.error(err.message || "Failed to update");
        } finally {
            setSavingEdit(false);
        }
    };

    const deleteNews = async (postId: number) => {
        if (!confirm("Are you sure you want to delete this news?")) return;
        try {
            const res = await fetch(`${BASE_URL}/Delnews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: postId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete");
            toast.success("News deleted!");
            fetchNewsPosts();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete");
        }
    };

    // ---- Workers state & handlers ----
    const [workers, setWorkers] = useState<WorkerStat[]>([]);
    const [loadingWorkers, setLoadingWorkers] = useState(true);

    const fetchWorkers = async () => {
        setLoadingWorkers(true);
        try {
            const res = await fetch(`${BASE_URL}/Get_Woport`);
            if (!res.ok) throw new Error("Failed to fetch workers");
            const data = await res.json();
            setWorkers(data);
        } catch (err: any) {
            toast.error(err.message || "Error loading workers");
        } finally {
            setLoadingWorkers(false);
        }
    };

    // ---- Maintenance mode ----
    const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState("");
    const [maintenanceKey, setMaintenanceKey] = useState("");
    const [loadingMaintenance, setLoadingMaintenance] = useState(true);
    const [savingMaintenance, setSavingMaintenance] = useState(false);

    const fetchMaintenance = async () => {
        setLoadingMaintenance(true);
        try {
            const res = await fetch(`${BASE_URL}/Get_Maintenance`);
            const data = await res.json();
            setMaintenanceEnabled(!!data.enabled);
            setMaintenanceMessage(data.message || "");
        } catch {
            toast.error("Failed to load maintenance status");
        } finally {
            setLoadingMaintenance(false);
        }
    };

    const applyMaintenance = async (nextEnabled: boolean) => {
        if (!maintenanceKey.trim()) {
            toast.error("Enter your admin key first");
            return;
        }
        const confirmMsg = nextEnabled
            ? "This will block every visitor from the app until you turn it back off. Continue?"
            : "Bring the app back online for everyone?";
        if (!confirm(confirmMsg)) return;

        setSavingMaintenance(true);
        try {
            const res = await fetch(`${BASE_URL}/Set_Maintenance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: nextEnabled, message: maintenanceMessage, key: maintenanceKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update maintenance mode");
            setMaintenanceEnabled(nextEnabled);
            toast.success(nextEnabled ? "Maintenance mode is on" : "Site is back online");
        } catch (err: any) {
            toast.error(err.message || "Failed to update maintenance mode");
        } finally {
            setSavingMaintenance(false);
        }
    };

    // ---- Analytics state & logic (direct Supabase) ----
    const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [analyticsSummary, setAnalyticsSummary] = useState({
        totalPageViews: 0,
        totalErrors: 0,
        uniqueSessions: 0,
        pageViewsByPath: {} as Record<string, number>,
        deviceBreakdown: {} as Record<string, number>,
        browserBreakdown: {} as Record<string, number>,
        recentErrors: [] as any[],
    });

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1000);
            if (error) throw error;
            setAnalyticsEvents(data || []);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load analytics');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    useEffect(() => {
        const events = analyticsEvents;
        const totalPageViews = events.filter(e => e.event_type === 'page_view').length;
        const totalErrors = events.filter(e => e.event_type === 'error').length;
        const uniqueSessions = new Set(events.map(e => e.session_id).filter(Boolean)).size;

        const pageViewsByPath: Record<string, number> = {};
        events.filter(e => e.event_type === 'page_view').forEach(e => {
            const path = e.page_path || '/unknown';
            pageViewsByPath[path] = (pageViewsByPath[path] || 0) + 1;
        });

        const deviceBreakdown: Record<string, number> = {};
        events.forEach(e => {
            const d = e.device_type || 'unknown';
            deviceBreakdown[d] = (deviceBreakdown[d] || 0) + 1;
        });

        const browserBreakdown: Record<string, number> = {};
        events.forEach(e => {
            const b = e.browser || 'unknown';
            browserBreakdown[b] = (browserBreakdown[b] || 0) + 1;
        });

        const recentErrors = events
            .filter(e => e.event_type === 'error')
            .slice(0, 10)
            .map(e => ({
                id: e.id,
                message: e.error_message || 'Unknown error',
                page_path: e.page_path,
                created_at: e.created_at,
                browser: e.browser,
                device_type: e.device_type,
            }));

        setAnalyticsSummary({
            totalPageViews,
            totalErrors,
            uniqueSessions,
            pageViewsByPath,
            deviceBreakdown,
            browserBreakdown,
            recentErrors,
        });
    }, [analyticsEvents]);

    // Initial data fetches
    useEffect(() => {
        fetchNewsPosts();
        fetchWorkers();
        fetchMaintenance();
        fetchAnalytics();
    }, []);

    return (
        <div className="flex min-h-screen bg-[#0A0A0A] text-white">
            {/* Sidebar */}
            <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-white/5 bg-[#0C0C0C] sm:flex">
                <div className="px-5 py-5">
                    <p className="cr-display text-sm font-bold tracking-wide">Admin</p>
                    <p className="mt-0.5 text-xs text-gray-500">Claim The Room</p>
                </div>
                <nav className="flex-1 space-y-1 px-3">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = section === item.id;
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

            {/* Mobile section switcher */}
            <div className="fixed inset-x-0 top-0 z-20 flex border-b border-white/5 bg-[#0A0A0A]/95 backdrop-blur sm:hidden">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = section === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setSection(item.id)}
                            className={cn(
                                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                                active ? "text-white" : "text-gray-500",
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <main className="min-w-0 flex-1 px-5 py-6 pt-16 sm:pt-6 sm:px-8 sm:py-8">
                <div className="mx-auto max-w-3xl">
                    {maintenanceEnabled && (
                        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                            Maintenance mode is live — visitors can't reach the app right now.
                        </div>
                    )}

                    {section === "news" && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="cr-display text-xl font-bold">News</h1>
                                <p className="mt-1 text-sm text-gray-500">Post and manage official announcements.</p>
                            </div>

                            <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Post News</h2>
                                <textarea
                                    value={newsContent}
                                    onChange={(e) => setNewsContent(e.target.value.slice(0, 1000))}
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
                                    Existing News <span className="text-gray-600">· {newsPosts.length}</span>
                                </h2>
                                {newsPosts.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-gray-500">No news posts yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {newsPosts.map((post) => (
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
                                                                onClick={cancelEdit}
                                                                className="rounded-full p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => saveEdit(post.id)}
                                                                disabled={savingEdit}
                                                                className="rounded-full p-2 text-green-400 transition hover:bg-white/5 hover:text-white"
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
                                                                {post.author_name} · {new Date(post.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex shrink-0 gap-1">
                                                            <button
                                                                onClick={() => startEdit(post)}
                                                                className="rounded-full p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteNews(post.id)}
                                                                className="rounded-full p-2 text-red-400 transition hover:bg-red-500/20 hover:text-white"
                                                                title="Delete"
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
                    )}

                    {section === "workers" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="cr-display text-xl font-bold">Workers</h1>
                                    <p className="mt-1 text-sm text-gray-500">Background job health and run history.</p>
                                </div>
                                <button
                                    onClick={fetchWorkers}
                                    className="rounded-full p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                                    title="Refresh"
                                >
                                    <RefreshCw className={cn("h-5 w-5", loadingWorkers && "animate-spin")} />
                                </button>
                            </div>

                            <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                                {loadingWorkers ? (
                                    <div className="grid place-items-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : workers.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-gray-500">No worker data yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {workers.map((w) => (
                                            <div
                                                key={w.name}
                                                className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#0A0A0A] p-4"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold">{w.friendly_name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Success: {w.success} · Errors: {w.error} · Voids: {w.void_count}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Runs: {w.runs} · Success Rate: {w.success_rate}%
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {w.status === "No problems" && <CheckCircle className="h-5 w-5 text-green-400" />}
                                                    {w.status === "Degraded" && <AlertTriangle className="h-5 w-5 text-yellow-400" />}
                                                    {w.status === "High traffic" && <XCircle className="h-5 w-5 text-red-400" />}
                                                    <span
                                                        className={cn(
                                                            "text-xs font-medium",
                                                            w.status === "No problems" && "text-green-400",
                                                            w.status === "Degraded" && "text-yellow-400",
                                                            w.status === "High traffic" && "text-red-400",
                                                            w.status === "No data" && "text-gray-500",
                                                        )}
                                                    >
                                                        {w.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {section === "maintenance" && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="cr-display text-xl font-bold">Maintenance Mode</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Block every visitor with a holding page while you make changes.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                                {loadingMaintenance ? (
                                    <div className="grid place-items-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#0A0A0A] p-4">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    Status: {maintenanceEnabled ? (
                                                        <span className="text-red-400">Live — site is blocked</span>
                                                    ) : (
                                                        <span className="text-green-400">Site is open</span>
                                                    )}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    Visitors currently on the site pick this up within ~8 seconds — no refresh needed.
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                Message shown to visitors (optional)
                                            </label>
                                            <textarea
                                                value={maintenanceMessage}
                                                onChange={(e) => setMaintenanceMessage(e.target.value.slice(0, 300))}
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
                                                value={maintenanceKey}
                                                onChange={(e) => setMaintenanceKey(e.target.value)}
                                                placeholder="Required to confirm this change"
                                                className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm outline-none focus:border-primary"
                                            />
                                            <p className="mt-1.5 text-xs text-gray-600">
                                                The same key you'd append as <code className="text-gray-500">?key=</code> to bypass the block page.
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
                                            {maintenanceEnabled ? (
                                                <button
                                                    onClick={() => applyMaintenance(false)}
                                                    disabled={savingMaintenance}
                                                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                                                >
                                                    {savingMaintenance ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                    Bring site back online
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => applyMaintenance(true)}
                                                    disabled={savingMaintenance}
                                                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                                                >
                                                    {savingMaintenance ? <Loader2 className="h-4 w-4 animate-spin" /> : <Construction className="h-4 w-4" />}
                                                    Enable maintenance mode
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {section === "analytics" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="cr-display text-xl font-bold">Analytics</h1>
                                    <p className="mt-1 text-sm text-gray-500">Traffic, errors, and device insights.</p>
                                </div>
                                <button
                                    onClick={fetchAnalytics}
                                    className="rounded-full p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                                    title="Refresh"
                                >
                                    <RefreshCw className={cn("h-5 w-5", loadingAnalytics && "animate-spin")} />
                                </button>
                            </div>

                            {loadingAnalytics ? (
                                <div className="grid place-items-center py-16">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        <StatCard label="Page Views" value={analyticsSummary.totalPageViews} icon={<BarChart3 className="h-4 w-4" />} />
                                        <StatCard label="Unique Sessions" value={analyticsSummary.uniqueSessions} icon={<Globe className="h-4 w-4" />} />
                                        <StatCard label="Errors" value={analyticsSummary.totalErrors} icon={<Bug className="h-4 w-4" />} />
                                    </div>

                                    <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Top Pages</h2>
                                        {Object.keys(analyticsSummary.pageViewsByPath).length === 0 ? (
                                            <p className="text-sm text-gray-500">No page views recorded yet.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {Object.entries(analyticsSummary.pageViewsByPath)
                                                    .sort((a: any, b: any) => b[1] - a[1])
                                                    .map(([path, count]: any) => (
                                                        <div key={path} className="flex items-center justify-between rounded-lg bg-[#0A0A0A] px-3 py-2">
                                                            <span className="truncate text-sm">{path}</span>
                                                            <span className="text-xs font-semibold text-gray-400">{count}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Devices</h2>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.entries(analyticsSummary.deviceBreakdown).map(([device, count]: any) => (
                                                <div key={device} className="rounded-xl bg-[#0A0A0A] p-4 text-center">
                                                    <MonitorSmartphone className="mx-auto h-5 w-5 text-gray-500" />
                                                    <p className="mt-1 text-lg font-bold">{count}</p>
                                                    <p className="text-xs capitalize text-gray-500">{device}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Browsers</h2>
                                        <div className="space-y-2">
                                            {Object.entries(analyticsSummary.browserBreakdown).map(([browser, count]: any) => (
                                                <div key={browser} className="flex items-center justify-between rounded-lg bg-[#0A0A0A] px-3 py-2">
                                                    <span className="text-sm">{browser}</span>
                                                    <span className="text-xs font-semibold text-gray-400">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Recent Errors</h2>
                                        {analyticsSummary.recentErrors.length === 0 ? (
                                            <p className="text-sm text-gray-500">No errors recorded.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {analyticsSummary.recentErrors.map((err: any) => (
                                                    <div key={err.id} className="rounded-lg bg-[#0A0A0A] p-3">
                                                        <p className="text-sm text-red-400">{err.message}</p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {err.page_path} · {err.browser} · {err.device_type} · {new Date(err.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-[#141414] p-4">
            <div className="flex items-center gap-2 text-gray-500">
                {icon}
                <span className="text-xs uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
    );
}