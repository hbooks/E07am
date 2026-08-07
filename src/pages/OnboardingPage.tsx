import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@/hooks/useKindeAuth';

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const ONBOARDING_CHECK_URL = `${BASE_URL}/OnUse_exs`;
const CREATE_PROFILE_URL = `${BASE_URL}/Cuse`;

function OnboardingPage() {
    const { user, isLoading: authLoading, isAuthenticated, login } = useKindeAuth();
    const [profileExists, setProfileExists] = useState<boolean | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        setProfileExists(null); 

        fetch(ONBOARDING_CHECK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.exists) {
                    navigate("/");
                } else {
                    setProfileExists(false);
                }
            })
            .catch(() => setProfileExists(false));
    }, [user, navigate]);

    if (authLoading || profileExists === null) {
        return (
            <div className= "min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4" >
            <div className="w-20 h-20 bg-[#1A1A1A] rounded-full animate-pulse mb-6" />
                <div className="w-48 h-4 bg-[#1A1A1A] rounded animate-pulse mb-4" />
                    <div className="w-32 h-3 bg-[#1A1A1A] rounded animate-pulse" />
                        <p className="mt-4 text-sm text-gray-500" > Setting up your profile...</p>
                            </div>
    );
    }

    if (!isAuthenticated) {
        return (
            <div className= "min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white" >
            <h2 className="text-2xl font-bold mb-4" > Welcome to CTR </h2>
                < p className = "text-gray-400 mb-8" > Sign in to start matchmaking.</p>
                    < button
        onClick = { login }
        className = "bg-[#1E90FF] hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition"
            >
            Sign in with Kinde
            </button>
            </div>
        );
    }

    return <OnboardingForm user={ user } />;
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
                body: JSON.stringify({
                    userId: user.id,
                    username: sanitizedUsername,
                }),
            });

            const result = await res.json();
            if (res.ok) {
                setMessage('Profile created! Redirecting...');
                setTimeout(() => navigate("/"), 1500);
            } else {
                setMessage(result.error || 'Failed to save profile');
            }
        } catch {
            setMessage('Network error – please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className= "min-h-screen bg-[#0A0A0A] text-white p-6" >
        <h1 className="text-2xl font-bold mb-6" > Complete Your Profile </h1>

            < div className = "bg-[#1A1A1A] p-4 rounded-xl mb-6" >
                <label className="text-sm text-gray-400" > Email </label>
                    < div className = "flex items-center justify-between" >
                        <span className="text-white" > { user.email } </span>
                            < span className = "text-xs text-gray-500" title = "Managed by Kinde" >🔒</span>
                                </div>
                                < p className = "text-xs text-gray-500 mt-2" >
                                    Your login email is managed by Kinde and cannot be changed here.
        </p>
                                        </div>

                                        < div className = "space-y-4" >
                                            <div>
                                            <label className="block text-sm text-gray-400 mb-1" > eFootball Username </label>
                                                < input
    type = "text"
    value = { username }
    onChange = { e => setUsername(e.target.value) }
    placeholder = "Your exact in‑game username (not ID)"
    className = "w-full bg-[#121212] border border-gray-700 rounded-lg p-3 focus:border-[#1E90FF] outline-none"
        />
        <p className="text-xs text-gray-500 mt-1" >
            Only letters, numbers, hyphens, underscores and dots.Impersonation may lead to account restriction.
          </p>
                </div>

                < div className = "bg-[#121212] p-4 rounded-xl" >
                    <label className="block text-sm text-gray-400 mb-1" > Squad Strength </label>
                        < p className = "text-gray-500 italic" > N / A – evaluated automatically </p>
                            </div>

                            < div className = "bg-[#121212] p-4 rounded-xl" >
                                <label className="block text-sm text-gray-400 mb-1" > Squad Rank </label>
                                    < p className = "text-gray-500 italic" > N / A – evaluated automatically </p>
                                        </div>

                                        < div className = "bg-[#121212] p-4 rounded-xl" >
                                            <label className="block text-sm text-gray-400 mb-1" > Player Rank </label>
                                                < p className = "text-gray-500 italic" > N / A – evaluated automatically </p>
                                                    </div>

                                                    < button
    onClick = { handleSave }
    disabled = { isSaving }
    className = "w-full bg-[#1E90FF] hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition"
        >
        { isSaving? 'Saving...': 'Save Profile' }
        </button>

    {
        message && (
            <p className={ `text-sm mt-2 ${message.includes('success') || message.includes('Profile created') ? 'text-green-400' : 'text-red-400'}` }>
                { message }
                </p>
        )
    }
    </div>
        </div>
  );
}

export default OnboardingPage;