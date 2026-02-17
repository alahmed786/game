/**
 * 1. Fetch Leaderboard
 * Fixed: Maps lowercase database columns to CamelCase for the App
 */
export const fetchLeaderboard = async () => {
    // 1. Select ALL columns ('*') to avoid missing column errors
    const { data, error } = await supabase
        .from('players')
        .select('*') 
        .order('balance', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Leaderboard Error:", error.message);
        return [];
    }

    // 2. MAP the data (Crucial Step)
    // Left side: What the App expects (CamelCase)
    // Right side: What the Database has (lowercase)
    return data.map((p: any) => ({
        telegramId: p.telegramid,       // ✅ Map lowercase 'telegramid'
        username: p.username || 'Unknown',
        balance: p.balance,
        level: p.level,
        stars: p.stars,
        referralCount: p.referralcount  // ✅ Map lowercase 'referralcount'
    }));
};
