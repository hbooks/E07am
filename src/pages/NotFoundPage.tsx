import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';

const FOCUS_RING =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]';
const PRESS = 'active:scale-[0.97]';

export default function NotFoundPage() {
    return (
        <div className="relative min-h-screen bg-[#0A0A0A] text-white cr-body flex items-center justify-center px-6 overflow-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&display=swap');
                .cr-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.02em; }
                .cr-body { font-family: 'Inter', sans-serif; }
                .cr-card {
                    background: linear-gradient(180deg, #161616 0%, #121212 100%);
                    box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05);
                }
            `}</style>

            {/* faint pitch markings — ties the empty state back to the game rather than a generic error screen */}
            <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
                viewBox="0 0 400 400"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
            >
                <circle cx="200" cy="200" r="90" fill="none" stroke="white" strokeWidth="1.5" />
                <circle cx="200" cy="200" r="2.5" fill="white" />
                <line x1="200" y1="0" x2="200" y2="400" stroke="white" strokeWidth="1.5" />
            </svg>

            <div
                className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(30,144,255,0.14), transparent 70%)' }}
            />

            <div className="relative text-center max-w-sm">
                <div className="relative mx-auto mb-6 w-20 h-20 rounded-full cr-card border border-white/10 flex items-center justify-center">
                    <Flag className="h-8 w-8 text-[#1E90FF]" strokeWidth={2} />
                </div>

                <p
                    className="cr-display text-7xl font-bold tracking-wide text-white mb-2"
                    style={{ textShadow: '0 0 40px rgba(30,144,255,0.25)' }}
                >
                    404
                </p>
                <h1 className="cr-display text-xl font-semibold text-white mb-2">Offside</h1>
                <p className="text-sm text-gray-400 leading-relaxed mb-8">
                    This page doesn't exist, never existed, why and how did you get here? You might want to check the URL or go back to the feed.
                </p>

                <Link
                    to="/"
                    className={`inline-flex items-center justify-center bg-[#1E90FF] hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition ${PRESS} ${FOCUS_RING}`}
                >
                    Back to Feed
                </Link>
            </div>
        </div>
    );
}