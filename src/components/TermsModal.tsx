import { X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TermsModalProps {
    open: boolean;
    onClose: () => void;
}

export default function TermsModal({ open, onClose }: TermsModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Terms of Service</h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-full p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto text-gray-300 text-sm space-y-3">
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

                    {/* Both routes are real pages now (App.tsx), so this opens a normal
                        new tab - no more redirect flicker from a missing route. */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 pt-3">
                        <Link
                            to="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1E90FF] underline underline-offset-2 hover:text-blue-400 transition inline-flex items-center gap-1"
                        >
                            Read full Terms <ExternalLink className="h-3 w-3" />
                        </Link>
                        <Link
                            to="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1E90FF] underline underline-offset-2 hover:text-blue-400 transition inline-flex items-center gap-1"
                        >
                            Privacy Policy <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full bg-[#1E90FF] hover:bg-blue-600 text-white py-2 rounded-xl font-semibold transition"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}