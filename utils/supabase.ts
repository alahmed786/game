
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely across different build environments.
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) 
  ? (import.meta as any).env 
  : (typeof process !== 'undefined' ? (process as any).env : {});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

// Detect if credentials are truly missing or still placeholders.
const isMissing = !SUPABASE_URL || !SUPABASE_ANON_KEY;
const isPlaceholder = SUPABASE_ANON_KEY?.includes('REPLACE_THIS') || SUPABASE_URL?.includes('placeholder');

if (isMissing || isPlaceholder) {
    console.info("ℹ️ System initialized in standard mode (Supabase credentials missing or placeholder). Offline features active.");
}

// Fallback to prevent crash if keys are missing.
const url = (isMissing || isPlaceholder) ? 'https://placeholder.supabase.co' : SUPABASE_URL;
const key = (isMissing || isPlaceholder) ? 'placeholder-key' : SUPABASE_ANON_KEY;

export const supabase = createClient(url, key);

/**
 * Logs application errors to the Supabase 'error_logs' table.
 */
export const logError = async (message: string, stack?: string, userId?: string) => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return;

    try {
        await supabase.from('error_logs').insert({
            message,
            stack: stack || '',
            user_id: userId || 'anonymous',
            timestamp: new Date().toISOString(),
            platform: navigator.userAgent
        });
    } catch (e) {
        // Silent fail to avoid infinite loop of logging errors about logging errors
    }
};

/**
 * Fetches the top players by balance for the leaderboard.
 * Mapped from lowercase DB columns to CamelCase App objects.
 */
export const fetchLeaderboard = async () => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return [];
    
    const { data, error } = await supabase
        .from('players')
        .select('*') 
        .order('balance', { ascending: false })
        .limit(50);

    if (error) return [];

    return data.map((row: any) => ({
        telegramId: row.telegramid,
        username: row.username,
        balance: row.balance,
        level: row.level,
        stars: row.stars,
        referralCount: row.referralcount,
        photoUrl: row.gamestate?.photoUrl || null,
        ...row.gamestate 
    }));
};

/**
 * Fetches ALL players (Admin Use Only)
 */
export const fetchAllPlayersAdmin = async () => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return [];

    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('balance', { ascending: false });

    if (error) return [];

    return data.map((row: any) => ({
        telegramId: row.telegramid,
        username: row.username,
        balance: row.balance,
        level: row.level,
        stars: row.stars,
        referralCount: row.referralcount,
        invitedBy: row.invitedby,
        isBanned: row.isbanned, 
        photoUrl: row.gamestate?.photoUrl || null,
        withdrawalHistory: row.gamestate?.withdrawalHistory || [],
        ...row.gamestate
    }));
}

/**
 * Global Game Settings (Admin Config, Tasks, Deals)
 */
export const fetchGameSettings = async () => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return null;

    const { data, error } = await supabase
        .from('game_settings')
        .select('settings')
        .eq('id', 'global')
        .maybeSingle();

    if (error) return null;
    return data?.settings || null;
};

export const saveGameSettings = async (settings: any) => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return;

    await supabase
        .from('game_settings')
        .upsert({
            id: 'global',
            settings: settings,
            lastUpdated: new Date().toISOString()
        });
};

/**
 * Fetches the specific rank of a user based on their balance.
 */
export const fetchUserRank = async (balance: number) => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return 999;
    
    const { count, error } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .gt('balance', balance);

    if (error) return 999;
    
    return (count || 0) + 1;
};

/**
 * Handles referral logic.
 */
export const processReferral = async (referrerId: string, newPlayerId: string, rewardStars: number) => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return;

    try {
        const { data: referrer, error } = await supabase
            .from('players')
            .select('telegramid, referralcount, stars')
            .eq('telegramid', referrerId)
            .maybeSingle();

        if (error || !referrer) return;

        const newCount = (referrer.referralcount || 0) + 1;
        const newStars = (referrer.stars || 0) + rewardStars;

        await supabase
            .from('players')
            .update({ 
                referralcount: newCount,
                stars: newStars
            })
            .eq('telegramid', referrerId);
            
    } catch (e) {
        console.error("Referral processing error:", e);
    }
};
