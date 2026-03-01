import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Upgrade, View, FloatingText, Task, StellarDeal, ActiveBoost, Withdrawal, Theme, AdminConfig } from '../types';
import { 
  INITIAL_UPGRADES, ENERGY_REGEN_RATE, INITIAL_DAILY_REWARDS, INITIAL_TASKS, INITIAL_STELLAR_DEALS, INITIAL_ADMIN_CONFIG,
  HOLD_TICK_RATE_MS, HOLD_ENERGY_DRAIN_PER_TICK, HOLD_EARN_MULTIPLIER, LEVEL_BALANCE_REQUIREMENTS,
  MAX_ENERGY, THEME_CONFIG, getLevelTheme, calculateLevelUpAdsReq, WITHDRAWAL_COOLDOWN_MS
} from '../constants';
import { playStardustSound } from '../utils/audio';
import { showAd } from '../utils/ads';
import { supabase, fetchLeaderboard, processReferral, fetchUserRank, fetchGameSettings } from '../utils/supabase';

const ADMIN_ID = "702954043";

export const useGameEngine = () => {
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
      if (savedTheme !== null) return savedTheme === 'dark';
      return true; 
  }); 

  const [dealToProcess, setDealToProcess] = useState<StellarDeal | null>(null);
  const [isDealAdModalVisible, setIsDealAdModalVisible] = useState(false);

  const [canSave, setCanSave] = useState(false);
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
        // @ts-ignore
        const tg = window.Telegram?.WebApp;
        if (tg) tg.setHeaderColor(newMode ? '#030712' : '#f0f9ff'); 
        return newMode;
    });
  };

  const handleShowAd = (onComplete: () => void, onError: (msg: string) => void) => {
     if (adminConfig.demoMode) {
         setTimeout(() => onComplete(), 500); 
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
                    return { ...prev, referralCount: newPlayer.referralcount, stars: newPlayer.stars, level: newPlayer.level, balance: newPlayer.balance };
                }
                return prev;
           });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  useEffect(() => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const app = tg as any;
      app.ready(); app.expand(); app.enableClosingConfirmation();
      const savedTheme = localStorage.getItem('app_theme');
      let finalMode = true;
      if (savedTheme !== null) finalMode = savedTheme === 'dark';
      else if (app.colorScheme === 'light') finalMode = false;

      setIsDarkMode(finalMode);
      if (finalMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      app.setHeaderColor(finalMode ? '#030712' : '#f0f9ff'); 
    }

    const userData = tg?.initDataUnsafe?.user;
    const startParam = tg?.initDataUnsafe?.start_param; 
    
    // Fallback ID ensures dev testing doesn't collide with the ghost unknown_user account
    const fallbackId = 'dev_' + Math.random().toString(36).substr(2, 9);
    const telegramId = userData?.id?.toString() || (process.env.NODE_ENV === 'development' ? fallbackId : 'unknown_user');
    const username = userData?.username || userData?.first_name || 'SpaceCadet';

    const createNewPlayer = (): Player => ({
        telegramId: telegramId, username: username, photoUrl: userData?.photo_url, balance: 0, coinsPerTap: 1, passivePerHour: 0,
        maxEnergy: MAX_ENERGY, currentEnergy: 1000, lastUpdate: Date.now(), lastRewardClaimed: null, consecutiveDays: 0,
        dailyCipherClaimed: false, lastCipherClaimed: null as any, level: 1, levelUpAdsWatched: 0, stars: 5, lastBoosterClaimed: null,
        holdMultiplier: 1, hasOfflineEarnings: false, hasFollowedTelegram: false, taskProgress: {}, lastTasksReset: Date.now(),
        lastAdWatched: null, activeBoosts: [], lastDealPurchases: {}, withdrawalHistory: [], lastWithdrawalTime: null, activeAutoMiner: null,
        referralCount: 0, invitedBy: startParam ? `Commander_${startParam}` : undefined, isBanned: false
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
                    // ✅ BUG FIX: Sanitize global upgrades so NO ONE accidentally gets maxed out baseline upgrades!
                    currentGlobalUpgrades = globalSettings.upgrades.map((gUpg: any) => {
                         const initialMatch = INITIAL_UPGRADES.find(i => i.id === gUpg.id);
                         return {
                             ...gUpg,
                             level: 0, // ALWAYS start baseline at 0
                             cost: initialMatch ? initialMatch.cost : gUpg.cost // ALWAYS start at baseline cost
                         };
                    });
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
                    telegramId: remotePlayer.telegramid, username: remotePlayer.username, balance: Number(remotePlayer.balance), 
                    level: remotePlayer.level, stars: remotePlayer.stars, referralCount: remotePlayer.referralcount || 0,
                    invitedBy: remotePlayer.invitedby || remotePlayer.invitedBy, ...remotePlayer.gamestate,
                    photoUrl: userData?.photo_url || remotePlayer.gamestate?.photoUrl, lastCipherClaimed: remotePlayer.gamestate?.lastCipherClaimed || null
                };

                if (remotePlayer.gamestate && remotePlayer.gamestate.upgrades) {
                     const savedUpgrades = remotePlayer.gamestate.upgrades;
                     const mergedUpgrades = currentGlobalUpgrades.map(globalUpg => {
                         const saved = savedUpgrades.find((s: any) => s.id === globalUpg.id);
                         if (saved) return { ...globalUpg, level: Math.min(saved.level, globalUpg.maxLevel), cost: saved.cost };
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
                        if (!isNaN(offlineIncome) && offlineIncome > 0) setOfflineEarnings(offlineIncome); 
                    }
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
                if (startParam && startParam !== telegramId) {
                    processReferral(startParam, telegramId, adminConfig.referralRewardStars).catch(err => console.error(err));
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
          await supabase.from('players').upsert({
              telegramid: telegramId, username: username, balance: balance, level: level, stars: stars,
              referralcount: referralCount || 0, invitedby: invitedBy || null, gamestate: cleanGameState, lastupdated: new Date().toISOString() 
          }, { onConflict: 'telegramid' });
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
      if (!canSave) return;
      const saveInterval = setInterval(() => {
          if (playerRef.current && !isDeletingRef.current) savePlayerToSupabase(playerRef.current, upgradesRef.current);
      }, 5000); 
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
                setShowLevelAlert(true); lastNotifiedLevelRef.current = currentLevel; setTimeout(() => setShowLevelAlert(false), 10000);
            }
        }
    }
    const newTheme = getLevelTheme(player.level);
    if (newTheme !== theme) {
      setTheme(newTheme);
      document.documentElement.style.setProperty('--bg-primary', THEME_CONFIG[newTheme].primary);
      document.documentElement.style.setProperty('--bg-secondary', THEME_CONFIG[newTheme].secondary);
    }
  }, [player?.balance, player?.level, player?.levelUpAdsWatched]);
  
  useEffect(() => {
    const checkUrgency = () => {
      if (player?.lastRewardClaimed) {
        const remainingTime = 86400000 - (Date.now() - player.lastRewardClaimed);
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
        const totalPassivePerHour = activeBoosts.filter(boost => boost.type === 'passive_income').reduce((sum, boost) => sum + (boost as { pph: number }).pph, prev.passivePerHour); 
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
    return () => { if (passiveUpdateRef.current) cancelAnimationFrame(passiveUpdateRef.current); if (holdIntervalRef.current) clearInterval(holdIntervalRef.current); };
  }, [updatePassiveIncome]);

  const handleClaimOfflineEarnings = () => {
      if (!player || !offlineEarnings) return;
      const updatedPlayer = { ...player, balance: player.balance + offlineEarnings, lastUpdate: Date.now() };
      setPlayer(updatedPlayer); setOfflineEarnings(null); triggerBalanceAnimation();
      if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
  };

  const handleHoldStart = () => {
    if (holdIntervalRef.current || !player || player.currentEnergy <= 0 || player.isBanned || isDeletingRef.current) return;
    accumulatedHoldRewardRef.current = 0; setCurrentHoldAmount(0);
    const activeCptBoost = player.activeBoosts.find(b => b.type === 'cpt' && b.expiresAt > Date.now());
    const cptMultiplier = activeCptBoost ? (activeCptBoost as { multiplier: number }).multiplier : 1;

    holdIntervalRef.current = window.setInterval(() => {
      let earnings = 0;
      setPlayer(prev => {
        if (!prev || prev.currentEnergy <= 0) { handleHoldEnd(); return prev; }
        earnings = (prev.coinsPerTap * cptMultiplier) * HOLD_EARN_MULTIPLIER * prev.holdMultiplier;
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
    if (!isDeletingRef.current) savePlayerToSupabase(updated, upgradesRef.current);
  };

  const handleCancelHoldReward = () => { setPendingHoldReward(null); setIsClaimModalVisible(false); accumulatedHoldRewardRef.current = 0; };

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
    if (upgrade.id === 's5') updatedPlayer.hasOfflineEarnings = true;

    const newUpgrades = upgrades.map(u => u.id === upgradeId ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.6) } : u);
    setPlayer(updatedPlayer); setUpgrades(newUpgrades);
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
          updatedPlayer.activeBoosts = updatedPlayer.activeBoosts.filter(b => b.type !== 'cpt');
          updatedPlayer.activeBoosts.push({ sourceId: deal.id, type: 'cpt', multiplier: cptReward.multiplier, expiresAt: Date.now() + cptReward.duration }); break;
        case 'passive_income_boost':
          const pphReward = deal.rewardValue as { pph: number, duration: number };
          updatedPlayer.activeBoosts = updatedPlayer.activeBoosts.filter(b => b.type !== 'passive_income');
          updatedPlayer.activeBoosts.push({ sourceId: deal.id, type: 'passive_income', pph: pphReward.pph, expiresAt: Date.now() + pphReward.duration }); break;
        case 'free_upgrade':
          const availableUpgrades = upgrades.filter(u => u.level < u.maxLevel && (!u.unlockLevel || player.level >= u.unlockLevel));
          if (availableUpgrades.length > 0) {
              const cheapest = availableUpgrades.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
              updatedPlayer.passivePerHour += (cheapest.profitPerHour || 0); updatedPlayer.coinsPerTap += (cheapest.cptBoost || 0); updatedPlayer.holdMultiplier += (cheapest.holdMultiplierBoost || 0);
              if (cheapest.id === 's5') updatedPlayer.hasOfflineEarnings = true;
              setUpgrades(prev => prev.map(u => u.id === cheapest.id ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * 1.6) } : u));
          } break;
    }
    if (deal.cooldown) updatedPlayer.lastDealPurchases = { ...updatedPlayer.lastDealPurchases, [deal.id]: Date.now() };
    setPlayer(updatedPlayer);
    if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
  };

  const handleBuyStellarDeal = (deal: StellarDeal) => {
      if (!player) return;
      if (deal.cooldown && player.lastDealPurchases[deal.id] && Date.now() - player.lastDealPurchases[deal.id] < deal.cooldown) return;
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
    setPlayer(updatedPlayer); setView('Earn');
    if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
  };
  
  const handleSolveCipher = () => {
    if (!player || player.dailyCipherClaimed) return;
    const updated = { ...player, balance: player.balance + adminConfig.dailyCipherReward, dailyCipherClaimed: true, lastCipherClaimed: Date.now() } as any;
    setPlayer(updated); triggerBalanceAnimation(); setView('Earn');
    if (!isDeletingRef.current) savePlayerToSupabase(updated, upgradesRef.current);
  };

  const handleActivateBooster = () => {
    if (!player) return;
    const updated = { ...player, currentEnergy: player.maxEnergy, lastBoosterClaimed: Date.now() };
    setPlayer(updated); if (!isDeletingRef.current) savePlayerToSupabase(updated, upgradesRef.current);
  };

  const handleWatchLevelUpAd = () => { setPlayer(p => p ? ({ ...p, levelUpAdsWatched: p.levelUpAdsWatched + 1 }) : null); };

  const handleInitiateTask = (task: Task) => {
    if (!player) return;
    const rawChatId = (task as any).chatId || ''; const cleanChatId = rawChatId.startsWith('@') ? rawChatId.replace('@', '') : rawChatId;
    const targetUrl = task.link || (cleanChatId && !cleanChatId.startsWith('-') ? `https://t.me/${cleanChatId}` : '');

    if (task.type === 'youtube_video' || task.type === 'youtube_shorts') { setPendingTasks(prev => [...new Set([...prev, task.id])]); if (task.link) window.open(task.link, '_blank'); return; }
    if (task.type === 'telegram') {
        if (pendingTasks.includes(task.id)) {
            const updatedPlayer = { ...player, balance: player.balance + task.reward, hasFollowedTelegram: true, taskProgress: { ...player.taskProgress, [task.id]: 1 } };
            setPlayer(updatedPlayer); triggerBalanceAnimation(); setPendingTasks(prev => prev.filter(id => id !== task.id)); 
            if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
        } else {
            setPendingTasks(prev => [...new Set([...prev, task.id])]);
            // @ts-ignore
            if (targetUrl) { if (window.Telegram?.WebApp?.openTelegramLink) window.Telegram.WebApp.openTelegramLink(targetUrl); else if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(targetUrl); else window.open(targetUrl, '_blank'); }
        } return;
    }
    if (task.type === 'ads') {
        setPlayer(prev => {
            if (!prev) return null; let updatedPlayer = { ...prev };
            const currentProgress = updatedPlayer.taskProgress[task.id] || 0;
            updatedPlayer.taskProgress = { ...updatedPlayer.taskProgress, [task.id]: currentProgress + 1 };
            updatedPlayer.lastAdWatched = Date.now();
            if (updatedPlayer.taskProgress[task.id] >= (task.dailyLimit || 1)) { updatedPlayer.balance += task.reward; triggerBalanceAnimation(); }
            if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
            return updatedPlayer;
        });
    }
  };

  const handleCancelTask = (taskId: string) => { setPendingTasks(prev => prev.filter(id => id !== taskId)); };

  const handleClaimTask = (taskId: string, code: string): boolean => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || code !== (task.secretCode || '1234') || !player) return false;
    const updatedPlayer = { ...player, balance: player.balance + task.reward };
    updatedPlayer.taskProgress = { ...updatedPlayer.taskProgress, [task.id]: (updatedPlayer.taskProgress[task.id] || 0) + 1 };
    setPlayer(updatedPlayer); triggerBalanceAnimation(); setPendingTasks(prev => prev.filter(id => id !== taskId));
    if (!isDeletingRef.current) savePlayerToSupabase(updatedPlayer, upgradesRef.current);
    return true;
  };
  
  const handleWithdrawal = (withdrawal: Omit<Withdrawal, 'id' | 'timestamp' | 'status' | 'telegramId' | 'username'>) => {
    if (!player || (player.lastWithdrawalTime && Date.now() - player.lastWithdrawalTime < WITHDRAWAL_COOLDOWN_MS)) return; 
    const newWithdrawal: Withdrawal = { ...withdrawal, id: `wd_${Date.now()}`, timestamp: Date.now(), status: 'Pending', telegramId: player.telegramId, username: player.username };
    const updated = { ...player, balance: player.balance - withdrawal.amountStardust, withdrawalHistory: [newWithdrawal, ...player.withdrawalHistory], lastWithdrawalTime: Date.now() };
    setPlayer(updated); setGlobalWithdrawals(prev => [newWithdrawal, ...prev]);
    if (!isDeletingRef.current) savePlayerToSupabase(updated, upgradesRef.current);
  };

  // ✅ BUG FIX: Safely delete user, clear local storage, and FORCE a close/reload so they don't get stuck in a ghost account!
  const handleDeleteAccount = async () => {
      if (!player) return;
      isDeletingRef.current = true; setCanSave(false); 
      try {
          const { error } = await supabase.from('players').delete().eq('telegramid', player.telegramId);
          if (error) throw error;
          
          localStorage.clear(); 
          sessionStorage.clear();
          
          // @ts-ignore
          if (window.Telegram?.WebApp?.close) { 
              // @ts-ignore
              window.Telegram.WebApp.showAlert("Account permanently deleted. The app will now close.", () => { 
                  // @ts-ignore
                  window.Telegram.WebApp.close(); 
              }); 
          } else { 
              window.location.replace(window.location.pathname + "?t=" + Date.now()); 
          }
      } catch (e) {
          console.error("Failed to delete account", e); alert("Failed to delete account. Please try again.");
          isDeletingRef.current = false; setCanSave(true);
      }
  };

  return {
    state: {
      showIntro, view, adminConfig, tasks, upgrades, stellarDeals, dailyRewards, globalWithdrawals, allPlayers, userRank, player, floatingTexts,
      pendingHoldReward, isClaimModalVisible, currentHoldAmount, offlineEarnings, isProfileModalVisible, isRewardUrgent, pendingTasks,
      animateBalance, showLevelAlert, theme, isDarkMode, dealToProcess, isDealAdModalVisible, ADMIN_ID
    },
    actions: {
      setShowIntro, setView, setAdminConfig, setTasks, setUpgrades, setStellarDeals, setDailyRewards, setGlobalWithdrawals, setAllPlayers,
      setUserRank, setPlayer, setFloatingTexts, setPendingHoldReward, setIsClaimModalVisible, setCurrentHoldAmount, setOfflineEarnings,
      setIsProfileModalVisible, setIsRewardUrgent, setPendingTasks, setAnimateBalance, setShowLevelAlert, setTheme, setIsDarkMode,
      setDealToProcess, setIsDealAdModalVisible, toggleThemeMode, handleShowAd, handleClaimOfflineEarnings, handleHoldStart, handleHoldEnd,
      handleClaimHoldReward, handleCancelHoldReward, buyUpgrade, handleBuyStellarDeal, handleConfirmDealAd, handleClaimReward,
      handleSolveCipher, handleActivateBooster, handleWatchLevelUpAd, handleInitiateTask, handleCancelTask, handleClaimTask, handleWithdrawal,
      handleDeleteAccount
    }
  };
};
