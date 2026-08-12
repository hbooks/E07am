export interface MatchWithHost {
    id: number;
    host_id: string;
    match_type: string;
    coop_sub: string | null;
    room_number: string;
    nopr: number;
    status: string;
    created_at: string;
    house: string;
    p_url: string;
    isv: boolean;
    iss: boolean;
    squad_rank: string | null;
    player_rank: string | null;
    r_url: string | null;
    pr_url: string | null;
    tc: number;
    claimant_ids: string[];
}