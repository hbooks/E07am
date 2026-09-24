import { useEffect, useMemo, useState, useCallback } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
    Send, RefreshCw, Loader2, Pencil, Trash2, Check, X, CheckCircle, XCircle, AlertTriangle,
    Newspaper, Activity, Construction, KeyRound, LogOut, ShieldAlert, BarChart3, Globe,
    MonitorSmartphone, Bug, Inbox, Eye, MapPin, Clock, Smartphone, Laptop, User,
    FileText, Terminal,
} from "lucide-react";
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

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
    country: string | null;
    country_code: string | null;
    city: string | null;
    region: string | null;
    created_at: string;
}

interface AdworResponse {
    news: NewsPost[];
    workers: WorkerStat[];
    historyByWorker: Record<string, number[]>;
    maintenance: { enabled: boolean; message: string | null };
    requests: UserRequest[];
    fetched_at: string;
}

type Section = "requests" | "news" | "workers" | "maintenance" | "analytics";
type DateRange = '24h' | '7d' | '30d' | 'all';

const NAV_ITEMS: { id: Section; label: string; icon: typeof Newspaper }[] = [
    { id: "requests", label: "Requests", icon: Inbox },
    { id: "news", label: "News", icon: Newspaper },
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
        case '24h': return now - 24 * 60 * 60 * 1000;
        case '7d': return now - 7 * 24 * 60 * 60 * 1000;
        case '30d': return now - 30 * 24 * 60 * 60 * 1000;
        case 'all': return 0;
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

    // ---- Request actions ----
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

    // ---- News actions ----
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

    // ---- Maintenance ----
    const applyMaintenance = async (nextEnabled: boolean) => {
        if (!maintenanceKey.trim()) { toast.error("Enter your admin key first"); return; }
        const confirmMsg = nextEnabled
            ? "This will block every visitor. Continue?"
            : "Bring the app back online for everyone?";
        if (!confirm(confirmMsg)) return;

        setSavingMaintenance(true);
        try {
            const res = await fetch(`${BASE_URL}/Set_Maintenance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

            {/* Mobile nav */}
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

            {/* Content */}
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
    const submittedAt = request.meta?.submitted_at as string | undefined;

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
                {/* Header */}
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

                {/* Body */}
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
// ANALYTICS SECTION
// ============================================================
function AnalyticsSection() {
    const [range, setRange] = useState<DateRange>('24h');
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorFilter, setErrorFilter] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const cutoff = rangeCutoff(range);
            let q = supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5000);
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

    const summary = useMemo(() => {
        const pageViews = events.filter((e) => e.event_type === 'page_view');
        const errors = events.filter((e) => e.event_type === 'error');
        const uniqueSessions = new Set(events.map((e) => e.session_id)).size;
        const uniqueCountries = new Set(events.map((e) => e.country_code).filter(Boolean)).size;

        const bucketMs = range === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const buckets: Record<string, number> = {};
        for (const e of pageViews) {
            const t = new Date(e.created_at).getTime();
            const bucket = Math.floor(t / bucketMs) * bucketMs;
            const key = new Date(bucket).toISOString();
            buckets[key] = (buckets[key] || 0) + 1;
        }
        const timeSeries = Object.entries(buckets)
            .map(([iso, count]) => ({
                t: new Date(iso).toLocaleString(undefined, {
                    month: 'short', day: 'numeric',
                    hour: range === '24h' ? 'numeric' : undefined,
                }),
                count,
            }))
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

        const countryCounts: Record<string, { count: number; code: string }> = {};
        for (const e of events) {
            if (!e.country) continue;
            const code = e.country_code || 'XX';
            if (!countryCounts[e.country]) countryCounts[e.country] = { count: 0, code };
            countryCounts[e.country].count++;
        }
        const topCountries = Object.entries(countryCounts)
            .map(([country, { count, code }]) => ({ country, code, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const deviceCounts: Record<string, number> = {};
        for (const e of events) {
            const d = e.device_type || 'unknown';
            deviceCounts[d] = (deviceCounts[d] || 0) + 1;
        }
        const devices = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

        const browserCounts: Record<string, number> = {};
        for (const e of events) {
            const b = e.browser || 'unknown';
            browserCounts[b] = (browserCounts[b] || 0) + 1;
        }
        const browsers = Object.entries(browserCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const osCounts: Record<string, number> = {};
        for (const e of events) {
            const o = e.os || 'unknown';
            osCounts[o] = (osCounts[o] || 0) + 1;
        }
        const osAll = Object.entries(osCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const osErrorCounts: Record<string, { total: number; errors: number }> = {};
        for (const e of events) {
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
            uniqueCountries,
            timeSeries,
            topPages,
            topCountries,
            devices,
            browsers,
            osAll,
            osErrorRate,
            errorGroups,
        };
    }, [events, range]);

    const filteredErrors = useMemo(() => {
        if (!errorFilter) return [];
        return events
            .filter((e) => e.event_type === 'error' && categorizeError(e.error_message) === errorFilter)
            .slice(0, 30);
    }, [events, errorFilter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="cr-display text-xl font-bold">Analytics</h1>
                    <p className="mt-1 text-sm text-gray-500">Traffic, geography, OS, and error diagnostics.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-full border border-white/10 bg-[#141414] p-1">
                        {(['24h', '7d', '30d', 'all'] as DateRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={cn(
                                    "rounded-full px-3 py-1 text-xs font-medium transition uppercase",
                                    range === r ? "bg-white/10 text-white" : "text-gray-500 hover:text-white",
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="rounded-full p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid place-items-center py-24">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <KpiCard label="Page views" value={summary.totalPageViews} tone="blue" icon={<BarChart3 className="h-4 w-4" />} />
                        <KpiCard label="Sessions" value={summary.uniqueSessions} tone="green" icon={<Globe className="h-4 w-4" />} />
                        <KpiCard label="Countries" value={summary.uniqueCountries} tone="purple" icon={<MapPin className="h-4 w-4" />} />
                        <KpiCard label="Errors" value={summary.totalErrors} tone="red" icon={<Bug className="h-4 w-4" />} />
                    </div>

                    <Card title="Page views over time">
                        {summary.timeSeries.length === 0 ? (
                            <Empty msg="No page views in this range." />
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
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

                        <Card title="Devices">
                            {summary.devices.length === 0 ? (
                                <Empty msg="No data." />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={summary.devices}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
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

                        <Card title="Top countries">
                            {summary.topCountries.length === 0 ? (
                                <Empty msg="No location data yet." />
                            ) : (
                                <div className="space-y-2">
                                    {summary.topCountries.map((c) => (
                                        <div key={c.country} className="flex items-center justify-between rounded-lg bg-[#0A0A0A] px-3 py-2">
                                            <span className="flex items-center gap-2 text-sm">
                                                <span className="text-lg">{flagEmoji(c.code)}</span>
                                                {c.country}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-400">{c.count}</span>
                                        </div>
                                    ))}
                                </div>
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
                    </div>

                    <Card title="Error categories">
                        {summary.errorGroups.length === 0 ? (
                            <Empty msg="No errors recorded. 🎉" />
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

function KpiCard({
    label, value, icon, tone,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    tone: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
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
        <div className="rounded-2xl border border-white/5 bg-[#141414] p-4">
            <div className={cn("flex items-center gap-2", toneClass)}>
                {icon}
                <span className="text-xs uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
    );
}