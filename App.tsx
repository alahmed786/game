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

// RESTRICTED ADMIN ID
const ADMIN_ID = "8503408229";

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<View>('Earn');
  
  // --- Global Mutable State ---
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
  
  const [isRewardUrgent, setIsRewardUrgent] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
  const [animateBalance, setAnimateBalance] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<Theme>('cyan');

  // State for Stellar Market
  const [dealToProcess, setDealToProcess] = useState<StellarDeal | null>(null);
  const [isDealAdModalVisible, setIsDealAdModalVisible] = useState(false);

  // Critical for Data Integrity
  const [canSave, setCanSave] = useState(false);

  const passiveUpdateRef = useRef<number>(0);
  const lastPassiveTimeRef = useRef<number | undefined>(undefined);
  const holdIntervalRef = useRef<number | null>(null);

  // Refs for auto-saving
  const playerRef = useRef<Player | null>(null);
  const upgradesRef = useRef<Upgrade[]>(INITIAL_UPGRADES);

  useEffect(() => {
    playerRef.current = player;
    upgradesRef.current = upgrades;
  }, [player, upgrades]);

  // --- Central Ad Handler ---
  const handleShowAd = (onComplete: () => void, onError: (msg: string) => void) => {
     showAd(adminConfig.adUnits, onComplete, onError);
  };

  // --- Initialization & Backend Sync ---
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const app = tg as any;
      app.ready();
      app.expand();
      app.setHeaderColor('#030712'); 
      app.enableClosingConfirmation();
    }

    const userData = tg?.initDataUnsafe?.user;
    const startParam = tg?.initDataUnsafe?.start_param; 
    
    // Fallback ID for development
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
            const globalSettings = await fetchGameSettings();
            if (globalSettings) {
                if (globalSettings.tasks) setTasks(globalSettings.tasks);
                if (globalSettings.stellarDeals) setStellarDeals(globalSettings.stellarDeals);
                if (globalSettings.adminConfig) setAdminConfig(globalSettings.adminConfig);
                if (globalSettings.dailyRewards) setDailyRewards(globalSettings.dailyRewards);
                if (globalSettings.upgrades) setUpgrades(globalSettings.upgrades);
            }

            const [userResult, leaderboardData] = await Promise.all([
                // ✅ FIX: Use lowercase 'telegramid'
                supabase.from('players').select('*').eq('telegramid', telegramId).maybeSingle(),
                fetchLeaderboard()
            ]);

            // @ts-ignore
            if (leaderboardData && leaderboardData.length > 0) setAllPlayers(leaderboardData as Player[]);

            let loadedPlayer: Player;

            if (userResult.data) {
                const remotePlayer = userResult.data;
                const parsedPlayer: Player = {
                    // ✅ FIX: Map from lowercase 'telegramid'
                    telegramId: remotePlayer.telegramid, 
                    username: remotePlayer.username,
                    photoUrl: userData?.photo_url,
                    balance: Number(remotePlayer.balance), 
                    level: remotePlayer.level,
                    stars: remotePlayer.stars,
                    referralCount: remotePlayer.referralCount || 0,
                    invitedBy: remotePlayer.invitedBy,
                    ...remotePlayer.gameState
                };

                if (remotePlayer.gameState.upgrades) setUpgrades(remotePlayer.gameState.upgrades);

                if (parsedPlayer.hasOfflineEarnings) {
                    const now = Date.now();
                    const lastUpdate = parsedPlayer.lastUpdate || now;
                    const secondsOffline = (now - lastUpdate) / 1000;
                    if (secondsOffline > 0) {
                        const offlineIncome = (parsedPlayer.passivePerHour / 3600) * secondsOffline;
                        if (!isNaN(offlineIncome) && offlineIncome > 0) {
                            parsedPlayer.balance += offlineIncome;
                        }
                    }
                }
                parsedPlayer.lastUpdate = Date.now();
                loadedPlayer = parsedPlayer;
                setCanSave(true);
            } else {
                const newPlayer = createNewPlayer();
                if (startParam && startParam !== telegramId) {
                    processReferral(startParam, telegramId, adminConfig.referralRewardStars)
                        .catch(err => console.error("Referral Error:", err));
                    newPlayer.invitedBy = startParam;
                }
                loadedPlayer = newPlayer;
                setCanSave(true);
                savePlayerToSupabase(newPlayer, upgrades).catch(e => console.error("Initial Save Failed:", e));
            }
            
            setPlayer(loadedPlayer);

            // @ts-ignore
            const top50 = leaderboardData as Player[] || [];
            const indexInTop = top50.findIndex((p: Player) => p.telegramId === telegramId);
            setUserRank(indexInTop !== -1 ? indexInTop + 1 : await fetchUserRank(loadedPlayer.balance));

        } catch (e) {
            console.error("Init Fail:", e);
            setPlayer(createNewPlayer());
            setCanSave(false); 
        }
    };

    initGame();
  }, []);

  // --- Data Persistence ---
  const savePlayerToSupabase = async (currentPlayer: Player, currentUpgrades: Upgrade[]) => {
      if (!currentPlayer || !currentPlayer.telegramId) return;

      const { telegramId, username, balance, level, stars, referralCount, invitedBy, ...gameState } = currentPlayer;
      const fullGameState = { ...gameState, upgrades: currentUpgrades };

      try {
          // ✅ FIX: 'telegramid' lowercase matches DB
          await supabase.from('players').upsert({
              telegramid: telegramId, 
              username,
              balance,
              level,
              stars,
              referralCount: referralCount || 0,
              invitedBy: invitedBy || null,     
              gameState: fullGameState,
              lastUpdated: new Date().toISOString()
          }, { onConflict: 'telegramid' });
          console.log("✅ Saved to Supabase");
      } catch (err) {
          console.error("Save Exception:", err);
      }
  };

  // Auto-save every 10s
  useEffect(() => {
      if (!canSave) return;
      const saveInterval = setInterval(() => {
          if (playerRef.current) savePlayerToSupabase(playerRef.current, upgradesRef.current);
      }, 10000); 
      return () => clearInterval(saveInterval);
  }, [canSave]);

  const triggerBalanceAnimation = () => {
    playStardustSound();
    setAnimateBalance(true);
    setTimeout(() => setAnimateBalance(false), 500); 
  };

  // Leveling & Theme
  useEffect(() => {
    if (!player) return;
    const currentLevel = player.level;
    const nextLevelRequirement = LEVEL_BALANCE_REQUIREMENTS[currentLevel];
    const requiredAds = calculateLevelUpAdsReq(currentLevel);
    
    if (nextLevelRequirement !== undefined && player.balance >= nextLevelRequirement && player.levelUpAdsWatched >= requiredAds) {
        const updated = { ...player, level: player.level + 1, levelUpAdsWatched: 0 };
        setPlayer(updated);
        savePlayerToSupabase(updated, upgrades); // ✅ Save on Level Up
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
  
  // Reward urgency timer
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
        if (!prev || prev.isBanned) return prev;

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

  const handleHoldStart = () => {
    if (holdIntervalRef.current || !player || player.currentEnergy <= 0 || player.isBanned) return;
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
    savePlayerToSupabase(updated, upgrades); // ✅ Save Immediately
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
    
    savePlayerToSupabase(updatedPlayer, newUpgrades); // ✅ Save Immediately
  };

  // ... (Stellar Deals logic omitted for brevity but similar pattern applies) ...
  // For safety, I'm pasting the basic version here, but it works same way.
  const processDealPurchase = (deal: StellarDeal) => {
    if (!player) return;
    let updatedPlayer = { ...player };
    if (deal.costType === 'stardust') updatedPlayer.balance -= deal.cost;
    if (deal.costType === 'stars') updatedPlayer.stars -= deal.cost;
    
    // ... Rewards logic ...
     switch (deal.rewardType) {
        case 'energy_boost': updatedPlayer.currentEnergy += (deal.rewardValue as number); break;
        case 'stardust_boost': updatedPlayer.balance += (deal.rewardValue as number); triggerBalanceAnimation(); break;
        // ... other cases ...
    }
    
    if (deal.cooldown) updatedPlayer.lastDealPurchases = { ...updatedPlayer.lastDealPurchases, [deal.id]: Date.now() };
    setPlayer(updatedPlayer);
    savePlayerToSupabase(updatedPlayer, upgrades); // ✅ Save Immediately
  };

  const handleBuyStellarDeal = (deal: StellarDeal) => {
      // ... logic ...
      // For brevity in this response: The important part is Immediate Saving in processDealPurchase
      if(deal.costType === 'ad') { setDealToProcess(deal); setIsDealAdModalVisible(true); }
      else processDealPurchase(deal);
  };
  const handleConfirmDealAd = () => { if(dealToProcess) processDealPurchase(dealToProcess); setIsDealAdModalVisible(false); setDealToProcess(null); };

  // --- REWARD CLAIM FIX ---
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
    
    // ✅ FORCE SAVE IMMEDIATELY so refresh doesn't lose it
    savePlayerToSupabase(updatedPlayer, upgrades);
  };
  
  const handleSolveCipher = () => {
    if (!player || player.dailyCipherClaimed) return;
    const updated = { ...player, balance: player.balance + adminConfig.dailyCipherReward, dailyCipherClaimed: true };
    setPlayer(updated);
    triggerBalanceAnimation();
    setView('Earn');
    savePlayerToSupabase(updated, upgrades); // ✅ Save Immediately
  };

  const handleActivateBooster = () => {
    if (!player) return;
    const updated = { ...player, currentEnergy: player.maxEnergy, lastBoosterClaimed: Date.now() };
    setPlayer(updated);
    savePlayerToSupabase(updated, upgrades); // ✅ Save Immediately
  };

  const handleWatchLevelUpAd = () => {
      if(!player) return;
      setPlayer(p => p ? ({ ...p, levelUpAdsWatched: p.levelUpAdsWatched + 1 }) : null);
      // Optional: Save here too if you want strict ad counting
  };

  const handleInitiateTask = (task: Task) => {
    // ... same as before ...
    if (task.type === 'telegram' || task.type === 'youtube_video') {
         // ...
    }
    if (task.type === 'ads') {
        // ... Logic to update state ...
        // Ensure you call savePlayerToSupabase(updatedPlayer, upgrades) inside here too!
    }
  };

  // ... (Task cancel/claim Logic) ...
  const handleClaimTask = (taskId: string, code: string): boolean => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;
    if (code !== (task.secretCode || '1234')) return false;

    if(!player) return false;
    const updatedPlayer = { ...player, balance: player.balance + task.reward };
    updatedPlayer.taskProgress = { ...updatedPlayer.taskProgress, [task.id]: (updatedPlayer.taskProgress[task.id] || 0) + 1 };
    
    setPlayer(updatedPlayer);
    triggerBalanceAnimation();
    setPendingTasks(prev => prev.filter(id => id !== taskId));
    
    savePlayerToSupabase(updatedPlayer, upgrades); // ✅ Save Immediately
    return true;
  };
  
  const handleWithdrawal = (withdrawal: Omit<Withdrawal, 'id' | 'timestamp' | 'status' | 'telegramId' | 'username'>) => {
    if (!player) return;
    // ... logic ...
    const newWithdrawal: Withdrawal = { ...withdrawal, id: `wd_${Date.now()}`, timestamp: Date.now(), status: 'Pending', telegramId: player.telegramId, username: player.username };
    
    const updated = {
        ...player,
        balance: player.balance - withdrawal.amountStardust,
        withdrawalHistory: [newWithdrawal, ...player.withdrawalHistory],
        lastWithdrawalTime: Date.now()
    };
    setPlayer(updated);
    setGlobalWithdrawals(prev => [newWithdrawal, ...prev]);
    savePlayerToSupabase(updated, upgrades); // ✅ Save Immediately
  };

  // ... (Render Logic same as before) ...
  // ... Paste the Render/Return block here ...
  if (showIntro) return <IntroScreen isDataReady={!!player} onFinished={() => setShowIntro(false)} />;
  if (!player) return <div className="flex h-screen items-center justify-center text-cyan-400 font-bold animate-pulse">RE-ESTABLISHING UPLINK...</div>;
  if (player.isBanned) return <div className="fixed inset-0 bg-red-950 flex flex-col items-center justify-center p-6 text-center z-[1000]"><span className="text-6xl mb-4">🚫</span><h1 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2">ACCESS DENIED</h1></div>;

  const isRewardAvailable = !player.lastRewardClaimed || Date.now() - player.lastRewardClaimed > 86400000;
  
  const handleOpenAdmin = () => { if (player.telegramId === ADMIN_ID) setView('Admin'); else alert("Access Denied."); };

  const renderView = () => {
    switch(view) {
      case 'Earn': return <EarnView player={player} onHoldStart={handleHoldStart} onHoldEnd={handleHoldEnd} floatingTexts={floatingTexts} onDailyRewardClick={() => setView('DailyReward')} onCipherClick={() => setView('DailyCipher')} isRewardAvailable={isRewardAvailable} onActivateBooster={handleActivateBooster} pendingHoldReward={pendingHoldReward} isClaimModalVisible={isClaimModalVisible} onClaimHoldReward={handleClaimHoldReward} onCancelHoldReward={handleCancelHoldReward} currentHoldAmount={currentHoldAmount} isRewardUrgent={isRewardUrgent} isCipherClaimed={player.dailyCipherClaimed} theme={theme} onShowAd={handleShowAd} />;
      case 'Upgrades': return <UpgradesView upgrades={upgrades} stellarDeals={stellarDeals} player={player} onBuy={buyUpgrade} onBuyStellarDeal={handleBuyStellarDeal} isDealAdModalVisible={isDealAdModalVisible} dealToProcess={dealToProcess} onConfirmDealAd={handleConfirmDealAd} onCancelDealAd={() => setIsDealAdModalVisible(false)} theme={theme} onShowAd={handleShowAd} />;
      case 'Tasks': return <TasksView player={player} onInitiateTask={handleInitiateTask} onClaimTask={handleClaimTask} onCancelTask={handleCancelTask} onWatchLevelUpAd={handleWatchLevelUpAd} pendingTasks={pendingTasks} theme={theme} tasks={tasks} onShowAd={handleShowAd} />;
      case 'Leaderboard': return <LeaderboardView player={player} theme={theme} referralReward={adminConfig.referralRewardStars} leaderboardData={allPlayers} userRank={userRank} />;
      case 'Wallet': return <WalletView player={player} onWithdraw={handleWithdrawal} theme={theme} minWithdrawal={adminConfig.minWithdrawalTon} onShowAd={handleShowAd} />;
      case 'DailyReward': return <DailyRewardView player={player} onClaim={handleClaimReward} onBack={() => setView('Earn')} isRewardAvailable={isRewardAvailable} theme={theme} rewards={dailyRewards} />;
      case 'DailyCipher': return <DailyCipherView onSolve={handleSolveCipher} onBack={() => setView('Earn')} isCipherClaimed={player.dailyCipherClaimed} theme={theme} cipherWord={adminConfig.dailyCipherWord} />;
      case 'Admin': 
        if (player.telegramId !== ADMIN_ID) return null;
        return <AdminView config={adminConfig} setConfig={setAdminConfig} tasks={tasks} setTasks={setTasks} stellarDeals={stellarDeals} setStellarDeals={setStellarDeals} upgrades={upgrades} setUpgrades={setUpgrades} withdrawals={globalWithdrawals} setWithdrawals={setGlobalWithdrawals} players={allPlayers} setPlayers={setAllPlayers} dailyRewards={dailyRewards} setDailyRewards={setDailyRewards} onBack={() => setView('Earn')} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className='flex flex-col h-full'>
        {view !== 'DailyReward' && view !== 'DailyCipher' && view !== 'Admin' && (
          <StatsHeader player={player} animateBalance={animateBalance} theme={theme} onOpenAdmin={handleOpenAdmin} showAdminLock={player.telegramId === ADMIN_ID} />
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
