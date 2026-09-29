import { Link } from 'react-router-dom';

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
            `}</style>

            {/* Faint pitch markings — keeps the empty state tied to the game */}
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
                className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(30,144,255,0.16), transparent 70%)' }}
            />

            <div className="relative text-center max-w-md">
                <p
                    className="cr-display font-bold leading-[0.85] tracking-tight text-white"
                    style={{
                        fontSize: 'clamp(6rem, 22vw, 10rem)',
                        textShadow: '0 0 60px rgba(30,144,255,0.22), 0 0 120px rgba(30,144,255,0.08)',
                    }}
                >
                    404
                </p>

                <h1 className="cr-display mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    Offside
                </h1>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-gray-400 sm:text-[15px]">
                    Last time I checked, wherever you are didn't exist.
                    How did you end up here?
                </p>
                <p className="mt-8 text-xs text-gray-600">
                    Use the navigation to find your way back.
                </p>
            </div>
        </div>
    );
}