import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface TermsModalProps {
    open: boolean;
    onClose: () => void;
}

export default function TermsModal({ open, onClose }: TermsModalProps) {
    // 'summary' is the short version shown by default; 'full' expands the
    // same modal to show the complete terms. There is no navigation to any
    // other route - both views render from local content.
    const [view, setView] = useState<'summary' | 'full'>('summary');

    if (!open) return null;

    // Reset to the summary view next time the modal opens.
    const handleClose = () => {
        onClose();
        setTimeout(() => setView('summary'), 200);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                        {view === 'full' && (
                            <button
                                onClick={() => setView('summary')}
                                aria-label="Back to summary"
                                className="rounded-full p-1 -ml-1 text-gray-400 hover:bg-gray-700 hover:text-white transition"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-white">
                            {view === 'summary' ? 'Terms of Service' : 'Full Terms of Service'}
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        aria-label="Close"
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto text-gray-300 text-sm space-y-3">
                    {view === 'summary' ? (
                        <>
                            <p>
                                Welcome to CTR – Claim The Room. By using this service you agree to these terms.
                            </p>
                            <div className="space-y-2">
                                <div>
                                    <strong>1. Username Policy</strong><br />
                                    You must use your real eFootball username. Impersonating another player, using offensive language,
                                    or pretending to be a CTR staff member will result in permanent account suspension.
                                </div>
                                <div>
                                    <strong>2. Fair Play</strong><br />
                                    Tampered screenshots, false squad information, or any attempt to cheat the evaluation
                                    system will lead to immediate restriction.
                                </div>
                                <div>
                                    <strong>3. Data Privacy</strong><br />
                                    We only store your eFootball username and your chosen avatar. Your sign‑in credentials
                                    are never stored on our servers.
                                </div>
                            </div>
                            <button
                                onClick={() => setView('full')}
                                className="text-[#1E90FF] underline underline-offset-2 hover:text-blue-400 transition mt-3"
                            >
                                Read full Terms
                            </button>
                        </>
                    ) : (
                        <FullTerms />
                    )}
                </div>

                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={handleClose}
                        className="w-full bg-[#1E90FF] hover:bg-blue-600 text-white py-2 rounded-xl font-semibold transition"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}

// Full terms content, rendered inline in the same modal - no fetch, no
// route change. Replace this with your real legal copy whenever it's ready;
// swap it for a fetch() call to a CMS/markdown endpoint later if you'd
// rather manage it outside the codebase, the modal shell doesn't need to
// change either way.
function FullTerms() {
    return (
        <div className="space-y-4 leading-relaxed">
            <p className="text-gray-400 text-xs">Last updated: August 2026</p>

            <section>
                <h3 className="font-semibold text-white mb-1">1. Acceptance of Terms</h3>
                <p>
                    By creating an account or using CTR – Claim The Room ("CTR", "we", "us"), you agree to be
                    bound by these Terms of Service. If you do not agree, do not use the service.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-white mb-1">2. Username Policy</h3>
                <p>
                    Your CTR username must match your real eFootball in‑game username. You may not impersonate
                    another player, a CTR staff member, or any public figure. Usernames containing offensive,
                    hateful, or sexually explicit language are not permitted and may be changed or suspended
                    without notice.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-white mb-1">3. Fair Play</h3>
                <p>
                    Squad strength, rank, and other evaluation data must be submitted honestly. Uploading
                    tampered, doctored, or misleading screenshots, or otherwise attempting to manipulate the
                    evaluation system, is grounds for immediate account restriction.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-white mb-1">4. Account Security</h3>
                <p>
                    You are responsible for keeping your sign‑in credentials secure. CTR uses Kinde for
                    authentication and never sees or stores your password.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-white mb-1">5. Data We Store</h3>
                <p>
                    We store your eFootball username, chosen avatar, and squad evaluation data associated with
                    your account. Your sign‑in email is provided by your authentication provider and is used
                    only to identify your account - it is never displayed publicly.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-white mb-1">6. Enforcement</h3>
                <p>
                    We may suspend or terminate accounts that violate these terms at our discretion. Repeated
                    or severe violations may result in a permanent ban.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-white mb-1">7. Changes to These Terms</h3>
                <p>
                    We may update these terms from time to time. Continued use of CTR after changes are posted
                    constitutes acceptance of the revised terms.
                </p>
            </section>

            <section>
                <h3 className="font-semibold text-white mb-1">8. Contact</h3>
                <p>
                    Questions about these terms can be directed to the CTR team through the app's support
                    channel.
                </p>
            </section>
        </div>
    );
}