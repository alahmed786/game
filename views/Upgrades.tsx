import React, { useState, useEffect } from 'react';
import { Upgrade, Player, StellarDeal, UpgradesViewProps } from '../types';

const formatTime = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AdDealModal: React.FC<{ deal: StellarDeal; onConfirm: () => void; onCancel: () => void; theme: string; onShowAd: any }> = ({ deal, onConfirm, onCancel, theme, onShowAd }) => {
  const [isWatching, setIsWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setIsWatching(true);
    setError(null);
    onShowAd(() => { setIsWatching(false); onConfirm(); }, (msg: string) => { setIsWatching(false); setError(msg); });
  };

  return (
    <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm bg-white/60 dark:bg-black/50 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center gap-4 text-center shadow-2xl">
        <span className="text-6xl drop-shadow-lg">{deal.icon}</span>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">{deal.title}</h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed">{deal.description}</p>
        {error && <p className="text-red-500 dark:text-red-400 text-xs font-bold uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</p>}
        <div className="flex flex-col gap-3 w-full mt-4">
          <button onClick={handleConfirm} disabled={isWatching} className={`w-full bg-gradient-to-r from-${theme}-500 to-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-${theme}-500/30 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-3`}>
            {isWatching ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>ESTABLISHING LINK...</span></>) : ('Watch & Claim')}
          </button>
          <button onClick={onCancel} disabled={isWatching} className="w-full text-slate-500 dark:text-slate-400 text-xs uppercase font-black tracking-widest py-3 rounded-xl active:scale-95 transition-all hover:bg-slate-200 dark:hover:bg-slate-800">Abort</button>
        </div>
      </div>
    </div>
  );
};

const StellarDealCard: React.FC<{ deal: StellarDeal, player: Player, onBuy: (deal: StellarDeal) => void, theme: string }> = ({ deal, player, onBuy, theme }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const activeBoost = player.activeBoosts.find(b => b.sourceId === deal.id);
  const onCooldown = deal.cooldown && player.lastDealPurchases[deal.id] && (Date.now() - player.lastDealPurchases[deal.id] < deal.cooldown);

  useEffect(() => {
    const updateTimer = () => {
      let remaining = 0;
      if (activeBoost) remaining = activeBoost.expiresAt - Date.now();
      else if (onCooldown) remaining = (player.lastDealPurchases[deal.id] + deal.cooldown!) - Date.now();
      setTimeLeft(remaining > 0 ? remaining : 0);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [player.activeBoosts, player.lastDealPurchases, deal.id, deal.cooldown, activeBoost, onCooldown]);

  const isUnlocked = !deal.unlockLevel || player.level >= deal.unlockLevel;
  const isForbiddenTech = deal.id === 'ad_free_upgrade';
  const hasEnoughCurrency = deal.costType === 'stars' ? player.stars >= deal.cost : deal.costType === 'stardust' ? player.balance >= deal.cost : true; 
  const canBuy = isUnlocked && hasEnoughCurrency && !onCooldown && !activeBoost;
  const costIcon = deal.costType === 'stars' ? '⭐' : deal.costType === 'stardust' ? '🪐' : '🎟️';

  const getButtonContent = () => {
    if (activeBoost) return <><span className="text-emerald-500 font-black">ACTIVE:</span><span className="font-mono text-slate-900 dark:text-white">{formatTime(timeLeft)}</span></>;
    if (onCooldown) return <span className="font-mono text-slate-900 dark:text-white tracking-widest">{formatTime(timeLeft)}</span>;
    if (!isUnlocked) return <span className="text-red-500 dark:text-red-400 font-black">LVL {deal.unlockLevel} REQ.</span>;
    return <><span>{costIcon}</span><span className={deal.costType === 'ad' ? 'text-slate-900 dark:text-white font-black' : 'font-black'}>{deal.costType === 'ad' ? 'TRANSMIT SIGNAL' : deal.cost.toLocaleString()}</span></>;
  };

  return (
    <div className={`relative w-full backdrop-blur-xl border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-lg ${!canBuy && isUnlocked ? 'opacity-60' : ''} ${!isUnlocked ? 'opacity-60 grayscale' : ''} ${activeBoost ? 'animate-border-glow-green border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : ''} ${isForbiddenTech ? "bg-gradient-to-br from-yellow-200/40 via-purple-200/40 to-white/60 dark:from-yellow-900/40 dark:via-purple-900/40 dark:to-slate-900/60 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]" : `bg-white/60 dark:bg-slate-900/60 border-${activeBoost ? 'emerald-500' : 'yellow-500/30'}`}`}>
      {isForbiddenTech && <div className="absolute -top-3 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg shadow-lg uppercase tracking-widest z-10 animate-bounce">Legendary</div>}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-inner ${isForbiddenTech ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300 text-white' : 'bg-white/80 dark:bg-slate-800 border-white/20 dark:border-slate-700'}`}>{deal.icon}</div>
          <div>
            <h3 className={`font-black text-lg ${isForbiddenTech ? 'text-slate-900 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>{deal.title}</h3>
            <p className={`text-xs font-medium leading-tight mt-0.5 ${isForbiddenTech ? 'text-slate-700 dark:text-yellow-100/70' : 'text-slate-500 dark:text-slate-400'}`}>{deal.description}</p>
          </div>
        </div>
      </div>
      <button onClick={() => onBuy(deal)} disabled={!canBuy} className={`w-full py-3 rounded-xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed ${canBuy && deal.costType === 'ad' ? `bg-gradient-to-r from-${theme}-500 to-${theme}-600 text-white shadow-lg shadow-${theme}-500/30` : canBuy ? 'bg-white dark:bg-slate-100 text-slate-950 font-black shadow-lg border border-slate-200 dark:border-transparent hover:scale-[1.02]' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-600 font-bold'} ${isForbiddenTech && canBuy ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-black shadow-[0_0_20px_rgba(234,179,8,0.4)]' : ''}`} style={onCooldown ? { background: 'repeating-linear-gradient(-45deg, rgba(203,213,225,0.2), rgba(203,213,225,0.2) 10px, rgba(226,232,240,0.2) 10px, rgba(226,232,240,0.2) 20px)' } : {}}>
        {getButtonContent()}
      </button>
    </div>
  );
};

const UpgradeCard: React.FC<{ upgrade: Upgrade, player: Player, theme: string, onBuy: (id: string) => void }> = ({ upgrade, player, theme, onBuy }) => {
  const isUnlocked = !upgrade.unlockLevel || player.level >= upgrade.unlockLevel;
  const isStarCost = upgrade.costType === 'stars';
  const hasEnoughCurrency = isStarCost ? player.stars >= upgrade.cost : player.balance >= upgrade.cost;
  const isMaxed = upgrade.level >= upgrade.maxLevel;
  
  const isPassive = !!upgrade.profitPerHour;
  const isMinerActive = player.activeAutoMiner && player.activeAutoMiner > Date.now();
  const isLockedByMiner = isPassive && isMinerActive;
  
  const canBuy = isUnlocked && hasEnoughCurrency && !isMaxed && !isLockedByMiner;
  const currentYield = isPassive ? (upgrade.profitPerHour! * upgrade.level) : 0;
  const nextYield = isPassive && !isMaxed ? (upgrade.profitPerHour! * (upgrade.level + 1)) : currentYield;

  return (
    <div className={`relative backdrop-blur-xl border p-5 rounded-3xl flex flex-col gap-4 transition-all shadow-lg overflow-hidden ${isMaxed ? 'bg-gradient-to-br from-amber-500/10 to-emerald-500/10 dark:from-amber-500/5 dark:to-emerald-500/5 border-amber-500/30 dark:border-emerald-500/30' : 'bg-white/70 dark:bg-slate-900/70 border-white/40 dark:border-slate-800'} ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}>
      {isMaxed && <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-[50px] pointer-events-none"></div>}
      <div className="flex gap-4 items-start relative z-10">
        <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-inner border ${isMaxed ? 'bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-slate-800 dark:to-slate-800 border-emerald-400/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
          <span className={isMaxed ? 'drop-shadow-md scale-110 transition-transform' : ''}>{upgrade.icon}</span>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
            <div className="flex justify-between items-start gap-2">
                <h3 className={`font-black text-base truncate ${isMaxed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{upgrade.name}</h3>
                <div className={`px-2 py-0.5 rounded border shrink-0 ${isMaxed ? 'bg-emerald-500 text-white border-emerald-400 shadow-md' : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isMaxed ? 'text-white' : `text-${theme}-600 dark:text-${theme}-500`}`}>{isMaxed ? 'MAX' : `LVL ${upgrade.level}`}</span>
                </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-snug mt-1">{upgrade.description}</p>
            {!isUnlocked && upgrade.unlockLevel && <div className="mt-2 inline-block bg-red-500/10 px-2 py-1 rounded border border-red-500/20 w-max"><p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest">Requires Level {upgrade.unlockLevel}</p></div>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80 relative z-10">
        <div className="flex flex-col bg-slate-50 dark:bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800/50 grow">
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Mining Yield</span>
          {isPassive ? (
             <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">+{currentYield.toLocaleString()}/hr</span>
                {!isMaxed && <><span className="text-slate-400 text-[10px]">→</span><span className={`font-black text-${theme}-600 dark:text-${theme}-400`}>+{nextYield.toLocaleString()}/hr</span></>}
             </div>
          ) : (
             <span className={`text-sm font-black text-purple-600 dark:text-purple-400`}>{upgrade.cptBoost ? `+${upgrade.cptBoost} Power per Tap` : upgrade.holdMultiplierBoost ? `+${(upgrade.holdMultiplierBoost * 100).toFixed(0)}% Hold Earnings` : 'Special Effect Active'}</span>
          )}
        </div>
        
        <button onClick={() => onBuy(upgrade.id)} disabled={!canBuy} className={`px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shrink-0 w-full sm:w-auto ${isMaxed ? 'bg-emerald-500 text-white opacity-100 cursor-default shadow-[0_0_15px_rgba(16,185,129,0.3)]' : isLockedByMiner ? 'bg-red-500/10 border border-red-500/30 text-red-400 opacity-100' : canBuy ? `bg-slate-900 dark:bg-white text-white dark:text-slate-950 active:scale-95 shadow-lg hover:bg-slate-800 dark:hover:bg-slate-100` : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}`}>
          {isMaxed ? (<span className="flex items-center gap-1">✓ <span className="pt-0.5">COMPLETED</span></span>) : isLockedByMiner ? (<span className="text-[9px] leading-tight text-center">STOP MINER<br/>TO UPGRADE</span>) : (<><span className="text-sm">{isStarCost ? '⭐' : '🪐'}</span><span className="pt-0.5">UPGRADE • {upgrade.cost.toLocaleString()}</span></>)}
        </button>
      </div>
    </div>
  );
};

const UpgradesView: React.FC<any> = ({ upgrades, stellarDeals, player, onBuy, onBuyStellarDeal, isDealAdModalVisible, dealToProcess, onConfirmDealAd, onCancelDealAd, theme, onShowAd, onToggleMiner }) => {
  const marketUpgrades = upgrades.filter((u: any) => u.category === 'Market');
  const specialUpgrades = upgrades.filter((u: any) => u.category === 'Special');

  const isMinerActive = player.activeAutoMiner && player.activeAutoMiner > Date.now();
  const [minerTimeLeft, setMinerTimeLeft] = useState(0);

  // Constants for Miner Cost
  const MINER_COST = 1000;
  const canAffordMiner = player.balance >= MINER_COST;

  useEffect(() => {
      if (!player.activeAutoMiner) { setMinerTimeLeft(0); return; }
      const updateTimer = () => { const left = player.activeAutoMiner! - Date.now(); setMinerTimeLeft(left > 0 ? left : 0); };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
  }, [player.activeAutoMiner]);

  // Calculate visual progress bar %
  const TOTAL_MS = 14400000; // 4 Hours
  const progressPercent = isMinerActive ? Math.min(100, Math.max(0, (minerTimeLeft / TOTAL_MS) * 100)) : 0;

  return (
    <div className="pt-4 flex flex-col gap-6">
      {isDealAdModalVisible && dealToProcess && <AdDealModal deal={dealToProcess} onConfirm={onConfirmDealAd} onCancel={onCancelDealAd} theme={theme} onShowAd={onShowAd} />}
      
      {/* 🚀 PREMIUM FLEET COMMAND UI UPGRADE 🚀 */}
      <div className={`relative overflow-hidden p-6 rounded-[2rem] mx-4 shadow-xl transition-all border ${isMinerActive ? 'bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-emerald-950/30 border-emerald-500/30' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-800'}`}>
        
        {/* Glow behind the rocket */}
        {isMinerActive && <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-[50px] pointer-events-none animate-pulse"></div>}

        {/* Header */}
        <div className="flex items-center gap-4 relative z-10">
            <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-inner border ${isMinerActive ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-500/50' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <span className={`${isMinerActive ? 'animate-bounce' : ''}`}>🚀</span>
            </div>
            <div className="flex flex-col">
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Fleet Command</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Autonomous Drone Sector</p>
            </div>
        </div>

        {/* Status Box with Progress Bar */}
        <div className={`mt-5 rounded-2xl p-4 border relative overflow-hidden ${isMinerActive ? 'bg-white/60 dark:bg-slate-950/40 border-emerald-200 dark:border-emerald-500/30 shadow-inner' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80'}`}>
            
            {/* Visual Progress Bar (Background Fill) */}
            {isMinerActive && (
                <div className="absolute top-0 left-0 bottom-0 bg-emerald-500/10 dark:bg-emerald-500/20" style={{ width: `${progressPercent}%`, transition: 'width 1s linear' }}></div>
            )}

            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isMinerActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-400'}`}></div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${isMinerActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                        {isMinerActive ? 'Mining Active' : 'System Standby'}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Yield Rate</span>
                    <span className={`font-mono font-black text-base ${isMinerActive ? `text-emerald-600 dark:text-emerald-400` : 'text-slate-400'}`}>
                        +{isMinerActive ? player.passivePerHour.toLocaleString() : 0}/hr
                    </span>
                </div>
            </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 relative z-10">
            {player.passivePerHour > 0 ? (
                <>
                    <button 
                        onClick={onToggleMiner} 
                        disabled={!isMinerActive && !canAffordMiner}
                        className={`relative w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all overflow-hidden ${
                            isMinerActive 
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95' 
                            : canAffordMiner
                            ? `bg-gradient-to-r from-${theme}-500 to-indigo-600 hover:from-${theme}-400 hover:to-indigo-500 text-white shadow-lg shadow-${theme}-500/30 active:scale-95`
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                        }`}
                    >
                        {isMinerActive ? (
                            `STOP MINER • ${formatTime(minerTimeLeft)}`
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                                <span>ACTIVATE (4 HRS)</span>
                                <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-md">
                                    <span className="text-sm leading-none drop-shadow-md">🪐</span>
                                    <span>{MINER_COST.toLocaleString()}</span>
                                </span>
                            </div>
                        )}
                    </button>
                    {!isMinerActive && !canAffordMiner && (
                        <p className="text-center text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">Insufficient Stardust to activate</p>
                    )}
                </>
            ) : (
                <div className="py-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Purchase Auto-Miners to enable</p>
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-5"><span className="w-1 h-4 bg-yellow-500 rounded-full"></span><h3 className="text-sm font-black text-yellow-500 dark:text-yellow-400 uppercase tracking-widest">Stellar Market</h3></div>
        <div className="flex flex-col gap-4 px-4">{stellarDeals.map(deal => (<StellarDealCard key={deal.id} deal={deal} player={player} onBuy={onBuyStellarDeal} theme={theme} />))}</div>
      </div>

      {marketUpgrades.length > 0 && (
          <><div className="flex items-center gap-2 px-5 mt-4"><span className={`w-1 h-4 bg-${theme}-500 rounded-full`}></span><h3 className={`text-sm font-black text-${theme}-600 dark:text-${theme}-400 uppercase tracking-widest`}>Passive Income</h3></div>
            <div className="grid grid-cols-1 gap-5 px-4">{marketUpgrades.map((upgrade: any) => (<UpgradeCard key={upgrade.id} upgrade={upgrade} player={player} theme={theme} onBuy={onBuy} />))}</div></>
      )}

      <div className="flex items-center gap-2 px-5 mt-6"><span className="w-1 h-4 bg-purple-500 rounded-full"></span><h3 className={`text-sm font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest`}>Special Technologies</h3></div>
      <div className="grid grid-cols-1 gap-5 pb-12 px-4">{specialUpgrades.map((upgrade: any) => (<UpgradeCard key={upgrade.id} upgrade={upgrade} player={player} theme={theme} onBuy={onBuy} />))}</div>
    </div>
  );
};

export default UpgradesView;
