import { createClient } from '@supabase/supabase-js';

// Access environment variables safely.
// @ts-ignore
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("⚠️ Supabase environment variables are missing.");
}

export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co', 
    SUPABASE_ANON_KEY || 'placeholder-key'
);

/**
 * 1. Fetch All Players for Admin
 */
export const fetchAllPlayersAdmin = async () => {
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('balance', { ascending: false });

    if (error) {
        console.error("Error fetching all players:", error);
        return [];
    }
    // Map DB lowercase to CamelCase for App
    return data.map((p: any) => ({
        telegramId: p.telegramid,
        username: p.username,
        balance: p.balance,
        level: p.level,
        stars: p.stars,
        referralCount: p.referralCount,
        ...p.gamestate
    }));
};

/**
 * 2. Save Game Settings (Admin Config)
 */
export const saveGameSettings = async (settings: any) => {
    const { error } = await supabase
        .from('game_settings')
        .upsert({ 
            id: 'global_config', 
            settings: settings,
            lastupdated: new Date().toISOString()
        });

    if (error) {
        console.error("Error saving game settings:", error);
        return false;
    }
    return true;
};

/**
 * 3. Fetch Leaderboard
 */
export const fetchLeaderboard = async () => {
    const { data, error } = await supabase
        .from('players')
        .select('telegramid, username, balance, level, stars, referralCount')
        .order('balance', { ascending: false })
        .limit(50);

    if (error) return [];
    return data.map((p: any) => ({
        telegramId: p.telegramid,
        username: p.username || 'Unknown',
        balance: p.balance,
        level: p.level,
        stars: p.stars,
        referralCount: p.referralCount
    }));
};

/**
 * 4. Fetch User Rank
 */
export const fetchUserRank = async (userBalance: number) => {
    const { count, error } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .gt('balance', userBalance);

    if (error) return 0;
    return (count || 0) + 1;
};

/**
 * 5. Fetch Game Settings
 */
export const fetchGameSettings = async () => {
    const { data, error } = await supabase
        .from('game_settings')
        .select('settings')
        .eq('id', 'global_config')
        .maybeSingle();
    
    if (error) return null;
    return data?.settings || null;
};

/**
 * 6. Process Referral
 */
export const processReferral = async (referrerId: string, newUserId: string, rewardStars: number = 10) => {
    if (referrerId === newUserId) return;
    const { data: referrer, error } = await supabase
        .from('players')
        .select('telegramid, stars, referralCount')
        .eq('telegramid', referrerId)
        .single();

    if (error || !referrer) return;
    await supabase
        .from('players')
        .update({ 
            referralCount: (referrer.referralCount || 0) + 1,
            stars: (referrer.stars || 0) + rewardStars 
        })
        .eq('telegramid', referrerId);
};

/**
 * 7. Log Errors
 */
export const logError = async (message: string, stack?: string, userId?: string) => {
    if (SUPABASE_URL === 'https://placeholder.supabase.co') return;
    try {
        await supabase.from('error_logs').insert({
            message,
            details: stack || '',
            user_id: userId || 'anonymous',
            created_at: new Date().toISOString()
        });
    } catch (e) {
        console.error("Failed to upload error log", e);
    }
};
