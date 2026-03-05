import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Upgrade, View, FloatingText, Task, StellarDeal, ActiveBoost, Withdrawal, Theme, AdminConfig } from './types';
import { 
  INITIAL_UPGRADES, ENERGY_REGEN_RATE, INITIAL_DAILY_REWARDS, INITIAL_TASKS, INITIAL_STELLAR_DEALS, INITIAL_ADMIN_CONFIG,
  HOLD_TICK_RATE_MS, HOLD_ENERGY_DRAIN_PER_TICK, HOLD_EARN_MULTIPLIER, LEVEL_BALANCE_REQUIREMENTS,
  MAX_ENERGY, THEME_CONFIG, getLevelTheme, calculateLevelUpAdsReq, WITHDRAWAL_COOLDOWN_MS
} from './constants';
import EarnView from './views/Earn';
import UpgradesView from './views/Upgrades';
import LeaderboardView from './views/Leaderboard';
import Navigation from './components/Navigation';
import StatsHeader from './components/StatsHeader';
import WalletView from './views/Wallet';
import DailyRewardView from './views/DailyReward';
import DailyCipherView from './views/DailyCipher';
import TasksView from './views/Tasks';
import AdminView from './views/Admin';
import IntroScreen from './components/IntroScreen';
import { playStardustSound } from './utils/audio';
import { showAd } from './utils/ads';
import { supabase, fetchGameSettings } from './utils/supabase'; // REMOVED BROKEN FETCHERS

declare global {
  interface Window {
    Telegram: any;
  }
}

const ADMIN_ID = "702954043";

// --- Maintenance Screen Modal ---
const MaintenanceScreen: React.FC<{ endTime: number; onFinished: () => void; isDarkMode: boolean }> = ({ endTime, onFinished, isDarkMode }) => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) { clearInterval(timer); onFinished(); } 
      else {
        const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, onFinished]);

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center p-6 text-center ${isDarkMode ? 'bg-[#050B14] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mb-6 animate-bounce shadow-[0_0_30px_rgba(249,115,22,0.2)]"><span className="text-5xl">🚧</span></div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-widest mb-3">System Offline</h1>
        <p className={`text-sm mb-8 max-w-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Our engineers are currently upgrading the quantum mainframe. Access will be automatically restored when the timer concludes.</p>
        <div className="flex flex-col items-center">
            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 ${isDarkMode ? 'text-orange-500/70' : 'text-orange-600/70'}`}>Uplink Resumes In</span>
            <div className={`px-8 py-4 rounded-xl font-mono text-3xl font-black tracking-wider shadow-inner ${isDarkMode ? 'bg-black/50 border border-orange-500/30 text-orange-400' : 'bg-orange-50 border border-orange-200 text-orange-600'}`}>{timeLeft || "00:00:00"}</div>
        </div>
      </div>
    </div>
  );
};

// --- Premium Offline Earnings Modal ---
const OfflineEarningsModal: React.FC<{ amount: number; onClaim: () => void; isDarkMode: boolean }> = ({ amount, onClaim, isDarkMode }) => (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className={`relative w-full max-w-sm rounded-[2.5rem] p-1 text-center overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.2)] ${isDarkMode ? 'bg-gradient-to-b from-slate-800 to-slate-950' : 'bg-gradient-to-b from-slate-100 to-white'}`}>
            <div className={`relative rounded-[2.3rem] p-8 h-full w-full ${isDarkMode ? 'bg-[#0b1121]' : 'bg-white'}`}>
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="relative w-28 h-28 mx-auto mb-8 mt-2">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-2 bg-gradient-to-tr from-purple-600/50 to-indigo-600/50 rounded-full animate-[spin_4s_linear_infinite] border border-purple-400/50 border-t-transparent"></div>
                    <div className="absolute inset-4 bg-gradient-to-bl from-indigo-500/50 to-purple-500/50 rounded-full animate-[spin_3s_linear_infinite_reverse] border border-indigo-400/50 border-b-transparent"></div>
                    <div className={`absolute inset-0 flex items-center justify-center text-5xl drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]`}>🪐</div>
                </div>
                <h2 className={`text-2xl font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400' : 'text-slate-900'}`}>Yield Recovered</h2>
                <p className={`text-xs font-medium leading-relaxed mb-8 px-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Your Auto-Miner fleet has successfully returned from the void with a payload of Stardust.</p>
                <div className={`relative mb-8 p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-[9px] font-black text-white uppercase tracking-widest rounded-full shadow-lg border border-indigo-400/50">Payload</div>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl drop-shadow-sm animate-pulse" style={{ animationDuration: '2s' }}>✨</span>
                        <span className={`text-4xl font-black font-mono tracking-wider ${isDarkMode ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-slate-900'}`}>+{Math.floor(amount).toLocaleString()}</span>
                    </div>
                </div>
                <button onClick={onClaim} className="group relative w-full py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-95 transition-all overflow-hidden border border-indigo-400/50">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-colors"></div>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">Transfer to Vault <span className="text-lg leading-none">🚀</span></span>
                </button>
            </div>
        </div>
        <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
);

// --- Profile Modal ---
const ProfileModal: React.FC<{ player: Player; onClose: () => void; isDarkMode: boolean; theme: string }> = ({ player, onClose, isDarkMode, theme }) => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const faqs = [
        { q: "How do I earn Stardust?", a: "Hold the central core to generate Stardust. You can also complete missions and buy Auto-Miners for passive income." },
        { q: "What is Wormhole Profits?", a: "A special technology that allows your Auto-Miner Drones to collect Stardust even when you close the app!" },
        { q: "How do I withdraw?", a: "Navigate to the Wallet tab. Once you reach the minimum TON limit, you can request a payout to your crypto wallet or UPI." },
        { q: "What are Stars?", a: "Premium currency used to purchase elite Fleet Upgrades and special Stellar Deals." }
    ];

    const handleContactUs = () => {
        const email = "network.captchacash@gmail.com";
        try {
            const textArea = document.createElement("textarea"); textArea.value = email; document.body.appendChild(textArea); textArea.select(); document.execCommand("copy"); document.body.removeChild(textArea);
            if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert("Support email copied!\n\n" + email); else alert("Support email copied!\n\n" + email);
        } catch (err) { prompt("Please copy our support email:", email); }
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in pb-0 sm:pb-6 px-0 sm:px-4">
            <div className={`w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border border-slate-800' : 'bg-white border border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Commander Profile</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">✖</button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar flex flex-col gap-6">
                    <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
                        <div className={`w-14 h-14 rounded-xl p-[2px] bg-gradient-to-br from-${theme}-400 to-purple-500 shrink-0`}><img src={player.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`} alt="Avatar" className="w-full h-full rounded-lg bg-slate-100 dark:bg-slate-800" /></div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Username</span>
                            <span className={`font-black text-lg truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{player.username}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Chat ID</span>
                            <span className="font-mono text-xs text-cyan-500 truncate">{player.telegramId}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Support & Help</h3>
                        <button onClick={handleContactUs} className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${isDarkMode ? 'bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'}`}>
                            <div className="flex items-center gap-3"><span className="text-xl">📧</span><div className="flex flex-col text-left"><span className={`font-bold text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Contact Us</span><span className="text-[10px] text-slate-500">network.captchacash@gmail.com</span></div></div><span className="text-slate-400">📋 Copy</span>
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Frequently Asked Questions</h3>
                        <div className="flex flex-col gap-2">
                            {faqs.map((faq, i) => (
                                <div key={i} className={`rounded-xl border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-4 text-left flex justify-between items-center"><span className={`font-bold text-sm pr-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{faq.q}</span><span className="text-slate-400 font-mono text-lg leading-none">{openFaq === i ? '−' : '+'}</span></button>
                                    {openFaq === i && <div className={`px-4 pb-4 text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{faq.a}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<View>('Earn');
  
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(INITIAL_ADMIN_CONFIG);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [stellarDeals, setStellarDeals] = useState<StellarDeal[]>(INITIAL_STELLAR_DEALS);
  const [dailyRewards, setDailyRewards] = useState(INITIAL_DAILY_REWARDS);
  const [globalWithdrawals, setGlobalWithdrawals] = useState<Withdrawal[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]); 
  const [userRank, setUserRank] = useState<number>(0); 

  const [player, setPlayer] = useState<Player | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [pendingHoldReward, setPendingHoldReward] = useState<number | null>(null);
  const [isClaimModalVisible, setIsClaimModalVisible] = useState(false);
  const [currentHoldAmount, setCurrentHoldAmount] = useState(0);
  const accumulatedHoldRewardRef = useRef(0);

  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isRewardUrgent, setIsRewardUrgent] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
  const [animateBalance, setAnimateBalance] = useState(false);
  const [showLevelAlert, setShowLevelAlert] = useState(false);
  const lastNotifiedLevelRef = useRef<number>(0);

  const [theme, setTheme] = useState<Theme>('cyan');
  const [isDarkMode, setIsDarkMode] = useState(() => {
      try { const saved = localStorage.getItem('app_theme'); if (saved) return saved === 'dark'; } catch(e) {}
      return true; 
  }); 

  const [dealToProcess, setDealToProcess] = useState<StellarDeal | null>(null);
  const [isDealAdModalVisible, setIsDealAdModalVisible] = useState(false);
  const [canSave, setCanSave] = useState(false);

  const passiveUpdateRef = useRef<number>(0);
  const lastPassiveTimeRef = useRef<number | undefined>(undefined);
  const holdIntervalRef = useRef<number | null>(null);
  const playerRef = useRef<Player | null>(null);
  const upgradesRef = useRef<Upgrade[]>(INITIAL_UPGRADES);

  useEffect(() => { playerRef.current = player; upgradesRef.current = upgrades; }, [player, upgrades]);

  const toggleThemeMode = () => {
    setIsDarkMode(prev => {
        const newMode = !prev;
        try {
            if (newMode) { document.documentElement.classList.add('dark'); localStorage.setItem('app_theme', 'dark'); } 
            else { document.documentElement.classList.remove('dark'); localStorage.setItem('app_theme', 'light'); }
            const tg = window.Telegram?.WebApp; if (tg) tg.setHeaderColor(newMode ? '#030712' : '#f0f9ff'); 
        } catch(e) {}
        return newMode;
    });
  };

  const handleShowAd = (onComplete: () => void, onError: (msg: string) => void) => {
     if (adminConfig.demoMode) { setTimeout(() => onComplete(), 500); return; }
     showAd(adminConfig.adUnits, onComplete, onError);
  };

  // ✅ PERFECTED REALTIME REFERRAL LISTENER
  useEffect(() => {
    const subscription = supabase.channel('public:players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload: any) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
           const newPlayer = payload.new;
           
           // Update leaderboard instantly when anyone changes
           setAllPlayers(prev => {
              const filtered = prev.filter(p => p.telegramId !== newPlayer.telegramid);
              const mappedPlayer: any = { 
                  telegramId: newPlayer.telegramid, 
                  username: newPlayer.username || 'Unknown', 
                  photoUrl: newPlayer.gamestate?.photoUrl || null, 
                  balance: newPlayer.balance, 
                  level: newPlayer.level, 
                  stars: newPlayer.stars, 
                  referralCount: newPlayer.referralcount 
              };
              return [...filtered, mappedPlayer].sort((a, b) => b.balance - a.balance);
           });
           
           // If the updated row belongs to the CURRENT user, safely absorb new referrals & stars!
           setPlayer(prev => {
                if (prev && prev.telegramId === newPlayer.telegramid) { 
                    const incomingReferrals = newPlayer.referralcount || 0;
                    if (incomingReferrals > prev.referralCount || newPlayer.stars > prev.stars) {
                        return { ...prev, referralCount: incomingReferrals, stars: newPlayer.stars, level: newPlayer.level, balance: newPlayer.balance };
                    }
                    return { ...prev, referralCount: incomingReferrals, level: newPlayer.level, balance: newPlayer.balance }; 
                }
                return prev;
           });
        }
      }).subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  useEffect(() => {
    let telegramId = 'GHOST_ACCOUNT';
    let username = 'SpaceCadet';
    let photoUrl = undefined;
    let startParam = undefined;

    try {
        const tg = window.Telegram?.WebApp;
        if (tg) {
            const app = tg as any; app.ready(); app.expand(); app.enableClosingConfirmation();
            const savedTheme = localStorage.getItem('app_theme'); let finalMode = true;
            if (savedTheme !== null) finalMode = savedTheme === 'dark'; else if (app.colorScheme === 'light') finalMode = false;
            setIsDarkMode(finalMode);
            if (finalMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
            try { app.setHeaderColor(finalMode ? '#030712' : '#f0f9ff'); } catch(e){}

            const userData = tg.initDataUnsafe?.user;
            startParam = tg.initDataUnsafe?.start_param; 
            telegramId = userData?.id?.toString() || (process.env.NODE_ENV === 'development' ? 'local_dev_user_1' : 'GHOST_ACCOUNT');
            username = userData?.username || userData?.first_name || 'SpaceCadet';
            photoUrl = userData?.photo_url;
        }
    } catch(e) {}

    const createNewPlayer = (): Player => ({
        telegramId, username, photoUrl, balance: 0, coinsPerTap: 1, passivePerHour: 0,
        maxEnergy: MAX_ENERGY, currentEnergy: 1000, lastUpdate: Date.now(), lastRewardClaimed: null, consecutiveDays: 0,
        dailyCipherClaimed: false, lastCipherClaimed: null as any, level: 1, levelUpAdsWatched: 0, stars: 5, lastBoosterClaimed: null,
        holdMultiplier: 1, hasOfflineEarnings: false, hasFollowedTelegram: false, taskProgress: {}, lastTasksReset: Date.now(),
        lastAdWatched: null, activeBoosts: [], lastDealPurchases: {}, withdrawalHistory: [], lastWithdrawalTime: null, activeAutoMiner: null,
        referralCount: 0, invitedBy: startParam ? `Commander_${startParam}` : undefined, isBanned: false
    });

    const initGame = async () => {
        if (telegramId === 'GHOST_ACCOUNT') {
            console.error("Critical Error: Telegram ID missing. App locked to prevent database wipe.");
            setPlayer(createNewPlayer()); setCanSave(false); return;
        }

        try {
            let currentGlobalUpgrades = INITIAL_UPGRADES;
            const globalSettings = await fetchGameSettings();
            
            if (globalSettings) {
                if (globalSettings.tasks) setTasks(globalSettings.tasks);
                if (globalSettings.stellarDeals) setStellarDeals(globalSettings.stellarDeals);
                if (globalSettings.adminConfig) setAdminConfig(globalSettings.adminConfig);
                if (globalSettings.dailyRewards) setDailyRewards(globalSettings.dailyRewards);
                if (Array.isArray(globalSettings.upgrades) && globalSettings.upgrades.length > 0) {
                    currentGlobalUpgrades = globalSettings.upgrades.map((gUpg: any) => {
                         const initialMatch = INITIAL_UPGRADES.find(i => i.id === gUpg.id);
                         return { ...gUpg, level: 0, cost: initialMatch ? initialMatch.cost : gUpg.cost };
                    });
                }
            }
            setUpgrades(currentGlobalUpgrades);

            // ✅ BYPASS BROKEN EXTERNAL LEADERBOARD FUNCTION - Queries DB directly and safely!
            const [userResult, leaderboardResult] = await Promise.all([
                supabase.from('players').select('*').eq('telegramid', telegramId).maybeSingle(),
                supabase.from('players').select('*').order('balance', { ascending: false }).limit(50)
            ]);

            // Maps DB data into strict Player structure so Leaderboard NEVER defaults to Dummy Bots
            const parsedLeaderboard = (leaderboardResult.data || []).map((p: any) => ({
                telegramId: p.telegramid,
                username: p.username || 'Unknown',
                balance: Number(p.balance) || 0,
                level: Number(p.level) || 1,
                stars: Number(p.stars) || 0,
                referralCount: Number(p.referralcount) || 0,
                photoUrl: p.gamestate?.photoUrl || undefined
            }));
            
            setAllPlayers(parsedLeaderboard as Player[]);

            let loadedPlayer: Player;

            if (userResult.data) {
                const remotePlayer = userResult.data;
                const defaultPlayer = createNewPlayer();
                let parsedGameState = typeof remotePlayer.gamestate === 'object' && remotePlayer.gamestate !== null ? remotePlayer.gamestate : {};
                
                const parsedPlayer: Player = {
                    ...defaultPlayer,
                    ...parsedGameState,
                    telegramId: remotePlayer.telegramid, 
                    username: remotePlayer.username || username, 
                    balance: Number(remotePlayer.balance) || 0, 
                    level: Number(remotePlayer.level) || 1, 
                    stars: Number(remotePlayer.stars) || 0, 
                    referralCount: Number(remotePlayer.referralcount) || 0,
                    invitedBy: remotePlayer.invitedby || remotePlayer.invitedBy || undefined,
                    photoUrl: photoUrl || parsedGameState.photoUrl || undefined, 
                    lastCipherClaimed: parsedGameState.lastCipherClaimed || null,
                    activeBoosts: Array.isArray(parsedGameState.activeBoosts) ? parsedGameState.activeBoosts : [],
                    taskProgress: typeof parsedGameState.taskProgress === 'object' && parsedGameState.taskProgress !== null ? parsedGameState.taskProgress : {},
                    lastDealPurchases: typeof parsedGameState.lastDealPurchases === 'object' && parsedGameState.lastDealPurchases !== null ? parsedGameState.lastDealPurchases : {},
                    withdrawalHistory: Array.isArray(parsedGameState.withdrawalHistory) ? parsedGameState.withdrawalHistory : [],
                    activeAutoMiner: parsedGameState.activeAutoMiner || null,
                    hasOfflineEarnings: Boolean(parsedGameState.hasOfflineEarnings)
                };

                if (Array.isArray(parsedGameState.upgrades)) {
                     const savedUpgrades = parsedGameState.upgrades;
                     const mergedUpgrades = currentGlobalUpgrades.map(globalUpg => {
                         const saved = savedUpgrades.find((s: any) => s.id === globalUpg.id);
                         if (saved) return { ...globalUpg, level: Math.min(Number(saved.level) || 0, globalUpg.maxLevel), cost: Number(saved.cost) || globalUpg.cost };
                         return globalUpg;
                     });
                     setUpgrades(mergedUpgrades);
                }

                if (parsedPlayer.passivePerHour > 0 && parsedPlayer.activeAutoMiner) {
                    const now = Date.now();
                    const lastUpdate = parsedPlayer.lastUpdate || now;
                    if (parsedPlayer.activeAutoMiner > lastUpdate) {
                        const activeEndTime = Math.min(now, parsedPlayer.activeAutoMiner);
                        const secondsOffline = (activeEndTime - lastUpdate) / 1000;
                        if (secondsOffline > 120) { 
                            const offlineIncome = (parsedPlayer.passivePerHour / 3600) * secondsOffline;
                            if (!isNaN(offlineIncome) && offlineIncome > 0) setOfflineEarnings(offlineIncome); 
                        }
                    }
                    if (parsedPlayer.activeAutoMiner <= now) parsedPlayer.activeAutoMiner = null;
                }

                if (parsedPlayer.lastCipherClaimed) {
                    const claimDay = Math.floor(parsedPlayer.lastCipherClaimed / 86400000);
                    const currentDay = Math.floor(Date.now() / 86400000);
                    if (currentDay > claimDay) parsedPlayer.dailyCipherClaimed = false;
                }

                parsedPlayer.lastUpdate = Date.now();
                loadedPlayer = parsedPlayer;
                setCanSave(true);
            } else {
                const newPlayer = createNewPlayer();
                
                // ✅ DIRECT REFERRAL DATABASE INJECTION
                if (startParam && startParam !== telegramId) {
                    newPlayer.invitedBy = startParam;
                    try {
                        const { data: inviter } = await supabase.from('players').select('stars, referralcount').eq('telegramid', startParam).single();
                        if (inviter) {
                            const reward = adminConfig.referralRewardStars || 10;
                            // FORCE UPDATE THE DATABASE
                            await supabase.from('players').update({
                                stars: (inviter.stars || 0) + reward,
                                referralcount: (inviter.referralcount || 0) + 1
                            }).eq('telegramid', startParam);
                            
                            // Instantly refresh the leaderboard array so the new recruit visibly bumps the inviter's numbers up!
                            const { data: freshBoard } = await supabase.from('players').select('*').order('balance', { ascending: false }).limit(50);
                            if (freshBoard) {
                                setAllPlayers(freshBoard.map((p: any) => ({
                                    telegramId: p.telegramid, username: p.username || 'Unknown', balance: Number(p.balance) || 0, level: Number(p.level) || 1, stars: Number(p.stars) || 0, referralCount: Number(p.referralcount) || 0, photoUrl: p.gamestate?.photoUrl || undefined
                                })) as Player[]);
                            }
                        }
                    } catch (err) {
                        console.error("Referral Error:", err);
                    }
                }

                loadedPlayer = newPlayer;
                setCanSave(true);
                savePlayerToSupabase(newPlayer, currentGlobalUpgrades).catch(e => console.error(e));
            }
            
            setPlayer(loadedPlayer);
            
            // Generate Accurate Global Rank
            const indexInTop = parsedLeaderboard.findIndex((p: any) => p.telegramId === telegramId);
            if (indexInTop !== -1) {
                setUserRank(indexInTop + 1);
            } else {
                const { count } = await supabase.from('players').select('telegramid', { count: 'exact', head: true }).gt('balance', loadedPlayer.balance);
                setUserRank((count || 0) + 1);
            }

        } catch (e) {
            console.error("Init Error:", e);
            setPlayer(createNewPlayer());
            setCanSave(false); 
        }
    };

    initGame();
  }, []);

  // ✅ PREVENTS FRONTEND OVERWRITE LOOP
  const savePlayerToSupabase = async (currentPlayer: Player, currentUpgrades: Upgrade[]) => {
      if (!currentPlayer || !currentPlayer.telegramId || currentPlayer.telegramId === 'GHOST_ACCOUNT') return;
      
      const { telegramId, username, balance, level, stars, referralCount, invitedBy, isBanned, ...gameState } = currentPlayer;
      const fullGameState = { ...gameState, upgrades: currentUpgrades };

      try {
          const cleanGameState = JSON.parse(JSON.stringify(fullGameState));
          
          const payload: any = {
              telegramid: telegramId, 
              username: username, 
              balance: balance, 
              level: level, 
              stars: stars,
              // STRIPPED referralcount OUT! Supabase handles it autonomously now.
              gamestate: cleanGameState, 
              lastupdated: new Date().toISOString() 
          };

          if (invitedBy) payload.invitedby = invitedBy;

          await supabase.from('players').upsert(payload, { onConflict: 'telegramid' });
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
      if (!canSave) return;
      const saveInterval = setInterval(() => { if (playerRef.current) savePlayerToSupabase(playerRef.current, upgradesRef.current); }, 5000); 
      return () => clearInterval(saveInterval);
  }, [canSave]);

  const triggerBalanceAnimation = () => { playStardustSound(); setAnimateBalance(true); setTimeout(() => setAnimateBalance(false), 500); };

  useEffect(() => {
      const checkMidnightReset = () => {
          if (!player) return;
          if (player.dailyCipherClaimed && (player as any).lastCipherClaimed) {
              const claimDay = Math.floor((player as any).lastCipherClaimed / 86400000);
              const currentDay = Math.floor(Date.now() / 86400000);
              if (currentDay > claimDay) setPlayer(p => p ? { ...p, dailyCipherClaimed: false } : p);
          }
      };
      const interval = setInterval(checkMidnightReset, 60000); checkMidnightReset(); return () => clearInterval(interval);
  }, [player?.dailyCipherClaimed]);

  useEffect(() => {
    if (!player) return;
    let currentLevel = Number(player.level);
    if (isNaN(currentLevel) || currentLevel < 1) currentLevel = 1;
    
    const maxConfiguredLevel = Math.max(...Object.keys(LEVEL_BALANCE_REQUIREMENTS).map(Number));
    if (currentLevel >= maxConfiguredLevel) return; 

    const nextLevelRequirement = LEVEL_BALANCE_REQUIREMENTS[currentLevel + 1];
    const requiredAds = calculateLevelUpAdsReq(currentLevel);
    
    if (typeof nextLevelRequirement === 'number' && nextLevelRequirement > 0) {
        if (player.balance >= nextLevelRequirement) {
            if (player.levelUpAdsWatched >= requiredAds) {
                const updated = { ...player, level: currentLevel + 1, levelUpAdsWatched: 0 };
                setPlayer(updated); savePlayerToSupabase(updated, upgradesRef.current); lastNotifiedLevelRef.current = 0; 
            } else {
                if (lastNotifiedLevelRef.current !== currentLevel) {
                    setShowLevelAlert(true); lastNotifiedLevelRef.current = currentLevel; setTimeout(() => setShowLevelAlert(false), 10000);
                }
            }
        }
    }

    try {
        const newTheme = getLevelTheme(currentLevel);
        if (newTheme !== theme) {
            setTheme(newTheme);
            document.documentElement.style.setProperty('--bg-primary', THEME_CONFIG[newTheme].primary);
            document.documentElement.style.setProperty('--bg-secondary', THEME_CONFIG[newTheme].secondary);
        }
    } catch(e){}
  }, [player?.balance, player?.level, player?.levelUpAdsWatched]);
  
  useEffect(() => {
    const checkUrgency = () => {
      if (player?.lastRewardClaimed) { const timeSinceClaim = Date.now() - player.lastRewardClaimed; setIsRewardUrgent(86400000 - timeSinceClaim > 0 && 86400000 - timeSinceClaim < 3600000); }
    };
    checkUrgency(); const interval = setInterval(checkUrgency, 60000); return () => clearInterval(interval);
  }, [player?.lastRewardClaimed]);

  const updatePassiveIncome = useCallback((time: number) => {
    if (lastPassiveTimeRef.current !== undefined) {
      const deltaTime = (time - lastPassiveTimeRef.current) / 1000;
      setPlayer(prev => {
        if (!prev || prev.isBanned) return prev;
        const now = Date.now();
        const safeActiveBoosts = Array.isArray(prev.activeBoosts) ? prev.activeBoosts : [];
        const activeBoosts = safeActiveBoosts.filter(boost => boost.expiresAt > now);
        const boostsPPH = activeBoosts.filter(boost => boost.type === 'passive_income').reduce((sum, boost) => sum + (boost as { pph: number }).pph, 0); 
        
        let basePassive = 0;
        let nextMinerState = prev.activeAutoMiner;
        
        if (prev.activeAutoMiner && prev.activeAutoMiner > now) { basePassive = prev.passivePerHour; } 
        else if (prev.activeAutoMiner && prev.activeAutoMiner <= now) { nextMinerState = null; }

        const totalPassivePerHour = basePassive + boostsPPH;
        const income = (totalPassivePerHour / 3600) * deltaTime;
        const newEnergy = Math.min(prev.maxEnergy || 1000, (prev.currentEnergy || 0) + (ENERGY_REGEN_RATE * deltaTime));
        
        return { ...prev, balance: prev.balance + income, currentEnergy: newEnergy, lastUpdate: now, activeBoosts, activeAutoMiner: nextMinerState };
      });
    }
    lastPassiveTimeRef.current = time;
    passiveUpdateRef.current = requestAnimationFrame(updatePassiveIncome);
  }, []);

  useEffect(() => {
    passiveUpdateRef.current = requestAnimationFrame(updatePassiveIncome);
    return () => { if (passiveUpdateRef.current) cancelAnimationFrame(passiveUpdateRef.current); if (holdIntervalRef.current) clearInterval(holdIntervalRef.current); };
  }, [updatePassiveIncome]);

  const handleClaimOfflineEarnings = () => {
      if (!player || !offlineEarnings) return;
      const updatedPlayer = { ...player, balance: player.balance + offlineEarnings, lastUpdate: Date.now() };
      setPlayer(updatedPlayer); setOfflineEarnings(null); triggerBalanceAnimation(); savePlayerToSupabase(updatedPlayer, upgradesRef.current);
  };

  const handleHoldStart = () => {
    if (holdIntervalRef.current || !player || player.currentEnergy <= 0 || player.isBanned) return;
    accumulatedHoldRewardRef.current = 0; setCurrentHoldAmount(0);
    const now = Date.now();
    const safeActiveBoosts = Array.isArray(player.activeBoosts) ? player.activeBoosts : [];
    const activeCptBoost = safeActiveBoosts.find(b => b.type === 'cpt' && b.expiresAt > now);
    const cptMultiplier = activeCptBoost ? (activeCptBoost as { multiplier: number }).multiplier : 1;

    holdIntervalRef.current = window.setInterval(() => {
      let earnings = 0;
      setPlayer(prev => {
        if (!prev || prev.currentEnergy <= 0) { handleHoldEnd(); return prev; }
        const effectiveCPT = prev.coinsPerTap * cptMultiplier;
        earnings = effectiveCPT * HOLD_EARN_MULTIPLIER * prev.holdMultiplier;
        accumulatedHoldRewardRef.current += earnings; setCurrentHoldAmount(accumulatedHoldRewardRef.current);
        const newEnergy = Math.max(0, prev.currentEnergy - HOLD_ENERGY_DRAIN_PER_TICK);
        if (newEnergy === 0) handleHoldEnd();
        return { ...prev, currentEnergy: newEnergy };
      });
      if (earnings > 0) {
        const newText: FloatingText = { id: Date.now() + Math.random(), value: earnings };
        setFloatingTexts(prev => [...prev, newText]); setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== newText.id)), 1000);
      }
    }, HOLD_TICK_RATE_MS);
  };
  
  const handleHoldEnd = () => {
    if (holdIntervalRef.current) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null; }
    if (accumulatedHoldRewardRef.current > 0) { setPendingHoldReward(accumulatedHoldRewardRef.current); setIsClaimModalVisible(true); }
    setCurrentHoldAmount(0);
  };
  
  const handleClaimHoldReward = () => {
    if (!player || !pendingHoldReward) return;
    const updated = { ...player, balance: player.balance + pendingHoldReward };
    setPlayer(updated); triggerBalanceAnimation(); setPendingHoldReward(null); setIsClaimModalVisible(false); accumulatedHoldRewardRef.current = 0;
    savePlayerToSupabase(updated, upgradesRef.current);
  };

  const handleCancelHoldReward = () => { setPendingHoldReward(null); setIsClaimModalVisible(false); accumulatedHoldRewardRef.current = 0; };

  const handleToggleMiner = () => {
      if (!player || player.passivePerHour <= 0) return;
      const now = Date.now();
      const isMinerActive = player.activeAutoMiner && player.activeAutoMiner > now;
      let newActiveState: number | null = null;
      let newBalance = player.balance;
      
      if (!isMinerActive) {
          if (player.balance < 1000) {
              try {
                  if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert("Not enough Stardust to activate the auto-miner!"); 
                  else alert("Not enough Stardust to activate the auto-miner!");
              } catch(e) {}
              return; 
          }
          newBalance -= 1000;              
          newActiveState = now + 14400000; 
          triggerBalanceAnimation();       
      } 
      
      const updated = { ...player, balance: newBalance, activeAutoMiner: newActiveState, lastUpdate: now };
      setPlayer(updated);
      savePlayerToSupabase(updated, upgradesRef.current);
  };

  const buyUpgrade = (upgradeId: string) => {
    if (!player) return;
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;
    const isStarCost = upgrade.costType === 'stars';
    const canAfford = isStarCost ? player.stars >= upgrade.cost : player.balance >= upgrade.cost;
    if (upgrade.level >= upgrade.maxLevel || !canAfford) return;

    const updatedPlayer = { ...player };
    if (isStarCost) updatedPlayer.stars -= upgrade.cost; else updatedPlayer.balance -= upgrade.cost;
      
    updatedPlayer.passivePerHour += (upgrade.profitPerHour || 0);
    updatedPlayer.coinsPerTap += (upgrade.cptBoost || 0);
    updatedPlayer.holdMultiplier += (upgrade.holdMultiplierBoost || 0);
    if (upgrade.profitPerHour && upgrade.profitPerHour > 0) updatedPlayer.hasOfflineEarnings = true;
    if (upgrade.id === 's5') updatedPlayer.hasOfflineEarnings = true;

    const newUpgrades = upgrades.map(u => u.id === upgradeId ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.6) } : u);
    setPlayer(updatedPlayer); setUpgrades(newUpgrades); savePlayerToSupabase(updatedPlayer, newUpgrades);
  };

  const processDealPurchase = (deal: StellarDeal) => {
    if (!player) return;
    let updatedPlayer = { ...player };
    if (deal.costType === 'stardust') updatedPlayer.balance -= deal.cost;
    if (deal.costType === 'stars') updatedPlayer.stars -= deal.cost;
    
    const safeActiveBoosts = Array.isArray(updatedPlayer.activeBoosts) ? [...updatedPlayer.activeBoosts] : [];
    
     switch (deal.rewardType) {
        case 'energy_boost': updatedPlayer.currentEnergy = Math.min(updatedPlayer.maxEnergy, updatedPlayer.currentEnergy + (deal.rewardValue as number)); break;
        case 'stardust_boost': updatedPlayer.balance += (deal.rewardValue as number); triggerBalanceAnimation(); break;
        case 'cpt_boost':
          const cptReward = deal.rewardValue as { multiplier: number, duration: number };
          updatedPlayer.activeBoosts = safeActiveBoosts.filter(b => b.type !== 'cpt');
          updatedPlayer.activeBoosts.push({ sourceId: deal.id, type: 'cpt', multiplier: cptReward.multiplier, expiresAt: Date.now() + cptReward.duration }); break;
        case 'passive_income_boost':
          const pphReward = deal.rewardValue as { pph: number, duration: number };
          updatedPlayer.activeBoosts = safeActiveBoosts.filter(b => b.type !== 'passive_income');
          updatedPlayer.activeBoosts.push({ sourceId: deal.id, type: 'passive_income', pph: pphReward.pph, expiresAt: Date.now() + pphReward.duration }); break;
        case 'free_upgrade':
          const availableUpgrades = upgrades.filter(u => u.level < u.maxLevel && (!u.unlockLevel || player.level >= u.unlockLevel));
          if (availableUpgrades.length > 0) {
              const cheapestUpgrade = availableUpgrades.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
              updatedPlayer.passivePerHour += (cheapestUpgrade.profitPerHour || 0); updatedPlayer.coinsPerTap += (cheapestUpgrade.cptBoost || 0); updatedPlayer.holdMultiplier += (cheapestUpgrade.holdMultiplierBoost || 0);
              setUpgrades(prevUpgrades => prevUpgrades.map(u => u.id === cheapestUpgrade.id ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.6) } : u));
          } break;
    }
    
    const safePurchases = typeof updatedPlayer.lastDealPurchases === 'object' && updatedPlayer.lastDealPurchases !== null ? updatedPlayer.lastDealPurchases : {};
    updatedPlayer.lastDealPurchases = { ...safePurchases, [deal.id]: Date.now() };
    setPlayer(updatedPlayer); savePlayerToSupabase(updatedPlayer, upgradesRef.current);
  };

  const handleBuyStellarDeal = (deal: StellarDeal) => {
      if (!player) return;
      const safePurchases = typeof player.lastDealPurchases === 'object' && player.lastDealPurchases !== null ? player.lastDealPurchases : {};
      if (deal.cooldown && safePurchases[deal.id] && Date.now() - safePurchases[deal.id] < deal.cooldown) return;
      if (deal.unlockLevel && player.level < deal.unlockLevel) return;
      if (deal.costType === 'stardust' && player.balance < deal.cost) return;
      if (deal.costType === 'stars' && player.stars < deal.cost) return;
      if(deal.costType === 'ad') { setDealToProcess(deal); setIsDealAdModalVisible(true); } else processDealPurchase(deal);
  };
  
  const handleConfirmDealAd = () => { if(dealToProcess) processDealPurchase(dealToProcess); setIsDealAdModalVisible(false); setDealToProcess(null); };

  const handleClaimReward = () => {
    if (!player) return;
    const reward = dailyRewards[player.consecutiveDays % dailyRewards.length];
    const updatedPlayer = { ...player };
    if (reward.type === 'stars') updatedPlayer.stars += reward.amount;
    else { updatedPlayer.balance += (reward.amount * adminConfig.dailyRewardBase); triggerBalanceAnimation(); }
    updatedPlayer.lastRewardClaimed = Date.now(); updatedPlayer.consecutiveDays += 1;
    setPlayer(updatedPlayer); setView('Earn'); savePlayerToSupabase(updatedPlayer, upgradesRef.current);
  };
  
  const handleSolveCipher = () => {
    if (!player || player.dailyCipherClaimed) return;
    const updated = { ...player, balance: player.balance + adminConfig.dailyCipherReward, dailyCipherClaimed: true, lastCipherClaimed: Date.now() } as any;
    setPlayer(updated); triggerBalanceAnimation(); setView('Earn'); savePlayerToSupabase(updated, upgradesRef.current);
  };

  const handleActivateBooster = () => {
    if (!player) return;
    const updated = { ...player, currentEnergy: player.maxEnergy, lastBoosterClaimed: Date.now() };
    setPlayer(updated); savePlayerToSupabase(updated, upgradesRef.current);
  };

  const handleWatchLevelUpAd = () => { setPlayer(p => p ? ({ ...p, levelUpAdsWatched: p.levelUpAdsWatched + 1 }) : null); };

  const handleInitiateTask = (task: Task) => {
    if (!player) return;
    const rawChatId = (task as any).chatId || ''; const cleanChatId = rawChatId.startsWith('@') ? rawChatId.replace('@', '') : rawChatId;
    const targetUrl = task.link || (cleanChatId && !cleanChatId.startsWith('-') ? `https://t.me/${cleanChatId}` : '');

    if (task.type === 'youtube_video' || task.type === 'youtube_shorts') { setPendingTasks(prev => [...new Set([...prev, task.id])]); if (task.link) window.open(task.link, '_blank'); return; }
    if (task.type === 'telegram') {
        if (pendingTasks.includes(task.id)) {
            const safeTasks = typeof player.taskProgress === 'object' && player.taskProgress !== null ? player.taskProgress : {};
            const updatedPlayer = { ...player, balance: player.balance + task.reward, hasFollowedTelegram: true, taskProgress: { ...safeTasks, [task.id]: 1 } };
            setPlayer(updatedPlayer); triggerBalanceAnimation(); setPendingTasks(prev => prev.filter(id => id !== task.id)); savePlayerToSupabase(updatedPlayer, upgradesRef.current);
        } else {
            setPendingTasks(prev => [...new Set([...prev, task.id])]);
            if (targetUrl) { if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(targetUrl); else if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(targetUrl); else window.open(targetUrl, '_blank'); }
        } return;
    }
    if (task.type === 'ads') {
        setPlayer(prev => {
            if (!prev) return null; let updatedPlayer = { ...prev };
            const safeTasks = typeof updatedPlayer.taskProgress === 'object' && updatedPlayer.taskProgress !== null ? updatedPlayer.taskProgress : {};
            const currentProgress = safeTasks[task.id] || 0;
            updatedPlayer.taskProgress = { ...safeTasks, [task.id]: currentProgress + 1 };
            updatedPlayer.lastAdWatched = Date.now();
            if (updatedPlayer.taskProgress[task.id] >= (task.dailyLimit || 1)) { updatedPlayer.balance += task.reward; triggerBalanceAnimation(); }
            savePlayerToSupabase(updatedPlayer, upgradesRef.current); return updatedPlayer;
        });
    }
  };

  const handleCancelTask = (taskId: string) => { setPendingTasks(prev => prev.filter(id => id !== taskId)); };

  const handleClaimTask = (taskId: string, code: string): boolean => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || code !== (task.secretCode || '1234') || !player) return false;
    const safeTasks = typeof player.taskProgress === 'object' && player.taskProgress !== null ? player.taskProgress : {};
    const updatedPlayer = { ...player, balance: player.balance + task.reward };
    updatedPlayer.taskProgress = { ...safeTasks, [task.id]: (safeTasks[task.id] || 0) + 1 };
    setPlayer(updatedPlayer); triggerBalanceAnimation(); setPendingTasks(prev => prev.filter(id => id !== taskId)); savePlayerToSupabase(updatedPlayer, upgradesRef.current);
    return true;
  };
  
  const handleWithdrawal = (withdrawal: Omit<Withdrawal, 'id' | 'timestamp' | 'status' | 'telegramId' | 'username'>) => {
    if (!player || (player.lastWithdrawalTime && Date.now() - player.lastWithdrawalTime < WITHDRAWAL_COOLDOWN_MS)) return; 
    const newWithdrawal: Withdrawal = { ...withdrawal, id: `wd_${Date.now()}`, timestamp: Date.now(), status: 'Pending', telegramId: player.telegramId, username: player.username };
    const safeWithdrawals = Array.isArray(player.withdrawalHistory) ? player.withdrawalHistory : [];
    const updated = { ...player, balance: player.balance - withdrawal.amountStardust, withdrawalHistory: [newWithdrawal, ...safeWithdrawals], lastWithdrawalTime: Date.now() };
    setPlayer(updated); setGlobalWithdrawals(prev => [newWithdrawal, ...prev]); savePlayerToSupabase(updated, upgradesRef.current);
  };

  const renderView = () => {
    switch(view) {
      case 'Earn': return (
        <EarnView player={player} onHoldStart={handleHoldStart} onHoldEnd={handleHoldEnd} floatingTexts={floatingTexts} onDailyRewardClick={() => setView('DailyReward')} onCipherClick={() => setView('DailyCipher')} isRewardAvailable={isRewardAvailable} onActivateBooster={handleActivateBooster} pendingHoldReward={pendingHoldReward} isClaimModalVisible={isClaimModalVisible} onClaimHoldReward={handleClaimHoldReward} onCancelHoldReward={handleCancelHoldReward} currentHoldAmount={currentHoldAmount} isRewardUrgent={isRewardUrgent} isCipherClaimed={player.dailyCipherClaimed} theme={theme} onShowAd={handleShowAd} isDarkMode={isDarkMode} toggleTheme={toggleThemeMode} />
      );
      case 'Upgrades': return (
        <UpgradesView upgrades={upgrades} stellarDeals={stellarDeals} player={player} onBuy={buyUpgrade} onBuyStellarDeal={handleBuyStellarDeal} isDealAdModalVisible={isDealAdModalVisible} dealToProcess={dealToProcess} onConfirmDealAd={handleConfirmDealAd} onCancelDealAd={() => setIsDealAdModalVisible(false)} theme={theme} onShowAd={handleShowAd} onToggleMiner={handleToggleMiner} />
      );
      case 'Tasks': return (
        <TasksView player={player} onInitiateTask={handleInitiateTask} onClaimTask={handleClaimTask} onCancelTask={handleCancelTask} onWatchLevelUpAd={handleWatchLevelUpAd} pendingTasks={pendingTasks} theme={theme} tasks={tasks} onShowAd={handleShowAd} />
      );
      case 'Leaderboard': return (
        <LeaderboardView player={player} theme={theme} referralReward={adminConfig.referralRewardStars} leaderboardData={allPlayers} userRank={userRank} />
      );
      case 'Wallet': return (
        <WalletView player={player} onWithdraw={handleWithdrawal} theme={theme} minWithdrawal={adminConfig.minWithdrawalTon} onShowAd={handleShowAd} />
      );
      case 'DailyReward': return (
        <DailyRewardView player={player} onClaim={handleClaimReward} onBack={() => setView('Earn')} isRewardAvailable={isRewardAvailable} theme={theme} rewards={dailyRewards} />
      );
      case 'DailyCipher': return (
        <DailyCipherView onSolve={handleSolveCipher} onBack={() => setView('Earn')} isCipherClaimed={player.dailyCipherClaimed} theme={theme} cipherWord={adminConfig.dailyCipherWord} />
      );
      case 'Admin': 
        if (player.telegramId !== ADMIN_ID) return null;
        return <AdminView config={adminConfig} setConfig={setAdminConfig} tasks={tasks} setTasks={setTasks} stellarDeals={stellarDeals} setStellarDeals={setStellarDeals} upgrades={upgrades} setUpgrades={setUpgrades} withdrawals={globalWithdrawals} setWithdrawals={setGlobalWithdrawals} players={allPlayers} setPlayers={setAllPlayers} dailyRewards={dailyRewards} setDailyRewards={setDailyRewards} onBack={() => setView('Earn')} />;
      default: return null;
    }
  };

  if (!player) return <div className="flex h-screen items-center justify-center bg-[#050B14] text-cyan-400 font-bold animate-pulse uppercase tracking-widest">Re-Establishing Uplink...</div>;
  if (showIntro) return <IntroScreen isDataReady={!!player} onFinished={() => setShowIntro(false)} isDarkMode={isDarkMode} />;
  if (player.isBanned) return <div className="fixed inset-0 bg-red-950 flex flex-col items-center justify-center p-6 text-center z-[1000]"><span className="text-6xl mb-4">🚫</span><h1 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2">ACCESS DENIED</h1></div>;

  const isMaintenanceActive = adminConfig.maintenanceMode && adminConfig.maintenanceEndTime && Date.now() < adminConfig.maintenanceEndTime;
  if (isMaintenanceActive && player.telegramId !== ADMIN_ID) {
      return <MaintenanceScreen endTime={adminConfig.maintenanceEndTime as number} isDarkMode={isDarkMode} onFinished={() => setAdminConfig(prev => ({ ...prev, maintenanceMode: false }))} />;
  }

  const isRewardAvailable = !player.lastRewardClaimed || Date.now() - player.lastRewardClaimed > 86400000;
  const handleOpenAdmin = () => { if (player.telegramId === ADMIN_ID) setView('Admin'); else alert("Access Denied."); };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden relative">
      {isProfileModalVisible && <ProfileModal player={player} onClose={() => setIsProfileModalVisible(false)} isDarkMode={isDarkMode} theme={theme} />}
      {offlineEarnings !== null && <OfflineEarningsModal amount={offlineEarnings} onClaim={handleClaimOfflineEarnings} isDarkMode={isDarkMode} />}
      {adminConfig.demoMode && <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[1000] bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] pointer-events-none animate-pulse">Demo Mode Active</div>}
      
      {showLevelAlert && (
          <div className="absolute top-[80px] left-4 right-4 z-[100] pointer-events-auto">
             <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-${theme}-400 dark:border-${theme}-500/80 shadow-[0_0_25px_0px_var(--tw-shadow-color)] shadow-${theme}-400/50 dark:shadow-${theme}-500/40 p-4 rounded-2xl flex items-center gap-3 animate-slide-down-fade`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 animate-pulse flex-shrink-0">🚀</div>
                <div className="flex flex-col flex-1">
                   <h4 className={`text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm drop-shadow-sm`}>Level {player.level + 1} Ready!</h4>
                   <p className="text-slate-600 dark:text-slate-400 text-[9px] uppercase font-bold tracking-wider mt-0.5 leading-tight">Go to missions and complete the security check to unlock.</p>
                </div>
                <button onClick={() => { setView('Tasks'); setShowLevelAlert(false); }} className={`bg-gradient-to-r from-${theme}-500 to-${theme}-600 dark:from-${theme}-600 dark:to-${theme}-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-${theme}-500/30 active:scale-95 transition-transform flex-shrink-0`}>GO</button>
             </div>
             <style>{`@keyframes slideDownFade { 0% { opacity: 0; transform: translateY(-20px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } } .animate-slide-down-fade { animation: slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
          </div>
      )}

      <div className='flex flex-col h-full'>
        {view !== 'DailyReward' && view !== 'DailyCipher' && view !== 'Admin' && (
          <StatsHeader player={player} animateBalance={animateBalance} theme={theme} onOpenAdmin={handleOpenAdmin} showAdminLock={player.telegramId === ADMIN_ID} onOpenProfile={() => setIsProfileModalVisible(true)} />
        )}
        <div className={`flex-1 overflow-y-auto ${view !== 'DailyReward' && view !== 'DailyCipher' && view !== 'Admin' ? 'pb-24' : ''}`}>
          {renderView()}
        </div>
        {view !== 'DailyReward' && view !== 'DailyCipher' && view !== 'Admin' && (
          <Navigation currentView={view} onViewChange={setView} theme={theme} />
        )}
      </div>
    </div>
  );
};

export default App;
