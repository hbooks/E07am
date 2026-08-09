import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { PromptTypes } from '@kinde/js-utils';
import { toast } from 'sonner';
import { Mail, Lock, CheckCircle, AlertTriangle, ArrowRightCircle } from 'lucide-react';
import { validateUsername } from '@/lib/usernameFilter';
import TermsModal from '@/components/TermsModal';

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const ONBOARDING_CHECK_URL = `${BASE_URL}/OnUse_exs`;
const CREATE_PROFILE_URL = `${BASE_URL}/Cuse`;

export default function OnboardingPage() {
    const { user, isLoading: authLoading, isAuthenticated, login } = useKindeAuth();
    const [profileExists, setProfileExists] = useState<boolean | null>(null);
    const navigate = useNavigate();

    if (!authLoading && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white px-4">
                <h2 className="text-2xl font-bold mb-4">Sign in to continue</h2>
                <button
                    onClick={() => login({ prompt: PromptTypes.login })}
                    className="bg-[#1E90FF] hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition"
                >
                    Sign in with Kinde
                </button>
            </div>
        );
    }

    if (authLoading) return <OnboardingSkeleton />;

    return (
        <OnboardingContent
            user={user}
            profileExists={profileExists}
            setProfileExists={setProfileExists}
        />
    );
}

function OnboardingContent({ user, profileExists, setProfileExists }: any) {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!user) return;
        setChecking(true);
        fetch(ONBOARDING_CHECK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.exists) {
                    navigate('/profile', { replace: true });
                } else {
                    setProfileExists(false);
                }
            })
            .catch(() => setProfileExists(false))
            .finally(() => setChecking(false));
    }, [user, navigate, setProfileExists]);

    if (checking) return <OnboardingSkeleton />;

    if (profileExists) {
        navigate('/profile', { replace: true });
        return null;
    }

    return <OnboardingForm user={user} />;
}

function OnboardingForm({ user }: { user: any }) {
    const [username, setUsername] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // Manual validation state (triggered by button)
    const [checked, setChecked] = useState(false);
    const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
    const [shake, setShake] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsModalOpen, setTermsModalOpen] = useState(false);

    const handleCheck = () => {
        const trimmed = username.trim();
        if (!trimmed) {
            setValidation({ valid: false, error: 'Username cannot be empty' });
            setChecked(true);
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }
        const result = validateUsername(trimmed);
        setValidation(result);
        setChecked(true);
        if (!result.valid) {
            setShake(true);
            setTimeout(() => setShake(false), 600);
        }
    };

    // Re‑validate automatically if user changes username after a successful check
    useEffect(() => {
        if (checked) {
            // if they modify after a successful check, reset the check
            setChecked(false);
            setValidation({ valid: true });
        }
    }, [username]);

    const canSave = checked && validation.valid && termsAccepted;

    const handleSave = async () => {
        if (!canSave) return;
        const sanitizedUsername = username.replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 30);
        if (!sanitizedUsername) {
            toast.error('Invalid username.');
            return;
        }

        setIsSaving(true);

        try {
            const res = await fetch(CREATE_PROFILE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, username: sanitizedUsername }),
            });
            const result = await res.json();
            if (res.ok) {
                toast.success('Profile created! Redirecting...');
                setTimeout(() => navigate('/profile', { replace: true }), 1000);
            } else {
                // Server returned an error (e.g., username taken)
                toast.error(result.error || 'Failed to save profile');
            }
        } catch {
            toast.error('Network error – please try again.');
        } finally {
            setIsSaving(false);
        }
    };
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <style>{`
                @keyframes onboarding-shake {
                    10%, 90% { transform: translateX(-1px); }
                    20%, 80% { transform: translateX(2px); }
                    30%, 50%, 70% { transform: translateX(-4px); }
                    40%, 60% { transform: translateX(4px); }
                }
            `}</style>
            <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
            <p className="text-sm text-gray-400 mb-6">
                Set your eFootball username wisely, it can’t be easily changed, you'll have to request a change if you make a mistake. 
                Make sure to follow the guidelines and be truthful.
            </p>

            {/* Email card – redesigned */}
            <div className="bg-[#1A1A1A] rounded-2xl p-5 mb-6 border border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#121212] flex items-center justify-center">
                        <Mail className="h-5 w-5 text-[#1E90FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Managed by your authentication provider</p>
                    </div>
                    <div className="text-gray-500" title="Your sign‑in email is linked to your Kinde account and cannot be modified here.">
                        <Lock className="h-4 w-4" />
                    </div>
                </div>
                <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                    This email is tied to your sign‑in method and <strong>cannot be changed</strong>. It is never displayed publicly.
                </p>
            </div>

            {/* Username input with manual check */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="efootball-username" className="block text-sm text-gray-400 mb-1">eFootball Username</label>
                    <div className="relative">
                        <input
                            id="efootball-username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCheck();
                                }
                            }}
                            placeholder="Your exact in‑game username (not ID)"
                            className={`w-full bg-[#121212] border rounded-lg p-3 pr-12 outline-none transition-all duration-200 ${checked
                                ? validation.valid
                                    ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/30'
                                    : 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
                                : 'border-gray-700 focus:border-[#1E90FF] focus:ring-2 focus:ring-[#1E90FF]/30'
                                }`}
                            style={{
                                animation: shake ? 'onboarding-shake 0.5s ease-in-out' : 'none',
                            }}
                        />
                        {/* Check button */}
                        <button
                            onClick={handleCheck}
                            disabled={!username.trim()}
                            aria-label="Check username availability"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1E90FF] disabled:opacity-30 disabled:hover:text-gray-400 transition"
                            title="Check username"
                        >
                            <ArrowRightCircle className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Validation result */}
                    {checked && (
                        <div className="mt-2">
                            {validation.valid ? (
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Valid username</span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-red-400 text-sm">
                                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                                    <span>{validation.error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                        We never ask for your eFootball ID or password. 
                        Your username must match your in‑game username exactly, including capitalization and special characters.
                    </p>
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={e => setTermsAccepted(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-600 bg-[#121212] text-[#1E90FF] focus:ring-[#1E90FF]"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                        I agree to the{' '}
                        <button
                            onClick={() => setTermsModalOpen(true)}
                            className="text-[#1E90FF] underline underline-offset-2 hover:text-blue-400 transition"
                        >
                            Terms of Service
                        </button>
                    </label>
                </div>

                {/* Continue button */}
                <button
                    onClick={handleSave}
                    disabled={!canSave || isSaving}
                    className={`w-full py-3 rounded-xl font-semibold transition ${canSave
                        ? 'bg-[#1E90FF] hover:bg-blue-600 text-white'
                        : 'bg-[#1A1A1A] text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {isSaving ? 'Saving...' : 'Continue'}
                </button>

                {message && (
                    <p className={`text-sm mt-2 ${message.includes('success') || message.includes('created') ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </div>

            {/* Terms Modal */}
            <TermsModal open={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
        </div>
    );
}

function OnboardingSkeleton() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] p-6 max-w-xl mx-auto">
            <div className="w-48 h-6 bg-[#1A1A1A] rounded animate-pulse mb-6" />
            <div className="bg-[#1A1A1A] rounded-xl p-4 mb-6 flex items-center gap-3">
                <div className="w-5 h-5 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-4 bg-[#2A2A2A] rounded animate-pulse" />
                    <div className="w-1/2 h-3 bg-[#2A2A2A] rounded animate-pulse" />
                </div>
            </div>
            <div className="space-y-4">
                <div className="w-full h-12 bg-[#1A1A1A] rounded-xl animate-pulse" />
                <div className="w-full h-12 bg-[#1E90FF]/30 rounded-xl animate-pulse" />
            </div>
        </div>
    );
}