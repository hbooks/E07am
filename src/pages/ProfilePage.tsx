import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const ONBOARDING_CHECK_URL = `${BASE_URL}/OnUse_exs`;
const CREATE_PROFILE_URL = `${BASE_URL}/Cuse`;

export default function ProfilePage() {
  const { user, isLoading: authLoading, isAuthenticated, login } = useKindeAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const navigate = useNavigate();

  // If not authenticated, redirect to Kinde login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      login();
    }
  }, [authLoading, isAuthenticated, login]);

  // Fetch profile from Supabase once we have a user
  useEffect(() => {
    if (!user) return;
    setProfileExists(null); // reset loading state

    fetch(ONBOARDING_CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.exists) {
          // Profile exists – fetch full data (we can reuse the same endpoint or a new one)
          // For now we set profileExists = true, but we still need full data.
          // We'll fetch the profile details from a dedicated GET endpoint or reuse the same POST that returns data.
          // The current OnUse_exs only returns { exists: true/false }. We need the full record.
          // We'll assume we have a /api/profile?userId=... endpoint or modify Cuse to also fetch.
          // But we can simply call OnUse_exs and then if exists, fetch from a new endpoint /api/profile?id=...
          // Let's create a simple GET endpoint in Supabase edge functions: GetProfile
          // For now, we'll simulate with a separate fetch.
          fetch(`${BASE_URL}/Get_Up?userId=${user.id}`)
            .then(res => res.json())
            .then(profileData => {
              setProfile(profileData);
              setProfileExists(true);
            })
            .catch(() => setProfileExists(false));
        } else {
          setProfileExists(false);
        }
      })
      .catch(() => setProfileExists(false));
  }, [user]);

  // Loading states
  if (authLoading || profileExists === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-[#1A1A1A] rounded-full animate-pulse mb-6" />
        <div className="w-48 h-4 bg-[#1A1A1A] rounded animate-pulse mb-4" />
        <div className="w-32 h-3 bg-[#1A1A1A] rounded animate-pulse" />
        <p className="mt-4 text-sm text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // If profile doesn't exist yet, show the onboarding form
  if (!profileExists) {
    return <OnboardingForm user={user} />;
  }

  // Profile exists – show full profile page (editable)
  return <ProfileView user={user} profile={profile} />;
}

// ====================== ONBOARDING FORM ======================
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
        setMessage('Profile created! Reloading...');
        // Refresh the page to fetch the new profile
        setTimeout(() => window.location.reload(), 1000);
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
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>

      <div className="bg-[#1A1A1A] p-4 rounded-xl mb-6">
        <label className="text-sm text-gray-400">Email</label>
        <div className="flex items-center justify-between">
          <span className="text-white">{user.email}</span>
          <span className="text-xs text-gray-500" title="Managed by Kinde">🔒</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Your login email is managed by Kinde and cannot be changed here.
        </p>
      </div>

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

        <div className="bg-[#121212] p-4 rounded-xl">
          <label className="block text-sm text-gray-400 mb-1">Squad Strength</label>
          <p className="text-gray-500 italic">N/A – evaluated automatically</p>
        </div>

        <div className="bg-[#121212] p-4 rounded-xl">
          <label className="block text-sm text-gray-400 mb-1">Squad Rank</label>
          <p className="text-gray-500 italic">N/A – evaluated automatically</p>
        </div>

        <div className="bg-[#121212] p-4 rounded-xl">
          <label className="block text-sm text-gray-400 mb-1">Player Rank</label>
          <p className="text-gray-500 italic">N/A – evaluated automatically</p>
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

// ====================== FULL PROFILE VIEW ======================
function ProfileView({ user, profile }: { user: any; profile: any }) {
  const [username, setUsername] = useState(profile.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async () => {
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 30);
    if (!sanitizedUsername) {
      setMessage('Invalid username.');
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
        setMessage('Profile updated!');
      } else {
        setMessage(result.error || 'Failed to update');
      }
    } catch {
      setMessage('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      {/* Locked Kinde info */}
      <div className="bg-[#1A1A1A] p-4 rounded-xl mb-6">
        <label className="text-sm text-gray-400">Email</label>
        <div className="flex items-center justify-between">
          <span className="text-white">{user.email}</span>
          <span className="text-xs text-gray-500" title="Managed by Kinde">🔒</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Your login email is managed by Kinde and cannot be changed here.
        </p>
      </div>

      {/* Editable username */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">eFootball Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 focus:border-[#1E90FF] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#121212] p-4 rounded-xl">
            <label className="block text-sm text-gray-400 mb-1">Squad Strength</label>
            <p className="text-white font-semibold">{profile.squad_strength || 'N/A'}</p>
          </div>
          <div className="bg-[#121212] p-4 rounded-xl">
            <label className="block text-sm text-gray-400 mb-1">Squad Rank</label>
            <p className="text-white font-semibold">{profile.squad_rank || 'N/A'}</p>
          </div>
          <div className="bg-[#121212] p-4 rounded-xl">
            <label className="block text-sm text-gray-400 mb-1">Player Rank</label>
            <p className="text-white font-semibold">{profile.player_rank || 'N/A'}</p>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={isSaving}
          className="w-full bg-[#1E90FF] hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition"
        >
          {isSaving ? 'Saving...' : 'Update Profile'}
        </button>

        {message && (
          <p className={`text-sm mt-2 ${message.includes('success') || message.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}