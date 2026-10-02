/**
 * Mock feed pool for cold-start seeding.
 *
 * These are client-side only — they never touch the backend, never fire analytics,
 * and are shown ONLY when the real feed has zero matches for the current tab.
 *
 * Pool size per tab:
 *   1v1        → 15
 *   Tournament → 11
 *   Co-op      → 11
 *
 * Every mock has a unique username, a unique avatar URL from one of five
 * DiceBear libraries, and a match type. The rotation logic relies on this
 * being at least 2x the max visible count per tab (5), so no user is ever
 * shown twice in the same tab.
 */

export type MockMatchType = '1v1' | 'Co-op' | 'Tournament';

export interface MockUser {
    id: string;
    username: string;
    avatarUrl: string;
    matchType: MockMatchType;
    coopSub?: '2 vs AI' | '3 vs 3';
    tournamentSize?: 4 | 8;
    squadRank: string;
    playerRank: string;
    squadRankBadge: string;
    playerRankBadge: string;
    vibe: number;
    isStaff?: boolean;
    isVerified?: boolean;
}

// ── Badge URLs ────────────────────────────────────────
const PLAYER_BADGES = {
    Tepid: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380914/jpuxanxhxotl5asuoc5g.png',
    Grinder: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/s7rx3mwgezzfn0dtmjxk.png',
    Conqueror: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786381381/k0rtr7rbyoimuvm0toxk.png',
    'Global Best': 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380917/hx3cptpzolxigapujqin.png',
    Ace: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380917/sgjg1bwq4m20gyq60okq.png',
} as const;

const SQUAD_BADGES = {
    'Gen XI': 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/v2oomsnv2cb720pijvrw.png',
    Galacticos: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380916/hjih4glyecynmxxmvr6h.png',
    'Golden Eleven': 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/dwbweupxgs1fjkla3hzb.png',
    Wildcards: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/e95rg0zppnficltnhhvf.png',
    Generals: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380919/h5byjrvrdsrtxpauyowl.png',
    Cadets: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/oqweb7wxxqzgwpdkhuw1.png',
    Academy: 'https://res.cloudinary.com/ctr-cloud/image/upload/v1786380918/hiew6m38ulz49klmrsxd.png',
} as const;

type PlayerRank = keyof typeof PLAYER_BADGES;
type SquadRank = keyof typeof SQUAD_BADGES;

type AvatarLib = 'critters' | 'voxel-bot' | 'notionists-neutral' | 'clay' | 'adventurer-neutral';

function buildAvatarUrl(lib: AvatarLib, seed: string): string {
    return `https://api.dicebear.com/10.x/${lib}/svg?seed=${encodeURIComponent(seed)}`;
}

interface MockSeed {
    id: string;
    username: string;
    avatarLib: AvatarLib;
    avatarSeed: string;
    matchType: MockMatchType;
    coopSub?: '2 vs AI' | '3 vs 3';
    tournamentSize?: 4 | 8;
    squadRank: SquadRank;
    playerRank: PlayerRank;
    vibe: number;
    isStaff?: boolean;
    isVerified?: boolean;
}

const SEEDS: MockSeed[] = [
    // ── African / Kenyan flavor ─────────────────────────
    { id: 'mock-1', username: 'Simba254', avatarLib: 'critters', avatarSeed: 'Kenya-07', matchType: '1v1', squadRank: 'Wildcards', playerRank: 'Conqueror', vibe: 78, isVerified: true },
    { id: 'mock-2', username: 'Jamaa_YukoKadi', avatarLib: 'voxel-bot', avatarSeed: 'Nai-42', matchType: '1v1', squadRank: 'Generals', playerRank: 'Global Best', vibe: 62 },
    { id: 'mock-3', username: 'Msee_Wa_Goals', avatarLib: 'notionists-neutral', avatarSeed: 'Goals-11', matchType: 'Tournament', tournamentSize: 8, squadRank: 'Galacticos', playerRank: 'Ace', vibe: 91, isStaff: true },
    { id: 'mock-4', username: 'WanjikukE', avatarLib: 'clay', avatarSeed: 'Wan-08', matchType: 'Co-op', coopSub: '3 vs 3', squadRank: 'Golden Eleven', playerRank: 'Conqueror', vibe: 84, isVerified: true },
    { id: 'mock-5', username: 'KofiGhana', avatarLib: 'adventurer-neutral', avatarSeed: 'Kofi-19', matchType: '1v1', squadRank: 'Cadets', playerRank: 'Grinder', vibe: 55 },
    { id: 'mock-6', username: 'Zola_Mzansi', avatarLib: 'critters', avatarSeed: 'Zola-33', matchType: 'Tournament', tournamentSize: 4, squadRank: 'Gen XI', playerRank: 'Global Best', vibe: 96 },

    // ── West African ────────────────────────────────────
    { id: 'mock-7', username: 'Odogwu_Striker', avatarLib: 'voxel-bot', avatarSeed: 'Odo-71', matchType: '1v1', squadRank: 'Wildcards', playerRank: 'Tepid', vibe: 42 },
    { id: 'mock-8', username: 'Chinedu9ja', avatarLib: 'notionists-neutral', avatarSeed: 'Chi-52', matchType: 'Co-op', coopSub: '2 vs AI', squadRank: 'Generals', playerRank: 'Conqueror', vibe: 71 },
    { id: 'mock-9', username: 'TundeBaller', avatarLib: 'clay', avatarSeed: 'Tun-14', matchType: '1v1', squadRank: 'Galacticos', playerRank: 'Ace', vibe: 88, isVerified: true },

    // ── Middle East / North Africa ──────────────────────
    { id: 'mock-10', username: 'Yusuf_Istanbul', avatarLib: 'adventurer-neutral', avatarSeed: 'Yus-Ist-09', matchType: 'Tournament', tournamentSize: 8, squadRank: 'Golden Eleven', playerRank: 'Conqueror', vibe: 76 },
    { id: 'mock-11', username: 'YoussefCairo', avatarLib: 'critters', avatarSeed: 'Cairo-84', matchType: '1v1', squadRank: 'Cadets', playerRank: 'Grinder', vibe: 48 },
    { id: 'mock-12', username: 'TariqMorocco', avatarLib: 'voxel-bot', avatarSeed: 'Tar-27', matchType: 'Co-op', coopSub: '3 vs 3', squadRank: 'Wildcards', playerRank: 'Global Best', vibe: 82 },

    // ── Asia ────────────────────────────────────────────
    { id: 'mock-13', username: 'Kenji_Osaka', avatarLib: 'notionists-neutral', avatarSeed: 'Osaka-11', matchType: '1v1', squadRank: 'Gen XI', playerRank: 'Ace', vibe: 94, isStaff: true },
    { id: 'mock-14', username: 'Min-Jun_Seoul', avatarLib: 'clay', avatarSeed: 'Seoul-63', matchType: 'Tournament', tournamentSize: 4, squadRank: 'Galacticos', playerRank: 'Conqueror', vibe: 79 },
    { id: 'mock-15', username: 'ArjunMumbai', avatarLib: 'adventurer-neutral', avatarSeed: 'Mum-45', matchType: '1v1', squadRank: 'Cadets', playerRank: 'Tepid', vibe: 37 },

    // ── Europe ──────────────────────────────────────────
    { id: 'mock-16', username: 'Diego_Sevilla', avatarLib: 'critters', avatarSeed: 'Sev-72', matchType: 'Co-op', coopSub: '2 vs AI', squadRank: 'Generals', playerRank: 'Grinder', vibe: 66 },
    { id: 'mock-17', username: 'LucaNapoli', avatarLib: 'voxel-bot', avatarSeed: 'Nap-38', matchType: '1v1', squadRank: 'Golden Eleven', playerRank: 'Global Best', vibe: 89 },
    { id: 'mock-18', username: 'MateoBuenos', avatarLib: 'notionists-neutral', avatarSeed: 'Bue-56', matchType: 'Tournament', tournamentSize: 8, squadRank: 'Wildcards', playerRank: 'Ace', vibe: 74, isVerified: true },

    // ── Wildcards ───────────────────────────────────────
    { id: 'mock-19', username: 'DmitriKiev', avatarLib: 'clay', avatarSeed: 'Kiev-89', matchType: '1v1', squadRank: 'Cadets', playerRank: 'Conqueror', vibe: 58 },
    { id: 'mock-20', username: 'NikoAthens', avatarLib: 'adventurer-neutral', avatarSeed: 'Ath-22', matchType: 'Co-op', coopSub: '3 vs 3', squadRank: 'Generals', playerRank: 'Grinder', vibe: 63 },
    { id: 'mock-21', username: 'SiphoJoburg', avatarLib: 'critters', avatarSeed: 'Job-91', matchType: '1v1', squadRank: 'Galacticos', playerRank: 'Global Best', vibe: 87 },
    { id: 'mock-22', username: 'KwameAccra', avatarLib: 'voxel-bot', avatarSeed: 'Acc-15', matchType: 'Tournament', tournamentSize: 4, squadRank: 'Golden Eleven', playerRank: 'Ace', vibe: 92 },
    { id: 'mock-23', username: 'Bao_Hanoi', avatarLib: 'notionists-neutral', avatarSeed: 'Han-68', matchType: '1v1', squadRank: 'Wildcards', playerRank: 'Tepid', vibe: 44 },
    { id: 'mock-24', username: 'Omar_Casa', avatarLib: 'clay', avatarSeed: 'Casa-04', matchType: 'Co-op', coopSub: '2 vs AI', squadRank: 'Cadets', playerRank: 'Grinder', vibe: 61 },
    { id: 'mock-25', username: 'Ali_Baghdad', avatarLib: 'adventurer-neutral', avatarSeed: 'Bag-37', matchType: '1v1', squadRank: 'Gen XI', playerRank: 'Conqueror', vibe: 83 },
    { id: 'mock-26', username: 'Petar_Zagreb', avatarLib: 'critters', avatarSeed: 'Zag-49', matchType: 'Tournament', tournamentSize: 8, squadRank: 'Generals', playerRank: 'Global Best', vibe: 77 },
    { id: 'mock-27', username: 'ErikOslo', avatarLib: 'voxel-bot', avatarSeed: 'Oslo-81', matchType: '1v1', squadRank: 'Golden Eleven', playerRank: 'Ace', vibe: 90 },
    { id: 'mock-28', username: 'Otis_Lagos', avatarLib: 'notionists-neutral', avatarSeed: 'Lag-26', matchType: 'Co-op', coopSub: '3 vs 3', squadRank: 'Wildcards', playerRank: 'Grinder', vibe: 68 },
    { id: 'mock-29', username: 'Musa_Dar', avatarLib: 'clay', avatarSeed: 'Dar-57', matchType: '1v1', squadRank: 'Cadets', playerRank: 'Tepid', vibe: 39 },
    { id: 'mock-30', username: 'Femi_Abuja', avatarLib: 'adventurer-neutral', avatarSeed: 'Abu-12', matchType: 'Tournament', tournamentSize: 4, squadRank: 'Galacticos', playerRank: 'Conqueror', vibe: 85, isVerified: true },

    // ── Additional pool — keeps rotation from ever running out mid-session ──
    { id: 'mock-31', username: 'Rui_Lisbon', avatarLib: 'critters', avatarSeed: 'Lis-77', matchType: '1v1', squadRank: 'Wildcards', playerRank: 'Ace', vibe: 81 },
    { id: 'mock-32', username: 'Hugo_Marseille', avatarLib: 'voxel-bot', avatarSeed: 'Mar-93', matchType: '1v1', squadRank: 'Cadets', playerRank: 'Conqueror', vibe: 46 },
    { id: 'mock-33', username: 'Ingrid_Stockholm', avatarLib: 'notionists-neutral', avatarSeed: 'Sto-18', matchType: 'Co-op', coopSub: '2 vs AI', squadRank: 'Generals', playerRank: 'Grinder', vibe: 72 },
    { id: 'mock-34', username: 'MarekWarsaw', avatarLib: 'clay', avatarSeed: 'War-62', matchType: 'Co-op', coopSub: '3 vs 3', squadRank: 'Golden Eleven', playerRank: 'Global Best', vibe: 86 },
    { id: 'mock-35', username: 'Tomas_Prague', avatarLib: 'adventurer-neutral', avatarSeed: 'Pra-44', matchType: 'Tournament', tournamentSize: 8, squadRank: 'Galacticos', playerRank: 'Conqueror', vibe: 79 },
    { id: 'mock-36', username: 'SofiBelgrade', avatarLib: 'critters', avatarSeed: 'Bel-28', matchType: 'Tournament', tournamentSize: 4, squadRank: 'Wildcards', playerRank: 'Ace', vibe: 88, isVerified: true },
    { id: 'mock-37', username: 'Amirubai', avatarLib: 'voxel-bot', avatarSeed: 'Dub-51', matchType: 'Co-op', coopSub: '2 vs AI', squadRank: 'Cadets', playerRank: 'Tepid', vibe: 51 },
    { id: 'mock-38', username: 'FaridJeddah', avatarLib: 'notionists-neutral', avatarSeed: 'Jed-05', matchType: 'Co-op', coopSub: '3 vs 3', squadRank: 'Gen XI', playerRank: 'Conqueror', vibe: 83, isStaff: true },
    { id: 'mock-39', username: 'Lin_Singapore', avatarLib: 'clay', avatarSeed: 'Sin-70', matchType: 'Tournament', tournamentSize: 8, squadRank: 'Golden Eleven', playerRank: 'Global Best', vibe: 91 },
    { id: 'mock-40', username: 'HiroNagoya', avatarLib: 'adventurer-neutral', avatarSeed: 'Nag-39', matchType: 'Tournament', tournamentSize: 4, squadRank: 'Generals', playerRank: 'Ace', vibe: 78 },
    { id: 'mock-41', username: 'Rafa_Porto', avatarLib: 'critters', avatarSeed: 'Por-16', matchType: '1v1', squadRank: 'Wildcards', playerRank: 'Grinder', vibe: 64 },
    { id: 'mock-42', username: 'Boris_Minsk', avatarLib: 'voxel-bot', avatarSeed: 'Min-24', matchType: '1v1', squadRank: 'Cadets', playerRank: 'Conqueror', vibe: 53, isVerified: true },
];

export const MOCK_USERS: MockUser[] = SEEDS.map((s) => ({
    ...s,
    avatarUrl: buildAvatarUrl(s.avatarLib, s.avatarSeed),
    squadRankBadge: SQUAD_BADGES[s.squadRank],
    playerRankBadge: PLAYER_BADGES[s.playerRank],
}));

export function getMocksForType(type: MockMatchType): MockUser[] {
    return MOCK_USERS.filter((u) => u.matchType === type);
}