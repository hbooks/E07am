import { Link } from 'react-router-dom';
import { Flag } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');
                .cr-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.02em; }
            `}</style>

            <div className="text-center max-w-sm">
                <div className="relative mx-auto mb-6 w-20 h-20 rounded-full bg-[#1A1A1A] border border-gray-800 flex items-center justify-center">
                    <Flag className="h-8 w-8 text-[#1E90FF]" strokeWidth={2} />
                </div>

                <p className="cr-display text-7xl font-bold tracking-wide text-white mb-2">404</p>
                <h1 className="cr-display text-xl font-semibold text-white mb-2">Offside</h1>
                <p className="text-sm text-gray-400 leading-relaxed mb-8">
                    This page doesn't exist, moved, or isn't yours to see. Whatever the reason, there's nothing here.
                </p>

                <Link
                    to="/"
                    className="inline-flex items-center justify-center bg-[#1E90FF] hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                    Back to Feed
                </Link>
            </div>
        </div>
    );
}