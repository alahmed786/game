import { createClient } from '@supabase/supabase-js';

// Access environment variables safely.
// @ts-ignore
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("⚠️ Supabase environment variables are missing.");
}

// ✅ FIXED: Exporting 'supabase' so Tasks.tsx can use it
export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co', 
    SUPABASE_ANON_KEY || 'placeholder-key'
);

/**
 * 1. Fetch Leaderboard
 * Fixed: Selects '*' to avoid column name errors.
 * Fixed: Maps lowercase 'referralcount' from DB.
 */
export const fetchLeaderboard = async () => {
    const { data, error } = await supabase
        .from('players')
        .select('*') // ✅ Select ALL columns to prevent "column not found" errors
        .order('balance', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Leaderboard Fetch Error:", error.message);
        return [];
    }

    return data.map((p: any) => ({
        telegramId: p.telegramid,       // ✅ Map lowercase DB -> CamelCase App
        username: p.username || 'Unknown',
        balance: p.balance,
        level: p.level,
        stars: p.stars,
        referralCount: p.referralcount  // ✅ Map lowercase DB 'referralcount'
    }));
};

/**
 * 2. Fetch All Players (For Admin Panel)
 */
export const fetchAllPlayersAdmin = async () => {
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('balance', { ascending: false });

    if (error) return [];

    return data.map((p: any) => ({
        telegramId: p.telegramid,
        username: p.username,
        balance: p.balance,
        level: p.level,
        stars: p.stars,
        referralCount: p.referralcount,
        ...p.gamestate
    }));
};

/**
 * 3. Fetch User Rank
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
 * 4. Save Game Settings
 */
export const saveGameSettings = async (settings: any) => {
    const { error } = await supabase
        .from('game_settings')
        .upsert({ 
            id: 'global_config', 
            settings: settings,
            lastupdated: new Date().toISOString()
        });
    return !error;
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
        .select('telegramid, stars, referralcount')
        .eq('telegramid', referrerId)
        .single();

    if (error || !referrer) return;

    await supabase
        .from('players')
        .update({ 
            referralcount: (referrer.referralcount || 0) + 1, // ✅ Use lowercase 'referralcount'
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
    } catch (e) { console.error(e); }
};
