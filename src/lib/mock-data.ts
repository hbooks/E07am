/** Mock data for CTR — Claim The Room. Replace with backend calls later. */

export type RankBadge = {
  label: string;
  tier: "gold" | "silver" | "bronze";
};

export type Player = {
  id: string;
  username: string;
  avatarHue: number; // used to generate a deterministic avatar background
  initials: string;
  rank: RankBadge;
  squadStrength: number;
  playerRank: string;
};

export const CURRENT_USER: Player = {
  id: "you",
  username: "YouAreGoat",
  avatarHue: 210,
  initials: "YG",
  rank: { label: "Gold 1", tier: "gold" },
  squadStrength: 3120,
  playerRank: "Division 3",
};

const NEON_STRIKER: Player = {
  id: "p1",
  username: "NeonStriker",
  avatarHue: 262,
  initials: "NS",
  rank: { label: "Gold 2", tier: "gold" },
  squadStrength: 2985,
  playerRank: "Division 2",
};

const MADIBAX: Player = {
  id: "p2",
  username: "Madibax",
  avatarHue: 150,
  initials: "MX",
  rank: { label: "Silver 1", tier: "silver" },
  squadStrength: 2740,
  playerRank: "Division 4",
};

const KIP_TIKITAKA: Player = {
  id: "p3",
  username: "KipTikitaka",
  avatarHue: 24,
  initials: "KT",
  rank: { label: "Bronze 3", tier: "bronze" },
  squadStrength: 2210,
  playerRank: "Division 6",
};

const GHOST_WINGER: Player = {
  id: "p4",
  username: "GhostWinger_07",
  avatarHue: 340,
  initials: "GW",
  rank: { label: "Gold 1", tier: "gold" },
  squadStrength: 3075,
  playerRank: "Division 3",
};

const LOW_BLOCK: Player = {
  id: "p5",
  username: "LowBlockLegend",
  avatarHue: 96,
  initials: "LL",
  rank: { label: "Silver 2", tier: "silver" },
  squadStrength: 2560,
  playerRank: "Division 5",
};

const CHIP_SHOT: Player = {
  id: "p6",
  username: "ChipShotChulo",
  avatarHue: 190,
  initials: "CC",
  rank: { label: "Bronze 1", tier: "bronze" },
  squadStrength: 2380,
  playerRank: "Division 6",
};

export const PLAYERS: Player[] = [
  NEON_STRIKER,
  MADIBAX,
  KIP_TIKITAKA,
  GHOST_WINGER,
  LOW_BLOCK,
  CHIP_SHOT,
];

export type MatchRequest = {
  id: string;
  host: Player;
  matchType: "1v1" | "Co-op";
  roomNumber: string;
  password: string | null;
  postedAgo: string;
};

export const MATCH_REQUESTS: MatchRequest[] = [
  {
    id: "m1",
    host: NEON_STRIKER,
    matchType: "1v1",
    roomNumber: "7K2M4X",
    password: "derby24",
    postedAgo: "2 min ago",
  },
  {
    id: "m2",
    host: MADIBAX,
    matchType: "Co-op",
    roomNumber: "B9QW31",
    password: null,
    postedAgo: "9 min ago",
  },
  {
    id: "m3",
    host: GHOST_WINGER,
    matchType: "1v1",
    roomNumber: "ZX88PL",
    password: "nolag",
    postedAgo: "14 min ago",
  },
  {
    id: "m4",
    host: LOW_BLOCK,
    matchType: "Co-op",
    roomNumber: "C4T7R2",
    password: "presshigh",
    postedAgo: "26 min ago",
  },
  {
    id: "m5",
    host: CURRENT_USER,
    matchType: "1v1",
    roomNumber: "GG55XD",
    password: null,
    postedAgo: "41 min ago",
  },
  {
    id: "m6",
    host: CHIP_SHOT,
    matchType: "1v1",
    roomNumber: "M2V8KQ",
    password: "elclasico",
    postedAgo: "1 hr ago",
  },
];

export type Notification = {
  id: string;
  title: string;
  detail: string;
  timeAgo: string;
  unread: boolean;
  kind: "claim" | "follow" | "admin" | "match";
};

export const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Your room was claimed",
    detail: "NeonStriker claimed your 1v1 room GG55XD. Good luck!",
    timeAgo: "3 min ago",
    unread: true,
    kind: "claim",
  },
  {
    id: "n2",
    title: "New follower",
    detail: "Madibax started following you.",
    timeAgo: "18 min ago",
    unread: true,
    kind: "follow",
  },
  {
    id: "n3",
    title: "Admin update",
    detail: "Season 2 ranked window opens this Friday at 6 PM EAT.",
    timeAgo: "1 hr ago",
    unread: true,
    kind: "admin",
  },
  {
    id: "n4",
    title: "Match result synced",
    detail: "Your 2-1 win vs GhostWinger_07 was recorded.",
    timeAgo: "Yesterday",
    unread: false,
    kind: "match",
  },
  {
    id: "n5",
    title: "Room expired",
    detail: "Your co-op room C4T7R2 closed after 30 minutes with no claim.",
    timeAgo: "Yesterday",
    unread: false,
    kind: "claim",
  },
];

export type ChatMessage = {
  id: string;
  text: string;
  timeAgo: string;
};

export const ADMIN_MESSAGES: ChatMessage[] = [
  {
    id: "a1",
    text: "Welcome to CTR Season 2! Rooms now expire after 30 minutes, so claim fast.",
    timeAgo: "Mon 10:04",
  },
  {
    id: "a2",
    text: "Weekend tournament sign-ups open Friday 6 PM EAT. Top 8 get the gold banner badge.",
    timeAgo: "Mon 10:06",
  },
  {
    id: "a3",
    text: "Reminder: sharing room passwords outside the app gets your account flagged. Keep claims in-app.",
    timeAgo: "Tue 09:31",
  },
  {
    id: "a4",
    text: "We patched the duplicate-claim bug. If a room shows as taken, refresh your feed.",
    timeAgo: "Wed 14:52",
  },
];

export const GAME_MESSAGES: ChatMessage[] = [
  {
    id: "g1",
    text: "eFootball v4.2.0 is live — new 'Sharp Touch' dribbling mechanic and improved goalkeeper AI.",
    timeAgo: "Mon 08:00",
  },
  {
    id: "g2",
    text: "Featured Epic: R. Lewandowski and B. Saka headline this week's Epic Player pack.",
    timeAgo: "Tue 08:00",
  },
  {
    id: "g3",
    text: "Co-op event 'Dream Duo' runs all weekend. Win 3 co-op matches for 300 GP.",
    timeAgo: "Wed 08:00",
  },
  {
    id: "g4",
    text: "Maintenance notice: servers down Thursday 02:00–04:00 UTC for matchmaking improvements.",
    timeAgo: "Wed 20:15",
  },
];

export type CommunityPost = {
  id: string;
  author: Player;
  text: string;
  timeAgo: string;
  likes: number;
  comments: { id: string; author: Player; text: string; timeAgo: string }[];
};

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "c1",
    author: NEON_STRIKER,
    text: "Anyone else getting input delay in co-op since the patch? @adminFixBugs it's almost unplayable on 60ms ping.",
    timeAgo: "25 min ago",
    likes: 14,
    comments: [
      {
        id: "c1r1",
        author: MADIBAX,
        text: "Same here, feels like half a second behind.",
        timeAgo: "12 min ago",
      },
      {
        id: "c1r2",
        author: GHOST_WINGER,
        text: "Switch to wired if you can, helped me a lot.",
        timeAgo: "5 min ago",
      },
    ],
  },
  {
    id: "c2",
    author: GHOST_WINGER,
    text: "Best counter to low block + long ball spammers? My win rate against them is embarrassing.",
    timeAgo: "1 hr ago",
    likes: 9,
    comments: [
      {
        id: "c2r1",
        author: LOW_BLOCK,
        text: "Possession playstyle with two DMs. Starve them of the ball.",
        timeAgo: "40 min ago",
      },
    ],
  },
  {
    id: "c3",
    author: CHIP_SHOT,
    text: "Just hit Gold 1 for the first time! 3120 squad strength and climbing. Who wants a friendly?",
    timeAgo: "3 hr ago",
    likes: 27,
    comments: [],
  },
];
