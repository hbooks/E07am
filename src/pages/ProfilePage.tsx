import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { PromptTypes } from '@kinde/js-utils';
import { supabase } from '@/lib/supabaseClient';
import {
  Pencil, Lock, Info, ChevronRight, RefreshCw, Settings as SettingsIcon, X,
  Zap, Star, Clock, FileWarning,
} from 'lucide-react';
import { toast } from 'sonner';

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const UPDATE_AVATAR_URL = `${BASE_URL}/Update_Avatar`;

const AVATAR_CATEGORIES = [
  {
    name: 'Itters',
    base: 'https://api.dicebear.com/10.x/critters/svg?seed=',
    seeds: Array.from({ length: 10 }, (_, i) => String(i).padStart(2, '0')).concat(
      Array.from({ length: 15 }, (_, i) => String(95 + i))
    ),
  },
  {
    name: 'mar',
    base: 'https://api.dicebear.com/10.x/voxel-bot/svg?seed=',
    seeds: Array.from({ length: 20 }, (_, i) => String(85 + i)),
  },
  {
    name: 'aura',
    base: 'https://api.dicebear.com/10.x/notionists-neutral/svg?seed=',
    seeds: Array.from({ length: 35 }, (_, i) => String(60 + i)),
  },
  {
    name: 'lay',
    base: 'https://api.dicebear.com/10.x/clay/svg?seed=',
    seeds: Array.from({ length: 20 }, (_, i) => String(i).padStart(2, '0')),
  },
  {
    name: 'Zion',
    base: 'https://api.dicebear.com/10.x/adventurer-neutral/svg?seed=',
    seeds: Array.from({ length: 25 }, (_, i) => String(i).padStart(12, '0')),
  },
];

const PULL_THRESHOLD = 64;
const PULL_RESISTANCE = 0.45;
const PULL_MAX = 80;

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090b]';
const PRESS = 'active:scale-[0.97]';

// ---------- Badge asset maps ----------
const PLAYER_RANK_BADGES: Record<string, string> = {
  Tepid: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380914/jpuxanxhxotl5asuoc5g.png',
  Grinder: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/s7rx3mwgezzfn0dtmjxk.png',
  Conqueror: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786381381/k0rtr7rbyoimuvm0toxk.png',
  'Global Best': 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380917/hx3cptpzolxigapujqin.png',
  Ace: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380917/sgjg1bwq4m20gyq60okq.png',
  Admin: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/op1kkxepisfkre1apdyt.png',
};

const SQUAD_RANK_BADGES: Record<string, string> = {
  Academy: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/hiew6m38ulz49klmrsxd.png',
  Cadets: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/oqweb7wxxqzgwpdkhuw1.png',
  Wildcards: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/e95rg0zppnficltnhhvf.png',
  Generals: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380919/h5byjrvrdsrtxpauyowl.png',
  'Golden Eleven': 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/dwbweupxgs1fjkla3hzb.png',
  Galacticos: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/hjih4glyecynmxxmvr6h.png',
  'Gen XI': 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/v2oomsnv2cb720pijvrw.png',
};

const STAFF_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380915/ff7rn60eiylq1x1oixsz.png';
const VERIFIED_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/rsfa4dftmbz427k5cnmw.png';
const TROLL_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380917/l1bl2nyhvmudc75z1nqc.png';

const PLAYER_ORDER = ['Tepid', 'Grinder', 'Conqueror', 'Global Best', 'Ace', 'Admin'];
const SQUAD_ORDER = ['Academy', 'Cadets', 'Wildcards', 'Generals', 'Golden Eleven', 'Galacticos', 'Gen XI'];

type BadgeFocus = 'player' | 'squad' | null;

export default function ProfilePage() {
  const { user, isAuthenticated, login } = useKindeAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ranking' | 'tournaments' | 'achievements'>('ranking');
  const [badgeInfoOpen, setBadgeInfoOpen] = useState(false);
  const [badgeFocus, setBadgeFocus] = useState<BadgeFocus>(null);
  const navigate = useNavigate();

  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const fetchProfile = useCallback((silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    fetch(`${BASE_URL}/Get_Up?userId=${user.id}`)
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => {
        if (!silent) setLoading(false);
        setRefreshing(false);
      });
  }, [user?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => fetchProfile(true)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchProfile]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#08090b] px-6 text-center text-white">
        <p className="text-gray-400">You're not signed in.</p>
        <button
          onClick={() => login({ prompt: PromptTypes.login })}
          className={`rounded-xl bg-[#1E90FF] px-8 py-3 font-semibold text-white transition hover:bg-blue-600 ${PRESS} ${FOCUS_RING}`}
        >
          Sign in with Kinde
        </button>
      </div>
    );
  }

  if (!user) return <ProfileSkeleton />;

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = window.scrollY <= 0 && !refreshing ? e.touches[0].clientY : null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(delta * PULL_RESISTANCE, PULL_MAX));
    } else {
      setPullDistance(0);
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

  const openBadgeInfo = (focus: BadgeFocus) => {
    setBadgeFocus(focus);
    setBadgeInfoOpen(true);
  };

  if (loading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#08090b] px-6 text-center text-white">
        <p className="text-gray-400">You haven't set up your profile yet.</p>
        <Link
          to="/onboarding"
          className={`rounded-xl bg-[#1E90FF] px-8 py-3 font-semibold transition hover:bg-blue-600 ${PRESS} ${FOCUS_RING}`}
        >
          Complete Setup
        </Link>
      </div>
    );
  }

  // ---- Stats ----
  const oneVOne = Number(profile.one_v_one) || 0;
  const coOp = Number(profile.co_op) || 0;
  const tor = Number(profile.tor) || 0;
  const gamesPlayed = Number(profile.gp) || 0;
  const exp = Number(profile.exp) || 0;

  // ---- XP levels ----
  let xpLevel = 0;
  let xpNextThreshold = 240;
  if (exp >= 240 && exp < 496) { xpLevel = 1; xpNextThreshold = 496; }
  else if (exp >= 496 && exp < 1201) { xpLevel = 2; xpNextThreshold = 1201; }
  else if (exp >= 1201 && exp < 5160) { xpLevel = 3; xpNextThreshold = 5160; }
  else if (exp >= 5160) { xpLevel = 4; xpNextThreshold = 999999; }

  let xpRemaining = 0;
  if (xpLevel === 0) xpRemaining = 240 - exp;
  else if (xpLevel === 1) xpRemaining = 496 - exp;
  else if (xpLevel === 2) xpRemaining = 1201 - exp;
  else if (xpLevel === 3) xpRemaining = 5160 - exp;

  let xpProgress = 0;
  if (xpLevel === 0) xpProgress = (exp / 240) * 100;
  else if (xpLevel === 1) xpProgress = ((exp - 240) / (496 - 240)) * 100;
  else if (xpLevel === 2) xpProgress = ((exp - 496) / (1201 - 496)) * 100;
  else if (xpLevel === 3) xpProgress = ((exp - 1201) / (5160 - 1201)) * 100;
  else xpProgress = 100;
  xpProgress = Math.max(0, Math.min(100, xpProgress));

  // ---- Troll ----
  const trollPct = Math.max(0, Math.min(100, Number(profile.tc) || 0));
  const trollColor = trollPct < 20 ? '#22c55e' : trollPct < 30 ? '#eab308' : '#ef4444';
  const isTroll = trollPct >= 100;

  // ---- Rank info ----
  const squadRank = profile.squad_rank || 'Unranked';
  const playerRank = profile.player_rank || 'Unranked';
  const squadBadgeUrl = profile.r_url || SQUAD_RANK_BADGES[squadRank] || null;
  const playerBadgeUrl = profile.pr_url || PLAYER_RANK_BADGES[playerRank] || null;

  const isMaxLevel = xpLevel === 4;

  return (
    <div
      className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#08090b] text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .pr-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.01em; }
        .pr-body { font-family: 'Inter', sans-serif; }
        .pr-card {
          background: #0f0f11;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
        }
        .pr-avatar-ring {
          box-shadow: 0 0 0 2px #1E90FF, 0 0 0 6px rgba(30,144,255,0.08), 0 0 26px var(--ring-glow);
        }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {(pullDistance > 0 || refreshing) && (
        <div
          className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-[#141414] p-2.5 shadow-lg transition-opacity duration-150"
          style={{ opacity: refreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1) }}
        >
          <RefreshCw
            className={`h-5 w-5 text-[#1E90FF] ${refreshing ? 'animate-spin' : ''}`}
            style={refreshing ? undefined : { transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)` }}
          />
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-3 px-4 pb-24 pt-4 sm:px-6">
        {/* ── HERO ─────────────────────────────────── */}
        <div className="pr-card overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="pr-avatar-ring h-20 w-20 overflow-hidden rounded-full bg-[#08090b] sm:h-24 sm:w-24"
                  style={{ '--ring-glow': `rgba(30,144,255,0.3)` } as React.CSSProperties}
                >
                  <img src={profile.p_url} alt="Profile" className="h-full w-full object-cover" />
                </div>
                {isMaxLevel && (
                  <div
                    className="absolute -left-1 -top-1 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 p-0.5 ring-2 ring-[#0f0f11]"
                    title="Max XP level"
                  >
                    <Star className="h-2.5 w-2.5 text-black" fill="black" />
                  </div>
                )}
                <button
                  onClick={() => setAvatarModalOpen(true)}
                  aria-label="Change profile picture"
                  className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-[#1E90FF] p-1.5 shadow-lg ring-2 ring-[#0f0f11] transition hover:bg-blue-600 ${PRESS} ${FOCUS_RING}`}
                >
                  <Pencil className="h-3 w-3 text-white" />
                </button>
              </div>

              {/* Identity */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="pr-display truncate text-xl font-bold tracking-tight sm:text-2xl">
                    {profile.username}
                  </h1>
                  {profile.iss && (
                    <img
                      src={STAFF_BADGE}
                      alt="Staff"
                      className="h-5 w-5 shrink-0 rounded-full object-cover"
                      title="Staff"
                    />
                  )}
                  {profile.isv && (
                    <img
                      src={VERIFIED_BADGE}
                      alt="Verified"
                      className="h-5 w-5 shrink-0 rounded-full object-cover"
                      title="Verified"
                    />
                  )}
                  {isTroll && (
                    <img
                      src={TROLL_BADGE}
                      alt="Troll"
                      className="h-5 w-5 shrink-0 rounded-full object-cover"
                      title="Troll"
                    />
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                  <Lock className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>

                {/* Rank chips */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => openBadgeInfo('squad')}
                    className={`flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] py-1 pl-1 pr-2.5 transition hover:border-white/[0.12] hover:bg-white/[0.04] ${FOCUS_RING}`}
                    title="Squad rank"
                  >
                    {squadBadgeUrl ? (
                      <img src={squadBadgeUrl} alt={squadRank} className="h-6 w-6 rounded-full object-contain" />
                    ) : (
                      <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-white/15 text-[9px] text-gray-600">
                        ?
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-gray-400">{squadRank}</span>
                  </button>

                  <button
                    onClick={() => openBadgeInfo('player')}
                    className={`flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] py-1 pl-1 pr-2.5 transition hover:border-white/[0.12] hover:bg-white/[0.04] ${FOCUS_RING}`}
                    title="Player rank"
                  >
                    {playerBadgeUrl ? (
                      <img src={playerBadgeUrl} alt={playerRank} className="h-6 w-6 rounded-full object-contain" />
                    ) : (
                      <span className="grid h-6 w-6 place-items-center rounded-full border border-dashed border-white/15 text-[9px] text-gray-600">
                        ?
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-gray-400">{playerRank}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Slim stat row */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06]">
            <StatCell label="Games" value={gamesPlayed.toString()} />
            <StatCell label="Troll" value={`${trollPct}%`} valueColor={trollColor} />
            <StatCell
              label="Most Played"
              value={
                gamesPlayed === 0
                  ? '—'
                  : oneVOne >= coOp && oneVOne >= tor
                    ? '1v1'
                    : coOp >= tor
                      ? 'Co-op'
                      : 'Tournament'
              }
            />
          </div>
        </div>

        {/* ── XP ─────────────────────────────────────── */}
        <div className="pr-card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="pr-display text-sm font-semibold text-white">
                XP Level {xpLevel}
              </span>
            </div>
            <span className="text-[11px] tabular-nums text-gray-500">
              {xpLevel === 4 ? 'Maxed out' : `${xpRemaining.toLocaleString()} XP to next`}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums text-gray-500">
            <span>{exp.toLocaleString()} XP</span>
            <span>{xpLevel === 4 ? 'MAX' : `Next: ${xpNextThreshold.toLocaleString()} XP`}</span>
          </div>

          <div className="mt-3 flex items-center gap-1">
            {[0, 1, 2, 3, 4].map(lvl => (
              <div
                key={lvl}
                className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${lvl <= xpLevel ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-white/[0.06]'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* ── PENDING / REJECTED banners ─────────────── */}
        {profile.squad_strength === 'Pending' && (
          <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06] p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-yellow-500/10">
              <Clock className="h-3.5 w-3.5 text-yellow-500" />
            </span>
            <p className="text-[13px] leading-relaxed text-yellow-200">
              Your squad evaluation is in progress. You'll be notified when it's complete.
            </p>
          </div>
        )}

        {profile.squad_strength === 'Rejected' && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-500/10">
              <FileWarning className="h-3.5 w-3.5 text-red-400" />
            </span>
            <p className="text-[13px] leading-relaxed text-red-200">
              Your last squad screenshot was rejected. Upload a new one to get re-evaluated.
            </p>
          </div>
        )}

        {(!profile.squad_strength || profile.squad_strength === 'N/A' || profile.squad_strength === 'Rejected') && (
          <div className="pr-card p-4 sm:p-5">
            <div className="mb-3 flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
              <p className="text-[13px] leading-relaxed text-gray-400">
                Your squad strength is <strong className="text-white">not verified</strong>. Upload a
                screenshot of your best squad lineup to get evaluated. Tampered screenshots result in account restriction.
              </p>
            </div>
            <button
              onClick={() => navigate('/update-squad')}
              className={`w-full rounded-xl bg-yellow-600 py-2.5 text-sm font-semibold text-white transition hover:bg-yellow-700 ${PRESS} ${FOCUS_RING}`}
            >
              Update squad for evaluation
            </button>
          </div>
        )}

        {/* ── TABS ──────────────────────────────────── */}
        <div className="pr-card overflow-hidden">
          <div className="flex border-b border-white/[0.06]">
            {(['ranking', 'tournaments', 'achievements'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 py-3 text-[13px] font-medium capitalize transition ${FOCUS_RING} ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[#1E90FF]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5">
            {activeTab === 'ranking' && (
              <RankingTab
                squadRank={squadRank}
                playerRank={playerRank}
                squadBadgeUrl={squadBadgeUrl}
                playerBadgeUrl={playerBadgeUrl}
                onOpenBadge={openBadgeInfo}
              />
            )}
            {activeTab === 'tournaments' && <ComingSoon label="Tournaments" />}
            {activeTab === 'achievements' && <ComingSoon label="Achievements" />}
          </div>
        </div>

        {/* ── SETTINGS ─────────────────────────────── */}
        <button
          onClick={() => navigate('/settings')}
          className={`group flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-[#0f0f11] p-4 transition hover:border-white/[0.1] hover:bg-white/[0.02] ${FOCUS_RING}`}
        >
          <span className="flex items-center gap-3 text-sm font-medium">
            <SettingsIcon className="h-4 w-4 text-gray-500" />
            Settings
          </span>
          <ChevronRight className="h-4 w-4 text-gray-600 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {avatarModalOpen && (
        <AvatarModal onSelect={handleAvatarUpdate} onClose={() => setAvatarModalOpen(false)} />
      )}

      {badgeInfoOpen && (
        <BadgeInfoModal
          focus={badgeFocus}
          currentSquadRank={squadRank}
          currentPlayerRank={playerRank}
          onClose={() => { setBadgeInfoOpen(false); setBadgeFocus(null); }}
        />
      )}
    </div>
  );
}

/* ────────────── Small pieces ────────────── */

function StatCell({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="pr-display text-base font-bold tabular-nums sm:text-lg" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

function RankingTab({
  squadRank,
  playerRank,
  squadBadgeUrl,
  playerBadgeUrl,
  onOpenBadge,
}: {
  squadRank: string;
  playerRank: string;
  squadBadgeUrl: string | null;
  playerBadgeUrl: string | null;
  onOpenBadge: (focus: BadgeFocus) => void;
}) {
  const squadIdx = SQUAD_ORDER.indexOf(squadRank);
  const playerIdx = PLAYER_ORDER.indexOf(playerRank);

  return (
    <div className="space-y-4">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">Your Ranks</p>

      <RankRow
        badgeUrl={squadBadgeUrl}
        label="Squad Rank"
        value={squadRank}
        tiers={SQUAD_ORDER}
        currentIdx={squadIdx}
        onTap={() => onOpenBadge('squad')}
      />
      <RankRow
        badgeUrl={playerBadgeUrl}
        label="Player Rank"
        value={playerRank}
        tiers={PLAYER_ORDER}
        currentIdx={playerIdx}
        onTap={() => onOpenBadge('player')}
      />

      <p className="pt-1 text-center text-[11px] text-gray-600">
        More rankings coming soon
      </p>
    </div>
  );
}

function RankRow({
  badgeUrl,
  label,
  value,
  tiers,
  currentIdx,
  onTap,
}: {
  badgeUrl: string | null;
  label: string;
  value: string;
  tiers: string[];
  currentIdx: number;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className={`group flex w-full items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-left transition hover:border-white/[0.12] hover:bg-white/[0.04] ${FOCUS_RING}`}
    >
      {badgeUrl ? (
        <img src={badgeUrl} alt={value} className="h-11 w-11 shrink-0 rounded-lg bg-[#08090b] object-contain p-1" />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-dashed border-white/15 text-[10px] text-gray-600">
          ?
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
        <p className="pr-display truncate text-sm font-semibold text-white">{value}</p>
        <div className="mt-2 flex items-center gap-1">
          {tiers.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${currentIdx >= 0 && i <= currentIdx ? 'bg-[#1E90FF]' : 'bg-white/[0.06]'
                }`}
            />
          ))}
        </div>
      </div>
      <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="py-10 text-center">
      <p className="pr-display text-sm font-semibold text-gray-400">{label}</p>
      <p className="mt-1 text-xs text-gray-600">Coming soon.</p>
    </div>
  );
}

/* ────────────── Skeleton (matches real layout) ────────────── */

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/[0.04] ${className}`} />;
}

function ProfileSkeleton() {
  return (
    <div className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#08090b] text-white">
      <div className="mx-auto max-w-2xl space-y-3 px-4 pb-24 pt-4 sm:px-6">
        {/* HERO skeleton */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f11]">
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-white/[0.04] sm:h-24 sm:w-24" />

              {/* Identity */}
              <div className="min-w-0 flex-1 pt-0.5">
                {/* Name + badges row */}
                <div className="flex items-center gap-1.5">
                  <SkeletonBar className="h-6 w-28" />
                  <SkeletonBar className="h-4 w-4 !rounded-full" />
                </div>
                {/* Email */}
                <div className="mt-2 flex items-center gap-1.5">
                  <SkeletonBar className="h-3 w-3 !rounded-full" />
                  <SkeletonBar className="h-3 w-40" />
                </div>
                {/* Rank chips */}
                <div className="mt-3 flex items-center gap-2">
                  <SkeletonBar className="h-8 w-28 !rounded-full" />
                  <SkeletonBar className="h-8 w-28 !rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Stat row skeleton */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06]">
            {[0, 1, 2].map(i => (
              <div key={i} className="px-3 py-3 text-center">
                <SkeletonBar className="mx-auto h-5 w-12" />
                <SkeletonBar className="mx-auto mt-2 h-2.5 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* XP skeleton */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f11] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonBar className="h-4 w-4 !rounded-full" />
              <SkeletonBar className="h-4 w-20" />
            </div>
            <SkeletonBar className="h-3 w-24" />
          </div>
          <SkeletonBar className="h-1.5 w-full !rounded-full" />
          <div className="mt-2 flex items-center justify-between">
            <SkeletonBar className="h-3 w-16" />
            <SkeletonBar className="h-3 w-24" />
          </div>
          <div className="mt-3 flex items-center gap-1">
            {[0, 1, 2, 3, 4].map(i => (
              <SkeletonBar key={i} className="h-0.5 flex-1 !rounded-full" />
            ))}
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f11]">
          <div className="flex border-b border-white/[0.06]">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex-1 py-3">
                <SkeletonBar className="mx-auto h-3 w-20" />
              </div>
            ))}
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <SkeletonBar className="h-3 w-20" />
            {/* Two rank rows */}
            {[0, 1].map(i => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
              >
                <SkeletonBar className="h-11 w-11 shrink-0 !rounded-lg" />
                <div className="min-w-0 flex-1">
                  <SkeletonBar className="h-2.5 w-16" />
                  <SkeletonBar className="mt-2 h-4 w-24" />
                  <div className="mt-2 flex items-center gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map(j => (
                      <SkeletonBar key={j} className="h-1 flex-1 !rounded-full" />
                    ))}
                  </div>
                </div>
                <SkeletonBar className="mt-3 h-4 w-4 !rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Settings skeleton */}
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#0f0f11] p-4">
          <div className="flex items-center gap-3">
            <SkeletonBar className="h-4 w-4 !rounded-full" />
            <SkeletonBar className="h-3.5 w-20" />
          </div>
          <SkeletonBar className="h-4 w-4 !rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ────────────── Avatar Modal ────────────── */

function AvatarModal({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const category = AVATAR_CATEGORIES[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f11] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="pr-display text-base font-bold">Choose Your Avatar</h2>
            {selectedSeed && (
              <img src={selectedSeed} alt="Selected" className="h-7 w-7 rounded-full border border-[#1E90FF] object-cover" />
            )}
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1 text-gray-400 transition hover:bg-white/[0.06] hover:text-white ${FOCUS_RING}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2">
          {AVATAR_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => { setActiveTab(idx); setSelectedSeed(null); }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${FOCUS_RING} ${idx === activeTab ? 'bg-[#1E90FF] text-white' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {category.seeds.map(seed => {
              const url = `${category.base}${seed}`;
              const isSelected = selectedSeed === url;
              return (
                <button
                  key={seed}
                  onClick={() => setSelectedSeed(url)}
                  className={`aspect-square overflow-hidden rounded-xl border-2 bg-[#08090b] transition-all ${FOCUS_RING} ${isSelected ? 'border-[#1E90FF] ring-2 ring-[#1E90FF]/40' : 'border-white/[0.08] hover:border-gray-400'
                    }`}
                >
                  <img src={url} alt={`Avatar ${seed}`} className="h-full w-full object-cover" loading="lazy" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-white/[0.06] p-4">
          <button
            onClick={onClose}
            className={`flex-1 rounded-lg border border-white/[0.08] py-2 text-sm text-gray-300 transition hover:bg-white/[0.03] ${FOCUS_RING} ${PRESS}`}
          >
            Cancel
          </button>
          <button
            onClick={() => selectedSeed ? onSelect(selectedSeed) : toast.error('Please select an avatar')}
            className={`flex-1 rounded-lg bg-[#1E90FF] py-2 text-sm font-semibold text-white transition hover:bg-blue-600 ${FOCUS_RING} ${PRESS}`}
          >
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────── Badge Info Modal ────────────── */

function BadgeInfoModal({
  focus,
  currentSquadRank,
  currentPlayerRank,
  onClose,
}: {
  focus: BadgeFocus;
  currentSquadRank: string;
  currentPlayerRank: string;
  onClose: () => void;
}) {
  const playerLevels = [
    { name: 'Tepid', url: PLAYER_RANK_BADGES['Tepid'], desc: 'Just getting started.' },
    { name: 'Grinder', url: PLAYER_RANK_BADGES['Grinder'], desc: 'Consistent and putting in the work.' },
    { name: 'Conqueror', url: PLAYER_RANK_BADGES['Conqueror'], desc: 'A skilled, proven competitor.' },
    { name: 'Global Best', url: PLAYER_RANK_BADGES['Global Best'], desc: 'Ranked among the elite worldwide.' },
    { name: 'Ace', url: PLAYER_RANK_BADGES['Ace'], desc: 'The top tier. A true ace.' },
    { name: 'Admin', url: PLAYER_RANK_BADGES['Admin'], desc: 'Site administrator.' },
  ];

  const squadLevels = [
    { name: 'Academy', url: SQUAD_RANK_BADGES['Academy'], desc: 'Young prospects learning the game.' },
    { name: 'Cadets', url: SQUAD_RANK_BADGES['Cadets'], desc: 'Rising stars sharpening their edge.' },
    { name: 'Wildcards', url: SQUAD_RANK_BADGES['Wildcards'], desc: 'Unpredictable and dangerous.' },
    { name: 'Generals', url: SQUAD_RANK_BADGES['Generals'], desc: 'Leaders on the pitch.' },
    { name: 'Golden Eleven', url: SQUAD_RANK_BADGES['Golden Eleven'], desc: 'An elite starting XI.' },
    { name: 'Galacticos', url: SQUAD_RANK_BADGES['Galacticos'], desc: 'A star-studded squad.' },
    { name: 'Gen XI', url: SQUAD_RANK_BADGES['Gen XI'], desc: 'The ultimate eleven.' },
  ];

  const specialBadges = [
    { name: 'Verified', url: VERIFIED_BADGE, desc: 'Identity confirmed.' },
    { name: 'Staff', url: STAFF_BADGE, desc: 'Keeps the community running.' },
    { name: 'Troll', url: TROLL_BADGE, desc: 'Notorious mischief-maker.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0f0f11] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-5">
          <div>
            <h2 className="pr-display text-lg font-bold">Badges guide</h2>
            <p className="mt-0.5 text-xs text-gray-500">What each badge means and how you earn it</p>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 text-gray-400 transition hover:bg-white/[0.06] hover:text-white ${FOCUS_RING}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-5">
          {(focus === null || focus === 'player') && (
            <BadgeSection
              title="Player levels"
              subtitle="Your individual rank, based on performance"
              highlight={focus === 'player' ? currentPlayerRank : null}
            >
              {playerLevels.map(b => (
                <BadgeItem
                  key={b.name}
                  name={b.name}
                  url={b.url}
                  desc={b.desc}
                  shape="square"
                  isCurrent={b.name === currentPlayerRank}
                />
              ))}
            </BadgeSection>
          )}

          {(focus === null || focus === 'squad') && (
            <BadgeSection
              title="Squad levels"
              subtitle="Your squad's rank, based on combined performance"
              highlight={focus === 'squad' ? currentSquadRank : null}
            >
              {squadLevels.map(b => (
                <BadgeItem
                  key={b.name}
                  name={b.name}
                  url={b.url}
                  desc={b.desc}
                  shape="square"
                  isCurrent={b.name === currentSquadRank}
                />
              ))}
            </BadgeSection>
          )}

          {focus === null && (
            <BadgeSection title="Special badges" subtitle="Roles and status">
              {specialBadges.map(b => (
                <BadgeItem key={b.name} name={b.name} url={b.url} desc={b.desc} shape="round" />
              ))}
            </BadgeSection>
          )}
        </div>

        <div className="shrink-0 border-t border-white/[0.06] px-6 py-4">
          <button
            onClick={onClose}
            className={`w-full rounded-xl border border-white/[0.08] py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/[0.03] ${FOCUS_RING} ${PRESS}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function BadgeSection({
  title,
  subtitle,
  highlight,
  children,
}: {
  title: string;
  subtitle: string;
  highlight?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <h3 className="pr-display text-sm font-semibold text-white">{title}</h3>
        {highlight && (
          <span className="rounded-full bg-[#1E90FF]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5CA8FF]">
            You are here
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-gray-500">{subtitle}</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function BadgeItem({
  name,
  url,
  desc,
  shape,
  isCurrent,
}: {
  name: string;
  url: string;
  desc: string;
  shape: 'square' | 'round';
  isCurrent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition ${isCurrent
          ? 'border-[#1E90FF]/40 bg-[#1E90FF]/[0.06]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
        }`}
    >
      <img
        src={url}
        alt={name}
        className={`h-12 w-12 shrink-0 object-contain ${shape === 'round' ? 'rounded-full' : 'rounded-lg'}`}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          {isCurrent && (
            <span className="rounded-full bg-[#1E90FF] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Current
            </span>
          )}
        </div>
        <p className="text-xs leading-snug text-gray-400">{desc}</p>
      </div>
    </div>
  );
}