import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react';

interface LegalSection {
    id: string;
    title: string;
}

interface LegalLayoutProps {
    title: string;
    lastUpdated: string;
    sections: LegalSection[];
    children: ReactNode;
}

/**
 * Shared shell for /terms and /privacy. Keeps both documents visually and
 * structurally consistent: a back button (works no matter where the user
 * arrived from - modal, direct link, another legal page), a table of
 * contents that jumps to each section, and matching typography/spacing.
 */
export default function LegalLayout({ title, lastUpdated, sections, children }: LegalLayoutProps) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">
            {/* Smooth-scrolls anchor jumps from the table of contents below.
                Scoped to this page only - removed automatically on unmount. */}
            <style>{`html { scroll-behavior: smooth; }`}</style>

            <div className="max-w-5xl mx-auto p-6 md:p-10">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>

                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
                    <p className="text-xs text-gray-500 mt-2">Last updated: {lastUpdated}</p>
                </div>

                <div className="md:grid md:grid-cols-[220px_1fr] md:gap-12">
                    {/* Desktop sidebar TOC */}
                    <nav aria-label="Table of contents" className="hidden md:block">
                        <div className="sticky top-10 space-y-0.5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                On this page
                            </p>
                            {sections.map(s => (
                                <a
                                    key={s.id}
                                    href={`#${s.id}`}
                                    className="block text-sm text-gray-400 hover:text-[#1E90FF] transition py-1 leading-snug"
                                >
                                    {s.title}
                                </a>
                            ))}
                        </div>
                    </nav>

                    {/* Mobile pill TOC */}
                    <nav aria-label="Table of contents" className="md:hidden mb-8 flex flex-wrap gap-2">
                        {sections.map(s => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                className="text-xs px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-gray-800 text-gray-400 hover:text-[#1E90FF] hover:border-[#1E90FF]/40 transition"
                            >
                                {s.title}
                            </a>
                        ))}
                    </nav>

                    <div className="min-w-0 space-y-8 text-gray-300 text-sm leading-relaxed pb-16">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** One numbered/titled section of a legal document, with an anchor target. */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section id={id} className="scroll-mt-8 border-b border-gray-800/60 pb-8 last:border-0 last:pb-0">
            <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
            {children}
        </section>
    );
}

/** Highlighted callout box for things that need to stand out (warnings, key disclosures). */
export function Callout({ tone = 'info', children }: { tone?: 'info' | 'warning'; children: ReactNode }) {
    const isWarning = tone === 'warning';
    const Icon = isWarning ? AlertTriangle : Info;
    return (
        <div
            className={`rounded-xl border p-4 flex items-start gap-3 ${isWarning
                    ? 'border-black/30 bg-black/5'
                : 'border-black/30 bg-black/5'
                }`}
        >
            <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isWarning ? 'text-yellow-500' : 'text-[#1E90FF]'}`} />
            <div>{children}</div>
        </div>
    );
}