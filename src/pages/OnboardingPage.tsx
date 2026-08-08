import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { User, Mail, Lock } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const ONBOARDING_CHECK_URL = `${BASE_URL}/OnUse_exs`;
const CREATE_PROFILE_URL = `${BASE_URL}/Cuse`;

export default function OnboardingPage() {
    const { user, isLoading: authLoading, isAuthenticated, login } = useKindeAuth();
    const [profileExists, setProfileExists] = useState<boolean | null>(null);
    const navigate = useNavigate();

    // If not authenticated, show login prompt
    if (!authLoading && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white px-4">
                <h2 className="text-2xl font-bold mb-4">Sign in to continue</h2>
                <button onClick={() => login()} className="bg-[#1E90FF] hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition">
                    Sign in with Kinde
                </button>
            </div>
        );
    }

    // While auth is loading, show skeleton
    if (authLoading) {
        return <OnboardingSkeleton />;
    }

    // Once authenticated, check if profile exists
    // (We'll use an effect to avoid calling during render)
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
        // Already onboarded – should already have been redirected, but just in case
        navigate('/profile', { replace: true });
        return null;
    }

    // Show onboarding form
    return <OnboardingForm user={user} />;
}

function OnboardingForm({ user }: { user: any }) {
    const [username, setUsername] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSave = async () => {
        const sanitizedUsername = username.replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 30);
        if (!sanitizedUsername) {
            setMessage('Invalid username. Only letters, numbers, hyphens, underscores, and dots allowed.');
            return;
        }

        setIsSaving(true);
        setMessage('');

        try {
            const res = await fetch(CREATE_PROFILE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, username: sanitizedUsername }),
            });
            const result = await res.json();
            if (res.ok) {
                setMessage('Profile created! Redirecting...');
                setTimeout(() => navigate('/profile', { replace: true }), 1000);
            } else {
                setMessage(result.error || 'Failed to save profile');
            }
        } catch {
            setMessage('Network error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>

            {/* Locked email */}
            <div className="bg-[#1A1A1A] p-4 rounded-xl mb-6 flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Managed by your authentication provider</p>
                </div>
                <Lock className="h-4 w-4 text-gray-500" />
            </div>

            {/* Username input */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">eFootball Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Your exact in‑game username (not ID)"
                        className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 focus:border-[#1E90FF] outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Only letters, numbers, hyphens, underscores and dots. Impersonation may lead to account restriction.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-[#1E90FF] hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition"
                >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                </button>

                {message && (
                    <p className={`text-sm mt-2 ${message.includes('success') || message.includes('Profile created') ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </div>
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