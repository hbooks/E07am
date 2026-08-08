import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { Pencil, Lock, Info, Shield, ChevronRight, LogOut, Camera } from 'lucide-react';
import { toast } from 'sonner';


const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const UPDATE_AVATAR_URL = `${BASE_URL}/Update_Avatar`;

const AVATAR_CATEGORIES = [
  {
    name: 'Critters',
    base: 'https://api.dicebear.com/10.x/critters/svg?seed=',
    seeds: Array.from({ length: 10 }, (_, i) => String(i).padStart(2, '0')).concat(
      Array.from({ length: 6 }, (_, i) => String(95 + i))
    ),
  },
  {
    name: 'Croodles',
    base: 'https://api.dicebear.com/10.x/croodles/svg?seed=',
    seeds: Array.from({ length: 16 }, (_, i) => String(85 + i)),
  },
  {
    name: 'Dylan',
    base: 'https://api.dicebear.com/10.x/dylan/svg?seed=',
    seeds: Array.from({ length: 11 }, (_, i) => String(60 + i)),
  },
  {
    name: 'Clay',
    base: 'https://api.dicebear.com/10.x/clay/svg?seed=',
    seeds: Array.from({ length: 16 }, (_, i) => String(i).padStart(2, '0')),
  },
];

export default function ProfilePage() {
  const { user, isAuthenticated, login, logout } = useKindeAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutStatus, setLogoutStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  // If somehow not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      login();
    }
  }, [isAuthenticated, login]);

  // Fetch profile data
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`${BASE_URL}/Get_Up?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleAvatarUpdate = (newUrl: string) => {
    fetch(UPDATE_AVATAR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, avatarUrl: newUrl }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile({ ...profile, p_url: newUrl });
          toast.success('Profile picture updated!');
          setAvatarModalOpen(false);
        } else {
          toast.error('Failed to update avatar');
        }
      })
      .catch(() => toast.error('Network error'));
  };

  const handleLogout = () => {
    // Start the Kinde logout flow (redirects to Kinde, then back to logoutUri)
    logout();

    // After a short delay, aggressively clear all session data and force reload
    setTimeout(() => {
      // Delete all cookies
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });

      // Clear local and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Hard reload to the home page (bypasses cache)
      window.location.replace('/');
    }, 400);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <p>You're not logged in. Calling Auth....</p>
      </div>
    );
  }

  if (loading) return <ProfileSkeleton />;

  // If profile data is null, maybe user hasn't onboarded? We shouldn't normally reach here because onboarding would have redirected.
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white">
        <p className="mb-4">You haven't set up your profile yet.</p>
        <Link to="/onboarding" className="bg-[#1E90FF] px-6 py-2 rounded-xl">
          Complete Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Profile Card */}
      <div className="bg-[#1A1A1A] rounded-3xl p-6 mb-8 shadow-xl">
        <div className="flex items-start gap-6">
          {/* Avatar with edit pen */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#0A0A0A] border-2 border-[#1E90FF]">
              <img src={profile.p_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="absolute bottom-0 right-0 bg-[#1E90FF] p-2 rounded-full shadow-md hover:bg-blue-600 transition"
            >
              <Pencil className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Username and email */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{profile.username}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
              <Lock className="h-4 w-4" />
              <span className="truncate">{user.email}</span>
              <div className="relative group">
                <Info className="h-4 w-4 text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#2A2A2A] text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                  Your sign‑in credentials are securely managed and cannot be changed here.
                </div>
              </div>
            </div>

            {/* Badges rectangle */}
            <div className="mt-4 flex items-center gap-2">
              <div
                className="bg-[#2A2A2A] rounded-xl px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-[#333] transition"
                onClick={() => toast.info('Badges will be displayed here soon')}
              >
                <Shield className="h-4 w-4 text-[#1E90FF]" />
                <span className="text-sm font-medium">Badges</span>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats cubes */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-[#0A0A0A] rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Squad Strength</p>
            <p className="text-lg font-bold">{profile.squad_strength || 'N/A'}</p>
          </div>
          <div className="bg-[#0A0A0A] rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Squad Rank</p>
            <p className="text-lg font-bold">{profile.squad_rank || 'N/A'}</p>
          </div>
          <div className="bg-[#0A0A0A] rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Player Rank</p>
            <p className="text-lg font-bold">{profile.player_rank || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2 mb-8">
        <button
          onClick={() => navigate('/request-changes')}
          className="w-full bg-[#1A1A1A] rounded-xl p-4 flex items-center justify-between hover:bg-[#222] transition"
        >
          <span className="font-medium">Request Changes</span>
          <ChevronRight className="h-5 w-5 text-gray-500" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-[#1A1A1A] rounded-xl p-4 flex items-center justify-between hover:bg-[#222] transition"
        >
          <span className="font-medium">Settings</span>
          <ChevronRight className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Conditional Update Squad button */}
      {(!profile.squad_strength || profile.squad_strength === 'N/A') && (
        <div className="mb-8">
          <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-yellow-500/30">
            <div className="flex items-start gap-3 mb-4">
              <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">
                Your squad strength is currently <strong>NOT VERIFIED</strong>. To get evaluated, upload a <strong>screenshot of your best squad lineup</strong>. We manually verify these to ensure fair play. Tampered or doctored screenshots will result in account restriction.
              </p>
            </div>
            <button
              onClick={() => navigate('/update-squad')}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-xl font-semibold transition"
            >
              Update Squad For Evaluation
            </button>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`w-full rounded-xl p-4 flex items-center justify-between transition text-red-400 ${isLoggingOut ? 'bg-red-500/20 border border-red-500/30 cursor-not-allowed' : 'bg-red-600/20 border border-red-500/50 hover:bg-red-600/30'}`}
      >
        <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
        <LogOut className="h-5 w-5" />
      </button>
      {logoutStatus && (
        <p className="mt-3 text-sm text-gray-300">{logoutStatus}</p>
      )}

      {/* Avatar Selection Modal */}
      {avatarModalOpen && (
        <AvatarModal onSelect={handleAvatarUpdate} onClose={() => setAvatarModalOpen(false)} />
      )}
    </div>
  );
}

// ---------- Skeleton Loader ----------
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 max-w-2xl mx-auto">
      <div className="bg-[#1A1A1A] rounded-3xl p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#2A2A2A] animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="w-1/2 h-6 bg-[#2A2A2A] rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-[#2A2A2A] rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#0A0A0A] rounded-2xl p-4 space-y-2">
              <div className="w-1/2 h-3 bg-[#2A2A2A] rounded animate-pulse mx-auto" />
              <div className="w-1/3 h-5 bg-[#2A2A2A] rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2 mb-8">
        {[1, 2].map(i => (
          <div key={i} className="w-full h-14 bg-[#1A1A1A] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="w-full h-14 bg-[#1A1A1A] rounded-xl animate-pulse" />
    </div>
  );
}

// ---------- Avatar Modal (unchanged from before, just included for completeness) ----------
function AvatarModal({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const category = AVATAR_CATEGORIES[activeTab];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold">Choose Your Avatar</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-2">
          {AVATAR_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => { setActiveTab(idx); setSelectedSeed(null); }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${idx === activeTab ? 'border-[#1E90FF] text-[#1E90FF]' : 'border-transparent text-gray-400 hover:text-white'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-4 gap-3">
          {category.seeds.map(seed => {
            const url = `${category.base}${seed}`;
            return (
              <button
                key={seed}
                onClick={() => setSelectedSeed(url)}
                className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedSeed === url ? 'border-[#1E90FF] scale-105' : 'border-transparent hover:border-gray-500'
                  }`}
              >
                <img src={url} alt={`Avatar ${seed}`} className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => { if (selectedSeed) onSelect(selectedSeed); else toast.error('Please select an avatar'); }}
            className="w-full bg-[#1E90FF] hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition"
          >
            Save Avatar
          </button>
          <button onClick={onClose} className="w-full mt-2 bg-transparent border border-gray-600 text-gray-300 py-2 rounded-xl hover:bg-gray-700 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}