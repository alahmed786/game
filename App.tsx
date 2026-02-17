
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Upgrade, View, FloatingText, Task, StellarDeal, ActiveBoost, Withdrawal, Theme, AdminConfig } from './types';
import { 
  INITIAL_UPGRADES, ENERGY_REGEN_RATE, INITIAL_DAILY_REWARDS, INITIAL_TASKS, INITIAL_STELLAR_DEALS, INITIAL_ADMIN_CONFIG,
  HOLD_TICK_RATE_MS, HOLD_ENERGY_DRAIN_PER_TICK, HOLD_EARN_MULTIPLIER, LEVEL_BALANCE_REQUIREMENTS,
  BOOSTER_CLAIM_COOLDOWN, MAX_ENERGY, THEME_CONFIG, getLevelTheme, calculateLevelUpAdsReq, WITHDRAWAL_COOLDOWN_MS
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
import { supabase, logError, fetchLeaderboard, processReferral } from './utils/supabase';

declare global {
  interface Window {
    Telegram: any;
  }
}

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
  const [allPlayers, setAllPlayers] = useState<Player[]>([]); // Leaderboard Data

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

  // Critical for Data Integrity: If fetch fails, do NOT save over DB data
  const [canSave, setCanSave] = useState(false);

  const passiveUpdateRef = useRef<number>();
  const lastPassiveTimeRef = useRef<number>();
  const holdIntervalRef = useRef<number | null>(null);

  // --- Central Ad Handler ---
  const handleShowAd = (onComplete: () => void, onError: (msg: string) => void) => {
     showAd(adminConfig.adUnits, onComplete, onError);
  };

  // --- Error Logging Setup ---
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global Error Caught:", event.error);
      logError(event.message, event.error?.stack, player?.telegramId || 'unknown');
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Global Rejection Caught:", event.reason);
      logError(`Unhandled Rejection: ${event.reason}`, undefined, player?.telegramId || 'unknown');
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [player?.telegramId]);

  // --- Initialization & Backend Sync ---
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      // Cast to any to avoid TypeScript argument errors with some definitions
      const app = tg as any;
      app.ready();
      app.expand();
      app.setHeaderColor('#030712'); 
      app.enableClosingConfirmation();
    }

    const userData = tg?.initDataUnsafe?.user;
    const startParam = tg?.initDataUnsafe?.start_param; 
    
    // Ensure we have a consistent ID. For dev, use a fixed ID.
    const telegramId = userData?.id?.toString() || 'dev_user_123';
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
            // Fetch User and Leaderboard in parallel
            // NOTE: We check for error explicitly to avoid overwriting data on network fail
            const [userResult, leaderboardData] = await Promise.all([
                supabase.from('players').select('*').eq('telegramId', telegramId).single(),
                fetchLeaderboard()
            ]);

            // @ts-ignore
            if (leaderboardData && leaderboardData.length > 0) {
                 // @ts-ignore
                 setAllPlayers(leaderboardData as Player[]);
            }

            if (userResult.data) {
                // Existing Player Found - Sync Data
                const remotePlayer = userResult.data;
                const parsedPlayer: Player = {
                    telegramId: remotePlayer.telegramId,
                    username: remotePlayer.username,
                    photoUrl: userData?.photo_url, // Always update photo
                    balance: remotePlayer.balance,
                    level: remotePlayer.level,
                    stars: remotePlayer.stars,
                    referralCount: remotePlayer.referralCount || 0,
                    invitedBy: remotePlayer.invitedBy,
                    ...remotePlayer.gameState
                };

                if (remotePlayer.gameState.upgrades) {
                    setUpgrades(remotePlayer.gameState.upgrades);
                }

                // Calculate Offline Earnings
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
                setPlayer(parsedPlayer);
                setCanSave(true); // Data loaded successfully, enabling auto-save

            } else if (userResult.error && userResult.error.code !== 'PGRST116') {
                // Real Error (Network, API down, etc.) - NOT "Row not found"
                console.error("Critical Supabase Error:", userResult.error);
                // Load temporary profile but DISABLE saving to prevent overwrite
                setPlayer(createNewPlayer());
                setCanSave(false);
                alert("Connection Error. Progress will NOT be saved. Please reload.");
            } else {
                // New Player (Row not found)
                console.log("Creating New Player Profile...");
                const newPlayer = createNewPlayer();
                
                // Handle Referral (Only for new players)
                if (startParam && startParam !== telegramId) {
                    processReferral(startParam, telegramId, adminConfig.referralRewardStars)
                        .catch(err => console.error("Referral Error:", err));
                    newPlayer.invitedBy = startParam;
                }

                setPlayer(newPlayer);
                // Safe to save a brand new player
                setCanSave(true);
                savePlayerToSupabase(newPlayer, upgrades).catch(console.warn);
            }

        } catch (e) {
            console.error("Initialization Critical Failure:", e);
            // Fallback for completely offline usage
            setPlayer(createNewPlayer());
            setCanSave(false); 
        }
    };

    initGame();
  }, []);

  // --- Data Persistence ---
  const savePlayerToSupabase = async (currentPlayer: Player, currentUpgrades: Upgrade[]) => {
      if (!canSave) return; // Prevent overwriting if initial load failed

      const { telegramId, username, balance, level, stars, referralCount, invitedBy, ...gameState } = currentPlayer;
      const fullGameState = { ...gameState, upgrades: currentUpgrades };

      await supabase.from('players').upsert({
          telegramId,
          username,
          balance,
          level,
          stars,
          referralCount,
          invitedBy,
          gameState: fullGameState,
          lastUpdated: new Date().toISOString()
      });
  };

  useEffect(() => {
      const saveInterval = setInterval(() => {
          if (player && canSave) {
              savePlayerToSupabase(player, upgrades);
          }
      }, 10000); // Autosave every 10s
      return () => clearInterval(saveInterval);
  }, [player, upgrades, canSave]);

  // Payment Handler (Mock)
  const handleBuyStars = async (packageId: string, amount: number, cost: number) => {
      const confirmed = window.confirm(`Simulate Payment of $${cost} for ${amount} Stars?`);
      if (confirmed) {
          setPlayer(prev => {
              if(!prev) return null;
              return { ...prev, stars: prev.stars + amount };
          });
          alert(`Success! ${amount} Stars added to your account.`);
          triggerBalanceAnimation();
      }
  };

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
    
    if (nextLevelRequirement !== undefined && 
        player.balance >= nextLevelRequirement && 
        player.levelUpAdsWatched >= requiredAds) {
          
        setPlayer(p => p ? ({ ...p, level: p.level + 1, levelUpAdsWatched: 0 }) : null);
    }

    const newTheme = getLevelTheme(player.level);
    if (newTheme !== theme) {
      setTheme(newTheme);
      const root = document.documentElement;
      const config = THEME_CONFIG[newTheme];
      root.style.setProperty('--bg-primary', config.primary);
      root.style.setProperty('--bg-secondary', config.secondary);
    }
  }, [player?.balance, player?.level, player?.levelUpAdsWatched, player]);
  
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
        if (!prev) return null;
        if (prev.isBanned) return prev;

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
    setPlayer(prev => prev ? ({ ...prev, balance: prev.balance + pendingHoldReward }) : null);
    triggerBalanceAnimation();
    setPendingHoldReward(null);
    setIsClaimModalVisible(false);
    accumulatedHoldRewardRef.current = 0;
  };

  const handleCancelHoldReward = () => {
    setPendingHoldReward(null);
    setIsClaimModalVisible(false);
    accumulatedHoldRewardRef.current = 0;
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    setPlayer(prevPlayer => {
      if (!prevPlayer) return null;
      
      const isStarCost = upgrade.costType === 'stars';
      const canAfford = isStarCost ? prevPlayer.stars >= upgrade.cost : prevPlayer.balance >= upgrade.cost;

      if (upgrade.level >= upgrade.maxLevel || !canAfford) return prevPlayer;

      const updatedPlayer = { ...prevPlayer };
      if (isStarCost) updatedPlayer.stars -= upgrade.cost;
      else updatedPlayer.balance -= upgrade.cost;
      
      updatedPlayer.passivePerHour += (upgrade.profitPerHour || 0);
      updatedPlayer.coinsPerTap += (upgrade.cptBoost || 0);
      updatedPlayer.holdMultiplier += (upgrade.holdMultiplierBoost || 0);
      if (upgrade.id === 's5') updatedPlayer.hasOfflineEarnings = true;
      
      return updatedPlayer;
    });

    setUpgrades(prev => prev.map(u => u.id === upgradeId ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.6) } : u));
  };

  const processDealPurchase = (deal: StellarDeal) => {
    if (!player) return;
    setPlayer(prev => {
      if (!prev) return null;
      let updatedPlayer = { ...prev };

      if (deal.costType === 'stardust') updatedPlayer.balance -= deal.cost;
      if (deal.costType === 'stars') updatedPlayer.stars -= deal.cost;
      
      switch (deal.rewardType) {
        case 'energy_boost':
          updatedPlayer.currentEnergy = Math.min(updatedPlayer.maxEnergy, updatedPlayer.currentEnergy + (deal.rewardValue as number));
          break;
        case 'stardust_boost':
          updatedPlayer.balance += (deal.rewardValue as number);
          triggerBalanceAnimation();
          break;
        case 'cpt_boost':
          const cptReward = deal.rewardValue as { multiplier: number, duration: number };
          const newCptBoost: ActiveBoost = {
            sourceId: deal.id,
            type: 'cpt',
            multiplier: cptReward.multiplier,
            expiresAt: Date.now() + cptReward.duration,
          };
          updatedPlayer.activeBoosts = updatedPlayer.activeBoosts.filter(b => b.type !== 'cpt');
          updatedPlayer.activeBoosts.push(newCptBoost);
          break;
        case 'passive_income_boost':
          const pphReward = deal.rewardValue as { pph: number, duration: number };
          const newPphBoost: ActiveBoost = {
            sourceId: deal.id,
            type: 'passive_income',
            pph: pphReward.pph,
            expiresAt: Date.now() + pphReward.duration,
          };
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
      return updatedPlayer;
    });
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
    
    if (deal.costType === 'ad') {
      setDealToProcess(deal);
      setIsDealAdModalVisible(true);
      return;
    }
    processDealPurchase(deal);
  };

  const handleConfirmDealAd = () => {
    if (dealToProcess) processDealPurchase(dealToProcess);
    setIsDealAdModalVisible(false);
    setDealToProcess(null);
  };
  
  const handleClaimReward = () => {
    setPlayer(prevPlayer => {
      if (!prevPlayer) return null;
      const reward = dailyRewards[prevPlayer.consecutiveDays % dailyRewards.length];
      const updatedPlayer = { ...prevPlayer };

      if (reward.type === 'stars') updatedPlayer.stars += reward.amount;
      else {
        updatedPlayer.balance += (reward.amount * adminConfig.dailyRewardBase);
        triggerBalanceAnimation();
      }
      updatedPlayer.lastRewardClaimed = Date.now();
      updatedPlayer.consecutiveDays += 1;
      return updatedPlayer;
    });
    setView('Earn');
  };
  
  const handleSolveCipher = () => {
    if (!player || player.dailyCipherClaimed) return;
    setPlayer(prev => prev ? ({ ...prev, balance: prev.balance + adminConfig.dailyCipherReward, dailyCipherClaimed: true }) : null);
    triggerBalanceAnimation();
    setView('Earn');
  };

  const handleActivateBooster = () => {
    if (!player) return;
    setPlayer(prev => prev ? ({ ...prev, currentEnergy: prev.maxEnergy, lastBoosterClaimed: Date.now() }) : null);
  };

  const handleWatchLevelUpAd = () => {
      if(!player) return;
      setPlayer(prev => prev ? ({ ...prev, levelUpAdsWatched: prev.levelUpAdsWatched + 1 }) : null);
  };

  const handleInitiateTask = (task: Task) => {
    if (!player) return;
    if (task.type === 'youtube_video' || task.type === 'youtube_shorts') {
      setPendingTasks(prev => [...new Set([...prev, task.id])]);
      if (task.link) window.open(task.link, '_blank');
      return;
    }
    if (task.type === 'telegram') {
        const isPending = pendingTasks.includes(task.id);
        if (isPending) {
             // Now handled by async verify logic in Tasks view, but if this is called manually:
            setPlayer(prev => {
                if (!prev) return null;
                const updatedPlayer = { ...prev };
                updatedPlayer.balance += task.reward;
                updatedPlayer.hasFollowedTelegram = true;
                updatedPlayer.taskProgress = { ...updatedPlayer.taskProgress, [task.id]: 1 };
                return updatedPlayer;
            });
            triggerBalanceAnimation();
            setPendingTasks(prev => prev.filter(id => id !== task.id)); 
        } else {
            setPendingTasks(prev => [...new Set([...prev, task.id])]);
            if (task.link) {
                 if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(task.link);
                 else if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(task.link);
                 else window.open(task.link, '_blank');
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
            if (updatedPlayer.taskProgress[task.id] === task.dailyLimit) {
                updatedPlayer.balance += task.reward;
                triggerBalanceAnimation();
            }
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

    setPlayer(prev => {
        if (!prev) return null;
        const updatedPlayer = { ...prev, balance: prev.balance + task.reward };
        const currentProgress = updatedPlayer.taskProgress[task.id] || 0;
        updatedPlayer.taskProgress = { ...updatedPlayer.taskProgress, [task.id]: currentProgress + 1 };
        return updatedPlayer;
    });
    triggerBalanceAnimation();
    setPendingTasks(prev => prev.filter(id => id !== taskId));
    return true;
  };
  
  const handleWithdrawal = (withdrawal: Omit<Withdrawal, 'id' | 'timestamp' | 'status' | 'telegramId' | 'username'>) => {
    if (!player) return;
    if (player.lastWithdrawalTime && Date.now() - player.lastWithdrawalTime < WITHDRAWAL_COOLDOWN_MS) return; 
    
    const newWithdrawal: Withdrawal = {
      ...withdrawal,
      id: `wd_${Date.now()}`,
      timestamp: Date.now(),
      status: 'Pending',
      telegramId: player.telegramId,
      username: player.username
    };

    setPlayer(prev => {
      if (!prev) return null;
      return {
        ...prev,
        balance: prev.balance - withdrawal.amountStardust,
        withdrawalHistory: [newWithdrawal, ...prev.withdrawalHistory],
        lastWithdrawalTime: Date.now()
      };
    });
    setGlobalWithdrawals(prev => [newWithdrawal, ...prev]);
  };

  // Render Intro Screen if showing
  if (showIntro) {
      // IntroScreen now waits for 'player' to be truthy to finish loading
      return <IntroScreen isDataReady={!!player} onFinished={() => setShowIntro(false)} />;
  }

  if (!player) return <div className="flex h-screen items-center justify-center text-cyan-400 font-bold animate-pulse">RE-ESTABLISHING UPLINK...</div>;
  
  if (player.isBanned) {
      return (
        <div className="fixed inset-0 bg-red-950 flex flex-col items-center justify-center p-6 text-center z-[1000]">
            <span className="text-6xl mb-4">🚫</span>
            <h1 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-2">ACCESS DENIED</h1>
            <p className="text-red-300 font-mono text-xs">Your account has been terminated by the High Command.</p>
        </div>
      );
  }

  const isRewardAvailable = !player.lastRewardClaimed || Date.now() - player.lastRewardClaimed > 86400000;

  const renderView = () => {
    switch(view) {
      case 'Earn': return <EarnView player={player} onHoldStart={handleHoldStart} onHoldEnd={handleHoldEnd} floatingTexts={floatingTexts} onDailyRewardClick={() => setView('DailyReward')} onCipherClick={() => setView('DailyCipher')} isRewardAvailable={isRewardAvailable} onActivateBooster={handleActivateBooster} pendingHoldReward={pendingHoldReward} isClaimModalVisible={isClaimModalVisible} onClaimHoldReward={handleClaimHoldReward} onCancelHoldReward={handleCancelHoldReward} currentHoldAmount={currentHoldAmount} isRewardUrgent={isRewardUrgent} isCipherClaimed={player.dailyCipherClaimed} theme={theme} onShowAd={handleShowAd} />;
      case 'Upgrades': return <UpgradesView upgrades={upgrades} stellarDeals={stellarDeals} player={player} onBuy={buyUpgrade} onBuyStellarDeal={handleBuyStellarDeal} isDealAdModalVisible={isDealAdModalVisible} dealToProcess={dealToProcess} onConfirmDealAd={handleConfirmDealAd} onCancelDealAd={() => setIsDealAdModalVisible(false)} theme={theme} onShowAd={handleShowAd} />;
      case 'Tasks': return <TasksView player={player} onInitiateTask={handleInitiateTask} onClaimTask={handleClaimTask} onCancelTask={handleCancelTask} onWatchLevelUpAd={handleWatchLevelUpAd} pendingTasks={pendingTasks} theme={theme} tasks={tasks} onShowAd={handleShowAd} />;
      case 'Leaderboard': return <LeaderboardView player={player} theme={theme} referralReward={adminConfig.referralRewardStars} leaderboardData={allPlayers} />;
      case 'Wallet': return <WalletView player={player} onWithdraw={handleWithdrawal} theme={theme} minWithdrawal={adminConfig.minWithdrawalTon} onShowAd={handleShowAd} />;
      case 'DailyReward': return <DailyRewardView player={player} onClaim={handleClaimReward} onBack={() => setView('Earn')} isRewardAvailable={isRewardAvailable} theme={theme} rewards={dailyRewards} />;
      case 'DailyCipher': return <DailyCipherView onSolve={handleSolveCipher} onBack={() => setView('Earn')} isCipherClaimed={player.dailyCipherClaimed} theme={theme} cipherWord={adminConfig.dailyCipherWord} />;
      case 'Admin': return (
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
    <div className="flex flex-col h-screen overflow-hidden">
      <div className='flex flex-col h-full'>
        {view !== 'DailyReward' && view !== 'DailyCipher' && view !== 'Admin' && (
          <StatsHeader player={player} animateBalance={animateBalance} theme={theme} onOpenAdmin={() => setView('Admin')} />
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
