import { Construction } from 'lucide-react';

export default function MaintenancePage({ message }: { message?: string | null }) {
    return (
        <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-[#0A0A0A] p-6 text-white cr-body">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&display=swap');
                .cr-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.02em; }
                .cr-body { font-family: 'Inter', sans-serif; }
                .cr-card {
                    background: linear-gradient(180deg, #161616 0%, #121212 100%);
                    box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05);
                }
                @keyframes cr-shimmer {
                    0% { transform: translateX(-120%); }
                    100% { transform: translateX(320%); }
                }
                .cr-shimmer-bar { animation: cr-shimmer 1.7s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) {
                    .cr-shimmer-bar { animation: none; opacity: 0.6; }
                }
            `}</style>

            <div className="relative w-full max-w-sm text-center">
                {/* soft floodlight glow, echoes the rest of the app rather than a flat icon box */}
                <div
                    className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-44 w-44 rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(30,144,255,0.18), transparent 70%)' }}
                />

                <div className="relative mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl cr-card border border-white/10">
                    <Construction className="h-7 w-7 text-[#5fdc16]" />
                </div>

                <h1 className="relative cr-display text-2xl font-bold">Server maintainance underway. We'll be right back</h1>
                <p className="relative mt-2.5 text-sm leading-relaxed text-gray-400">
                    {message?.trim() || "We're making some improvements. This won't take long."}
                </p>

                {/* indeterminate progress — signals the system is actively working, not frozen */}
                <div className="relative mt-7 h-1 w-40 mx-auto rounded-full bg-white/5 overflow-hidden">
                    <div className="cr-shimmer-bar h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#1E90FF] to-transparent" />
                </div>

                <p className="relative mt-5 text-xs text-gray-600">
                    Everything will be back to normal once the work is complete.
                </p>
            </div>
        </div>
    );
}