export type TourPage = '/' | '/profile' | '/news';
export type TourPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type TourInteraction = 'tap-anywhere' | 'click-target';

export interface TourStep {
    id: string;
    page: TourPage;
    target: string | null;
    title: string;
    body: string;
    position: TourPosition;
    interaction: TourInteraction;
    /** Special: 'farewell' renders the end-of-tour modal. */
    variant?: 'farewell';
}

export const FULL_TOUR: TourStep[] = [
    // ─────────────────────────────────────────────
    // Feed page: welcome + intro
    // ─────────────────────────────────────────────
    {
        id: 'welcome',
        page: '/',
        target: null,
        title: 'Welcome to Claim The Room',
        body: "Find an eFootball opponent in seconds. Here's a quick look at where everything lives. Tap anywhere to begin.",
        position: 'center',
        interaction: 'tap-anywhere',
    },
    {
        id: 'skip',
        page: '/',
        target: 'tour-skip',
        title: 'Skip anytime',
        body: 'Short on time? Tap Skip to jump straight in. Otherwise, tap anywhere to continue.',
        position: 'bottom',
        interaction: 'tap-anywhere',
    },
    {
        id: 'nav-feed',
        page: '/',
        target: 'nav-feed',
        title: 'The Feed',
        body: 'Every open room appears here the moment it goes live. This is your home base.',
        position: 'right',
        interaction: 'tap-anywhere',
    },
    {
        id: 'nav-create',
        page: '/',
        target: 'nav-create',
        title: 'Create a Room',
        body: 'Ready to host? Pick a mode, add your eFootball room code, and your room goes live on the feed.',
        position: 'right',
        interaction: 'tap-anywhere',
    },
    {
        id: 'feed-filters',
        page: '/',
        target: 'feed-filters',
        title: 'Filter by Mode',
        body: 'Switch between 1v1, Tournament and Co-op. Tap a pill, or swipe across them.',
        position: 'bottom',
        interaction: 'tap-anywhere',
    },
    {
        id: 'feed-refresh',
        page: '/',
        target: 'feed-refresh',
        title: 'Refresh',
        body: "Rooms expire after five minutes. Pull down or tap here to see what's live.",
        position: 'bottom',
        interaction: 'tap-anywhere',
    },
    {
        id: 'feed-cards',
        page: '/',
        target: 'feed-cards',
        title: 'Match Cards',
        body: 'Each card is a live room with its host, mode, open slots and a countdown. Tap Claim to get the room number and password instantly.',
        position: 'top',
        interaction: 'tap-anywhere',
    },
    {
        id: 'nav-profile',
        page: '/',
        target: 'nav-profile',
        title: 'Your Profile',
        body: 'Your squad, stats and ranks live here. Tap it to take a look.',
        position: 'right',
        interaction: 'click-target',
    },

    // ─────────────────────────────────────────────
    // Profile page
    // ─────────────────────────────────────────────
    {
        id: 'profile-hero',
        page: '/profile',
        target: 'profile-hero',
        title: 'Your Identity',
        body: 'This is your player card. Tap the pen to change your avatar. The two chips are your Squad Rank and Player Rank. Tap either to see every rank.',
        position: 'bottom',
        interaction: 'tap-anywhere',
    },
    {
        id: 'profile-stats',
        page: '/profile',
        target: 'profile-stats',
        title: 'Your Stats',
        body: 'Games is your total played. Troll goes up when you break community rules, so keep it low. Most Played shows your favorite mode. Tap any stat for your full match history.',
        position: 'top',
        interaction: 'tap-anywhere',
    },
    {
        id: 'profile-xp',
        page: '/profile',
        target: 'profile-xp',
        title: 'XP and Levels',
        body: 'Every recorded match earns XP. Fill the bar to level up.',
        position: 'top',
        interaction: 'tap-anywhere',
    },
    {
        id: 'profile-update-squad',
        page: '/profile',
        target: 'profile-update-squad',
        title: 'Verify Your Squad',
        body: 'Upload a screenshot of your best lineup to create or claim rooms. Use the in-game squad screen, uncropped and unedited. Once approved, you are ready to play.',
        position: 'bottom',
        interaction: 'tap-anywhere',
    },
    {
        id: 'profile-settings',
        page: '/profile',
        target: 'profile-settings',
        title: 'Settings',
        body: 'Music, notifications, privacy, legal info and support all live here.',
        position: 'top',
        interaction: 'tap-anywhere',
    },

    // ─────────────────────────────────────────────
    // News page
    // ─────────────────────────────────────────────
    {
        id: 'news-tabs',
        page: '/news',
        target: 'news-tabs',
        title: 'The News Hub',
        body: 'Admin Updates are official announcements from the team. Game Updates brings eFootball patch notes every Thursday after maintenance. Community is where players post, comment and like. Sign in to join in. The other two are open to everyone.',
        position: 'bottom',
        interaction: 'tap-anywhere',
    },

    // ─────────────────────────────────────────────
    // Farewell
    // ─────────────────────────────────────────────
    {
        id: 'farewell',
        page: '/',
        target: null,
        title: "You're all set",
        body: 'That\'s the tour. Head to the feed, pick a mode and claim your first room. Good luck out there.',
        position: 'center',
        interaction: 'tap-anywhere',
        variant: 'farewell',
    },
];

export const TOTAL_STEPS = FULL_TOUR.length;