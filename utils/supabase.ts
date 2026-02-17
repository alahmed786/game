
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely.
// @ts-ignore
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("⚠️ Supabase environment variables are missing. Please check your .env file. The app will run in offline/demo mode.");
}

// Fallback to prevent crash if keys are missing.
const url = SUPABASE_URL || 'https://placeholder.supabase.co';
const key = SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(url, key);

/**
 * Logs application errors to the Supabase 'error_logs' table.
 */
export const logError = async (message: string, stack?: string, userId?: string) => {
    if (url === 'https://placeholder.supabase.co') return;

    try {
        await supabase.from('error_logs').insert({
            message,
            stack: stack || '',
            user_id: userId || 'anonymous',
            timestamp: new Date().toISOString(),
            platform: navigator.userAgent
        });
    } catch (e) {
        console.error("Failed to upload error log to Supabase", e);
    }
};

/**
 * Fetches the top players by balance for the leaderboard.
 */
export const fetchLeaderboard = async () => {
    if (url === 'https://placeholder.supabase.co') return [];
    
    const { data, error } = await supabase
        .from('players')
        .select('username, balance, level, photoUrl, telegramId, stars, referralCount')
        .order('balance', { ascending: false })
        .limit(50); // Fetch top 50

    if (error) {
        console.warn("Error fetching leaderboard:", error.message);
        return [];
    }
    return data;
};

/**
 * Fetches ALL players (Admin Use Only)
 */
export const fetchAllPlayersAdmin = async () => {
    if (url === 'https://placeholder.supabase.co') return [];

    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('balance', { ascending: false });

    if (error) {
        console.error("Admin fetch error:", error);
        return [];
    }
    return data;
}

/**
 * Global Game Settings (Admin Config, Tasks, Deals)
 */
export const fetchGameSettings = async () => {
    if (url === 'https://placeholder.supabase.co') return null;

    const { data, error } = await supabase
        .from('game_settings')
        .select('settings')
        .eq('id', 'global')
        .maybeSingle();

    if (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
    return data?.settings || null;
};

export const saveGameSettings = async (settings: any) => {
    if (url === 'https://placeholder.supabase.co') return;

    const { error } = await supabase
        .from('game_settings')
        .upsert({
            id: 'global',
            settings: settings,
            lastUpdated: new Date().toISOString()
        });

    if (error) console.error("Error saving global settings:", error);
};

/**
 * Fetches the specific rank of a user based on their balance.
 */
export const fetchUserRank = async (balance: number) => {
    if (url === 'https://placeholder.supabase.co') return 999;
    
    const { count, error } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .gt('balance', balance);

    if (error) {
        console.warn("Error fetching rank:", error.message);
        return 999;
    }
    
    return (count || 0) + 1;
};

/**
 * Handles referral logic
 */
export const processReferral = async (referrerId: string, newPlayerId: string, rewardStars: number) => {
    if (url === 'https://placeholder.supabase.co') return;

    try {
        const { data: referrer, error } = await supabase
            .from('players')
            .select('telegramId, referralCount, stars')
            .eq('telegramId', referrerId)
            .maybeSingle();

        if (error || !referrer) return;

        const newCount = (referrer.referralCount || 0) + 1;
        const newStars = (referrer.stars || 0) + rewardStars;

        await supabase
            .from('players')
            .update({ 
                referralCount: newCount,
                stars: newStars
            })
            .eq('telegramId', referrerId);
            
    } catch (e) {
        console.error("Referral processing error:", e);
    }
};
