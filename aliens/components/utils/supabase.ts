
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
        console.warn('Skipping error log upload due to missing credentials:', message);
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
