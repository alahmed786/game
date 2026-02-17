import { createClient } from '@supabase/supabase-js';

// Access environment variables safely.
// @ts-ignore
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("⚠️ Supabase environment variables are missing. Please check your .env file.");
}

// Create the client
export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co', 
    SUPABASE_ANON_KEY || 'placeholder-key'
);

/**
 * 1. Fetch Top 50 Players (Leaderboard)
 * maps lowercase DB columns (telegramid) to uppercase App types (telegramId)
 */
export const fetchLeaderboard = async () => {
    const { data, error } = await supabase
        .from('players')
        .select('telegramid, username, balance, level, stars, referralCount') // Select fields
        .order('balance', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }

    // ✅ IMPORTANT: Map lowercase DB keys to CamelCase for the UI
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
 * 2. Fetch User Rank
 * Calculates rank by counting how many people have more coins
 */
export const fetchUserRank = async (userBalance: number) => {
    const { count, error } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .gt('balance', userBalance);

    if (error) return 0;
    return (count || 0) + 1; // Rank is count + 1
};

/**
 * 3. Fetch Game Settings (Admin Config)
 */
export const fetchGameSettings = async () => {
    const { data, error } = await supabase
        .from('game_settings')
        .select('settings')
        .single();
    
    if (error) return null;
    return data.settings;
};

/**
 * 4. Process Referral
 * Updates the inviter's referral count and awards stars
 */
export const processReferral = async (referrerId: string, newUserId: string, rewardStars: number = 10) => {
    // Prevent self-referral
    if (referrerId === newUserId) return;

    // Check if referrer exists
    const { data: referrer, error } = await supabase
        .from('players')
        .select('telegramid, stars, referralCount')
        .eq('telegramid', referrerId)
        .single();

    if (error || !referrer) return;

    // Give rewards to referrer
    const newCount = (referrer.referralCount || 0) + 1;
    const newStars = (referrer.stars || 0) + rewardStars;

    await supabase
        .from('players')
        .update({ 
            referralCount: newCount,
            stars: newStars 
        })
        .eq('telegramid', referrerId);
};

/**
 * 5. Log Errors
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
