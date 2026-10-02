import { useEffect } from 'react';
import { LogIn, Swords, X } from 'lucide-react';

interface MockClaimPromptProps {
    mode: 'signin' | 'toolate';
    onSignIn: () => void;
    onCreateRoom: () => void;
    onClose: () => void;
}

export function MockClaimPrompt({ mode, onSignIn, onCreateRoom, onClose }: MockClaimPromptProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const isSignIn = mode === 'signin';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
            style={{ animation: 'mcp-fade .15s ease-out' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label={isSignIn ? 'Sign in to claim' : 'Room already claimed'}
        >
            <style>{`
                @keyframes mcp-fade { from { opacity: 0 } to { opacity: 1 } }
                @keyframes mcp-rise {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div
                className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.9)]"
                style={{ animation: 'mcp-rise .2s cubic-bezier(0.16,1,0.3,1)' }}
            >
                {/* Header row — terse label, close X, nothing else */}
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                    <p className="text-[15px] font-semibold text-white leading-tight">
                        {isSignIn ? 'Sign in to claim' : 'That one just went'}
                    </p>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="-mr-1 -mt-0.5 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body — one line */}
                <p className="px-5 pt-2 text-[13px] leading-relaxed text-gray-400">
                    {isSignIn
                        ? 'Rooms fill in seconds. Sign in and you\'ll be ready for the next one.'
                        : 'Rooms fill fast. Open your own and players get notified the moment it goes live.'}
                </p>

                {/* Actions — one primary, no secondary button */}
                <div className="px-5 pb-5 pt-4">
                    {isSignIn ? (
                        <button
                            onClick={onSignIn}
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1E90FF] py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
                        >
                            <LogIn className="h-4 w-4" />
                            Sign in
                        </button>
                    ) : (
                        <button
                            onClick={onCreateRoom}
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1E90FF] py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
                        >
                            <Swords className="h-4 w-4" />
                            Create a room
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}