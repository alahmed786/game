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
 * ✅ FIX: Matched exactly to your DB schema (message, details, user_id).
 */
export const logError = async (message: string, stack?: string, userId?: string) => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return;

    try {
        await supabase.from('error_logs').insert({
            message: message,
            details: stack || 'No stack trace provided',
            user_id: userId || 'anonymous'
        });
    } catch (e) {
        // Silent fail to avoid infinite loop of logging errors about logging errors
    }
};

/**
 * Fetches the top players by balance for the leaderboard.
 * ✅ FIX: Spread `gamestate` FIRST so authoritative DB columns overwrite stale JSON data.
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
        ...row.gamestate, // Spread this first!
        telegramId: row.telegramid,
        username: row.username,
        balance: row.balance,
        level: row.level,
        stars: row.stars,
        referralCount: row.referralcount,
        photoUrl: row.gamestate?.photoUrl || row.photourl || null
    }));
};

/**
 * Fetches ALL players (Admin Use Only)
 * ✅ FIX: Spread `gamestate` FIRST here as well.
 */
export const fetchAllPlayersAdmin = async () => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return [];

    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('balance', { ascending: false });

    if (error) return [];

    return data.map((row: any) => ({
        ...row.gamestate, // Spread this first!
        telegramId: row.telegramid,
        username: row.username,
        balance: row.balance,
        level: row.level,
        stars: row.stars,
        referralCount: row.referralcount,
        invitedBy: row.invitedby,
        isBanned: row.isbanned, 
        photoUrl: row.gamestate?.photoUrl || row.photourl || null,
        withdrawalHistory: row.gamestate?.withdrawalHistory || []
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

/**
 * Save Game Settings
 * Scrubs 'undefined' properties which cause Postgres JSONB to fail silently.
 */
export const saveGameSettings = async (settings: any) => {
    if (url === 'https://placeholder.supabase.co' || isPlaceholder) return false;

    try {
        const cleanSettings = JSON.parse(JSON.stringify(settings));
        
        const { error } = await supabase
            .from('game_settings')
            .upsert({ 
                id: 'global', 
                settings: cleanSettings,
                lastupdated: new Date().toISOString()
            }, { onConflict: 'id' }); 
        
        if (error) {
            console.error("❌ Database Save Error:", error.message);
            return false;
        }
        return true;
    } catch (err) {
        console.error("❌ Logic Save Error:", err);
        return false;
    }
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
