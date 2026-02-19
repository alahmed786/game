
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely.
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

const isMissing = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Fallback to prevent crash if keys are missing.
const url = isMissing ? 'https://placeholder.supabase.co' : SUPABASE_URL;
const key = isMissing ? 'placeholder-key' : SUPABASE_ANON_KEY;

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
        // Silently catch errors in the logging utility itself
    }
};
