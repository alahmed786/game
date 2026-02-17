
import { createClient } from '@supabase/supabase-js';
import { Player } from '../types';

// Access environment variables safely.
// @ts-ignore
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("⚠️ Supabase environment variables are missing. Please check your .env file. The app will run in offline/demo mode.");
}

// Fallback to prevent crash if keys are missing.
// Using a placeholder URL ensures createClient doesn't throw "supabaseUrl is required".
const url = SUPABASE_URL || 'https://placeholder.supabase.co';
const key = SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(url, key);

/**
 * Logs application errors to the Supabase 'error_logs' table.
 * This allows the admin to view client-side crashes and issues.
 */
export const logError = async (message: string, stack?: string, userId?: string) => {
    // Prevent logging if using placeholder credentials to avoid console noise
    if (url === 'https://placeholder.supabase.co') {
        return;
    }

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
 * Fetches the top 50 players by balance for the leaderboard.
 * Returns an array of Player objects (partial).
 */
export const fetchLeaderboard = async () => {
    if (url === 'https://placeholder.supabase.co') return [];
    
    const { data, error } = await supabase
        .from('players')
        .select('username, balance, level, photoUrl, telegramId, stars, referralCount')
        .order('balance', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
    return data;
};

/**
 * Handles referral logic: Increments the referrer's count and rewards them.
 * This should ideally be a Postgres RPC function for atomicity, but implemented here for simplicity.
 * 
 * @param referrerId - The Telegram ID of the person who invited the user
 * @param newPlayerId - The Telegram ID of the new user
 * @param rewardStars - Amount of stars to reward the referrer
 */
export const processReferral = async (referrerId: string, newPlayerId: string, rewardStars: number) => {
    if (url === 'https://placeholder.supabase.co') return;

    try {
        // 1. Check if referrer exists
        const { data: referrer, error } = await supabase
            .from('players')
            .select('telegramId, referralCount, stars')
            .eq('telegramId', referrerId)
            .single();

        if (error || !referrer) return;

        // 2. Update Referrer stats
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
