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
import { supabase, fetchLeaderboard, processReferral, fetchUserRank, fetchGameSettings } from './utils/supabase';

declare global {
  interface Window {
    Telegram: any;
  }
}

const ADMIN_ID = "702954043";

// --- Maintenance Screen ---
const MaintenanceScreen: React.FC<{ endTime: number; onFinished: () => void; isDarkMode: boolean }> = ({ endTime, onFinished, isDarkMode }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        clearInterval(timer);
        onFinished();
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
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
        <div className="w-24 h-24 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mb-6 animate-bounce shadow-[0_0_30px_rgba(249,115,22,0.2)]">
            <span className="text-5xl">🚧</span>
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-widest mb-3">System Offline</h1>
        <p className={`text-sm mb-8 max-w-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
           Our engineers are currently upgrading the quantum mainframe. Access will be automatically restored when the timer concludes.
        </p>
        
        <div className="flex flex-col items-center">
            <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-2 ${isDarkMode ? 'text-orange-500/70' : 'text-orange-600/70'}`}>Uplink Resumes In</span>
            <div className={`px-8 py-4 rounded-xl font-mono text-3xl font-black tracking-wider shadow-inner ${isDarkMode ? 'bg-black/50 border border-orange-500/30 text-orange-400' : 'bg-orange-50 border border-orange-200 text-orange-600'}`}>
                {timeLeft || "00:00:00"}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Offline Earnings Modal ---
const OfflineEarningsModal: React.FC<{ amount: number; onClaim: () => void; isDarkMode: boolean }> = ({ amount, onClaim, isDarkMode }) => (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className={`relative w-full max-w-sm rounded-[2rem] p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border border-purple-500/30' : 'bg-white border border-purple-200'}`}>
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-500/20 to-transparent pointer-events-none"></div>
            <div className="w-24 h-24 mx-auto bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-[spin_10s_linear_infinite]">
                🌌
            </div>
            <h2 className={`text-2xl font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Wormhole Secured</h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Your offline drones have returned from the void with harvested stardust.</p>
            
            <div className="flex items-center justify-center gap-2 mb-8 bg-purple-500/10 py-4 rounded-xl border border-purple-500/20">
                <span className="text-2xl drop-shadow-sm">🪐</span>
                <span className="text-3xl font-black font-mono text-purple-400 tracking-wider">+{Math.floor(amount).toLocaleString()}</span>
            </div>

            <button 
                onClick={onClaim}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 transition-all"
            >
                Transfer to Vault
            </button>
        </div>
    </div>
);

// --- Profile Modal ---
const ProfileModal: React.FC<{ player: Player; onClose: () => void; onDelete: () => void; isDarkMode: boolean; theme: string }> = ({ player, onClose, onDelete, isDarkMode, theme }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        { q: "How do I earn Stardust?", a: "Hold the central core to generate Stardust. You can also complete missions and buy Auto-Miners for passive income." },
        { q: "What is Wormhole Profits?", a: "A special technology that allows your Auto-Miner Drones to collect Stardust even when you close the app!" },
        { q: "How do I withdraw?", a: "Navigate to the Wallet tab. Once you reach the minimum TON limit, you can request a payout to your crypto wallet or UPI." },
        { q: "What are Stars?", a: "Premium currency used to purchase elite Fleet Upgrades and special Stellar Deals." }
    ];

    // ✅ FIX: Safely copy email to clipboard to avoid Telegram Webview URL scheme blocks
    const handleContactUs = () => {
        const email = "network.captchacash@gmail.com";
        navigator.clipboard.writeText(email).then(() => {
            if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert("Support email copied to clipboard!\n\n" + email);
            } else {
                alert("Support email copied to clipboard!\n\n" + email);
            }
        }).catch(err => {
            console.error("Clipboard failed", err);
            prompt("Please copy our support email:", email);
        });
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in pb-0 sm:pb-6 px-0 sm:px-4">
            <div className={`w-full max-w-md h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border border-slate-800' : 'bg-white border border-slate-200'}`}>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Commander Profile</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                        ✖
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar flex flex-col gap-6">
                    
                    {/* User Info Card */}
                    <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDarkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
                        <div className={`w-14 h-14 rounded-xl p-[2px] bg-gradient-to-br from-${theme}-400 to-purple-500 shrink-0`}>
                            <img src={player.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`} alt="Avatar" className="w-full h-full rounded-lg bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Username</span>
                            <span className={`font-black text-lg truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{player.username}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Chat ID</span>
                            <span className="font-mono text-xs text-cyan-500 truncate">{player.telegramId}</span>
                        </div>
                    </div>

                    {/* Support & Contact */}
                    <div className="flex flex-col gap-3">
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Support & Help</h3>
                        <button onClick={handleContactUs} className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${isDarkMode ? 'bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📧</span>
                                <div className="flex flex-col text-left">
                                    <span className={`font-bold text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Contact Us</span>
                                    <span className="text-[10px] text-slate-500">network.captchacash@gmail.com</span>
                                </div>
                            </div>
                            <span className="text-slate-400">📋 Copy</span>
                        </button>
                    </div>

                    {/* FAQ */}
                    <div className="flex flex-col gap-3">
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Frequently Asked Questions</h3>
                        <div className="flex flex-col gap-2">
                            {faqs.map((faq, i) => (
                                <div key={i} className={`rounded-xl border transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full p-4 text-left flex justify-between items-center"
                                    >
                                        <span className={`font-bold text-sm pr-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{faq.q}</span>
                                        <span className="text-slate-400 font-mono text-lg leading-none">{openFaq === i ? '−' : '+'}</span>
                                    </button>
                                    {openFaq === i && (
                                        <div className={`px-4 pb-4 text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-red-900/30">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-red-500">Danger Zone</h3>
                        {!confirmDelete ? (
                            <button 
                                onClick={() => setConfirmDelete(true)} 
                                className="w-full py-3 rounded-xl border border-red-500/30 text-red-500 font-bold text-sm hover:bg-red-500/10 transition-colors"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2 bg-red-950/30 p-4 rounded-xl border border-red-900/50">
                                <p className="text-xs text-red-400 font-bold text-center mb-2 uppercase">Are you absolutely sure? This cannot be undone.</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors">Cancel</button>
                                    <button onClick={onDelete} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all active:scale-95">Yes, Delete</button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};


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
      const savedTheme = localStorage.getItem('app_theme');
      if (savedTheme !== null) {
          return savedTheme === 'dark';
      }
      return true; 
  }); 

  const [dealToProcess, setDealToProcess] = useState<StellarDeal | null>(null);
  const [isDealAdModalVisible, setIsDealAdModalVisible] = useState(false);

  const [canSave, setCanSave] = useState(false);
  
  // ✅ FIX: Lock variable to prevent Supabase auto-save loop after account deletion
  const isDeletingRef = useRef(false);

  const passiveUpdateRef = useRef<number>(0);
  const lastPassiveTimeRef = useRef<number | undefined>(undefined);
  const holdIntervalRef = useRef<number | null>(null);

  const playerRef = useRef<Player | null>(null);
  const upgradesRef = useRef<Upgrade[]>(INITIAL_UPGRADES);

  useEffect(() => {
    playerRef.current = player;
    upgradesRef.current = upgrades;
  }, [player, upgrades]);

  const toggleThemeMode = () => {
    setIsDarkMode(prev => {
        const newMode = !prev;
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('app_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('app_theme', 'light');
        }
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.setHeaderColor(newMode ? '#030712' : '#f0f9ff'); 
        }
        return newMode;
    });
  };

  const handleShowAd = (onComplete: () => void, onError: (msg: string) => void) => {
     if (adminConfig.demoMode) {
         setTimeout(() => {
             onComplete();
         }, 500); 
         return;
     }
     showAd(adminConfig.adUnits, onComplete, onError);
  };

  useEffect(() => {
    const subscription = supabase
      .channel('public:players')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload: any) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
           const newPlayer = payload.new;
           
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

           setPlayer(prev => {
                if (prev && prev.telegramId === newPlayer.telegramid && !isDeletingRef.current) {
                    return {
                        ...prev,
                        referralCount: newPlayer.referralcount,
                        stars: newPlayer.stars,
                        level: newPlayer.level,
                        balance: newPlayer.balance
                    };
                }
                return prev;
           });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const app = tg as any;
      app.ready();
      app.expand();
      app.enableClosingConfirmation();
      
      const savedTheme = localStorage.getItem('app_theme');
      let finalMode = true;

      if (savedTheme !== null) {
          finalMode = savedTheme === 'dark';
      } else if (app.colorScheme === 'light') {
          finalMode = false;
      }

      setIsDarkMode(finalMode);
      
      if (finalMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }

      app.setHeaderColor(finalMode ? '#030712' : '#f0f9ff'); 
    }

    const userData = tg?.initDataUnsafe?.user;
    const startParam = tg?.initDataUnsafe?.start_param; 
    
    const telegramId = userData?.id?.toString() || (process.env.NODE_ENV === 'development' ? 'dev_user_123' : 'unknown_user');
    const username = userData?.username || userData?.first_name || 'SpaceCadet';

    const createNewPlayer = (): Player => ({
        telegramId: telegramId,
        username: username,
        photoUrl: userData?.photo_url,
        balance: 0,
        coinsPerTap: 1,
        passivePerHour: 0,
        maxEnergy: MAX_ENERGY,
        currentEnergy: 1000,
        lastUpdate: Date.now(),
        lastRewardClaimed: null,
        consecutiveDays: 0,
        dailyCipherClaimed: false,
        lastCipherClaimed: null as any,
        level: 1,
        levelUpAdsWatched: 0, 
        stars: 5,
        lastBoosterClaimed: null,
        holdMultiplier: 1,
        hasOfflineEarnings: false,
        hasFollowedTelegram: false,
        taskProgress: {},
        lastTasksReset: Date.now(),
        lastAdWatched: null,
        activeBoosts: [],
        lastDealPurchases: {},
        withdrawalHistory: [],
        lastWithdrawalTime: null, 
        activeAutoMiner: null,
        referralCount: 0,
        invitedBy: startParam ? `Commander_${startParam}` : undefined,
        isBanned: false
    });

    const initGame = async () => {
        try {
            let currentGlobalUpgrades = INITIAL_UPGRADES;

            const globalSettings = await fetchGameSettings();
            if (globalSettings) {
                if (globalSettings.tasks) setTasks(globalSettings.tasks);
                if (globalSettings.stellarDeals) setStellarDeals(globalSettings.stellarDeals);
                if (globalSettings.adminConfig) setAdminConfig(globalSettings.adminConfig);
                if (globalSettings.dailyRewards) setDailyRewards(globalSettings.dailyRewards);
                if (globalSettings.upgrades && globalSettings.upgrades.length > 0) {
                    currentGlobalUpgrades = globalSettings.upgrades;
                }
            }
            
            setUpgrades(currentGlobalUpgrades);

            const [userResult, leaderboardData] = await Promise.all([
                supabase.from('players').select('*').eq('telegramid', telegramId).maybeSingle(),
                fetchLeaderboard()
            ]);

            if (leaderboardData && leaderboardData.length > 0) setAllPlayers(leaderboardData as Player[]);

            let loadedPlayer: Player;

            if (userResult.data) {
                const remotePlayer = userResult.data;
                const parsedPlayer: Player = {
                    telegramId: remotePlayer.telegramid, 
                    username: remotePlayer.username,
                    balance: Number(remotePlayer.balance), 
                    level: remotePlayer.level,
                    stars: remotePlayer.stars,
                    referralCount: remotePlayer.referralcount || 0,
                    invitedBy: remotePlayer.invitedby || remotePlayer.invitedBy,
                    ...remotePlayer.gamestate,
                    photoUrl: userData?.photo_url || remotePlayer.gamestate?.photoUrl,
                    lastCipherClaimed: remotePlayer.gamestate?.lastCipherClaimed || null
                };

                if (remotePlayer.gamestate && remotePlayer.gamestate.upgrades) {
                     const savedUpgrades = remotePlayer.gamestate.upgrades;
                     
                     const mergedUpgrades = currentGlobalUpgrades.map(globalUpg => {
                         const saved = savedUpgrades.find((s: any) => s.id === globalUpg.id);
                         if (saved) {
                             const clampedLevel = Math.min(saved.level, globalUpg.maxLevel);
                             return { ...globalUpg, level: clampedLevel, cost: saved.cost };
                         }
                         return globalUpg;
                     });
                     
                     setUpgrades(mergedUpgrades);
                }

                if (parsedPlayer.hasOfflineEarnings && parsedPlayer.passivePerHour > 0) {
                    const now = Date.now();
                    const lastUpdate = parsedPlayer.lastUpdate || now;
                    const secondsOffline = (now - lastUpdate) / 1000;
                    
                    if (secondsOffline > 300) {
                        const offlineIncome = (parsedPlayer.passivePerHour / 3600) * secondsOffline;
                        if (!isNaN(offlineIncome) && offlineIncome > 0) {
                            setOfflineEarnings(offlineIncome); 
                        }
                    }
                }

                if (parsedPlayer.lastCipherClaimed) {
                    const claimDay = Math.floor(parsedPlayer.lastCipherClaimed / 86400000);
                    const currentDay = Math.floor(Date.now() / 86400000);
                    if (currentDay > claimDay) {
                        parsedPlayer.dailyCipherClaimed = false;
                    }
                }

                parsedPlayer.lastUpdate = Date.now();
                loadedPlayer = parsedPlayer;
                setCanSave(true);
            } else {
                const newPlayer = createNewPlayer();
                if (startParam && startParam !== telegramId) {
                    processReferral(startParam, telegramId, adminConfig.referralRewardStars)
                        .catch(err => console.error(err));
                    newPlayer.invitedBy = startParam;
                }
                loadedPlayer = newPlayer;
                setCanSave(true);
                savePlayerToSupabase(newPlayer, currentGlobalUpgrades).catch(e => console.error(e));
            }
            
            setPlayer(loadedPlayer);

            const top50 = leaderboardData as Player[] || [];
            const indexInTop = top50.findIndex((p: any) => (p.telegramid || p.telegramId) === telegramId);
            setUserRank(indexInTop !== -1 ? indexInTop + 1 : await fetchUserRank(loadedPlayer.balance));

        } catch (e) {
            console.error(e);
            setPlayer(createNewPlayer());
            setCanSave(false); 
        }
    };

    initGame();
  }, []);

  const savePlayerToSupabase = async (currentPlayer: Player, currentUpgrades: Upgrade[]) => {
      if (!currentPlayer || !currentPlayer.telegramId) return;

      const { telegramId, username, balance, level, stars, referralCount, invitedBy, isBanned, ...gameState } = currentPlayer;
      const fullGameState = { ...gameState, upgrades: currentUpgrades };

      try {
          const cleanGameState = JSON.parse(JSON.stringify(fullGameState));

          const { error } = await supabase.from('players').upsert({
              telegramid: telegramId, 
              username: username,
              balance: balance,
              level: level,
              stars: stars,
              referralcount: referralCount || 0,
              invitedby: invitedBy || null, 
              gamestate: cleanGameState, 
              lastupdated: new Date().toISOString() 
          }, { onConflict: 'telegramid' });

          if (error) {
              console.error(error.message);
          }
      } catch (err) {
          console.error(err);
      }
  };

  // ✅ FIX: Respect the isDeletingRef lock so we don't accidentally save while deleting!
  useEffect(() => {
      if (!canSave) return;
      const saveInterval = setInterval(() => {
          if (playerRef.current && !isDeletingRef.current) {
              savePlayerToSupabase(playerRef.current, upgradesRef.current);
          }
      }, 5000); 
      return () => clearInterval(saveInterval);
  }, [canSave]);

  const triggerBalanceAnimation = () => {
    playStardustSound();
    setAnimateBalance(true);
    setTimeout(() => setAnimateBalance(false), 500); 
  };

  useEffect(() => {
      const checkMidnightReset = () => {
          if (!player) return;
          if (player.dailyCipherClaimed && (player as any).lastCipherClaimed) {
              const claimDay = Math.floor((player as any).lastCipherClaimed / 86400000);
              const currentDay = Math.floor(Date.now() / 86400000);
              if (currentDay > claimDay) {
                  setPlayer(p => p ? { ...p, dailyCipherClaimed: false } : p);
              }
          }
      };
      
      const interval = setInterval(checkMidnightReset, 60000); 
      checkMidnightReset();
      return () => clearInterval(interval);
  }, [player?.dailyCipherClaimed]);

  useEffect(() => {
    if (!player) return;
    const currentLevel = player.level;
    const nextLevelRequirement = LEVEL_BALANCE_REQUIREMENTS[currentLevel];
    const requiredAds = calculateLevelUpAdsReq(currentLevel);
    
    if (nextLevelRequirement !== undefined && player.balance >= nextLevelRequirement) {
        if (player.levelUpAdsWatched >= requiredAds) {
            const updated = { ...player, level: player.level + 1, levelUpAdsWatched: 0 };
            setPlayer(updated);
            
            if (!isDeletingRef.current) savePlayerToSupabase(updated, upgradesRef.current);
            
            lastNotifiedLevelRef.current = 0; 
        } else {
            if (lastNotifiedLevelRef.current !== currentLevel) {
                setShowLevelAlert(true);
                lastNotifiedLevelRef.current = currentLevel;
                setTimeout(() => setShowLevelAlert(false), 10000);
            }
        }
    }

    const newTheme = getLevelTheme(player.level);
    if (newTheme !== theme) {
      setTheme(newTheme);
      const root = document.documentElement;
      const config = THEME_CONFIG[newTheme];
      root.style.setProperty('--bg-primary', config.primary);
      root.style.setProperty('--bg-secondary', config.secondary);
    }
  }, [player?.balance, player?.level, player?.levelUpAdsWatched]);
  
  useEffect(() => {
    const checkUrgency = () => {
      if (player?.lastRewardClaimed) {
        const timeSinceClaim = Date.now() - player.lastRewardClaimed;
        const remainingTime = 86400000 - timeSinceClaim;
        setIsRewardUrgent(remainingTime > 0 && remainingTime < 3600000); 
      }
    };
    checkUrgency();
    const interval = setInterval(checkUrgency, 60000); 
    return () => clearInterval(interval);
  }, [player?.lastRewardClaimed]);

  const updatePassiveIncome = useCallback((time: number) => {
    if (lastPassiveTimeRef.current !== undefined) {
      const deltaTime = (time - lastPassiveTimeRef.current) / 1000;
      setPlayer(prev => {
        if (!prev || prev.isBanned || isDeletingRef.current) return prev;

        const now = Date.now();
        const activeBoosts = prev.activeBoosts.filter(boost => boost.expiresAt > now);
        const totalPassivePerHour = activeBoosts
          .filter(boost => boost.type === 'passive_income')
          .reduce((sum, boost) => sum + (boost as { pph: number }).pph, prev.passivePerHour); 
        
        const income = (totalPassivePerHour / 3600) * deltaTime;
        const newEnergy = Math.min(prev.maxEnergy, prev.currentEnergy + (ENERGY_REGEN_RATE * deltaTime));
        return { ...prev, balance: prev.balance + income, currentEnergy: newEnergy, lastUpdate: Date.now(), activeBoosts };
      });
    }
    lastPassiveTimeRef.current = time;
    passiveUpdateRef.current = requestAnimationFrame(updatePassiveIncome);
  }, []);

  useEffect(() => {
    passiveUpdateRef.current = requestAnimationFrame(updatePassiveIncome);
    return () => {
      if (passiveUpdateRef.current) cancelAnimationFrame(passiveUpdateRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [updatePassiveIncome]);

  const handleClaimOfflineEarnings = () => {
      if (!player || !offlineEarnings) return;
      
      const updatedPlayer = { 
          ...player, 
          balance: player.balance + offlineEarnings,
          lastUpdate: Date.now()
      };
      
      setPlayer(updatedPlayer);
      setOfflineEarnings(null);
      triggerBalanceAnimation();
      
      if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
  };

  const handleHoldStart = () => {
    if (holdIntervalRef.current || !player || player.currentEnergy <= 0 || player.isBanned || isDeletingRef.current) return;
    accumulatedHoldRewardRef.current = 0;
    setCurrentHoldAmount(0);

    const now = Date.now();
    const activeCptBoost = player.activeBoosts.find(b => b.type === 'cpt' && b.expiresAt > now);
    const cptMultiplier = activeCptBoost ? (activeCptBoost as { multiplier: number }).multiplier : 1;

    holdIntervalRef.current = window.setInterval(() => {
      let earnings = 0;
      setPlayer(prev => {
        if (!prev || prev.currentEnergy <= 0) {
          handleHoldEnd();
          return prev;
        }
        const effectiveCPT = prev.coinsPerTap * cptMultiplier;
        earnings = effectiveCPT * HOLD_EARN_MULTIPLIER * prev.holdMultiplier;
        accumulatedHoldRewardRef.current += earnings;
        setCurrentHoldAmount(accumulatedHoldRewardRef.current);
        const newEnergy = Math.max(0, prev.currentEnergy - HOLD_ENERGY_DRAIN_PER_TICK);
        if (newEnergy === 0) handleHoldEnd();
        return { ...prev, currentEnergy: newEnergy };
      });
      if (earnings > 0) {
        const newText: FloatingText = { id: Date.now() + Math.random(), value: earnings };
        setFloatingTexts(prev => [...prev, newText]);
        setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== newText.id)), 1000);
      }
    }, HOLD_TICK_RATE_MS);
  };
  
  const handleHoldEnd = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (accumulatedHoldRewardRef.current > 0) {
      setPendingHoldReward(accumulatedHoldRewardRef.current);
      setIsClaimModalVisible(true);
    }
      setCurrentHoldAmount(0);
  };
  
  const handleClaimHoldReward = () => {
    if (!player || !pendingHoldReward) return;
    const updated = { ...player, balance: player.balance + pendingHoldReward };
    setPlayer(updated);
    triggerBalanceAnimation();
    setPendingHoldReward(null);
    setIsClaimModalVisible(false);
    accumulatedHoldRewardRef.current = 0;
    
    if (!isDeletingRef.current) savePlayerToSupabase(updated, upgradesRef.current);
  };

  const handleCancelHoldReward = () => {
    setPendingHoldReward(null);
    setIsClaimModalVisible(false);
    accumulatedHoldRewardRef.current = 0;
  };

  const buyUpgrade = (upgradeId: string) => {
    if (!player) return;
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const isStarCost = upgrade.costType === 'stars';
    const canAfford = isStarCost ? player.stars >= upgrade.cost : player.balance >= upgrade.cost;
    if (upgrade.level >= upgrade.maxLevel || !canAfford) return;

    const updatedPlayer = { ...player };
    if (isStarCost) updatedPlayer.stars -= upgrade.cost;
    else updatedPlayer.balance -= upgrade.cost;
      
    updatedPlayer.passivePerHour += (upgrade.profitPerHour || 0);
    updatedPlayer.coinsPerTap += (upgrade.cptBoost || 0);
    updatedPlayer.holdMultiplier += (upgrade.holdMultiplierBoost || 0);
    if (upgrade.id === 's5') updatedPlayer.hasOfflineEarnings = true;

    const newUpgrades = upgrades.map(u => u.id === upgradeId ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.6) } : u);

    setPlayer(updatedPlayer);
    setUpgrades(newUpgrades);
    
    if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, newUpgrades);
  };

  const processDealPurchase = (deal: StellarDeal) => {
    if (!player) return;
    let updatedPlayer = { ...player };
    if (deal.costType === 'stardust') updatedPlayer.balance -= deal.cost;
    if (deal.costType === 'stars') updatedPlayer.stars -= deal.cost;
    
     switch (deal.rewardType) {
        case 'energy_boost': updatedPlayer.currentEnergy = Math.min(updatedPlayer.maxEnergy, updatedPlayer.currentEnergy + (deal.rewardValue as number)); break;
        case 'stardust_boost': updatedPlayer.balance += (deal.rewardValue as number); triggerBalanceAnimation(); break;
        case 'cpt_boost':
          const cptReward = deal.rewardValue as { multiplier: number, duration: number };
          const newCptBoost: ActiveBoost = { sourceId: deal.id, type: 'cpt', multiplier: cptReward.multiplier, expiresAt: Date.now() + cptReward.duration };
          updatedPlayer.activeBoosts = updatedPlayer.activeBoosts.filter(b => b.type !== 'cpt');
          updatedPlayer.activeBoosts.push(newCptBoost);
          break;
        case 'passive_income_boost':
          const pphReward = deal.rewardValue as { pph: number, duration: number };
          const newPphBoost: ActiveBoost = { sourceId: deal.id, type: 'passive_income', pph: pphReward.pph, expiresAt: Date.now() + pphReward.duration };
          updatedPlayer.activeBoosts = updatedPlayer.activeBoosts.filter(b => b.type !== 'passive_income');
          updatedPlayer.activeBoosts.push(newPphBoost);
          break;
        case 'free_upgrade':
          const availableUpgrades = upgrades.filter(u => u.level < u.maxLevel && (!u.unlockLevel || player.level >= u.unlockLevel));
          if (availableUpgrades.length > 0) {
              const cheapestUpgrade = availableUpgrades.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
              updatedPlayer.passivePerHour += (cheapestUpgrade.profitPerHour || 0);
              updatedPlayer.coinsPerTap += (cheapestUpgrade.cptBoost || 0);
              updatedPlayer.holdMultiplier += (cheapestUpgrade.holdMultiplierBoost || 0);
              if (cheapestUpgrade.id === 's5') updatedPlayer.hasOfflineEarnings = true;
              setUpgrades(prevUpgrades => prevUpgrades.map(u => u.id === cheapestUpgrade.id ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.6) } : u));
          }
          break;
    }
    
    if (deal.cooldown) updatedPlayer.lastDealPurchases = { ...updatedPlayer.lastDealPurchases, [deal.id]: Date.now() };
    setPlayer(updatedPlayer);
    
    if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
  };

  const handleBuyStellarDeal = (deal: StellarDeal) => {
      if (!player) return;
      if (deal.cooldown) {
        const lastPurchase = player.lastDealPurchases[deal.id];
        if (lastPurchase && Date.now() - lastPurchase < deal.cooldown) return;
      }
      if (deal.unlockLevel && player.level < deal.unlockLevel) return;
      if (deal.costType === 'stardust' && player.balance < deal.cost) return;
      if (deal.costType === 'stars' && player.stars < deal.cost) return;
      
      if(deal.costType === 'ad') { setDealToProcess(deal); setIsDealAdModalVisible(true); }
      else processDealPurchase(deal);
  };
  
  const handleConfirmDealAd = () => { if(dealToProcess) processDealPurchase(dealToProcess); setIsDealAdModalVisible(false); setDealToProcess(null); };

  const handleClaimReward = () => {
    if (!player) return;
    
    const reward = dailyRewards[player.consecutiveDays % dailyRewards.length];
    const updatedPlayer = { ...player };

    if (reward.type === 'stars') updatedPlayer.stars += reward.amount;
    else {
      updatedPlayer.balance += (reward.amount * adminConfig.dailyRewardBase);
      triggerBalanceAnimation();
    }
    updatedPlayer.lastRewardClaimed = Date.now();
    updatedPlayer.consecutiveDays += 1;

    setPlayer(updatedPlayer);
    setView('Earn');
    
    if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
  };
  
  const handleSolveCipher = () => {
    if (!player || player.dailyCipherClaimed) return;
    
    const updated = { 
        ...player, 
        balance: player.balance + adminConfig.dailyCipherReward, 
        dailyCipherClaimed: true,
        lastCipherClaimed: Date.now() 
    } as any;
    
    setPlayer(updated);
    triggerBalanceAnimation();
    setView('Earn');
    
    if (!isDeletingRef.current) savePlayerToSupabase(updated, upgradesRef.current);
  };

  const handleActivateBooster = () => {
    if (!player) return;
    const updated = { ...player, currentEnergy: player.maxEnergy, lastBoosterClaimed: Date.now() };
    setPlayer(updated);
    
    if (!isDeletingRef.current) savePlayerToSupabase(updated, upgradesRef.current);
  };

  const handleWatchLevelUpAd = () => {
      if(!player) return;
      setPlayer(p => p ? ({ ...p, levelUpAdsWatched: p.levelUpAdsWatched + 1 }) : null);
  };

  const handleInitiateTask = (task: Task) => {
    if (!player) return;
    
    const rawChatId = (task as any).chatId || '';
    const cleanChatId = rawChatId.startsWith('@') ? rawChatId.replace('@', '') : rawChatId;
    const targetUrl = task.link || (cleanChatId && !cleanChatId.startsWith('-') ? `https://t.me/${cleanChatId}` : '');

    if (task.type === 'youtube_video' || task.type === 'youtube_shorts') {
      setPendingTasks(prev => [...new Set([...prev, task.id])]);
      if (task.link) window.open(task.link, '_blank');
      return;
    }
    if (task.type === 'telegram') {
        const isPending = pendingTasks.includes(task.id);
        if (isPending) {
            const updatedPlayer = { ...player, balance: player.balance + task.reward, hasFollowedTelegram: true, taskProgress: { ...player.taskProgress, [task.id]: 1 } };
            setPlayer(updatedPlayer);
            triggerBalanceAnimation();
            setPendingTasks(prev => prev.filter(id => id !== task.id)); 
            
            if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
        } else {
            setPendingTasks(prev => [...new Set([...prev, task.id])]);
            if (targetUrl) {
                 if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(targetUrl);
                 else if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(targetUrl);
                 else window.open(targetUrl, '_blank');
            }
        }
        return;
    }
    if (task.type === 'ads') {
        setPlayer(prev => {
            if (!prev) return null;
            let updatedPlayer = { ...prev };
            const currentProgress = updatedPlayer.taskProgress[task.id] || 0;
            updatedPlayer.taskProgress = { ...updatedPlayer.taskProgress, [task.id]: currentProgress + 1 };
            updatedPlayer.lastAdWatched = Date.now();
            
            if (updatedPlayer.taskProgress[task.id] >= (task.dailyLimit || 1)) {
                updatedPlayer.balance += task.reward;
                triggerBalanceAnimation();
            }
            
            if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
            return updatedPlayer;
        });
    }
  };

  const handleCancelTask = (taskId: string) => {
    setPendingTasks(prev => prev.filter(id => id !== taskId));
  };

  const handleClaimTask = (taskId: string, code: string): boolean => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;
    const requiredCode = task.secretCode || '1234';
    if (code !== requiredCode) return false;

    if(!player) return false;
    const updatedPlayer = { ...player, balance: player.balance + task.reward };
    updatedPlayer.taskProgress = { ...updatedPlayer.taskProgress, [task.id]: (updatedPlayer.taskProgress[task.id] || 0) + 1 };
    
    setPlayer(updatedPlayer);
    triggerBalanceAnimation();
    setPendingTasks(prev => prev.filter(id => id !== taskId));
    
    if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
    return true;
  };
  
  const handleWithdrawal = (withdrawal: Omit<Withdrawal, 'id' | 'timestamp' | 'status' | 'telegramId' | 'username'>) => {
    if (!player) return;
    if (player.lastWithdrawalTime && Date.now() - player.lastWithdrawalTime < WITHDRAWAL_COOLDOWN_MS) return; 
    
    const newWithdrawal: Withdrawal = { ...withdrawal, id: `wd_${Date.now()}`, timestamp: Date.now(), status: 'Pending', telegramId: player.telegramId, username: player.username };
    
    const updated = {
        ...player,
        balance: player.balance - withdrawal.amountStardust,
        withdrawalHistory: [newWithdrawal, ...player.withdrawalHistory],
        lastWithdrawalTime: Date.now()
    };
    setPlayer(updated);
    setGlobalWithdrawals(prev => [newWithdrawal, ...prev]);
    
    if (!isDeletingRef.current) savePlayerToSupabase(updated, upgradesRef.current);
  };

  // ✅ FIX: Securly Delete Account Logic
  const handleDeleteAccount = async () => {
      if (!player) return;
      
      // Stop the auto-saver from running to prevent the account from respawning
      isDeletingRef.current = true;
      setCanSave(false); 

      try {
          // Permanently erase the row from Supabase Database
          const { error } = await supabase.from('players').delete().eq('telegramid', player.telegramId);
          if (error) throw error;
          
          // Clear all local web app data cache
          localStorage.clear();
          sessionStorage.clear();
          
          // Show alert and close/refresh WebApp
          if (window.Telegram?.WebApp?.showAlert) {
              window.Telegram.WebApp.showAlert("Account successfully deleted. The app will now reload.", () => {
                  window.location.replace(window.location.pathname + "?t=" + Date.now());
              });
          } else {
              window.location.replace(window.location.pathname + "?t=" + Date.now());
          }
      } catch (e) {
          console.error("Failed to delete account", e);
          alert("Failed to delete account. Please check your connection and try again.");
          isDeletingRef.current = false;
          setCanSave(true);
      }
  };

  if (showIntro) return <IntroScreen isDataReady={!!player} onFinished={() => setShowIntro(false)} isDarkMode={isDarkMode} />;
  if (!player) return <div className="flex h-screen items-center justify-center text-cyan-400 font-bold animate-pulse">RE-ESTABLISHING UPLINK...</div>;
  if (player.isBanned) return <div className="fixed inset-0 bg-red-950 flex flex-col items-center justify-center p-6 text-center z-[1000]"><span className="text-6xl mb-4">🚫</span><h1 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2">ACCESS DENIED</h1></div>;

  const isMaintenanceActive = adminConfig.maintenanceMode && 
                              adminConfig.maintenanceEndTime && 
                              Date.now() < adminConfig.maintenanceEndTime;

  if (isMaintenanceActive && player.telegramId !== ADMIN_ID) {
      return (
          <MaintenanceScreen 
              endTime={adminConfig.maintenanceEndTime as number} 
              isDarkMode={isDarkMode}
              onFinished={() => setAdminConfig(prev => ({ ...prev, maintenanceMode: false }))} 
          />
      );
  }

  const isRewardAvailable = !player.lastRewardClaimed || Date.now() - player.lastRewardClaimed > 86400000;
  
  const handleOpenAdmin = () => { if (player.telegramId === ADMIN_ID) setView('Admin'); else alert("Access Denied."); };

  const renderView = () => {
    switch(view) {
      case 'Earn': return (
        <EarnView 
            player={player} 
            onHoldStart={handleHoldStart} 
            onHoldEnd={handleHoldEnd} 
            floatingTexts={floatingTexts} 
            onDailyRewardClick={() => setView('DailyReward')} 
            onCipherClick={() => setView('DailyCipher')} 
            isRewardAvailable={isRewardAvailable} 
            onActivateBooster={handleActivateBooster} 
            pendingHoldReward={pendingHoldReward} 
            isClaimModalVisible={isClaimModalVisible} 
            onClaimHoldReward={handleClaimHoldReward} 
            onCancelHoldReward={handleCancelHoldReward} 
            currentHoldAmount={currentHoldAmount} 
            isRewardUrgent={isRewardUrgent} 
            isCipherClaimed={player.dailyCipherClaimed} 
            theme={theme} 
            onShowAd={handleShowAd}
            isDarkMode={isDarkMode}
            toggleTheme={toggleThemeMode}
        />
      );
      case 'Upgrades': return (
        <UpgradesView 
            upgrades={upgrades} 
            stellarDeals={stellarDeals} 
            player={player} 
            onBuy={buyUpgrade} 
            onBuyStellarDeal={handleBuyStellarDeal} 
            isDealAdModalVisible={isDealAdModalVisible} 
            dealToProcess={dealToProcess} 
            onConfirmDealAd={handleConfirmDealAd} 
            onCancelDealAd={() => setIsDealAdModalVisible(false)} 
            theme={theme} 
            onShowAd={handleShowAd} 
        />
      );
      case 'Tasks': return (
        <TasksView 
            player={player} 
            onInitiateTask={handleInitiateTask} 
            onClaimTask={handleClaimTask} 
            onCancelTask={handleCancelTask} 
            onWatchLevelUpAd={handleWatchLevelUpAd} 
            pendingTasks={pendingTasks} 
            theme={theme} 
            tasks={tasks} 
            onShowAd={handleShowAd} 
        />
      );
      case 'Leaderboard': return (
        <LeaderboardView 
            player={player} 
            theme={theme} 
            referralReward={adminConfig.referralRewardStars} 
            leaderboardData={allPlayers} 
            userRank={userRank} 
        />
      );
      case 'Wallet': return (
        <WalletView 
            player={player} 
            onWithdraw={handleWithdrawal} 
            theme={theme} 
            minWithdrawal={adminConfig.minWithdrawalTon} 
            onShowAd={handleShowAd} 
        />
      );
      case 'DailyReward': return (
        <DailyRewardView 
            player={player} 
            onClaim={handleClaimReward} 
            onBack={() => setView('Earn')} 
            isRewardAvailable={isRewardAvailable} 
            theme={theme} 
            rewards={dailyRewards} 
        />
      );
      case 'DailyCipher': return (
        <DailyCipherView 
            onSolve={handleSolveCipher} 
            onBack={() => setView('Earn')} 
            isCipherClaimed={player.dailyCipherClaimed} 
            theme={theme} 
            cipherWord={adminConfig.dailyCipherWord} 
        />
      );
      case 'Admin': 
        if (player.telegramId !== ADMIN_ID) return null;
        return (
            <AdminView 
                config={adminConfig} setConfig={setAdminConfig}
                tasks={tasks} setTasks={setTasks}
                stellarDeals={stellarDeals} setStellarDeals={setStellarDeals}
                upgrades={upgrades} setUpgrades={setUpgrades}
                withdrawals={globalWithdrawals} setWithdrawals={setGlobalWithdrawals}
                players={allPlayers} setPlayers={setAllPlayers}
                dailyRewards={dailyRewards} setDailyRewards={setDailyRewards}
                onBack={() => setView('Earn')}
            />
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden relative">
      
      {isProfileModalVisible && (
          <ProfileModal 
              player={player} 
              onClose={() => setIsProfileModalVisible(false)} 
              onDelete={handleDeleteAccount}
              isDarkMode={isDarkMode}
              theme={theme}
          />
      )}

      {offlineEarnings !== null && (
          <OfflineEarningsModal 
              amount={offlineEarnings} 
              onClaim={handleClaimOfflineEarnings} 
              isDarkMode={isDarkMode} 
          />
      )}

      {adminConfig.demoMode && (
          <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[1000] bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] pointer-events-none animate-pulse">
            Demo Mode Active
          </div>
      )}

      {showLevelAlert && (
          <div className="absolute top-[80px] left-4 right-4 z-[100] pointer-events-auto">
             <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-${theme}-400 dark:border-${theme}-500/80 shadow-[0_0_25px_0px_var(--tw-shadow-color)] shadow-${theme}-400/50 dark:shadow-${theme}-500/40 p-4 rounded-2xl flex items-center gap-3 animate-slide-down-fade`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 animate-pulse flex-shrink-0">
                   🚀
                </div>
                <div className="flex flex-col flex-1">
                   <h4 className={`text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm drop-shadow-sm`}>Level {player.level + 1} Ready!</h4>
                   <p className="text-slate-600 dark:text-slate-400 text-[9px] uppercase font-bold tracking-wider mt-0.5 leading-tight">
                      Go to missions and complete the security check to unlock.
                   </p>
                </div>
                <button 
                   onClick={() => {
                      setView('Tasks');
                      setShowLevelAlert(false);
                   }} 
                   className={`bg-gradient-to-r from-${theme}-500 to-${theme}-600 dark:from-${theme}-600 dark:to-${theme}-400 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-${theme}-500/30 active:scale-95 transition-transform flex-shrink-0`}
                >
                   GO
                </button>
             </div>
             <style>{`
                @keyframes slideDownFade {
                  0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
                  100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-slide-down-fade {
                  animation: slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
             `}</style>
          </div>
      )}

      <div className='flex flex-col h-full'>
        {view !== 'DailyReward' && view !== 'DailyCipher' && view !== 'Admin' && (
          <StatsHeader 
            player={player} 
            animateBalance={animateBalance} 
            theme={theme} 
            onOpenAdmin={handleOpenAdmin} 
            showAdminLock={player.telegramId === ADMIN_ID} 
            onOpenProfile={() => setIsProfileModalVisible(true)}
          />
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
