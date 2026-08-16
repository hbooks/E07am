import { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Send, RefreshCw, Loader2, Pencil, Trash2, Check, X, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function AdminPage() {
    const { user } = useKindeAuth();
    const [newsContent, setNewsContent] = useState("");
    const [posting, setPosting] = useState(false);
    const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
    const [workers, setWorkers] = useState<WorkerStat[]>([]);
    const [loadingWorkers, setLoadingWorkers] = useState(true);
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

    useEffect(() => {
        fetchNewsPosts();
        fetchWorkers();
    }, []);

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
            fetchNewsPosts(); // refresh list
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

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

            {/* News composer */}
            <div className="bg-[#141414] rounded-2xl p-5 border border-white/5 mb-8">
                <h2 className="text-lg font-semibold mb-3">Post News</h2>
                <textarea
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value.slice(0, 1000))}
                    rows={3}
                    placeholder="Write an announcement…"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                />
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{newsContent.length}/1000</span>
                    <button
                        onClick={postNews}
                        disabled={!newsContent.trim() || posting}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-40"
                    >
                        <Send className="h-4 w-4" />
                        {posting ? "Posting..." : "Post"}
                    </button>
                </div>
            </div>

            {/* Existing news posts */}
            <div className="bg-[#141414] rounded-2xl p-5 border border-white/5 mb-8">
                <h2 className="text-lg font-semibold mb-4">Existing News</h2>
                {newsPosts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No news posts yet.</p>
                ) : (
                    <div className="space-y-3">
                        {newsPosts.map((post) => (
                            <div key={post.id} className="bg-[#0A0A0A] rounded-xl p-4 border border-white/5">
                                {editingId === post.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value.slice(0, 1000))}
                                            rows={3}
                                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={cancelEdit}
                                                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => saveEdit(post.id)}
                                                disabled={savingEdit}
                                                className="p-2 rounded-full text-green-400 hover:text-white hover:bg-white/5 transition"
                                            >
                                                <Check className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-300">{post.content}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {post.author_name} · {new Date(post.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => startEdit(post)}
                                                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteNews(post.id)}
                                                className="p-2 rounded-full text-red-400 hover:text-white hover:bg-red-500/20 transition"
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

            {/* Workers status */}
            <div className="bg-[#141414] rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Workers</h2>
                    <button
                        onClick={fetchWorkers}
                        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-5 w-5", loadingWorkers && "animate-spin")} />
                    </button>
                </div>

                {loadingWorkers ? (
                    <div className="grid place-items-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : workers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No worker data yet.</p>
                ) : (
                    <div className="space-y-3">
                        {workers.map((w) => (
                            <div key={w.name} className="bg-[#0A0A0A] rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4">
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
    );
}