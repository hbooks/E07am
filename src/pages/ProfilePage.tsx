import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { PromptTypes } from '@kinde/js-utils';
import {
  Pencil, Lock, Info, ChevronRight, LogOut, Clock, FileWarning,
  RefreshCw, SlidersHorizontal, Settings as SettingsIcon, X,
} from 'lucide-react';
import { toast } from 'sonner';
import UserBadges, { STAFF_BADGE_URL, VERIFIED_BADGE_URL } from '@/components/UserBadges';

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const UPDATE_AVATAR_URL = `${BASE_URL}/Update_Avatar`;

const AVATAR_CATEGORIES = [
  {
    name: 'Critters',
    base: 'https://api.dicebear.com/10.x/critters/svg?seed=',
    seeds: Array.from({ length: 10 }, (_, i) => String(i).padStart(2, '0')).concat(
      Array.from({ length: 10 }, (_, i) => String(95 + i))
    ),
  },
  {
    name: 'Croodles',
    base: 'https://api.dicebear.com/10.x/croodles/svg?seed=',
    seeds: Array.from({ length: 20 }, (_, i) => String(85 + i)),
  },
  {
    name: 'Dylan',
    base: 'https://api.dicebear.com/10.x/dylan/svg?seed=',
    seeds: Array.from({ length: 20 }, (_, i) => String(60 + i)),
  },
  {
    name: 'Clay',
    base: 'https://api.dicebear.com/10.x/clay/svg?seed=',
    seeds: Array.from({ length: 20 }, (_, i) => String(i).padStart(2, '0')),
  },
];

const PULL_THRESHOLD = 64; // px of pull before a release triggers a refresh
const PULL_RESISTANCE = 0.45;
const PULL_MAX = 80;

export default function ProfilePage() {
  const { user, isAuthenticated, login, logout } = useKindeAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutStatus, setLogoutStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ranking' | 'tournaments' | 'achievements'>('ranking');
  const [badgeInfoOpen, setBadgeInfoOpen] = useState(false);
  const navigate = useNavigate();

  // --- Pull-to-refresh state ---
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);

  // Auth is guarded centrally by <ProtectedRoute> in App.tsx, which forces
  // `login({ prompt: PromptTypes.login })` whenever the user isn't
  // authenticated - this page doesn't call login() on mount itself.

  // Fetch profile data. Pulled out into a named function (same fetch,
  // same success/error handling as before) so pull-to-refresh can call it
  // again without duplicating the request logic.
  const fetchProfile = (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    fetch(`${BASE_URL}/Get_Up?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => {
        if (!silent) setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!isAuthenticated) {
    // Normally unreachable, since <ProtectedRoute> in App.tsx already keeps
    // unauthenticated users off this page. Kept as a defensive fallback.
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white gap-4">
        <p>You're not logged in.</p>
        <button
          onClick={() => login({ prompt: PromptTypes.login })}
          className="bg-[#1E90FF] hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition"
        >
          Sign in with Kinde
        </button>
      </div>
    );
  }

  if (!user) {
    // isAuthenticated is true but Kinde hasn't populated `user` yet -
    // same skeleton used while profile data itself is loading.
    return <ProfileSkeleton />;
  }

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
    setIsLoggingOut(true);
    setLogoutStatus('Signing you out…');

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore storage access issues (e.g. private browsing)
    }

    logout();
  };

  // --- Pull-to-refresh handlers ---
  // Deliberately lightweight (no external library): only arms when the
  // page is already scrolled to the very top, mirroring native
  // pull-to-refresh so it never fights normal scrolling further down
  // the page.
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = window.scrollY <= 0 && !refreshing ? e.touches[0].clientY : null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(delta * PULL_RESISTANCE, PULL_MAX));
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null) return;
    if (pullDistance > PULL_THRESHOLD) {
      setRefreshing(true);
      fetchProfile(true);
    }
    setPullDistance(0);
    touchStartY.current = null;
  };

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

  const trollPct = Math.max(0, Math.min(100, Number(profile.tc) || 0));
  const trollColor = trollPct < 20 ? '#22c55e' : trollPct < 30 ? '#eab308' : '#ef4444';
  const trollLabel = trollPct < 20 ? 'Chill' : trollPct < 30 ? 'Cheecky' : 'Troll';

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white cr-body"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .cr-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.01em; }
        .cr-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Pull-to-refresh indicator - zero height and invisible until pulled */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: refreshing ? 48 : pullDistance }}
      >
        <RefreshCw
          className={`h-5 w-5 text-[#1E90FF] ${refreshing ? 'animate-spin' : ''}`}
          style={refreshing ? undefined : { transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)` }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Profile header card */}
        <div className="bg-[#141414] rounded-3xl p-5 sm:p-6 border border-white/5">
          <div className="flex items-start gap-4 sm:gap-5">
            {/* Avatar with edit pen */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-[#0A0A0A] border-2 border-[#1E90FF] ring-4 ring-[#1E90FF]/10">
                <img src={profile.p_url} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => setAvatarModalOpen(true)}
                aria-label="Change profile picture"
                className="absolute bottom-0 right-0 bg-[#1E90FF] p-2 rounded-full shadow-lg hover:bg-blue-600 transition ring-2 ring-[#0A0A0A]"
              >
                <Pencil className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Username, email, badges */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="cr-display text-xl sm:text-3xl font-bold truncate">{profile.username}</h1>
                <UserBadges isStaff={!!profile.iss} isVerified={!!profile.isv} size="md" />
              </div>

              <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-gray-500">
                <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
                <div className="relative group flex-shrink-0">
                  <Info className="h-3.5 w-3.5 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1F1F1F] text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 border border-white/10">
                    Your sign‑in credentials are securely managed and cannot be changed here.
                  </div>
                </div>
              </div>

              {/* Badges area - replaces the old "about me" block */}
              <div className="mt-4 flex items-center gap-5">
                <RankBadgeTile imageUrl={profile.r_url} label="Squad" size="md" />
                <RankBadgeTile imageUrl={profile.pr_url} label="Player" size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Troll meter - signature element replacing the old menu/follow row */}
        <div className="bg-[#141414] rounded-2xl p-4 sm:p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <p className="cr-display text-xs sm:text-sm font-semibold tracking-wide text-gray-400 uppercase">Troll Counter</p>
            <span className="cr-display text-sm font-bold" style={{ color: trollColor }}>
              {trollLabel} · {trollPct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[#0A0A0A] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${trollPct}%`, backgroundColor: trollColor }}
            />
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Squad Rank" value={profile.squad_strength || 'N/A'} />
          <StatTile label="Troll %" value={`${trollPct}%`} valueColor={trollColor} />
        </div>

        {/* Show if pending */}
        {profile.squad_strength === 'Pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-300">Your squad evaluation is in progress. You'll be notified when it's complete.</p>
          </div>
        )}

        {/* Show if rejected */}
        {profile.squad_strength === 'Rejected' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center gap-3">
            <FileWarning className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-white">The screenshot you submitted was rejected. Please update your squad and resubmit for evaluation.</p>
          </div>
        )}

        {/* Conditional Update Squad button */}
        {(!profile.squad_strength || profile.squad_strength === 'N/A' || profile.squad_strength === 'Rejected') && (
          <div className="bg-[#141414] rounded-2xl p-5 border border-white/5">
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
        )}

        {/* Ranking / Tournaments / Achievements tabs */}
        <div className="bg-[#141414] rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex border-b border-white/5">
            {(['ranking', 'tournaments', 'achievements'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition ${activeTab === tab
                    ? 'text-[#1E90FF] border-b-2 border-[#1E90FF] bg-[#1E90FF]/5'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'ranking' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="cr-display text-sm font-semibold text-gray-400">Your Ranks</span>
                  <button
                    onClick={() => setBadgeInfoOpen(true)}
                    className="text-gray-500 hover:text-white transition p-1 rounded-full hover:bg-white/5"
                    aria-label="Learn about badges"
                    title="Learn about badges"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>
                <RankBadgeTile imageUrl={profile.r_url} label="Squad Rank" value={profile.squad_rank || 'Unranked'} size="lg" />
                <RankBadgeTile imageUrl={profile.pr_url} label="Player Rank" value={profile.player_rank || 'Unranked'} size="lg" />
                <p className="text-xs text-gray-600 text-center pt-2">More rankings coming soon</p>
              </div>
            )}
            {activeTab === 'tournaments' && <ComingSoon label="Tournaments" />}
            {activeTab === 'achievements' && <ComingSoon label="Achievements" />}
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/request-changes')}
            className="w-full bg-[#141414] rounded-xl p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition border border-white/5"
          >
            <span className="flex items-center gap-3 font-medium">
              <SlidersHorizontal className="h-4 w-4 text-gray-500" />
              Request Changes
            </span>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-[#141414] rounded-xl p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition border border-white/5"
          >
            <span className="flex items-center gap-3 font-medium">
              <SettingsIcon className="h-4 w-4 text-gray-500" />
              Settings
            </span>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Logout */}
        <div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full rounded-xl p-4 flex items-center justify-between transition text-red-400 border ${isLoggingOut ? 'bg-red-500/10 border-red-500/20 cursor-not-allowed' : 'bg-red-600/10 border-red-500/30 hover:bg-red-600/20'
              }`}
          >
            <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
            <LogOut className="h-5 w-5" />
          </button>
          {logoutStatus && (
            <p className="mt-3 text-sm text-gray-500 text-center">{logoutStatus}</p>
          )}
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {avatarModalOpen && (
        <AvatarModal onSelect={handleAvatarUpdate} onClose={() => setAvatarModalOpen(false)} />
      )}

      {/* Badge Info Modal */}
      {badgeInfoOpen && (
        <BadgeInfoModal onClose={() => setBadgeInfoOpen(false)} />
      )}
    </div>
  );
}

// ---------- Small presentational pieces ----------

function StatTile({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-[#141414] rounded-2xl p-4 border border-white/5 text-center">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">{label}</p>
      <p className="cr-display text-xl font-bold" style={valueColor ? { color: valueColor } : undefined}>{value}</p>
    </div>
  );
}

function RankBadgeTile({
  imageUrl,
  label,
  value,
  size = 'md',
}: {
  imageUrl?: string | null;
  label: string;
  value?: string;
  size?: 'md' | 'lg';
}) {
  const dim = size === 'lg' ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-10 w-10 sm:h-11 sm:w-11';
  return (
    <div className="flex items-center gap-3 min-w-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${label} badge`}
          className={`${dim} object-contain flex-shrink-0 rounded-lg bg-[#0A0A0A] p-1 border border-white/10`}
        />
      ) : (
        <div className={`${dim} rounded-full bg-[#0A0A0A] border border-white/10 flex items-center justify-center flex-shrink-0`}>
          <span className="text-gray-700 text-xs">—</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
        <p className="cr-display text-sm sm:text-base font-semibold text-white truncate">
          {value ?? (imageUrl ? '' : 'Not ranked yet')}
        </p>
      </div>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="text-center py-10">
      <p className="cr-display text-lg font-semibold text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-gray-600">Coming soon.</p>
    </div>
  );
}

// ---------- Skeleton Loader ----------
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <div className="bg-[#141414] rounded-3xl p-5 sm:p-6">
        <div className="flex items-start gap-5">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#1F1F1F] animate-pulse" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="w-1/2 h-6 bg-[#1F1F1F] rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-[#1F1F1F] rounded animate-pulse" />
            <div className="w-2/3 h-10 bg-[#1F1F1F] rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
      <div className="h-16 bg-[#141414] rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-[#141414] rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-48 bg-[#141414] rounded-2xl animate-pulse" />
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="w-full h-14 bg-[#141414] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="w-full h-14 bg-[#141414] rounded-xl animate-pulse" />
    </div>
  );
}

// ---------- Avatar Modal (redesigned) ----------
function AvatarModal({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const category = AVATAR_CATEGORIES[activeTab];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#141414] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="cr-display text-base font-bold">Choose Your Avatar</h2>
            {selectedSeed && (
              <img
                src={selectedSeed}
                alt="Selected avatar"
                className="h-7 w-7 rounded-full border border-[#1E90FF] object-cover"
              />
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-3 overflow-x-auto py-2 gap-1 shrink-0">
          {AVATAR_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => { setActiveTab(idx); setSelectedSeed(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition whitespace-nowrap ${idx === activeTab
                  ? 'bg-[#1E90FF] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Avatar grid */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {category.seeds.map(seed => {
              const url = `${category.base}${seed}`;
              const isSelected = selectedSeed === url;
              return (
                <button
                  key={seed}
                  onClick={() => setSelectedSeed(url)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all bg-[#0A0A0A] ${isSelected
                      ? 'border-[#1E90FF] ring-2 ring-[#1E90FF]/40'
                      : 'border-white/10 hover:border-gray-400'
                    }`}
                >
                  <img
                    src={url}
                    alt={`Avatar option ${seed}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10 flex gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 bg-transparent border border-white/10 text-gray-300 py-2 rounded-lg text-sm hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedSeed) {
                onSelect(selectedSeed);
              } else {
                toast.error('Please select an avatar');
              }
            }}
            className="flex-1 bg-[#1E90FF] hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold transition"
          >
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Badge Info Modal ----------
function BadgeInfoModal({ onClose }: { onClose: () => void }) {
  const playerLevels = [
    { name: 'Tepid', url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380914/jpuxanxhxotl5asuoc5g.png', desc: 'Just getting started.' },
    { name: 'Grinder', url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/s7rx3mwgezzfn0dtmjxk.png', desc: 'Consistent and putting in the work.' },
    { name: 'Conqueror', url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786381381/k0rtr7rbyoimuvm0toxk.png', desc: 'A skilled, proven competitor.' },
    { name: 'Global Best', url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380917/hx3cptpzolxigapujqin.png', desc: 'Ranked among the elite worldwide.' },
    { name: 'Ace', url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380917/sgjg1bwq4m20gyq60okq.png', desc: 'The top tier. A true ace.' },
  ];

  const squadLevels = [
    {
      name: 'Academy',
      url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/hiew6m38ulz49klmrsxd.png',
      desc: 'Young prospects learning the game. Raw potential waiting to break through.'
    },
    {
      name: 'Cadets',
      url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/oqweb7wxxqzgwpdkhuw1.png',
      desc: 'Rising stars sharpening their edge. One step away from the big leagues.'
    },
    {
      name: 'Wildcard',
      url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/e95rg0zppnficltnhhvf.png',
      desc: 'Unpredictable and dangerous. No formation is safe against this chaos.'
    },
    {
      name: 'Generals',
      url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380919/h5byjrvrdsrtxpauyowl.png',
      desc: 'Leaders on the pitch. Tactical masterminds who dictate the tempo.'
    },
    {
      name: 'Golden Eleven',
      url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/dwbweupxgs1fjkla3hzb.png',
      desc: 'An elite starting XI – precision, chemistry, and pure class.'
    },
    {
      name: 'Galacticos',
      url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/hjih4glyecynmxxmvr6h.png',
      desc: 'A star-studded squad of generational talent. The envy of the world.'
    },
    {
      name: 'Gen XI',
      url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/v2oomsnv2cb720pijvrw.png',
      desc: 'The ultimate eleven. Legends forged in glory, unstoppable.'
    },
  ];

  const specialBadges = [
    { name: 'Verified', url: VERIFIED_BADGE_URL, desc: 'Identity confirmed.' },
    { name: 'Staff', url: STAFF_BADGE_URL, desc: 'Keeps the community running.' },
    { name: 'Admin', url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/op1kkxepisfkre1apdyt.png', desc: 'Top-level management.' },
    { name: 'Troll', url: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380917/l1bl2nyhvmudc75z1nqc.png', desc: 'Notorious mischief-maker.' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-white/10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="cr-display text-lg font-bold">Badges guide</h2>
            <p className="text-xs text-gray-500 mt-0.5">What each badge means and how you earn it</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content – scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-7">
          <BadgeSection title="Player levels" subtitle="Your individual rank, based on performance">
            {playerLevels.map(b => (
              <BadgeItem key={b.name} name={b.name} url={b.url} desc={b.desc} shape="square" />
            ))}
          </BadgeSection>

          <BadgeSection title="Squad levels" subtitle="Your squad's rank, based on combined performance">
            {squadLevels.map(b => (
              <BadgeItem key={b.name} name={b.name} url={b.url} desc={b.desc} shape="square" />
            ))}
          </BadgeSection>

          <BadgeSection title="Special badges" subtitle="Roles and status, assigned rather than earned by rank">
            {specialBadges.map(b => (
              <BadgeItem key={b.name} name={b.name} url={b.url} desc={b.desc} shape="round" />
            ))}
          </BadgeSection>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-transparent border border-white/10 text-gray-300 py-2.5 rounded-xl hover:bg-white/5 transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function BadgeSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="cr-display text-sm font-semibold text-white mb-0.5">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{subtitle}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {children}
      </div>
    </div>
  );
}

function BadgeItem({
  name,
  url,
  desc,
  shape,
}: {
  name: string;
  url: string;
  desc: string;
  shape: 'square' | 'round';
}) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition">
      <img
        src={url}
        alt={name}
        className={`h-14 w-14 object-contain shrink-0 ${shape === 'round' ? 'rounded-full' : 'rounded-lg'
          }`}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{name}</p>
        <p className="text-xs text-gray-400 leading-snug">{desc}</p>
      </div>
    </div>
  );
}